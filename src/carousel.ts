/// <reference path="./definitions.ts" />

import { containsClass, throttle, forEach, mutate, isSwiping, getTouchCoords, PosCoordinates, getInitialItemsOrder, navAvailable, calcStepIndex } from './helpers';
import { step, swipeContinuous, swipeStarts, swipeEnds } from './logic';
import { afterInfiniteUpdated } from './update-infinite';
import * as SE from './side-effects';

const querySelector =  HTMLElement.prototype.querySelector;

export class Carousel implements ICarousel {
    element: CarouselElement;
    container: HTMLDivElement;

    swipeDir = undefined;
    isSwiping = undefined;
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
      this.element = element;
    }

    attached() {
      this.touchStart = new PosCoordinates(0, 0);
      this.mode = this.element.getAttribute('loop') || 'finite';
      this.container = <HTMLDivElement>(querySelector.call(this.element, '[role="container"]'));
        this.container.addEventListener('transitionend', _ => this.busy = false);
        if (this.mode === 'infinite') {
          // Note: This event will not be always triggered!
          // When we move to the [right], first of all, we remove `no-transition` class from the container.
          // Thus, transition happens and we have the event.
          // However, when we move to the [left], we add the `no-transition` class to the Container.
          // Thus, the transition will not be happening and the callback will not be called.
            this.container.addEventListener('transitionend', _ => {
              mutate(this, afterInfiniteUpdated(this, false));
              // this.busy = false;
            });
        }

        // Create Listeners.
        this.resizeListener = throttle(step.bind(null, 0, this.mode, this), 100);
        this.touchStartListener = this.touchStartEventHandler.bind(this);
        this.touchMoveListener = this.touchMoveEventHandler.bind(this);
        this.touchEndListener = this.touchEndEventHandler.bind(this);

        // Add Listeners.
        window.addEventListener('resize', this.resizeListener);
        this.element.addEventListener('touchstart', this.touchStartListener);
        this.element.addEventListener('touchmove', this.touchMoveListener);
        this.element.addEventListener('touchend', this.touchEndListener);

        if (!('touchend' in window)) {
            forEach((btn: NavigationButton) => {
                const direction = btn.getAttribute('data-direction');
                this.pagination[btn.getAttribute('data-direction')] = btn;
                btn.addEventListener('click', e => {
                    e.preventDefault();
                    e.stopPropagation();
                    mutate(this, step(direction === 'left' ? -1 : 1, this));
                });
            }, this.element.querySelectorAll('[role="nav-button"]'));
        }

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
        const target = <HTMLElement>event.target;
        if (target.classList.contains('as24-carousel__button')) {
            event.preventDefault();
            event.stopPropagation();
        }
        if (this.busy) return;
        if (target.classList.contains('as24-carousel__button')) {
            let btnDirection = target.dataset.direction;
            mutate(this, step(btnDirection === 'left' ? -1 : 1, this));
        } else {
            const navButtons = <NavigationButton[]>Array.from(this.element.querySelectorAll('[role="nav-button"]'));
            if (!navAvailable(navButtons)) {
                return;
            }
            mutate(this, swipeStarts(getTouchCoords(event), this));
        }
    }

    touchMoveEventHandler(event: TouchEvent) {
        const target = <HTMLElement>event.target;
        const navButtons = <NavigationButton[]>Array.from(this.element.querySelectorAll('[role="nav-button"]'));
        if (this.busy) return;
        if (this.isSwiping) {
            event.preventDefault();
        }
        if (!navAvailable(navButtons)) {
            return;
        }
        if (!target.classList.contains('as24-carousel__button')) {
            mutate(this, swipeContinuous(getTouchCoords(event), this));
        }
    }

    touchEndEventHandler(event: TouchEvent) {
        const navButtons = <NavigationButton[]>Array.from(this.element.querySelectorAll('[role="nav-button"]'));
        const finalTouch = getTouchCoords(event.changedTouches[0]);
        if (!navAvailable(navButtons) || (this.touchStart && this.touchStart.x === finalTouch.x)) {
            return;
        }
        mutate(this, swipeEnds(finalTouch, this));
    }

    goTo(index: number, options: GoToOptions) {
        this.index = --index;
        this.index = calcStepIndex(0, this);
        this.touchStart = new PosCoordinates(0, 0);
        mutate(this, step(0, this, options.notify));
        this.busy = false;
    }

    getIndex(): number {
        return this.index;
    }

    redraw(triggerNotifications = true): void {
        mutate(this, step(0, this, triggerNotifications));
        this.busy = false;
    }

    removeItem(index: number): void {
        this.container.children[index].remove();
        this.busy = false;
        this.goTo(1, { notify: false });
    }
}
