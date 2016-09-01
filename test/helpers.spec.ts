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

    describe('getNextIndex function', () => {
        let maximalIndex = 8;

        describe('in finite mode', () => {

            let mode: CarouselMode = 'finite';

            it('should return (index + 1) when it is possible to go to the next position', () => {
                // given
                let dir = 1;
                let index = 0;
                let itemsVisible = 2;

                // when
                let result = H.getNextIndex(mode, dir, maximalIndex, index, itemsVisible);

                // then
                expect(result).equals(1);
            });

            it('should return (index - 1) when it is possible to go to the prev position', () => {
                // given
                let dir = -1;
                let index = 5;
                let itemsVisible = 2;

                // when
                let result = H.getNextIndex(mode, dir, maximalIndex, index, itemsVisible);

                // then
                expect(result).equals(index - 1);
            });

            it('should return (maximalIndex - itemsVisible) when index > (maximalIndex - itemsVisible)', () => {
                // given
                let dir = 1;
                let index = 15;
                let itemsVisible = 2;

                // when
                let result = H.getNextIndex(mode, dir, maximalIndex, index, itemsVisible);

                // then
                expect(result).equals(maximalIndex - itemsVisible);
            });

            it('should normalise index when direction === 0 and index > (maximalIndex - itemsVisible)', () => {
                // given
                let dir = 0;
                let index = 15;
                let itemsVisible = 2;

                // when
                let result = H.getNextIndex(mode, dir, maximalIndex, index, itemsVisible);

                // then
                expect(result).equals(maximalIndex - itemsVisible);
            });

            it('should return 0 when it is in the left most position and direction is -1', () => {
                // given
                let dir = -1;
                let index = 0;
                let itemsVisible = 2;

                // when
                let result = H.getNextIndex(mode, dir, maximalIndex, index, itemsVisible);

                // then
                expect(result).equals(0);
            });

            it('should return (maximalIndex - itemsVisible) for finite mode when a user reached the most right position', () => {
                // given
                let dir = 1;
                let index = 6;
                let itemsVisible = 2;

                // when
                let result = H.getNextIndex(mode, dir, maximalIndex, index, itemsVisible);

                // then
                expect(result).equals(maximalIndex - itemsVisible);
            });

        });

        describe('in infinite mode', () => {

            let mode: CarouselMode = 'infinite';

            it('should return 0 for infinite mode when a user reached the most right position', () => {
                // given
                let dir = 1;
                let index = 8;
                let itemsVisible = 1;

                // when
                let result = H.getNextIndex(mode, dir, maximalIndex, index, itemsVisible);

                // then
                expect(result).equals(0);
            });

            it('should return (maximalIndex - itemsVisible) for infinite mode when a user goes left while standing on position 0', () => {
                // given
                let dir = -1;
                let index = 0;
                let itemsVisible = 1;

                // when
                let result = H.getNextIndex(mode, dir, maximalIndex, index, itemsVisible);

                // then
                expect(result).equals(maximalIndex - itemsVisible);
            });

        });

    });

    describe('getNextOffset function', () => {

        it('should 0 as offset for the very first position', () => {
            // given
            let index = 0;
            let itemWidth = 300;
            let maxOffset = 900;

            // when
            let result = H.getNextOffset(index, itemWidth, maxOffset);

            // then
            expect(result).equals(0);
        });

        it('should return 2 * itemWidth as offset for the second position', () => {
            // given
            let index = 2;
            let itemWidth = 300;
            let maxOffset = 900;

            // when
            let result = H.getNextOffset(index, itemWidth, maxOffset);

            // then
            expect(result).equals(600);
        });

        it('should return maxOffset when calculated offset is greater then maxOffset', () => {
            // given
            let index = 4;
            let itemWidth = 300;
            let maxOffset = 900;

            // when
            let result = H.getNextOffset(index, itemWidth, maxOffset);

            // then
            expect(result).equals(900);
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
