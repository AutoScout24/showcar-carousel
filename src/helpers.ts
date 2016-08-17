/// <reference path="../node_modules/typescript/lib/lib.es6.d.ts" />
/// <reference path="./definitions.ts" />

export const addClass = (className: string, element: Element): Element =>
    (element.classList.add(className), element);

export const removeClass = (className: string, element: Element): Element =>
    (element.classList.remove(className), element);

export const containsClass = (className: string, element: Element): boolean =>
    element.classList.contains(className);

export const toggleClass = (className: string, element: Element, flag: boolean): boolean =>
    flag ? (addClass(className, element), true) : (removeClass(className, element), false);

export const forEach = <T>(fn: (x: T, i: number) => void, collection: Iterable<T>) =>
    Array.prototype.forEach.call(collection, fn);

export const mutate = (dst, src): void => {
    for (let id in src) {
        dst[id] = src[id];
    }
};

export const getInitialItemsOrder = (items: ArrayLike<any>): SlidesOrder => Array.from(items).map((x, i) => i);

export const getNextIndex = (mode: CarouselMode, dir: number, maxItems: number, oldIndex: number, itemsVisible?: number, canGoRight?: boolean): number => {
    let newIndex = 0;
    if (mode === 'infinite') {
        newIndex = oldIndex + dir;
        return newIndex < 0 ? maxItems - 1 : newIndex > maxItems - 1 ? 0 : newIndex;
    }
    if (mode === 'finite') {
        newIndex = oldIndex;
        if (dir > 0 && !canGoRight) {
            return oldIndex;
        }
        newIndex = oldIndex + dir;
        return newIndex < 0 ? 0 : newIndex;
    }
};

export const getVars = (element: CarouselElement, container: HTMLDivElement) => {
    const rootElemWidth: number = getElementWidth(element, false);
    const itemWidth: number = getElementWidth(<HTMLElement>container.children.item(0), true);
    const totalWidth: number = Array.from(container.children).reduce((acc, item) => acc += getElementWidth(item, true), 0);
    const maxOffset: number = totalWidth - rootElemWidth;
    const itemsVisible: number = Math.floor(rootElemWidth / itemWidth);
    return { maxOffset, itemWidth, itemsVisible };
};

export const zipWith = <T, U>(fn: (a: T, b: U) => U, arr1: T[], arr2: U[]): U[] => {
    return arr2.map((val: U, idx) => fn(arr1[idx], val));
};

export const isSwiping = (touchStartCoords: Coordinates): boolean => Object.keys(touchStartCoords).length > 0;

export const throttle = (fn: () => any, delay: number) => {
    let timer = null;
    return () => {
        if (!timer) {
            fn();
            timer = setTimeout(() => {
                clearTimeout(timer);
                timer = null;
            }, delay);
        }
    };
};

export const getElementWidth = (element: Element, inclMargins: boolean): number => {
    let computed = getComputedStyle(element);
    let width = parseFloat(computed.width);
    let ml = parseFloat(computed.marginLeft);
    let mr = parseFloat(computed.marginRight);
    let margin = mr === ml ? ml : mr;
    if (inclMargins) {
        width += margin;
    }
    return width;
};

export const getTouchCoords = (event: any): Coordinates => {
    let touch = event.touches && event.touches[0];
    return new Coordinates(
        event.clientX || (touch && touch.clientX),
        event.clientY || (touch && touch.clientY)
    );
};

export class Coordinates {
    x: number;
    y: number;
    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }
};
