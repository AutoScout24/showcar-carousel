/// <reference path="./definitions.ts" />

import { getNextIndex, getVars, getNextOffset } from './helpers';

import * as SE from './side-effects';

export const updateFinite = (dir: MoveDirection, state: ICarousel): CarouselState => {
    let { element, container, offset, index, pagination } = state;
    const { itemWidth, maxOffset, itemsVisible } = getVars(element, container);

    offset = getNextOffset(index, itemWidth, maxOffset);

    // side effects
    SE.doUpdateNavigationButtonsState(pagination.left, pagination.right, offset <= 0, offset >= maxOffset);
    if (offset > 0 && offset < maxOffset) {
        SE.doNotify(element, dir, index);
    }
    SE.doUpdateIndicator(pagination.indicator, index + 1, container.children.length);
    SE.doMove(container, offset);

    return { index, offset };
};
