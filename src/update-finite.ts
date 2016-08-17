/// <reference path="./definitions.ts" />

import { getNextIndex, getVars } from './helpers';

import * as SE from './side-effects';

export const getNextOffset = (index: number, itemWidth: number, maxOffset: number): number => {
    let offset = index * itemWidth;
    return offset > maxOffset ? maxOffset : offset;
};

export const updateFinite = (dir: number, state: ICarousel): CarouselState => {
    let {element, container, offset, index, pagination} = state;
    const { itemWidth, maxOffset, itemsVisible } = getVars(element, container);

    index = getNextIndex('finite', dir, container.children.length, index, itemsVisible, offset < maxOffset);
    offset = getNextOffset(index, itemWidth, maxOffset);

    // side effects
    SE.doUpdateNavigationButtonsState(pagination.left, pagination.right, 'finite', offset <= 0, offset >= maxOffset);
    if (offset > 0 && offset < maxOffset) {
        SE.doNotify(element, dir, index);
    }
    SE.doUpdateIndicator(pagination.indicator, index + 1, container.children.length);
    SE.doMove(container, offset);

    return { index, offset };
};
