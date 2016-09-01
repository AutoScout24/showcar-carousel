/// <reference path="./definitions.ts" />

import * as H from './helpers';

export const doUpdateNavigationButtonsState = (left: HTMLElement, right: HTMLElement, canGoLeft?: boolean, canGoRight?: boolean): boolean => {
    if (left && right) {
        H.toggleClass('as24-carousel__button--hidden', left, canGoLeft);
        H.toggleClass('as24-carousel__button--hidden', right, canGoRight);
        return true;
    } else {
        return false;
    }
};

export const doNotify = (element: HTMLElement, dir: number, index: number): boolean =>
    element.dispatchEvent(new CustomEvent('as24-carousel.slide', {
        detail: {
            id: element.id,
            role: element.getAttribute('role'),
            direction: dir,
            index: index
        },
        bubbles: true
    }));

export const doUpdateIndicator = (indicator: HTMLElement, currentPosition: number, max: number): boolean =>
    indicator ? (indicator.innerHTML = `${currentPosition}/${max}`, true) : false;

export const doMove = (container: HTMLElement, offset: number): boolean => {
    container.style.transform = 'translate3d(' + (-1 * offset) + 'px, 0, 0)';
    container.style.webkitTransform = 'translate3d(' + (-1 * offset) + 'px, 0, 0)';
    return true;
};

export const doSetOrder = (item: CarouselItem, ord: number): number => {
    item.style.order = ord.toString();
    return ord;
};

export const doReorderItems = (items: CarouselItemsList, order: SlidesOrder): SlidesOrder =>
    H.zipWith(doSetOrder, items, order);

export const doSetPositioning = (howMany: number, items: CarouselItemsList, order: SlidesOrder): CarouselItemsList => {
    items.forEach(x => H.removeClass('as24-carousel__item--static', x));
    order.forEach((x, i) => {
        if (x > howMany - 1) {
            H.addClass('as24-carousel__item--static', items[i]);
        }
    });
    return items;
};
