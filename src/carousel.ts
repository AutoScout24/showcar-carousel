/// <reference path="./definitions.ts" />

import { throttle, forEach, mutate, isSwiping, getTouchCoords, Coordinates, getInitialItemsOrder } from './helpers';
import { step, calcStepIndex } from './logic';
import { afterInfiniteUpdated } from './update-infinite';

export class Carousel implements ICarousel {
    element: CarouselElement;
    container: HTMLDivElement;

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

    touchStart: Coordinates | any;

    constructor(element: CarouselElement) {
        this.touchStart = new Coordinates(0, 0);
        this.element = element;
        this.mode = this.element.getAttribute('loop') || 'finite';
        this.container = <HTMLDivElement>this.element.querySelector('[role="container"]');

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
            let direction = btn.getAttribute('data-direction');
            this.pagination[direction] = btn;
            btn.addEventListener('mouseup', (evt: MouseEvent) => {
                evt.stopPropagation();
                evt.preventDefault();
                this.index = calcStepIndex(direction === 'left' ? -1 : 1, this);
                mutate(this, step(direction === 'left' ? -1 : 1, this));
            });
            btn.addEventListener('click', evt => evt.preventDefault());
        }, this.element.querySelectorAll('[role="nav-button"]'));

        this.pagination.indicator = <HTMLDivElement>this.element.querySelector('[role="indicator"]');

        this.index = 0;
        mutate(this, step(0, this));
    }

    detached() {
        window.removeEventListener('resize', this.resizeListener, true);
        this.element.removeEventListener('touchstart', this.touchStartListener, true);
        this.element.removeEventListener('touchmove', this.touchMoveListener, true);
        this.element.removeEventListener('touchend', this.touchEndListener, true);
    }

    touchStartEventHandler(event: TouchEvent) {
        this.touchStart = {};
        let target = <HTMLElement>event.target;
        if (!target.hasAttribute('data-direction')) {
            this.touchStart = getTouchCoords(event);
        }
    }

    touchMoveEventHandler(event: TouchEvent) {
        if (!isSwiping(this.touchStart)) {
            return;
        }

        const touchCoords = getTouchCoords(event);
        const startDiffX = Math.abs(touchCoords.x - this.touchStart.x);
        const startDiffY = Math.abs(touchCoords.y - this.touchStart.y);

        if (startDiffX < startDiffY) {
            this.touchStart = {};
        } else {
            event.preventDefault();
        }
    }

    touchEndEventHandler(event: TouchEvent) {
        if (!isSwiping(this.touchStart)) {
            return;
        }
        const touchEndCoords = getTouchCoords(event.changedTouches[0]);
        this.index = calcStepIndex(this.touchStart.x - touchEndCoords.x > 0 ? 1 : -1, this);
        mutate(this, step(this.touchStart.x - touchEndCoords.x > 0 ? 1 : -1, this));
    }

    goTo(index: number) {
        this.index = --index;
        this.index = calcStepIndex(0, this);
        mutate(this, step(0, this));
    }

    getIndex(): number {
        return this.index;
    }
}
