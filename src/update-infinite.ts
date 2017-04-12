/// <reference path="./definitions.ts" />

import { addClass, removeClass, getTouchCoords, getInitialItemsOrder, calcStepIndex } from './helpers';
import * as SE from './side-effects';
import { getNextIndex, getVars } from './helpers';

export const reorder = (index: CarouselIndex, items: SlidesOrder): SlidesOrder => {
    let fst = items.slice(items.length - index, items.length);
    let snd = items.slice(0, items.length - index);
    return fst.concat(snd);
};

// This function will be called either by the event listener or in updateInfinite fn.
export const afterInfiniteUpdated = (state: ICarousel, supposeToMoveToLeft: boolean): CarouselState => {
    let { element, container, itemsOrder, offset, index } = state;
    const { stepWidth } = getVars(element, container);

    let items = <CarouselItem[]>Array.from(container.children);

    if (supposeToMoveToLeft) {
        removeClass('as24-carousel__container--static', container);
    } else {
        addClass('as24-carousel__container--static', container);
        if (itemsOrder !== undefined) {
            SE.doSetPositioning(2, items, SE.doReorderItems(items, itemsOrder));
        }
    }

    SE.doMove(container, 0);

    state.itemsOrder = getInitialItemsOrder(container.children);
    state.busy = false;
    return state;
};

export const updateInfinite = (dir: MoveDirection, state: ICarousel, triggerNotifications: boolean): ICarousel => {
    let { element, container, touchStart, offset, index, pagination, mode } = state;
    const { stepWidth, itemsVisible } = getVars(element, container);
    let items = <CarouselItem[]>Array.from(container.children);

    index = dir !== 0 ? calcStepIndex(dir, state) : index;
    offset = dir === -1
        ? (offset === 0 ? dir * stepWidth : dir * offset)
        : dir * stepWidth;
    const initialOrder = getInitialItemsOrder(container.children);
    const itemsOrder = reorder(index, initialOrder);
    let busy = true;

    if (dir < 0) {
        addClass('as24-carousel__container--static', container);
        SE.doSetPositioning(2, items, SE.doReorderItems(items, itemsOrder));
        SE.doMove(container, -1 * offset);
        afterInfiniteUpdated(state, true);
    } else if (dir > 0) {
        removeClass('as24-carousel__container--static', container);
        SE.doMove(container, offset);
    } else {
        addClass('as24-carousel__container--static', container);
        SE.doMove(container, offset);
        SE.doSetPositioning(2, items, SE.doReorderItems(items, itemsOrder));
        busy = false;
    }

    if (triggerNotifications) {
        SE.doNotify(element, dir, index);
    }

    SE.doUpdateIndicator(pagination.indicator, index + 1, container.children.length);

    return { index, touchStart, offset: 0, itemsOrder, busy, isSwiping: false, swipeDir: undefined, element, container, mode, pagination };
};

export const swipeStartsInfinite = (touch: PosCoordinates, state: ICarousel): CarouselState => {
    const { offset, index, container, itemsOrder } = state;
    addClass('as24-carousel__container--static', container);
    return { touchStart: touch, index, offset: 0, itemsOrder, isSwiping: undefined, swipeDir: undefined };
};

export const swipeContinuousInfinite = (currentPos: PosCoordinates, state: ICarousel): CarouselState => {
    let { touchStart, index, container, element, isSwiping, swipeDir } = state;

    let offset = 0, itemsOrder, items;
    const distanceX  = Math.abs(currentPos.x - touchStart.x);
    const distanceY  = Math.abs(currentPos.y - touchStart.y);

    const { stepWidth, itemsVisible } = getVars(element, container);
    if (swipeDir === undefined) {
        swipeDir = touchStart.x - currentPos.x > 0 ? 1 : -1;
    }

    if (isSwiping) {
        if (swipeDir === -1) {
            itemsOrder = reorder(calcStepIndex(swipeDir, state), getInitialItemsOrder(container.children));
            items = <CarouselItem[]>Array.from(container.children);
            SE.doSetPositioning(2, items, SE.doReorderItems(items, itemsOrder));
            offset = touchStart.x - currentPos.x > 0
              ? stepWidth
              : stepWidth + (-1 * (currentPos.x - touchStart.x));
        } else {
            offset = touchStart.x - currentPos.x < 0
              ? 0
              : -1 * (currentPos.x - touchStart.x);
        }
        SE.doMove(container, offset);
    }

    return { index, touchStart, offset, itemsOrder, swipeDir, isSwiping: isSwiping === undefined
        ? distanceX / distanceY > .6
        : isSwiping };
};

export const swipeEndsInfinite = (finalTouch: PosCoordinates, state: ICarousel): CarouselState => {
    const { index, offset, touchStart, container, isSwiping, swipeDir } = state;
    if (isSwiping) {
        removeClass('as24-carousel__container--static', container);
        const swipedToFarToLeft = (swipeDir === -1 && touchStart.x - finalTouch.x > 0);
        const swipedToFarToRight = (swipeDir === 1 && touchStart.x - finalTouch.x < 0);
        if (swipedToFarToLeft || swipedToFarToRight) {
          return updateInfinite(0, state, false);
        }
        return updateInfinite(swipeDir, state, true);
    }
};
