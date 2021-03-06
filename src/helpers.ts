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

export const getNextOffset = (index: number, itemWidth: number, maxOffset: number): number => {
    let offset = index * itemWidth;
    return offset > maxOffset ? maxOffset : offset;
};

export const getNextIndex = (mode: CarouselMode, dir: MoveDirection, maximalIndex: number, oldIndex: CarouselIndex, itemsVisible: number): number => {
    let newIndex = oldIndex + dir;
    if (mode === 'infinite') {
        return newIndex < 0 ? (maximalIndex - itemsVisible)
            : newIndex > (maximalIndex - itemsVisible) ? 0 : newIndex;
    }
    if (mode === 'finite') {
        newIndex = oldIndex + dir;
        return newIndex < 0 ? 0
            : newIndex > (maximalIndex - itemsVisible) ? maximalIndex - itemsVisible
                : newIndex;
    }
};

export const calcStepIndex = (dir: MoveDirection, state: ICarousel): number => {
    let {element, container, itemsOrder, mode, offset, index, pagination} = state;
    const { itemsVisible } = getVars(element, container);
    return getNextIndex(mode, dir, container.children.length, index, itemsVisible);
};

export const navButtonIsHidden = (theButton: NavigationButton): Boolean => {
    let theStyle = theButton !== null ? getComputedStyle(theButton) : null;
    return theStyle !== null && theStyle.display !== 'none';
};

export const navAvailable = (buttons: NavigationButton[]): Boolean => {
    // I could use `every` here. But browser support is...
    return buttons.map(navButtonIsHidden).reduce((res, x) => res && x, true);
};

export const getElementWidth = (element: Element, inclMargins: boolean): number => {
    let computed = getComputedStyle(element);
    let { width, marginLeft, marginRight, paddingLeft, paddingRight, boxSizing } = computed;

    let totalMargin = inclMargins ? parseFloat(marginLeft) + parseFloat(marginRight) : 0;
    let totalPadding = boxSizing === 'border-box' ? 0 : parseFloat(paddingLeft) + parseFloat(paddingRight);

    let resultingWidth = parseFloat(width) + totalPadding + totalMargin;
    return resultingWidth;
};

export const getVars = (element: CarouselElement, container: HTMLDivElement) => {
    const rootElemWidth: number = getElementWidth(element, false);
    const stepWidth: number = element.getAttribute('loop') === 'infinite' ? element.getBoundingClientRect().width : getElementWidth(<HTMLElement>container.children.item(0), true);
    const totalWidth: number = Math.floor(Array.from(container.children).reduce((acc, item) => acc += getElementWidth(item, true), 0));
    const maxOffset: number = Math.floor(totalWidth - rootElemWidth);
    const itemsVisible: number = Math.floor((rootElemWidth | 0) / (stepWidth | 0));
    return { maxOffset, stepWidth, itemsVisible, rootElemWidth, totalWidth };
};

export const zipWith = <T, U>(fn: (a: T, b: U) => U, arr1: T[], arr2: U[]): U[] => {
    return arr2.map((val: U, idx) => fn(arr1[idx], val));
};

export const isSwiping = (touchStartCoords: PosCoordinates): boolean => Object.keys(touchStartCoords).length > 0;

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

export const getTouchCoords = (event: any): PosCoordinates => {
    let touch = event.touches && event.touches[0];
    return new PosCoordinates(
        event.clientX || (touch && touch.clientX),
        event.clientY || (touch && touch.clientY)
    );
};

export class PosCoordinates {
    x: number;
    y: number;
    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }
};
