/// <reference path="../typings/index.d.ts" />

import { expect } from 'chai';
import * as H from '../src/helpers';

describe('Helpers', () => {

    describe('mutate function', () => {

        it('should mutate source object by extending it', () => {
            // given
            let src = { a: 2, b: 4 };

            // when
            H.mutate(src, { b: 14 });

            // then
            expect(src).to.deep.equal({ a: 2, b: 14 });
        });

    });

    describe('getInitialItemsOrder', () => {
        it('should take array like object and return an array of ints', () => {
            // given
            let arrayLikeObj = {
                0: 'a',
                1: 'b',
                2: 'c',
                length: 3
            };

            // when
            let result = H.getInitialItemsOrder(arrayLikeObj);

            // then
            expect(result).to.deep.equal([0, 1, 2]);
        });
    });

    describe('zipWith', () => {
        it('should zip two array with a function', () => {
            // given
            let arr1 = [1, 2, 3];
            let arr2 = ['a', 'b', 'c'];
            let fn = (a, b) => a + ': ' + b;

            // when
            let result = H.zipWith(fn, arr1, arr2);

            // then
            expect(result).to.deep.equal(['1: a', '2: b', '3: c']);
        });
    });

});
