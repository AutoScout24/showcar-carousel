/// <reference path="../typings/index.d.ts" />

import { expect } from 'chai';
import * as U from '../src/update-infinite';

describe('Update Infinite', () => {

    describe('reorder function', () => {

        let arr = [1, 2, 3, 4];

        it('should move 0th element in the array to the index position', () => {
            // given

            // when
            let result = U.reorder(1, arr);

            // then
            expect(result).to.deep.equal( [4, 1, 2, 3] );
        });

        it('should move 0th element in the array to the index position', () => {
            // given

            // when
            let result = U.reorder(2, arr);

            // then
            expect(result).to.deep.equal( [3, 4, 1, 2] );
        });

    });

});
