/// <reference path="./definitions.ts" />

import * as H from './helpers';

export const doUpdateNavigationButtonsState = (left: NavigationButton, right: NavigationButton, canGoLeft?: boolean, canGoRight?: boolean): boolean => {
    if (left && right) {
        H.toggleClass('as24-carousel__button--hidden', left, !canGoLeft);
        H.toggleClass('as24-carousel__button--hidden', right, !canGoRight);
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
    container.style.transform = 'translateX(' + (-1 * offset) + 'px)';
    container.style.webkitTransform = 'translateX(' + (-1 * offset) + 'px)';
    return true;
};

export const doSetOrder = (item: CarouselItem, ord: number): number => {
    item.style['WebkitOrder'] = ord.toString();
    item.style.order = ord.toString();
    return ord;
};

export const doReorderItems = (items: CarouselItemsList, order: SlidesOrder): SlidesOrder =>
    H.zipWith(doSetOrder, items, order);

export const doSetPositioning = (howMany: number, items: CarouselItemsList, order: SlidesOrder): CarouselItemsList => {
    items.forEach(x => H.removeClass('as24-carousel__item--invisible', x));
    order.forEach((x, i) => {
        if (x > howMany - 1) {
            H.addClass('as24-carousel__item--invisible', items[i]);
        }
    });
    return items;
};
