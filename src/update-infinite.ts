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
export const afterInfiniteUpdated = (state: ICarousel, supposeToMoveToLeft: boolean): void => {
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
};

export const updateInfinite = (dir: MoveDirection, state: ICarousel, triggerNotifications: boolean): CarouselState => {
    let { element, container, offset, index, pagination } = state;
    const { stepWidth, itemsVisible } = getVars(element, container);
    let items = <CarouselItem[]>Array.from(container.children);

    index = calcStepIndex(dir, state);
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
        SE.doReorderItems(items, itemsOrder);
    }

    if (triggerNotifications) {
        SE.doNotify(element, dir, index);
    }

    SE.doUpdateIndicator(pagination.indicator, index + 1, container.children.length);

    return { index, offset: 0, itemsOrder };
};

export const swipeStartsInfinite = (state: ICarousel): CarouselState => {
    const { offset, index, container } = state;
    addClass('as24-carousel__container--static', container);
    const touchStart = getTouchCoords(event);
    return { touchStart, index, offset };
};

export const swipeContinuousInfinite = (currentPos: PosCoordinates, state: ICarousel): CarouselState => {
    const { touchStart, index, container, element } = state;
    const { stepWidth, itemsVisible } = getVars(element, container);
    const dir = touchStart.x - currentPos.x > 0 ? 1 : -1;

    let offset, diffX, newIndex, itemsOrder, items;

    if (dir === -1) {
        itemsOrder = reorder(calcStepIndex(dir, state), getInitialItemsOrder(container.children));
        items = <CarouselItem[]>Array.from(container.children);
        SE.doSetPositioning(2, items, SE.doReorderItems(items, itemsOrder));
        offset = stepWidth + (-1 * (currentPos.x - touchStart.x));
    } else {
        offset = -1 * (currentPos.x - touchStart.x);
    }

    SE.doMove(container, offset);

    return { index, offset, itemsOrder };
};

export const swipeEndsInfinite = (finalTouch: PosCoordinates, state: ICarousel): CarouselState => {
    const { offset, touchStart, container } = state;
    removeClass('as24-carousel__container--static', container);
    const dir = touchStart.x - finalTouch.x > 0 ? 1 : -1;
    return updateInfinite(dir, state, true);
};
