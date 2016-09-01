/// <reference path="./definitions.ts" />

import { updateFinite } from './update-finite';
import { updateInfinite } from './update-infinite';
import { getNextOffset, getVars, getNextIndex } from './helpers';
import * as SE from './side-effects';

export const step = (dir: MoveDirection, state: ICarousel): CarouselState => {
    let { mode } = state;
    switch (mode) {
        case 'infinite': return updateInfinite(dir, state);
        case 'finite': return updateFinite(dir, state);
    }
};

export const calcStepIndex = (dir: MoveDirection, state: ICarousel): number => {
    let {element, container, itemsOrder, mode, offset, index, pagination} = state;
    const { itemWidth, itemsVisible } = getVars(element, container);
    return getNextIndex(mode, dir, container.children.length, index, itemsVisible);
};
