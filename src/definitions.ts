interface PosCoordinates {
    x: number;
    y: number;
}

interface IPagination {
    left: NavigationButton;
    right: NavigationButton;
    indicator: HTMLDivElement;
}

interface GoToOptions {
  notify: boolean;
}

type MoveDirection = number;
type CarouselIndex = number;
type CarouselOffset = number;

type DirectionAttr = 'data-direction';
type DirectionValue = 'left' | 'right';

interface NavigationButton extends HTMLAnchorElement {
    getAttribute(name: DirectionAttr): DirectionValue;
}

type CarouselModeAttr = 'loop';
type CarouselMode = 'finite' | 'infinite';

type CarouselAutoRotateIntervalAttr = 'auto-rotate-interval';
type CarouselAutoRotateInterval = number;

type SlidesOrder = number[];
interface CarouselItem extends HTMLDivElement { }
type CarouselItemsList = CarouselItem[];


interface CarouselElement extends HTMLElement {
    getAttribute(name: CarouselModeAttr): CarouselMode;
    getAttribute(name: CarouselAutoRotateIntervalAttr): CarouselAutoRotateInterval;
}

interface CarouselState {
    index: CarouselIndex;
    offset: CarouselOffset;
    busy?: boolean;
    itemsOrder: SlidesOrder;
    touchStart: PosCoordinates | null;
    isSwiping: undefined | boolean;
    swipeDir: undefined | number;
};

interface ICarousel extends CarouselState {
    element: CarouselElement;
    container: HTMLDivElement;
    mode: CarouselMode;
    pagination: IPagination;
}
