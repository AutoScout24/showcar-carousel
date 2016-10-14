/// <reference path="./definitions.ts" />

import { throttle, forEach, mutate, isSwiping, getTouchCoords, PosCoordinates, getInitialItemsOrder, navAvailable, calcStepIndex } from './helpers';
import { step, swipeContinuous, swipeStarts, swipeEnds } from './logic';
import { afterInfiniteUpdated } from './update-infinite';
import * as SE from './side-effects';

export class Carousel implements ICarousel {
    element: CarouselElement;
    container: HTMLDivElement;

    busy: boolean = false;
    index: number = 0;
    offset: number = 0;
    itemsOrder: SlidesOrder;
    mode: CarouselMode = 'finite';

    resizeListener: EventListener;
    touchStartListener: EventListener;
    touchMoveListener: EventListener;
    touchEndListener: EventListener;

    pagination: IPagination = {
        left: null,
        right: null,
        indicator: null
    };

    touchStart: PosCoordinates;
    currentTouch: PosCoordinates;
    finalTouch: PosCoordinates;

    constructor(element: CarouselElement) {
        this.touchStart = new PosCoordinates(0, 0);
        this.element = element;
        this.mode = this.element.getAttribute('loop') || 'finite';
        this.container = <HTMLDivElement>this.element.querySelector('[role="container"]');

        this.container.addEventListener('transitionend', _ => this.busy = false);

        if (this.mode === 'infinite') {
            this.itemsOrder = getInitialItemsOrder(this.container.children);
            // Note: This event will not be always triggered!
            // When we move to the [right], first of all, we remove `no-transition` class from the container.
            // Thus, transition happens and we have the event.
            // However, when we move to the [left], we add the `no-transition` class to the Container.
            // Thus, the transition will not be happening and the callback will not be called.
            this.container.addEventListener('transitionend', _ => {
                afterInfiniteUpdated(this, false);
            });
        }
    }

    attached() {
        // Create Listeners.
        this.resizeListener = throttle(step.bind(null, 0, this.mode, this), 100);
        this.touchStartListener = this.touchStartEventHandler.bind(this);
        this.touchMoveListener = this.touchMoveEventHandler.bind(this);
        this.touchEndListener = this.touchEndEventHandler.bind(this);

        // Add Listeners.
        window.addEventListener('resize', this.resizeListener, true);
        this.element.addEventListener('touchstart', this.touchStartListener, true);
        this.element.addEventListener('touchmove', this.touchMoveListener, true);
        this.element.addEventListener('touchend', this.touchEndListener, true);

        // Add container and pagination buttons.
        forEach((btn: NavigationButton) => {
            const direction = btn.getAttribute('data-direction');
            this.pagination[btn.getAttribute('data-direction')] = btn;
            btn.addEventListener('click', e => {
              if (this.busy) return;
              if (!('ontouchstart' in window)) {
                  this.busy = true;
                  mutate(this, step(direction === 'left' ? -1 : 1, this));
              }
              e.preventDefault();
            });
        }, this.element.querySelectorAll('[role="nav-button"]'));

        this.pagination.indicator = <HTMLDivElement>this.element.querySelector('[role="indicator"]');

        this.index = 0;
        mutate(this, step(0, this, false));
    }

    detached() {
        window.removeEventListener('resize', this.resizeListener, true);
        this.element.removeEventListener('touchstart', this.touchStartListener, true);
        this.element.removeEventListener('touchmove', this.touchMoveListener, true);
        this.element.removeEventListener('touchend', this.touchEndListener, true);
    }

    touchStartEventHandler(event: TouchEvent) {
        if (this.busy) return;
        const navButtons = <NavigationButton[]>Array.from(this.element.querySelectorAll('[role="nav-button"]'));
        if (!navAvailable(navButtons)) {
            return;
        }
        mutate(this, swipeStarts(this));
    }

    touchMoveEventHandler(event: TouchEvent) {
        if (this.busy) return;
        const navButtons = <NavigationButton[]>Array.from(this.element.querySelectorAll('[role="nav-button"]'));
        if (!navAvailable(navButtons)) {
            return;
        }
        mutate(this, swipeContinuous(getTouchCoords(event), this));
    }

    touchEndEventHandler(event: TouchEvent) {
        if (this.busy) return;
        const navButtons = <NavigationButton[]>Array.from(this.element.querySelectorAll('[role="nav-button"]'));
        if (!navAvailable(navButtons)) {
            return;
        }
        const target = <NavigationButton>event.target;
        const finalTouch = getTouchCoords(event.changedTouches[0]);
        if (target.hasAttribute('data-direction')) {
            event.preventDefault();
            this.busy = true;
            switch (target.getAttribute('data-direction')) {
              case 'left'  : return mutate(this, step(-1, this));
              case 'right' : return mutate(this, step(1, this));
            }
        } else {
            if (this.touchStart.x === finalTouch.x) {
                return;
            }
            this.busy = true;
            mutate(this, swipeEnds(finalTouch, this));
        }
    }

    goTo(index: number) {
        this.index = --index;
        this.index = calcStepIndex(0, this);
        mutate(this, step(0, this));
    }

    getIndex(): number {
        return this.index;
    }

    redraw(): void {
        mutate(this, step(0, this));
    }
}
