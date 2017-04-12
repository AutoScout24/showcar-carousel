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
var calcStepIndex = function calcStepIndex(dir, state) {
    var element = state.element,
        container = state.container,
        itemsOrder = state.itemsOrder,
        mode = state.mode,
        offset = state.offset,
        index = state.index,
        pagination = state.pagination;
    var itemsVisible = getVars(element, container).itemsVisible;
    return getNextIndex(mode, dir, container.children.length, index, itemsVisible);
};
var navButtonIsHidden = function navButtonIsHidden(theButton) {
    var theStyle = theButton !== null ? getComputedStyle(theButton) : null;
    return theStyle !== null && theStyle.display !== 'none';
};
var navAvailable = function navAvailable(buttons) {
    // I could use `every` here. But browser support is...
    return buttons.map(navButtonIsHidden).reduce(function (res, x) {
        return res && x;
    }, true);
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
    // console.log(container);
    var rootElemWidth = getElementWidth(element, false);
    var stepWidth = element.getAttribute('loop') === 'infinite' ? element.getBoundingClientRect().width : getElementWidth(container.children.item(0), true);
    // const totalWidth: number;
    // if (!container) {
    var totalWidth = Math.floor(Array.from(container.children).reduce(function (acc, item) {
        return acc += getElementWidth(item, true);
    }, 0));
    // }else{
    //   const totalWidth: number = stepWidth;
    // }
    var maxOffset = Math.floor(totalWidth - rootElemWidth);
    var itemsVisible = Math.floor((rootElemWidth | 0) / (stepWidth | 0));
    return { maxOffset: maxOffset, stepWidth: stepWidth, itemsVisible: itemsVisible, rootElemWidth: rootElemWidth, totalWidth: totalWidth };
};
var zipWith = function zipWith(fn, arr1, arr2) {
    return arr2.map(function (val, idx) {
        return fn(arr1[idx], val);
    });
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
    return new PosCoordinates(event.clientX || touch && touch.clientX, event.clientY || touch && touch.clientY);
};
var PosCoordinates = function () {
    function PosCoordinates(x, y) {
        this.x = x;
        this.y = y;
    }
    return PosCoordinates;
}();

