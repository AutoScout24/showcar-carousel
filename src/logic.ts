/// <reference path="./definitions.ts" />

import { updateFinite } from './update-finite';
import { updateInfinite } from './update-infinite';

export const update = (dir: number, mode: CarouselMode, state: ICarousel): CarouselState => {
    switch (mode) {
        case 'infinite': return updateInfinite(dir, state);
        case 'finite': return updateFinite(dir, state);
    }
};
