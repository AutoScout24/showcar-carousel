/// <reference path="./definitions.ts" />

import { containsClass, throttle, forEach, mutate, isSwiping, getTouchCoords, PosCoordinates, getInitialItemsOrder, navAvailable, calcStepIndex } from './helpers';
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
            // Note: This event will not be always triggered!
            // When we move to the [right], first of all, we remove `no-transition` class from the container.
            // Thus, transition happens and we have the event.
            // However, when we move to the [left], we add the `no-transition` class to the Container.
            // Thus, the transition will not be happening and the callback will not be called.
            this.container.addEventListener('transitionend', _ => {
                mutate(this, afterInfiniteUpdated(this, false));
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

            const eventName = 'touchend' in window ? 'touchend' : 'click';
            btn.addEventListener(eventName, e => {
                e.preventDefault();
                e.stopPropagation();
                mutate(this, step(direction === 'left' ? -1 : 1, this));
            });
        }, this.element.querySelectorAll('[role="nav-button"]'));

        this.pagination.indicator = <HTMLDivElement>this.element.querySelector('[role="indicator"]');

        this.index = 0;
        mutate(this, step(0, this, false));
        this.busy = false;
    }

    detached() {
        window.removeEventListener('resize', this.resizeListener, true);
        this.element.removeEventListener('touchstart', this.touchStartListener, true);
        this.element.removeEventListener('touchmove', this.touchMoveListener, true);
        this.element.removeEventListener('touchend', this.touchEndListener, true);
    }

    touchStartEventHandler(event: TouchEvent) {
        const navButtons = <NavigationButton[]>Array.from(this.element.querySelectorAll('[role="nav-button"]'));
        if (!navAvailable(navButtons)) {
            return;
        }
        mutate(this, swipeStarts(getTouchCoords(event), this));
    }

    touchMoveEventHandler(event: TouchEvent) {
        const navButtons = <NavigationButton[]>Array.from(this.element.querySelectorAll('[role="nav-button"]'));
        if (!navAvailable(navButtons)) {
            return;
        }
        mutate(this, swipeContinuous(getTouchCoords(event), this));
    }

    touchEndEventHandler(event: TouchEvent) {
        const navButtons = <NavigationButton[]>Array.from(this.element.querySelectorAll('[role="nav-button"]'));
        const finalTouch = getTouchCoords(event.changedTouches[0]);
        if (!navAvailable(navButtons) || (this.touchStart && this.touchStart.x === finalTouch.x)) {
            return;
        }
        mutate(this, swipeEnds(finalTouch, this));
    }

    goTo(index: number) {
        this.index = --index;
        this.index = calcStepIndex(0, this);
        this.touchStart = new PosCoordinates(0, 0);
        mutate(this, step(0, this));
        this.busy = false;
    }

    getIndex(): number {
        return this.index;
    }

    redraw(): void {
        mutate(this, step(0, this));
    }
}
