/// <reference path="./definitions.ts" />

import { updateFinite, swipeContinuousFinite, swipeStartsFinite, swipeEndsFinite } from './update-finite';
import { updateInfinite, swipeContinuousInfinite, swipeStartsInfinite, swipeEndsInfinite } from './update-infinite';
import { getNextOffset, getVars, getNextIndex } from './helpers';
import * as SE from './side-effects';

export const step = (dir: MoveDirection, state: ICarousel, triggerNotifications = true): CarouselState => {
    let { mode } = state;
    switch (mode) {
        case 'infinite': return updateInfinite(dir, state, triggerNotifications);
        case 'finite': return updateFinite(dir, state);
    }
};

export const swipeStarts = (touch: PosCoordinates, state: ICarousel): CarouselState => {
    let { mode } = state;
    switch (mode) {
        case 'infinite': return swipeStartsInfinite(touch, state);
        case 'finite': return swipeStartsFinite(touch, state);
    }
};

export const swipeContinuous = (currentPos: PosCoordinates, state: ICarousel): CarouselState => {
    let { mode } = state;
    switch (mode) {
        case 'infinite': return swipeContinuousInfinite(currentPos, state);
        case 'finite': return swipeContinuousFinite(currentPos, state);
    }
};

export const swipeEnds = (finalPos: PosCoordinates, state: ICarousel): CarouselState => {
    let { mode } = state;
    switch (mode) {
        case 'infinite': return swipeEndsInfinite(finalPos, state);
        case 'finite': return swipeEndsFinite(finalPos, state);
    }
};