/// <reference path="./definitions.ts" />
var doUpdateNavigationButtonsState = function doUpdateNavigationButtonsState(left, right, canGoLeft, canGoRight) {
    if (left && right) {
        toggleClass('as24-carousel__button--hidden', left, !canGoLeft);
        toggleClass('as24-carousel__button--hidden', right, !canGoRight);
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
    container.style.transform = 'translateX(' + -1 * offset + 'px)';
    container.style.webkitTransform = 'translateX(' + -1 * offset + 'px)';
    return true;
};
var doSetOrder = function doSetOrder(item, ord) {
    item.style['WebkitOrder'] = ord.toString();
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
//# sourceMappingURL=side-effects.js.map

/// <reference path="./definitions.ts" />
/// <reference path="./helpers.ts" />
var updateFinite = function updateFinite(dir, state, triggerNotifications) {
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
    removeClass('as24-carousel__container--static', container);
    index = calcStepIndex(dir, state);
    var newOffset = rootElemWidth > totalWidth ? 0 : getNextOffset(index, stepWidth, maxOffset);
    // side effects
    doUpdateNavigationButtonsState(pagination.left, pagination.right, newOffset > 0, newOffset < maxOffset);
    if (Math.abs(offset - newOffset) > 0) {
        if (triggerNotifications) {
            doNotify(element, dir, index);
        }
    }
    doUpdateIndicator(pagination.indicator, index + 1, container.children.length);
    doMove(container, newOffset);
    return { touchStart: null, index: index, offset: newOffset, isSwiping: false, swipeDir: undefined };
};
var swipeStartsFinite = function swipeStartsFinite(touch, state) {
    var offset = state.offset,
        index = state.index,
        container = state.container;
    addClass('as24-carousel__container--static', container);
    return { touchStart: touch, index: index, offset: offset, isSwiping: undefined, swipeDir: undefined };
};
var swipeContinuousFinite = function swipeContinuousFinite(currentPos, state) {
    var offset = state.offset,
        touchStart = state.touchStart,
        index = state.index,
        container = state.container,
        isSwiping$$1 = state.isSwiping,
        swipeDir = state.swipeDir;
    var dx = Math.abs(currentPos.x - touchStart.x);
    var dy = Math.abs(currentPos.y - touchStart.y);
    if (isSwiping$$1) {
        var diffX = offset + -1 * (currentPos.x - touchStart.x);
        doMove(container, diffX);
    }
    return { index: index, offset: offset, touchStart: touchStart, swipeDir: swipeDir, isSwiping: isSwiping$$1 === undefined ? dx / dy > .6 : isSwiping$$1 };
};
var swipeEndsFinite = function swipeEndsFinite(finalTouch, state) {
    var index = state.index,
        offset = state.offset,
        touchStart = state.touchStart,
        container = state.container,
        isSwiping$$1 = state.isSwiping;
    var dir = touchStart.x - finalTouch.x > 0 ? 1 : -1;
    if (isSwiping$$1) {
        return updateFinite(dir, state, true);
    }
};
//# sourceMappingURL=update-finite.js.map

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
        if (itemsOrder !== undefined) {
            doSetPositioning(2, items, doReorderItems(items, itemsOrder));
        }
    }
    doMove(container, 0);
    state.itemsOrder = getInitialItemsOrder(container.children);
    state.busy = false;
    return state;
};
var updateInfinite = function updateInfinite(dir, state, triggerNotifications) {
    var element = state.element,
        container = state.container,
        touchStart = state.touchStart,
        offset = state.offset,
        index = state.index,
        pagination = state.pagination,
        mode = state.mode;
    var _a = getVars(element, container),
        stepWidth = _a.stepWidth,
        itemsVisible = _a.itemsVisible;
    var items = Array.from(container.children);
    index = dir !== 0 ? calcStepIndex(dir, state) : index;
    offset = dir === -1 ? offset === 0 ? dir * stepWidth : dir * offset : dir * stepWidth;
    var initialOrder = getInitialItemsOrder(container.children);
    var itemsOrder = reorder(index, initialOrder);
    var busy = true;
    if (dir < 0) {
        addClass('as24-carousel__container--static', container);
        doSetPositioning(2, items, doReorderItems(items, itemsOrder));
        doMove(container, -1 * offset);
        afterInfiniteUpdated(state, true);
    } else if (dir > 0) {
        removeClass('as24-carousel__container--static', container);
        doMove(container, offset);
    } else {
        addClass('as24-carousel__container--static', container);
        doMove(container, offset);
        doSetPositioning(2, items, doReorderItems(items, itemsOrder));
        busy = false;
    }
    if (triggerNotifications) {
        doNotify(element, dir, index);
    }
    doUpdateIndicator(pagination.indicator, index + 1, container.children.length);
    return { index: index, touchStart: touchStart, offset: 0, itemsOrder: itemsOrder, busy: busy, isSwiping: false, swipeDir: undefined, element: element, container: container, mode: mode, pagination: pagination };
};
var swipeStartsInfinite = function swipeStartsInfinite(touch, state) {
    var offset = state.offset,
        index = state.index,
        container = state.container,
        itemsOrder = state.itemsOrder;
    addClass('as24-carousel__container--static', container);
    return { touchStart: touch, index: index, offset: 0, itemsOrder: itemsOrder, isSwiping: undefined, swipeDir: undefined };
};
var swipeContinuousInfinite = function swipeContinuousInfinite(currentPos, state) {
    var touchStart = state.touchStart,
        index = state.index,
        container = state.container,
        element = state.element,
        isSwiping$$1 = state.isSwiping,
        swipeDir = state.swipeDir;
    var offset = 0,
        itemsOrder,
        items;
    var distanceX = Math.abs(currentPos.x - touchStart.x);
    var distanceY = Math.abs(currentPos.y - touchStart.y);
    var _a = getVars(element, container),
        stepWidth = _a.stepWidth,
        itemsVisible = _a.itemsVisible;
    if (swipeDir === undefined) {
        swipeDir = touchStart.x - currentPos.x > 0 ? 1 : -1;
    }
    if (isSwiping$$1) {
        if (swipeDir === -1) {
            itemsOrder = reorder(calcStepIndex(swipeDir, state), getInitialItemsOrder(container.children));
            items = Array.from(container.children);
            doSetPositioning(2, items, doReorderItems(items, itemsOrder));
            offset = touchStart.x - currentPos.x > 0 ? stepWidth : stepWidth + -1 * (currentPos.x - touchStart.x);
        } else {
            offset = touchStart.x - currentPos.x < 0 ? 0 : -1 * (currentPos.x - touchStart.x);
        }
        doMove(container, offset);
    }
    return { index: index, touchStart: touchStart, offset: offset, itemsOrder: itemsOrder, swipeDir: swipeDir, isSwiping: isSwiping$$1 === undefined ? distanceX / distanceY > .6 : isSwiping$$1 };
};
var swipeEndsInfinite = function swipeEndsInfinite(finalTouch, state) {
    var index = state.index,
        offset = state.offset,
        touchStart = state.touchStart,
        container = state.container,
        isSwiping$$1 = state.isSwiping,
        swipeDir = state.swipeDir;
    if (isSwiping$$1) {
        removeClass('as24-carousel__container--static', container);
        var swipedToFarToLeft = swipeDir === -1 && touchStart.x - finalTouch.x > 0;
        var swipedToFarToRight = swipeDir === 1 && touchStart.x - finalTouch.x < 0;
        if (swipedToFarToLeft || swipedToFarToRight) {
            return updateInfinite(0, state, false);
        }
        return updateInfinite(swipeDir, state, true);
    }
};
//# sourceMappingURL=update-infinite.js.map

