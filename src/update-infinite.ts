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
        SE.doSetPositioning(2, items, SE.doReorderItems(items, itemsOrder));
    }

    SE.doMove(container, 0);

    state.busy = false;
    state.itemsOrder = getInitialItemsOrder(container.children);
    return state;
};

export const updateInfinite = (dir: MoveDirection, state: ICarousel, triggerNotifications: boolean): CarouselState => {
    let { element, container, touchStart, offset, index, pagination, busy } = state;
    const { stepWidth, itemsVisible } = getVars(element, container);
    let items = <CarouselItem[]>Array.from(container.children);

    if (busy) return;

    index = dir !== 0 ? calcStepIndex(dir, state) : index;
    offset = dir === -1
        ? (offset === 0 ? dir * stepWidth : dir * offset)
        : dir * stepWidth;
    const initialOrder = getInitialItemsOrder(container.children);
    const itemsOrder = reorder(index, initialOrder);

    if (dir < 0) {
        addClass('as24-carousel__container--static', container);
        SE.doSetPositioning(2, items, SE.doReorderItems(items, itemsOrder));
        SE.doMove(container, -1 * offset);
        afterInfiniteUpdated(state, true);
    } else if (dir > 0) {
        removeClass('as24-carousel__container--static', container);
        SE.doMove(container, offset);
    } else {
        SE.doSetPositioning(2, items, SE.doReorderItems(items, itemsOrder));
    }

    if (triggerNotifications) {
        SE.doNotify(element, dir, index);
    }

    SE.doUpdateIndicator(pagination.indicator, index + 1, container.children.length);

    return { index, touchStart, offset: 0, itemsOrder, busy: true };
};

export const swipeStartsInfinite = (touch: PosCoordinates, state: ICarousel): CarouselState => {
    const { offset, index, container, busy } = state;
    if (busy) return;

    addClass('as24-carousel__container--static', container);
    return { touchStart: touch, index, offset, busy };
};

export const swipeContinuousInfinite = (currentPos: PosCoordinates, state: ICarousel): CarouselState => {
    const { touchStart, index, container, element, busy } = state;

    let offset = 0, itemsOrder, items;
    const distanceX  = Math.abs(currentPos.x - touchStart.x);
    const distanceY  = Math.abs(currentPos.y - touchStart.y);
    if (busy || distanceX < distanceY) {
      return { index, offset, touchStart, busy: true };
    }

    const { stepWidth, itemsVisible } = getVars(element, container);
    const dir = touchStart.x - currentPos.x > 0 ? 1 : -1;

    if (dir === -1) {
        itemsOrder = reorder(calcStepIndex(dir, state), getInitialItemsOrder(container.children));
        items = <CarouselItem[]>Array.from(container.children);
        SE.doSetPositioning(2, items, SE.doReorderItems(items, itemsOrder));
        offset = stepWidth + (-1 * (currentPos.x - touchStart.x));
    } else {
        offset = -1 * (currentPos.x - touchStart.x);
    }

    SE.doMove(container, offset);

    return { index, touchStart, offset, itemsOrder, busy };
};

export const swipeEndsInfinite = (finalTouch: PosCoordinates, state: ICarousel): CarouselState => {
    const { index, offset, touchStart, container, busy } = state;
    const distanceX  = Math.abs(finalTouch.x - touchStart.x);
    const distanceY  = Math.abs(finalTouch.y - touchStart.y);
    if (busy || distanceX < distanceY) {
      return { index, offset, touchStart, busy: false };
    }

    removeClass('as24-carousel__container--static', container);
    const dir = touchStart.x - finalTouch.x > 0 ? 1 : -1;
    return updateInfinite(dir, state, true);
};
