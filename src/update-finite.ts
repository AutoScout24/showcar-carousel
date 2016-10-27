/// <reference path="./definitions.ts" />
/// <reference path="./helpers.ts" />

import { getNextIndex, getVars, getNextOffset, addClass, removeClass, getTouchCoords, PosCoordinates, calcStepIndex } from './helpers';

import * as SE from './side-effects';

export const updateFinite = (dir: MoveDirection, state: ICarousel): CarouselState => {
    let { element, container, offset, index, pagination } = state;
    const { rootElemWidth, stepWidth, maxOffset, itemsVisible, totalWidth } = getVars(element, container);

    removeClass('as24-carousel__container--static', container);

    index = calcStepIndex(dir, state);
    offset = rootElemWidth > totalWidth ? 0 : getNextOffset(index, stepWidth, maxOffset);

    // side effects
    SE.doUpdateNavigationButtonsState(pagination.left, pagination.right, offset > 0, offset < maxOffset);
    if (offset > 0 && offset < maxOffset) {
        SE.doNotify(element, dir, index);
    }
    SE.doUpdateIndicator(pagination.indicator, index + 1, container.children.length);
    SE.doMove(container, offset);

    return { touchStart: null, index, offset };
};

export const swipeStartsFinite = (touch: PosCoordinates, state: ICarousel): CarouselState => {
    const { offset, index, container } = state;
    addClass('as24-carousel__container--static', container);
    return { touchStart: touch, index, offset };
};

export const swipeContinuousFinite = (currentPos: PosCoordinates, state: ICarousel): CarouselState => {
    const { offset, touchStart, index, container } = state;
    const distanceX  = Math.abs(currentPos.x - touchStart.x);
    const distanceY  = Math.abs(currentPos.y - touchStart.y);
    if (distanceX < distanceY) {
      return { index, offset, touchStart };
    }
    const diffX = offset + (-1 * (currentPos.x - touchStart.x));
    SE.doMove(container, diffX);
    return { index, offset, touchStart };
};

export const swipeEndsFinite = (finalTouch: PosCoordinates, state: ICarousel): CarouselState => {
    const { index, offset, touchStart, container } = state;
    const dir = touchStart.x - finalTouch.x > 0 ? 1 : -1;
    const distanceX  = Math.abs(finalTouch.x - touchStart.x);
    const distanceY  = Math.abs(finalTouch.y - touchStart.y);
    if (distanceX < distanceY || distanceX < 25) {
      return { index, offset, touchStart };
    }
    return updateFinite(dir, state);
};