/// <reference path="./definitions.ts" />
var step = function step(dir, state, triggerNotifications) {
    if (triggerNotifications === void 0) {
        triggerNotifications = true;
    }
    var mode = state.mode;
    switch (mode) {
        case 'infinite':
            return updateInfinite(dir, state, triggerNotifications);
        case 'finite':
            return updateFinite(dir, state, triggerNotifications);
    }
};
var swipeStarts = function swipeStarts(touch, state) {
    var mode = state.mode;
    switch (mode) {
        case 'infinite':
            return swipeStartsInfinite(touch, state);
        case 'finite':
            return swipeStartsFinite(touch, state);
    }
};
var swipeContinuous = function swipeContinuous(currentPos, state) {
    var mode = state.mode;
    switch (mode) {
        case 'infinite':
            return swipeContinuousInfinite(currentPos, state);
        case 'finite':
            return swipeContinuousFinite(currentPos, state);
    }
};
var swipeEnds = function swipeEnds(finalPos, state) {
    var mode = state.mode;
    switch (mode) {
        case 'infinite':
            return swipeEndsInfinite(finalPos, state);
        case 'finite':
            return swipeEndsFinite(finalPos, state);
    }
};
//# sourceMappingURL=logic.js.map

/// <reference path="./definitions.ts" />
var querySelector = HTMLElement.prototype.querySelector;
var Carousel = function () {
    function Carousel(element) {
        this.swipeDir = undefined;
        this.isSwiping = undefined;
        this.busy = false;
        this.index = 0;
        this.offset = 0;
        this.mode = 'finite';
        this.pagination = {
            left: null,
            right: null,
            indicator: null
        };
        this.element = element;
    }
    Carousel.prototype.attached = function () {
        var _this = this;
        this.touchStart = new PosCoordinates(0, 0);
        this.mode = this.element.getAttribute('loop') || 'finite';
        this.container = querySelector.call(this.element, '[role="container"]');
        this.container.addEventListener('transitionend', function (_) {
            return _this.busy = false;
        });
        if (this.mode === 'infinite') {
            // Note: This event will not be always triggered!
            // When we move to the [right], first of all, we remove `no-transition` class from the container.
            // Thus, transition happens and we have the event.
            // However, when we move to the [left], we add the `no-transition` class to the Container.
            // Thus, the transition will not be happening and the callback will not be called.
            this.container.addEventListener('transitionend', function (_) {
                mutate(_this, afterInfiniteUpdated(_this, false));
                // this.busy = false;
            });
        }
        // Create Listeners.
        this.resizeListener = throttle(step.bind(null, 0, this.mode, this), 100);
        this.touchStartListener = this.touchStartEventHandler.bind(this);
        this.touchMoveListener = this.touchMoveEventHandler.bind(this);
        this.touchEndListener = this.touchEndEventHandler.bind(this);
        // Add Listeners.
        window.addEventListener('resize', this.resizeListener);
        this.element.addEventListener('touchstart', this.touchStartListener);
        this.element.addEventListener('touchmove', this.touchMoveListener);
        this.element.addEventListener('touchend', this.touchEndListener);
        if (!('touchend' in window)) {
            forEach(function (btn) {
                var direction = btn.getAttribute('data-direction');
                _this.pagination[btn.getAttribute('data-direction')] = btn;
                btn.addEventListener('click', function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    mutate(_this, step(direction === 'left' ? -1 : 1, _this));
                });
            }, this.element.querySelectorAll('[role="nav-button"]'));
        }
        this.pagination.indicator = this.element.querySelector('[role="indicator"]');
        this.index = 0;
        mutate(this, step(0, this, false));
        this.busy = false;
    };
    Carousel.prototype.detached = function () {
        window.removeEventListener('resize', this.resizeListener, true);
        this.element.removeEventListener('touchstart', this.touchStartListener, true);
        this.element.removeEventListener('touchmove', this.touchMoveListener, true);
        this.element.removeEventListener('touchend', this.touchEndListener, true);
    };
    Carousel.prototype.touchStartEventHandler = function (event) {
        var target = event.target;
        if (target.classList.contains('as24-carousel__button')) {
            event.preventDefault();
            event.stopPropagation();
        }
        if (this.busy) return;
        if (target.classList.contains('as24-carousel__button')) {
            var btnDirection = target.dataset.direction;
            mutate(this, step(btnDirection === 'left' ? -1 : 1, this));
        } else {
            var navButtons = Array.from(this.element.querySelectorAll('[role="nav-button"]'));
            if (!navAvailable(navButtons)) {
                return;
            }
            mutate(this, swipeStarts(getTouchCoords(event), this));
        }
    };
    Carousel.prototype.touchMoveEventHandler = function (event) {
        var target = event.target;
        var navButtons = Array.from(this.element.querySelectorAll('[role="nav-button"]'));
        if (this.busy) return;
        if (this.isSwiping) {
            event.preventDefault();
        }
        if (!navAvailable(navButtons)) {
            return;
        }
        if (!target.classList.contains('as24-carousel__button')) {
            mutate(this, swipeContinuous(getTouchCoords(event), this));
        }
    };
    Carousel.prototype.touchEndEventHandler = function (event) {
        var navButtons = Array.from(this.element.querySelectorAll('[role="nav-button"]'));
        var finalTouch = getTouchCoords(event.changedTouches[0]);
        if (!navAvailable(navButtons) || this.touchStart && this.touchStart.x === finalTouch.x) {
            return;
        }
        mutate(this, swipeEnds(finalTouch, this));
    };
    Carousel.prototype.goTo = function (index, options) {
        this.index = --index;
        this.index = calcStepIndex(0, this);
        this.touchStart = new PosCoordinates(0, 0);
        mutate(this, step(0, this, options.notify));
        this.busy = false;
    };
    Carousel.prototype.getIndex = function () {
        return this.index;
    };
    Carousel.prototype.redraw = function (triggerNotifications) {
        if (triggerNotifications === void 0) {
            triggerNotifications = true;
        }
        mutate(this, step(0, this, triggerNotifications));
        this.busy = false;
    };
    Carousel.prototype.removeItem = function (index) {
        this.container.children[index].remove();
        this.busy = false;
        this.goTo(1, { notify: false });
    };
    return Carousel;
}();

/// <reference path="../node_modules/typescript/lib/lib.es6.d.ts" />
function elementAttachedHandler() {
    this.carousel = new Carousel(this);
    this.carousel.attached();
}
function elementDetachedCallback() {
    this.carousel.detached();
    delete this.carousel;
}
try {
    document['registerElement']('as24-carousel', {
        prototype: Object.assign(Object.create(HTMLElement.prototype, {
            attachedCallback: { value: elementAttachedHandler },
            detachedCallback: { value: elementDetachedCallback },
            attributeChangedCallback: { value: function value() {} }
        }), {
            goTo: function goTo(index, options) {
                this.carousel.goTo(index, options || { notify: true });
            },
            getIndex: function getIndex() {
                return this.carousel.index;
            },
            redraw: function redraw(triggerNotifications) {
                this.carousel.redraw(triggerNotifications);
            },
            removeItem: function removeItem(index) {
                this.carousel.removeItem(index);
            }
        })
    });
} catch (e) {
    if (window && window.console) {
        window.console.warn('Failed to register CustomElement "as24-carousel".', e);
    }
}
//# sourceMappingURL=showcar-carousel.js.map
