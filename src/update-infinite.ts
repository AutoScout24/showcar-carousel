/// <reference path="./definitions.ts" />

import { removeClass, addClass, getInitialItemsOrder } from './helpers';
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
    const { itemWidth } = getVars(element, container);

    let items = <CarouselItem[]>Array.from(container.children);

    if (supposeToMoveToLeft) {
        removeClass('as24-carousel__container--static', container);
    } else {
        addClass('as24-carousel__container--static', container);
        SE.doSetPositioning(2, items, SE.doReorderItems(items, itemsOrder));
    }

    SE.doMove(container, 0);
};

export const updateInfinite = (dir: MoveDirection, state: ICarousel): CarouselState => {
    let {element, container, offset, index, pagination} = state;
    const { itemWidth, itemsVisible } = getVars(element, container);
    let items = <CarouselItem[]>Array.from(container.children);

    offset = dir * itemWidth;
    let initialOrder = getInitialItemsOrder(container.children);
    let itemsOrder = reorder(index, initialOrder);

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

    SE.doNotify(element, dir, index);
    SE.doUpdateIndicator(pagination.indicator, index + 1, container.children.length);

    return { index, offset, itemsOrder };
};
