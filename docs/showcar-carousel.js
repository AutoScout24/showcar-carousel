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
var getNextIndex = function getNextIndex(mode, dir, maxItems, oldIndex, itemsVisible, canGoRight) {
    var newIndex = 0;
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
var getVars = function getVars(element, container) {
    var rootElemWidth = getElementWidth(element, false);
    var itemWidth = getElementWidth(container.children.item(0), true);
    var totalWidth = Array.from(container.children).reduce(function (acc, item) {
        return acc += getElementWidth(item, true);
    }, 0);
    var maxOffset = totalWidth - rootElemWidth;
    var itemsVisible = Math.floor(rootElemWidth / itemWidth);
    return { maxOffset: maxOffset, itemWidth: itemWidth, itemsVisible: itemsVisible };
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
var getElementWidth = function getElementWidth(element, inclMargins) {
    var computed = getComputedStyle(element);
    var width = parseFloat(computed.width);
    var ml = parseFloat(computed.marginLeft);
    var mr = parseFloat(computed.marginRight);
    var margin = mr === ml ? ml : mr;
    if (inclMargins) {
        width += margin;
    }
    return width;
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
var doUpdateNavigationButtonsState = function doUpdateNavigationButtonsState(left, right, mode, canGoLeft, canGoRight) {
    if (left && right) {
        if (mode === 'infinite') {
            removeClass('as24-carousel__button--hidden', left);
            removeClass('as24-carousel__button--hidden', right);
            return true;
        } else {
            toggleClass('as24-carousel__button--hidden', left, canGoLeft);
            toggleClass('as24-carousel__button--hidden', right, canGoRight);
            return true;
        }
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
        return removeClass('as24-carousel__item--static', x);
    });
    order.forEach(function (x, i) {
        if (x > howMany - 1) {
            addClass('as24-carousel__item--static', items[i]);
        }
    });
    return items;
};

/// <reference path="./definitions.ts" />
var getNextOffset = function getNextOffset(index, itemWidth, maxOffset) {
    var offset = index * itemWidth;
    return offset > maxOffset ? maxOffset : offset;
};
var updateFinite = function updateFinite(dir, state) {
    var element = state.element,
        container = state.container,
        offset = state.offset,
        index = state.index,
        pagination = state.pagination;
    var _a = getVars(element, container),
        itemWidth = _a.itemWidth,
        maxOffset = _a.maxOffset,
        itemsVisible = _a.itemsVisible;
    index = getNextIndex('finite', dir, container.children.length, index, itemsVisible, offset < maxOffset);
    offset = getNextOffset(index, itemWidth, maxOffset);
    // side effects
    doUpdateNavigationButtonsState(pagination.left, pagination.right, 'finite', offset <= 0, offset >= maxOffset);
    if (offset > 0 && offset < maxOffset) {
        doNotify(element, dir, index);
    }
    doUpdateIndicator(pagination.indicator, index + 1, container.children.length);
    doMove(container, offset);
    return { index: index, offset: offset };
};

/// <reference path="./definitions.ts" />
var reorder = function reorder(dir, items) {
    if (dir < 0) {
        var x = items[0],
            rest = items.slice(1);
        return rest.concat(x);
    } else if (dir > 0) {
        var last = items.pop();
        return [last].concat(items);
    } else {
        return items;
    }
};
// This function will be called either by the event listener or in updateInfinite fn.
var afterInfiniteUpdated = function afterInfiniteUpdated(state, supposeToMoveToLeft) {
    var element = state.element,
        container = state.container,
        itemsOrder = state.itemsOrder,
        offset = state.offset,
        index = state.index;
    var itemWidth = getVars(element, container).itemWidth;
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
        itemsOrder = state.itemsOrder,
        offset = state.offset,
        index = state.index,
        pagination = state.pagination;
    var _a = getVars(element, container),
        itemWidth = _a.itemWidth,
        itemsVisible = _a.itemsVisible;
    var items = Array.from(container.children);
    index = getNextIndex('infinite', dir, container.children.length - 1, index);
    offset = dir * itemWidth;
    itemsOrder = reorder(dir, itemsOrder);
    // left := dir === -1, right := dir === 1;
    if (dir < 0) {
        addClass('as24-carousel__container--static', container);
        doSetPositioning(2, items, doReorderItems(items, itemsOrder));
        doMove(container, -1 * offset);
        afterInfiniteUpdated(state, true);
    } else if (dir > 0) {
        removeClass('as24-carousel__container--static', container);
        doMove(container, offset);
    }
    doUpdateNavigationButtonsState(pagination.left, pagination.right, 'infinite');
    doNotify(element, dir, index);
    doUpdateIndicator(pagination.indicator, index + 1, container.children.length);
    return { index: index, offset: offset, itemsOrder: itemsOrder };
};

/// <reference path="./definitions.ts" />
var update = function update(dir, mode, state) {
    switch (mode) {
        case 'infinite':
            return updateInfinite(dir, state);
        case 'finite':
            return updateFinite(dir, state);
    }
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
        this.resizeListener = throttle(update.bind(null, 0, this.mode, this), 100);
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
                mutate(_this, update(direction === 'left' ? -1 : 1, _this.mode, _this));
            });
            btn.addEventListener('click', function (evt) {
                return evt.preventDefault();
            });
        }, this.element.querySelectorAll('[role="nav-button"]'));
        this.pagination.indicator = this.element.querySelector('[role="indicator"]');
        mutate(this, update(0, this.mode, this));
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
        mutate(this, update(this.touchStart.x - touchEndCoords.x > 0 ? 1 : -1, this.mode, this));
    };
    Carousel.prototype.goTo = function (index) {
        var dir = index > this.index ? 1 : -1;
        mutate(this, update(dir, this.mode, this));
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
            redraw: function redraw() {
                this.carousel.redraw();
            },
            goTo: function goTo(index) {
                this.carousel.goTo(index);
            },
            getIndex: function getIndex() {
                return this.carousel.index;
            }
        })
    });
} catch (e) {
    if (window && window.console) {
        window.console.warn('Failed to register CustomElement "as24-carousel".', e);
    }
}