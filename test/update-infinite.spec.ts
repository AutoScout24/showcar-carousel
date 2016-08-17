/// <reference path="../typings/index.d.ts" />

import { expect } from 'chai';
import * as U from '../src/update-infinite';

describe('Update Infinite', () => {

    describe('reorder function', () => {

        it('should place the last element of an array at the beginning when direction is > 0', () => {
            // given
            let arr = [1, 2, 3, 4];

            // when
            let result = U.reorder(1, arr);

            // then
            expect(result).to.deep.equal( [4, 1, 2, 3] );
        });

        it('should place the first element of an array at the end when direction is < 0', () => {
            // given
            let arr = [1, 2, 3, 4];

            // when
            let result = U.reorder(-1, arr);

            // then
            expect(result).to.deep.equal( [2, 3, 4, 1] );
        });

    });

});
