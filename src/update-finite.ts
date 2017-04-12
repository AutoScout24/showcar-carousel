/// <reference path="./definitions.ts" />
/// <reference path="./helpers.ts" />

import { getNextIndex, getVars, getNextOffset, addClass, removeClass, getTouchCoords, PosCoordinates, calcStepIndex } from './helpers';

import * as SE from './side-effects';

export const updateFinite = (dir: MoveDirection, state: ICarousel, triggerNotifications: boolean): CarouselState => {
    let { element, container, offset, index, pagination, itemsOrder } = state;
    const { rootElemWidth, stepWidth, maxOffset, itemsVisible, totalWidth } = getVars(element, container);

    removeClass('as24-carousel__container--static', container);

    index = calcStepIndex(dir, state);
    let newOffset = rootElemWidth > totalWidth ? 0 : getNextOffset(index, stepWidth, maxOffset);

    // side effects
    if (maxOffset < 0) {
        SE.doUpdateNavigationButtonsState(pagination.left, pagination.right, false, true);
    } else {
        SE.doUpdateNavigationButtonsState(pagination.left, pagination.right, newOffset > 0, newOffset < maxOffset);
    }
    if (Math.abs(offset - newOffset) > 0) {
        if (triggerNotifications) {
            SE.doNotify(element, dir, index);
        }
    }
    SE.doUpdateIndicator(pagination.indicator, index + 1, container.children.length);
    SE.doMove(container, newOffset);

    return { touchStart: null, index, offset: newOffset, itemsOrder, isSwiping: false, swipeDir: undefined };
};

export const swipeStartsFinite = (touch: PosCoordinates, state: ICarousel): CarouselState => {
    const { offset, index, container, itemsOrder } = state;
    addClass('as24-carousel__container--static', container);
    return { touchStart: touch, index, offset, itemsOrder, isSwiping: undefined, swipeDir: undefined };
};

export const swipeContinuousFinite = (currentPos: PosCoordinates, state: ICarousel): CarouselState => {
    const { offset, touchStart, index, container, itemsOrder, isSwiping, swipeDir } = state;
    const dx  = Math.abs(currentPos.x - touchStart.x);
    const dy  = Math.abs(currentPos.y - touchStart.y);
    if (isSwiping) {
        const diffX = offset + (-1 * (currentPos.x - touchStart.x));
        SE.doMove(container, diffX);
    }
    return { index, offset, touchStart, swipeDir, itemsOrder, isSwiping: isSwiping === undefined
        ? dx / dy > .6
        : isSwiping };
};

export const swipeEndsFinite = (finalTouch: PosCoordinates, state: ICarousel): CarouselState => {
    const { index, offset, touchStart, container, isSwiping } = state;
    if (!touchStart) {
        // meaning user tapped a button
        return;
    }
    const dir = touchStart.x - finalTouch.x > 0 ? 1 : -1;
    if (isSwiping) {
        return updateFinite(dir, state, true);
    }
};
