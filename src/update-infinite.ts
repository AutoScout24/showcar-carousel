/// <reference path="./definitions.ts" />

import { getElementWidth, zipWith, removeClass, addClass, toggleClass, containsClass } from './helpers';
import * as SE from './side-effects';
import { getNextIndex, getVars } from './helpers';

export const reorder = (dir: number, items: SlidesOrder): SlidesOrder => {
    if (dir < 0) {
        let [x, ...rest] = items;
        return rest.concat(x);
    } else if (dir > 0) {
        let last = items.pop();
        return [last].concat(items);
    } else {
        return items;
    }
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

export const updateInfinite = (dir: number, state: ICarousel): CarouselState => {
    let {element, container, itemsOrder, offset, index, pagination} = state;
    const { itemWidth, itemsVisible } = getVars(element, container);
    let items = <CarouselItem[]>Array.from(container.children);

    index = getNextIndex('infinite', dir, container.children.length - 1, index);

    offset = dir * itemWidth;
    itemsOrder = reorder(dir, itemsOrder);

    // left := dir === -1, right := dir === 1;
    if (dir < 0) {
        addClass('as24-carousel__container--static', container);
        SE.doSetPositioning(2, items, SE.doReorderItems(items, itemsOrder));
        SE.doMove(container, -1 * offset);
        afterInfiniteUpdated(state, true);
    } else if (dir > 0) {
        removeClass('as24-carousel__container--static', container);
        SE.doMove(container, offset);
    }

    SE.doUpdateNavigationButtonsState(pagination.left, pagination.right, 'infinite');
    SE.doNotify(element, dir, index);
    SE.doUpdateIndicator(pagination.indicator, index + 1, container.children.length);

    return { index, offset, itemsOrder };
};
