(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (factory());
}(this, (function () { 'use strict';

/// <reference path="../node_modules/typescript/lib/lib.es6.d.ts" />
/// <reference path="./definitions.ts" />
var addClass = function addClass(className, element) {
    return element.classList.add(className), element;
};
var removeClass = function removeClass(className, element) {
    return element.classList.remove(className), element;
};
var toggleClass = function toggleClass(className, element, flag) {
    return flag ? (addClass(className, element), true) : (removeClass(className, element), false);
};
var forEach = function forEach(fn, collection) {
    return Array.prototype.forEach.call(collection, fn);
};
var mutate = function mutate(dst, src) {
    for (var id in src) {
        dst[id] = src[id];
    }
};
var getInitialItemsOrder = function getInitialItemsOrder(items) {
    return Array.from(items).map(function (x, i) {
        return i;
    });
};
var getNextOffset = function getNextOffset(index, itemWidth, maxOffset) {
    var offset = index * itemWidth;
    return offset > maxOffset ? maxOffset : offset;
};
var getNextIndex = function getNextIndex(mode, dir, maximalIndex, oldIndex, itemsVisible) {
    var newIndex = oldIndex + dir;
    if (mode === 'infinite') {
        return newIndex < 0 ? maximalIndex - itemsVisible : newIndex > maximalIndex - itemsVisible ? 0 : newIndex;
    }
    if (mode === 'finite') {
        newIndex = oldIndex + dir;
        return newIndex < 0 ? 0 : newIndex > maximalIndex - itemsVisible ? maximalIndex - itemsVisible : newIndex;
    }
};
var getElementWidth = function getElementWidth(element, inclMargins) {
    var computed = getComputedStyle(element);
    var width = computed.width,
        marginLeft = computed.marginLeft,
        marginRight = computed.marginRight,
        paddingLeft = computed.paddingLeft,
        paddingRight = computed.paddingRight,
        boxSizing = computed.boxSizing;
    var totalMargin = inclMargins ? parseFloat(marginLeft) + parseFloat(marginRight) : 0;
    var totalPadding = boxSizing === 'border-box' ? 0 : parseFloat(paddingLeft) + parseFloat(paddingRight);
    var resultingWidth = parseFloat(width) + totalPadding + totalMargin;
    return resultingWidth;
};
var getVars = function getVars(element, container) {
    var rootElemWidth = getElementWidth(element, false);
    var stepWidth = element.getAttribute('loop') === 'infinite' ? element.getBoundingClientRect().width : getElementWidth(container.children.item(0), true);
    var totalWidth = Array.from(container.children).reduce(function (acc, item) {
        return acc += getElementWidth(item, true);
    }, 0);
    var maxOffset = totalWidth - rootElemWidth;
    var itemsVisible = Math.floor(rootElemWidth / stepWidth);
    return { maxOffset: maxOffset, stepWidth: stepWidth, itemsVisible: itemsVisible, rootElemWidth: rootElemWidth, totalWidth: totalWidth };
};
var zipWith = function zipWith(fn, arr1, arr2) {
    return arr2.map(function (val, idx) {
        return fn(arr1[idx], val);
    });
};
var isSwiping = function isSwiping(touchStartCoords) {
    return Object.keys(touchStartCoords).length > 0;
};
var throttle = function throttle(fn, delay) {
    var timer = null;
    return function () {
        if (!timer) {
            fn();
            timer = setTimeout(function () {
                clearTimeout(timer);
                timer = null;
            }, delay);
        }
    };
};
var getTouchCoords = function getTouchCoords(event) {
    var touch = event.touches && event.touches[0];
    return new Coordinates(event.clientX || touch && touch.clientX, event.clientY || touch && touch.clientY);
};
var Coordinates = function () {
    function Coordinates(x, y) {
        this.x = x;
        this.y = y;
    }
    return Coordinates;
}();
;

/// <reference path="./definitions.ts" />
var doUpdateNavigationButtonsState = function doUpdateNavigationButtonsState(left, right, canGoLeft, canGoRight) {
    if (left && right) {
        toggleClass('as24-carousel__button--hidden', left, canGoLeft);
        toggleClass('as24-carousel__button--hidden', right, canGoRight);
        return true;
    } else {
        return false;
    }
};
var doNotify = function doNotify(element, dir, index) {
    return element.dispatchEvent(new CustomEvent('as24-carousel.slide', {
        detail: {
            id: element.id,
            role: element.getAttribute('role'),
            direction: dir,
            index: index
        },
        bubbles: true
    }));
};
var doUpdateIndicator = function doUpdateIndicator(indicator, currentPosition, max) {
    return indicator ? (indicator.innerHTML = currentPosition + "/" + max, true) : false;
};
var doMove = function doMove(container, offset) {
    container.style.transform = 'translate3d(' + -1 * offset + 'px, 0, 0)';
    container.style.webkitTransform = 'translate3d(' + -1 * offset + 'px, 0, 0)';
    return true;
};
var doSetOrder = function doSetOrder(item, ord) {
    item.style.order = ord.toString();
    return ord;
};
var doReorderItems = function doReorderItems(items, order) {
    return zipWith(doSetOrder, items, order);
};
var doSetPositioning = function doSetPositioning(howMany, items, order) {
    items.forEach(function (x) {
        return removeClass('as24-carousel__item--invisible', x);
    });
    order.forEach(function (x, i) {
        if (x > howMany - 1) {
            addClass('as24-carousel__item--invisible', items[i]);
        }
    });
    return items;
};

/// <reference path="./definitions.ts" />
var updateFinite = function updateFinite(dir, state) {
    var element = state.element,
        container = state.container,
        offset = state.offset,
        index = state.index,
        pagination = state.pagination;
    var _a = getVars(element, container),
        rootElemWidth = _a.rootElemWidth,
        stepWidth = _a.stepWidth,
        maxOffset = _a.maxOffset,
        itemsVisible = _a.itemsVisible,
        totalWidth = _a.totalWidth;
    offset = rootElemWidth > totalWidth ? 0 : getNextOffset(index, stepWidth, maxOffset);
    // side effects
    doUpdateNavigationButtonsState(pagination.left, pagination.right, offset <= 0, offset >= maxOffset);
    if (offset > 0 && offset < maxOffset) {
        doNotify(element, dir, index);
    }
    doUpdateIndicator(pagination.indicator, index + 1, container.children.length);
    doMove(container, offset);
    return { index: index, offset: offset };
};

/// <reference path="./definitions.ts" />
var reorder = function reorder(index, items) {
    var fst = items.slice(items.length - index, items.length);
    var snd = items.slice(0, items.length - index);
    return fst.concat(snd);
};
// This function will be called either by the event listener or in updateInfinite fn.
var afterInfiniteUpdated = function afterInfiniteUpdated(state, supposeToMoveToLeft) {
    var element = state.element,
        container = state.container,
        itemsOrder = state.itemsOrder,
        offset = state.offset,
        index = state.index;
    var stepWidth = getVars(element, container).stepWidth;
    var items = Array.from(container.children);
    if (supposeToMoveToLeft) {
        removeClass('as24-carousel__container--static', container);
    } else {
        addClass('as24-carousel__container--static', container);
        doSetPositioning(2, items, doReorderItems(items, itemsOrder));
    }
    doMove(container, 0);
};
var updateInfinite = function updateInfinite(dir, state) {
    var element = state.element,
        container = state.container,
        offset = state.offset,
        index = state.index,
        pagination = state.pagination;
    var _a = getVars(element, container),
        stepWidth = _a.stepWidth,
        itemsVisible = _a.itemsVisible;
    var items = Array.from(container.children);
    offset = dir * stepWidth;
    var initialOrder = getInitialItemsOrder(container.children);
    var itemsOrder = reorder(index, initialOrder);
    if (dir < 0) {
        addClass('as24-carousel__container--static', container);
        doSetPositioning(2, items, doReorderItems(items, itemsOrder));
        doMove(container, -1 * offset);
        afterInfiniteUpdated(state, true);
    } else if (dir > 0) {
        removeClass('as24-carousel__container--static', container);
        doMove(container, offset);
    } else {
        doReorderItems(items, itemsOrder);
    }
    doNotify(element, dir, index);
    doUpdateIndicator(pagination.indicator, index + 1, container.children.length);
    return { index: index, offset: offset, itemsOrder: itemsOrder };
};

/// <reference path="./definitions.ts" />
var step = function step(dir, state) {
    var mode = state.mode;
    switch (mode) {
        case 'infinite':
            return updateInfinite(dir, state);
        case 'finite':
            return updateFinite(dir, state);
    }
};
var calcStepIndex = function calcStepIndex(dir, state) {
    var element = state.element,
        container = state.container,
        itemsOrder = state.itemsOrder,
        mode = state.mode,
        offset = state.offset,
        index = state.index,
        pagination = state.pagination;
    var _a = getVars(element, container),
        itemWidth = _a.itemWidth,
        itemsVisible = _a.itemsVisible;
    return getNextIndex(mode, dir, container.children.length, index, itemsVisible);
};

/// <reference path="./definitions.ts" />
var Carousel = function () {
    function Carousel(element) {
        var _this = this;
        this.index = 0;
        this.offset = 0;
        this.mode = 'finite';
        this.pagination = {
            left: null,
            right: null,
            indicator: null
        };
        this.touchStart = new Coordinates(0, 0);
        this.element = element;
        this.mode = this.element.getAttribute('loop') || 'finite';
        this.container = this.element.querySelector('[role="container"]');
        if (this.mode === 'infinite') {
            this.itemsOrder = getInitialItemsOrder(this.container.children);
            // Note: This event will not be always triggered!
            // When we move to the [right], first of all, we remove `no-transition` class from the container.
            // Thus, transition happens and we have the event.
            // However, when we move to the [left], we add the `no-transition` class to the Container.
            // Thus, the transition will not be happening and the callback will not be called.
            this.container.addEventListener('transitionend', function (_) {
                afterInfiniteUpdated(_this, false);
            });
        }
    }
    Carousel.prototype.attached = function () {
        // Create Listeners.
        var _this = this;
        this.resizeListener = throttle(step.bind(null, 0, this.mode, this), 100);
        this.touchStartListener = this.touchStartEventHandler.bind(this);
        this.touchMoveListener = this.touchMoveEventHandler.bind(this);
        this.touchEndListener = this.touchEndEventHandler.bind(this);
        // Add Listeners.
        window.addEventListener('resize', this.resizeListener, true);
        this.element.addEventListener('touchstart', this.touchStartListener, true);
        this.element.addEventListener('touchmove', this.touchMoveListener, true);
        this.element.addEventListener('touchend', this.touchEndListener, true);
        // Add container and pagination buttons.
        forEach(function (btn) {
            var direction = btn.getAttribute('data-direction');
            _this.pagination[direction] = btn;
            btn.addEventListener('mouseup', function (evt) {
                evt.stopPropagation();
                evt.preventDefault();
                _this.index = calcStepIndex(direction === 'left' ? -1 : 1, _this);
                mutate(_this, step(direction === 'left' ? -1 : 1, _this));
            });
            btn.addEventListener('click', function (evt) {
                return evt.preventDefault();
            });
        }, this.element.querySelectorAll('[role="nav-button"]'));
        this.pagination.indicator = this.element.querySelector('[role="indicator"]');
        this.index = 0;
        mutate(this, step(0, this));
    };
    Carousel.prototype.detached = function () {
        window.removeEventListener('resize', this.resizeListener, true);
        this.element.removeEventListener('touchstart', this.touchStartListener, true);
        this.element.removeEventListener('touchmove', this.touchMoveListener, true);
        this.element.removeEventListener('touchend', this.touchEndListener, true);
    };
    Carousel.prototype.touchStartEventHandler = function (event) {
        this.touchStart = {};
        var target = event.target;
        if (!target.hasAttribute('data-direction')) {
            this.touchStart = getTouchCoords(event);
        }
    };
    Carousel.prototype.touchMoveEventHandler = function (event) {
        if (!isSwiping(this.touchStart)) {
            return;
        }
        var touchCoords = getTouchCoords(event);
        var startDiffX = Math.abs(touchCoords.x - this.touchStart.x);
        var startDiffY = Math.abs(touchCoords.y - this.touchStart.y);
        if (startDiffX < startDiffY) {
            this.touchStart = {};
        } else {
            event.preventDefault();
        }
    };
    Carousel.prototype.touchEndEventHandler = function (event) {
        if (!isSwiping(this.touchStart)) {
            return;
        }
        var touchEndCoords = getTouchCoords(event.changedTouches[0]);
        this.index = calcStepIndex(this.touchStart.x - touchEndCoords.x > 0 ? 1 : -1, this);
        mutate(this, step(this.touchStart.x - touchEndCoords.x > 0 ? 1 : -1, this));
    };
    Carousel.prototype.goTo = function (index) {
        this.index = --index;
        this.index = calcStepIndex(0, this);
        mutate(this, step(0, this));
    };
    Carousel.prototype.getIndex = function () {
        return this.index;
    };
    Carousel.prototype.redraw = function () {
        mutate(this, step(0, this));
    };
    return Carousel;
}();

/// <reference path="../node_modules/typescript/lib/lib.es6.d.ts" />
function elementCreatedHandler() {
    this.carousel = new Carousel(this);
}
function elementAttachedHandler() {
    this.carousel.attached();
}
function elementDetachedCallback() {
    this.carousel.detached();
    delete this.carousel;
}
try {
    document['registerElement']('as24-carousel', {
        prototype: Object.assign(Object.create(HTMLElement.prototype, {
            createdCallback: { value: elementCreatedHandler },
            attachedCallback: { value: elementAttachedHandler },
            detachedCallback: { value: elementDetachedCallback },
            attributeChangedCallback: { value: function value() {} }
        }), {
            goTo: function goTo(index) {
                this.carousel.goTo(index);
            },
            getIndex: function getIndex() {
                return this.carousel.index;
            },
            redraw: function redraw() {
                this.carousel.redraw();
            }
        })
    });
} catch (e) {
    if (window && window.console) {
        window.console.warn('Failed to register CustomElement "as24-carousel".', e);
    }
}

})));