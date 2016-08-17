/// <reference path="../typings/index.d.ts" />

import { expect } from 'chai';
import * as U from '../src/update-finite';

describe('Update Finite', () => {

    describe('getNextOffset function', () => {

        it('should 0 as offset for the very first position', () => {
            // given
            let index = 0;
            let itemWidth = 300;
            let maxOffset = 900;

            // when
            let result = U.getNextOffset(index, itemWidth, maxOffset);

            // then
            expect(result).equals(0);
        });

        it('should return 2 * itemWidth as offset for the second position', () => {
            // given
            let index = 2;
            let itemWidth = 300;
            let maxOffset = 900;

            // when
            let result = U.getNextOffset(index, itemWidth, maxOffset);

            // then
            expect(result).equals(600);
        });

        it('should return maxOffset when calculated offset is greater then maxOffset', () => {
            // given
            let index = 4;
            let itemWidth = 300;
            let maxOffset = 900;

            // when
            let result = U.getNextOffset(index, itemWidth, maxOffset);

            // then
            expect(result).equals(900);
        });

    });

});
