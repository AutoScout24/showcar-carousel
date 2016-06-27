'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Poly-fill for "CustomEvent".
 * ToDo: v3 -> Move to ui utils library.
 */
(function () {
  if (typeof window.CustomEvent === "function") return false;
  function CustomEvent(event, params) {
    params = params || { bubbles: false, cancelable: false, detail: undefined };
    var evt = document.createEvent('CustomEvent');
    evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
    return evt;
  }
  CustomEvent.prototype = window.Event.prototype;
  window.CustomEvent = CustomEvent;
})();

/**
 * Poly-fill for "Array.of".
 * ToDo: v3 -> Move to ui utils library.
 */
(function () {
  if (!Array.of) {
    Array.of = function () {
      return Array.prototype.slice.call(arguments);
    };
  }
})();

/**
 * Add a class to the given DOM element.
 * @param {string} className
 * @param {HTMLElement} element
 * @returns {HTMLElement}
 * ToDo: v3 -> Move to ui utils library.
 */
function addClass(className, element) {
  if (!element.getAttribute) return element;

  var classList = [],
      classesString = element.getAttribute('class');
  if (classesString) {
    classList = classesString.split(' ');
    if (classList.indexOf(className) === -1) {
      classesString = classList.concat(className).join(' ');
    }
  } else {
    classesString = className;
  }
  element.setAttribute('class', classesString);
  return element;
}

/**
 * Remove a class from the given DOM element.
 * @param {string} className
 * @param {HTMLElement} element
 * @returns {HTMLElement}
 * ToDo: v3 -> Move to ui utils library.
 */
function removeClass(className, element) {
  if (!element.getAttribute) return element;

  var classList = [],
      classesString = element.getAttribute('class');
  if (classesString) {
    classList = classesString.split(' ');
    if (classList.indexOf(className) !== -1) {
      classList.splice(classList.indexOf(className), 1);
    }
    element.setAttribute('class', classList.join(' '));
  }
  return element;
}

/**
 * Check if the given DOM element has a class.
 * @param {string} className
 * @param {HTMLElement} element
 * @returns {boolean}
 * ToDo: v3 -> Move to ui utils library.
 */
function containsClass(className, element) {
  if (!element.getAttribute) return false;

  var classList = [],
      classesString = element.getAttribute('class');
  if (classesString) {
    classList = classesString.split(' ');
  }
  return classList.indexOf(className) > -1;
}

/**
 * Main Class for the Carousel component.
 * ToDo: v3 -> Create a CarouselBase class with all the basics where the final carousel and slider should extend from.
 * ToDo: v3 -> Remove the carousel mode instead use two custom elements with own classes. ( as24-carousel, as24-slider )
 */

var Carousel = function () {

  /** @constructor */

  function Carousel(element, config) {
    _classCallCheck(this, Carousel);

    this.config = config;
    this.element = element;
    this.container = null;

    this.resizeTimeout = null;
    this.resizeListener = null;
    this.touchStartListener = null;
    this.touchMoveListener = null;
    this.touchEndListener = null;

    this.Enums = {
      Direction: {
        LEFT: 'left',
        RIGHT: 'right'
      },
      Speed: {
        SLOW: 'slow',
        FAST: 'fast'
      },
      Mode: {
        DEFAULT: 'default',
        SLIDER: 'slider'
      }
    };

    this.pagination = {
      left: null,
      right: null,
      indicator: null
    };

    this.index = 0;
    this.lastIndex = 0;
    this.refWidth = 330;
    this.itemWidth = 330;
    this.touchStart = {};
    this.itemsLength = 1;

    this.speed = this.Enums.Speed.SLOW;
    this.time = null;
  }

  /**
   * @typedef Coordinate
   * @type Object
   * @property {number} [x = 0] - The X Coordinate
   * @property {number} [y = 0] - The Y Coordinate
   */


  _createClass(Carousel, [{
    key: 'Coordinate',
    value: function Coordinate() {
      var x = arguments.length <= 0 || arguments[0] === undefined ? 0 : arguments[0];
      var y = arguments.length <= 1 || arguments[1] === undefined ? 0 : arguments[1];

      return { x: x, y: y };
    }

    /**
     * Gets all carousel items.
     */

  }, {
    key: 'attached',


    /**
     * Initializes the carousel by adding all necessary bits and bolts.
     */
    value: function attached() {
      // Get the initial window with.
      this.windowWidth = this.getWindowWidth();

      // Create Listeners.
      this.resizeListener = this.resizeTimeoutHandler.bind(this);
      this.touchStartListener = this.touchStartEventHandler.bind(this);
      this.touchMoveListener = this.touchMoveEventHandler.bind(this);
      this.touchEndListener = this.touchEndEventHandler.bind(this);

      // Add Listeners.
      window.addEventListener('resize', this.resizeListener, true);
      this.element.addEventListener('touchstart', this.touchStartListener, true);
      this.element.addEventListener('touchmove', this.touchMoveListener, true);
      this.element.addEventListener('touchend', this.touchEndListener, true);

      // Add container and pagination buttons.
      this.addContainer();
      this.addPagination();
      this.addIndicator();

      // Redraw the scene.
      this.redraw();
    }

    /**
     * Initializes the carousel by adding all necessary bits and bolts.
     */

  }, {
    key: 'detached',
    value: function detached() {
      // Remove Listeners
      window.removeEventListener('resize', this.resizeListener, true);
      this.element.removeEventListener('touchstart', this.touchStartListener, true);
      this.element.removeEventListener('touchmove', this.touchMoveListener, true);
      this.element.removeEventListener('touchend', this.touchEndListener, true);

      // Remove dynamically created Elements
      this.removeContainer();
      this.removePagination();
      this.removeIndicator();
    }

    /**
     * Redraw the whole carousel.
     * @public
     * ToDo: v3 -> should be extended by Carousel and Slider class.
     */

  }, {
    key: 'redraw',
    value: function redraw() {

      this.resizeItems();
      this.calculateEnvironment();

      // ToDo: v3 -> move to Carousel class.
      if (this.config.mode === this.Enums.Mode.DEFAULT) {
        this.index = 0;
        this.updateDefault();

        // ToDo: v3 -> move to Slider class.
      } else if (this.config.mode === this.Enums.Mode.SLIDER) {
          this.updateSlider({ transition: false });
        }

      this.updateIndicator();
    }

    /**
     * Resizes the carousel items.
     */

  }, {
    key: 'resizeItems',
    value: function resizeItems() {
      var _this = this;

      // ToDo: v3 -> move to Slider class.
      if (this.config.mode === this.Enums.Mode.SLIDER && this.config.preview && this.element.offsetWidth > this.config.previewBreakpoint) {
        addClass('dynamic-ratio', this.element);
      } else {
        removeClass('dynamic-ratio', this.element);
      }

      this.orgWidth = this.items[0].getBoundingClientRect().width + this.config.gap;
      if (this.orgWidth === this.refWidth && this.element.offsetWidth < this.refWidth) {
        this.itemWidth = this.element.offsetWidth - this.config.gap;
        [].forEach.call(this.items, function (element) {
          return element.style.width = _this.itemWidth - _this.config.gap + 'px';
        });
      } else {
        this.itemWidth = this.items[0].getBoundingClientRect().width + this.config.gap;
      }

      if (this.config.mode === this.Enums.Mode.SLIDER && this.config.preview) {
        if (this.element.offsetWidth > this.config.previewBreakpoint) {
          (function () {
            var buttons = _this.element.querySelectorAll('[data-direction]');
            var offset = (_this.element.offsetWidth - _this.itemWidth) / 2;
            var width = offset > 40 ? offset : 40;
            [].forEach.call(buttons, function (element) {
              element.style.width = width + 'px';
            });
            if (_this.config.indicator) {
              _this.pagination.indicator.style.left = width + 'px';
            }
          })();
        } else {
          if (this.config.indicator) {
            this.pagination.indicator.style.left = null;
          }
        }
      }
    }

    /**
     * Handles the touch start event.
     * @param {Event} event - the event object
     */

  }, {
    key: 'touchStartEventHandler',
    value: function touchStartEventHandler(event) {
      var target = event.target;
      this.resetTouch();
      if (!containsClass('as24-pagination-button', target)) {
        this.touchStart = this.getTouchCoords(event);
      }
    }

    /**
     * Handles the touch move event.
     * @param {Event} event - the event object
     */

  }, {
    key: 'touchMoveEventHandler',
    value: function touchMoveEventHandler(event) {
      if (!this.isSwiping()) {
        return;
      }

      var touchCoords = this.getTouchCoords(event);
      var startDiffX = Math.abs(touchCoords.x - this.touchStart.x);
      var startDiffY = Math.abs(touchCoords.y - this.touchStart.y);

      if (startDiffX < startDiffY) {
        this.resetTouch();
      } else {
        event.preventDefault();
      }
    }

    /**
     * Handles the touch end event.
     * @param {Event} event - the event object
     */

  }, {
    key: 'touchEndEventHandler',
    value: function touchEndEventHandler(event) {
      if (!this.isSwiping()) {
        return;
      }

      var touchCoords = this.getTouchCoords(event.changedTouches[0]);
      var touchDiffX = this.touchStart.x - touchCoords.x;
      var absTouchDiffX = Math.abs(touchDiffX);
      var howMany = Math.ceil(absTouchDiffX / this.itemWidth);

      for (var i = 0; i < howMany; i++) {
        if (touchDiffX > 0) {
          this.paginate(this.Enums.Direction.RIGHT);
        } else if (touchDiffX < 0) {
          this.paginate(this.Enums.Direction.LEFT);
        }
      }
    }

    /**
     * Gets the touch coordinates by its touch event.
     * @param {Event} event - the event object
     * @returns {Coordinate} coordinate - object containing some x and y coordinates
     */

  }, {
    key: 'getTouchCoords',
    value: function getTouchCoords(event) {
      var touch = event.touches && event.touches[0];
      return new this.Coordinate(event.clientX || touch && touch.clientX, event.clientY || touch && touch.clientY);
    }

    /**
     * Resets the touch coordinates.
     */

  }, {
    key: 'resetTouch',
    value: function resetTouch() {
      this.touchStart = {};
    }

    /**
     * Checks if the carousel is in swiping mode.
     * @returns {boolean}
     */

  }, {
    key: 'isSwiping',
    value: function isSwiping() {
      return Object.keys(this.touchStart).length > 0;
    }

    /**
     * Wraps all the carousel items in a wrapper plus a container.
     */

  }, {
    key: 'addContainer',
    value: function addContainer() {
      var _this2 = this;

      if (containsClass('as24-carousel-wrapper', this.element.firstChild)) {
        this.wrapper = this.element.querySelector('.as24-carousel-wrapper');
        this.container = this.element.querySelector('.as24-carousel-container');
        return;
      }

      this.wrapper = document.createElement('div');
      addClass('as24-carousel-wrapper', this.wrapper);

      this.container = document.createElement('ul');
      addClass('as24-carousel-container', this.container);

      [].forEach.call(this.element.children, function (element) {
        var item = element.cloneNode(true);
        _this2.container.appendChild(item);
      });

      this.wrapper.appendChild(this.container);
      this.element.innerHTML = '';
      this.element.appendChild(this.wrapper);
    }

    /**
     * Removes the container.
     */

  }, {
    key: 'removeContainer',
    value: function removeContainer() {
      var _this3 = this;

      [].forEach.call(this.container.children, function (element) {
        _this3.container.removeChild(element);
      });
      this.wrapper.removeChild(this.container);
      this.element.removeChild(this.wrapper);
    }

    /**
     * Adds the 'left' and 'right 'pagination buttons.
     * ToDo: v3 -> should be extended by Slider class.
     */

  }, {
    key: 'addPagination',
    value: function addPagination() {
      this.removePagination();
      var _arr = [this.Enums.Direction.LEFT, this.Enums.Direction.RIGHT];
      for (var _i = 0; _i < _arr.length; _i++) {
        var direction = _arr[_i];
        this.createPaginationButton(direction);
      }
      removeClass('hide', this.pagination.right);

      // ToDo: v3 -> move to Slider class.
      if (this.config.mode === this.Enums.Mode.SLIDER) {
        removeClass('hide', this.pagination.left);
      }
    }

    /**
     * Removes the pagination 'left', 'right' buttons and indicator.
     */

  }, {
    key: 'removePagination',
    value: function removePagination() {
      var buttons = this.element.querySelectorAll('[data-direction]');
      [].forEach.call(buttons, function (element) {
        element.parentNode.removeChild(element);
      });
    }

    /**
     * Adds the page indicator
     */

  }, {
    key: 'addIndicator',
    value: function addIndicator() {
      if (!this.config.indicator) return;
      this.pagination.indicator = document.createElement('div');
      addClass('as24-pagination-indicator', this.pagination.indicator);
      this.element.appendChild(this.pagination.indicator);
      this.updateIndicator();
    }

    /**
     * Removes the page indicator
     */

  }, {
    key: 'removeIndicator',
    value: function removeIndicator() {
      var indicator = this.element.querySelector('.as24-pagination-indicator');
      if (indicator !== null) this.element.removeChild(indicator);
    }

    /**
     * Creates the pagination buttons and event listeners.
     * @param {Direction|String} direction - the pagination direction. 'right' or 'left'
     */

  }, {
    key: 'createPaginationButton',
    value: function createPaginationButton(direction) {
      var _this4 = this;

      var button = this.pagination[direction] = document.createElement('a');
      addClass('as24-pagination-button', button);
      addClass('hide', button);
      button.href = '#';
      button.setAttribute('data-direction', direction);

      button.addEventListener('mouseup', function (e) {
        e.stopPropagation();
        e.preventDefault();
        _this4.paginate(direction);
      });

      button.addEventListener('click', function (e) {
        return e.preventDefault();
      });

      this.element.appendChild(button);
    }

    /**
     * Move the carousel to an specified image.
     * @public
     * @param {Number} index
     */

  }, {
    key: 'goTo',
    value: function goTo(index) {
      this.lastIndex = parseInt(this.index);
      this.index = index;
      this.triggerEvent('slide', {
        index: this.index
      });
      this.update(this.Enums.Direction.RIGHT);
    }

    /**
     * The handler for the pagination event.
     * @param {Direction|String} direction - the pagination direction. 'right' or 'left'
     */

  }, {
    key: 'paginate',
    value: function paginate(direction) {
      this.lastIndex = parseInt(this.index);
      this.index = this.getIndexOf(this.index, direction);
      this.triggerEvent('slide', {
        direction: direction,
        index: this.index
      });
      this.update(direction);
    }

    /**
     * Gets all the necessary dimensions and values for calculating distances and the index.
     * ToDo: v3 -> should be extended by Carousel and Slider class.
     */

  }, {
    key: 'calculateEnvironment',
    value: function calculateEnvironment() {
      this.itemsLength = this.container.children.length;
      this.itemsVisible = Math.floor(this.element.offsetWidth / this.itemWidth);
      this.totalReach = this.container.offsetWidth - this.element.offsetWidth;
      this.stepLength = this.speed === this.Enums.Speed.SLOW ? this.itemsLength - this.itemsVisible : Math.ceil(this.itemsLength / this.itemsVisible);
      if (this.config.mode === this.Enums.Mode.SLIDER) this.stepLength = this.container.children.length - 1;
      this.stepWidth = this.speed === this.Enums.Speed.SLOW ? this.itemWidth : Math.floor(this.element.offsetWidth / this.itemWidth) * this.itemWidth;
    }

    /**
     * Get the new index for paginating depending on the direction.
     * @param {Number} index - the current index
     * @param {Direction|String} direction - the pagination direction. 'right' or 'left'
     * ToDo: v3 -> should be extended by Carousel and Slider class.
     */

  }, {
    key: 'getIndexOf',
    value: function getIndexOf(index, direction) {
      var i = parseInt(index);
      if (direction === this.Enums.Direction.LEFT) {
        if (i > 0) {
          return i - 1;
        } else if (this.config.mode === this.Enums.Mode.SLIDER) {
          return this.stepLength;
        } else {
          return 0;
        }
      } else if (direction === this.Enums.Direction.RIGHT) {
        if (i < this.stepLength) {
          return i + 1;
        } else if (this.config.mode === this.Enums.Mode.SLIDER) {
          return 0;
        } else {
          return this.stepLength;
        }
      }
    }

    /**
     * Updates the position of the carousel.
     * ToDo: v3 -> should be extended by Carousel and Slider class.
     */

  }, {
    key: 'update',
    value: function update(direction) {
      this.triggerEvent('as24-carousel:change', {
        detail: {
          id: this.element.id
        }
      }, window.document);

      this.updateIndicator();

      if (this.config.mode === this.Enums.Mode.DEFAULT) {
        this.updateDefault();
      } else if (this.config.mode === this.Enums.Mode.SLIDER && this.lastIndex !== this.index) {
        this.updateSlider({
          direction: direction
        });
      }
    }

    /**
     * Update the default carousel
     * ToDo: v3 -> move to Carousel class.
     */

  }, {
    key: 'updateDefault',
    value: function updateDefault() {

      var distance = this.index * this.stepWidth;
      distance = distance > this.totalReach ? this.totalReach : distance;
      distance = ~distance + 1;

      var items = [];
      var start = this.index;
      var itemsVisible = Math.ceil(this.element.offsetWidth / this.itemWidth);
      var end = this.speed === this.Enums.Speed.SLOW ? this.index + itemsVisible : (this.index + 1) * itemsVisible;
      end = end > this.itemsLength ? this.itemsLength : end;
      for (var i = start; i < end; i++) {
        items.push(i);
      }

      this.loadImages(items);
      this.setPaginationButtonsVisibility();
      this.move(distance, this.container);
    }

    /**
     * Updates the slider carousel position.
     * @param {Object} config - the update configuration for the slider.
     * @return {Array} affected items (for image loading).
     * ToDo: v3 -> move to Slider class.
     */

  }, {
    key: 'updateSlider',
    value: function updateSlider() {
      var _this5 = this;

      var config = arguments.length <= 0 || arguments[0] === undefined ? { direction: this.Enums.Direction.RIGHT, transition: true } : arguments[0];
      var direction = config.direction;
      var _config$transition = config.transition;
      var transition = _config$transition === undefined ? true : _config$transition;

      var left = this.Enums.Direction.LEFT;
      var right = this.Enums.Direction.RIGHT;
      var previewSize = this.element.offsetWidth > this.config.previewBreakpoint && this.config.preview ? 2 : 1;
      var offset = this.config.preview ? (this.element.offsetWidth - this.itemWidth) / 2 : 0;
      var currentItem = this.items[this.index];

      // slowing down the hard hitters ;)
      var userSpeed = this.endTime();
      this.startTime();
      var animationSpeed = userSpeed > 300 ? 300 : 0;
      [].forEach.call(this.items, function (element) {
        addClass('no-transition', element);
        element.style.transitionDuration = animationSpeed + 'ms';
      });

      if (transition) removeClass('no-transition', currentItem);
      this.move(offset, currentItem);

      var previous = this.positionItems({
        current: this.index,
        side: left,
        direction: direction,
        previewSize: previewSize,
        transition: transition,
        offset: offset
      });

      var next = this.positionItems({
        current: this.index,
        side: right,
        direction: direction,
        previewSize: previewSize,
        transition: transition,
        offset: offset
      });

      var current = [this.index];
      var affected = [].concat(_toConsumableArray(new Set([].concat(previous, current, next))));
      var all = Array.apply(null, Array(this.items.length)).map(function (x, i) {
        return i;
      });
      var excluded = all.filter(function (el) {
        return !affected.includes(el);
      });

      excluded.forEach(function (i) {
        _this5.move(_this5.element.offsetWidth, _this5.items[i]);
      });

      this.loadImages(affected);
      return affected;
    }

    /**
     * Positions and animates the items by the rules given in the config.
     * @param {Object} config - the movement configuration for the items.
     */

  }, {
    key: 'positionItems',
    value: function positionItems() {
      var config = arguments.length <= 0 || arguments[0] === undefined ? { previewSize: 2, transition: true } : arguments[0];

      var affected = [];
      var current = config.current;
      var side = config.side;
      var direction = config.direction;
      var previewSize = config.previewSize;
      var transition = config.transition;
      var offset = config.offset;


      var left = this.Enums.Direction.LEFT;
      var right = this.Enums.Direction.RIGHT;

      var index = parseInt(current);
      var removeTransition = side === left ? right : left;

      for (var i = 1; i <= previewSize; i++) {
        index = this.getIndexOf(index, side);
        affected.push(index);
        if ((i < previewSize || i === previewSize && direction === removeTransition) && transition) {
          removeClass('no-transition', this.items[index]);
        }
        var distance = this.itemWidth * i;
        distance = side === right ? offset + distance : offset - distance;
        this.move(distance, this.items[index]);
      }

      return affected;
    }

    /**
     * Updates the pagination indicator count based on the index.
     */

  }, {
    key: 'updateIndicator',
    value: function updateIndicator() {
      if (this.pagination.indicator !== null) this.pagination.indicator.innerHTML = this.index + 1 + '/' + this.itemsLength;
    }

    /**
     * Moves the element by the given distance.
     * @param {Number} distance - the moving distance.
     * @param {HTMLElement} element.
     */

  }, {
    key: 'move',
    value: function move(distance, element) {
      element.style.transform = 'translate3d(' + distance + 'px, 0, 0)';
      element.style.webkitTransform = 'translate3d(' + distance + 'px, 0, 0)';
    }

    /**
     * Sets the visibility of the pagination buttons.
     */

  }, {
    key: 'setPaginationButtonsVisibility',
    value: function setPaginationButtonsVisibility() {
      if (this.index === 0) {
        addClass('hide', this.pagination.left);
      } else {
        removeClass('hide', this.pagination.left);
      }
      if (this.index === this.stepLength) {
        addClass('hide', this.pagination.right);
      } else {
        removeClass('hide', this.pagination.right);
      }
    }

    /**
     * Lazy loads the images of the carousel items.
     * @param {Array} items - the items to be loaded.
     */

  }, {
    key: 'loadImages',
    value: function loadImages() {
      var _this6 = this;

      var items = arguments.length <= 0 || arguments[0] === undefined ? [] : arguments[0];

      [].forEach.call(items, function (i) {
        var images = _this6.container.children[i].querySelectorAll('img');
        [].forEach.call(images, function (image) {
          var src = image.getAttribute('data-src');
          if (src !== null) {
            image.setAttribute('src', src);
            image.removeAttribute('data-src');
          }
        });
      });
    }

    /**
     * Triggers an custom event with the given name and payload.
     * @param {String} type - name of the event.
     * @param {Object} payload - payload of the event.
     * @param {HTMLElement} element - the element from where to dispatch the event from.
     */

  }, {
    key: 'triggerEvent',
    value: function triggerEvent(type, payload) {
      var element = arguments.length <= 2 || arguments[2] === undefined ? this.element : arguments[2];

      var event = new CustomEvent(type, { detail: payload });
      element.dispatchEvent(event);
    }

    /**
     * Checks if the window width has changed and starts the redraw process.
     */

  }, {
    key: 'resizeHandler',
    value: function resizeHandler() {
      var currentWindowWidth = this.getWindowWidth();
      if (this.windowWidth !== currentWindowWidth) {
        this.windowWidth = currentWindowWidth;
        this.redraw();
      }
    }

    /**
     * Resize timeout call blocker.
     */

  }, {
    key: 'resizeTimeoutHandler',
    value: function resizeTimeoutHandler() {
      // ToDo: v3 -> Uncomment the following two lines and remove the last one if there is a need for an resize maniac execution blocker.
      // clearTimeout(this.resizeTimeout);
      // this.resizeTimeout = setTimeout(this.resizeHandler.bind(this), 300);
      this.resizeHandler();
    }

    /**
     * gets the current client height.
     * @returns {number}
     */

  }, {
    key: 'getWindowWidth',
    value: function getWindowWidth() {
      return window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
    }

    /**
     * Starts the time measurement.
     */

  }, {
    key: 'startTime',
    value: function startTime() {
      this.time = new Date();
    }

    /**
     * Ends the time measurement.
     * @return {Number} time in ms.
     */

  }, {
    key: 'endTime',
    value: function endTime() {
      if (this.time !== null) {
        var now = new Date();
        return now - this.time;
      } else {
        return 300;
      }
    }
  }, {
    key: 'items',
    get: function get() {
      return this.element.querySelectorAll('.as24-carousel-item');
    }
  }]);

  return Carousel;
}();

(function () {

  /**
   * Allowed custom element attributes and there defaults.
   */
  var attributes = [{ name: 'gap', value: 20, type: 'Number' }, { name: 'mode', value: 'default', type: 'String' }, { name: 'preview', value: true, type: 'Boolean' }, { name: 'previewBreakpoint', value: 640, type: 'Number' }, { name: 'indicator', value: false, type: 'Boolean' }];

  /**
   * Handler for creating the element.
   */
  var elementCreatedHandler = function elementCreatedHandler() {
    var _this7 = this;

    var config = {};
    [].forEach.call(attributes, function (attribute) {
      config[attribute.name] = checkValue(_this7.getAttribute(attribute.name), attribute.value, attribute.type);
    });
    this.carousel = new Carousel(this, config);
  };

  /**
   * Handler for the attachment of the element to the dom.
   */
  var elementAttachedHandler = function elementAttachedHandler() {
    this.carousel.attached();
  };

  /**
   * Handler for detachment of the element from the dom.
   */
  var elementDetachedCallback = function elementDetachedCallback() {
    this.carousel.detached();
    delete this.carousel;
  };

  /**
   * Handler for the element attribute changes.
   * @property {String} attributeName.
   */
  var elementAttributeChangedHandler = function elementAttributeChangedHandler(attributeName) {
    if (attributes.hasOwnProperty(attributeName)) {
      var attribute = attributes[attributeName];
      this.carousel.config[attribute.name] = checkValue(this.getAttribute(attribute.name), attribute.value, attribute.type);
    }
  };

  /**
   * Method for assigning an default value if the given value is undefined or null.
   * @property {Object} value - value to check.
   * @property {Object} defaultValue - the default value to be set if the given value is undefined.
   * @property {String} type - the type of the value.
   */
  var checkValue = function checkValue(value, defaultValue) {
    var type = arguments.length <= 2 || arguments[2] === undefined ? 'String' : arguments[2];

    if (value !== 'undefined' && value !== null) {
      if (type === 'Number') {
        value = parseInt(value);
      }
      if (type === 'Boolean') {
        value = value == 'true';
      }
      return value;
    } else {
      return defaultValue;
    }
  };

  /**
   * Try to register the carousel component.
   * ToDo: v3 -> instead carousel mode instead use two custom elements with own classes. ( as24-carousel, as24-slider )
   */
  try {
    document.registerElement('as24-carousel', {
      prototype: _extends(Object.create(HTMLElement.prototype, {
        createdCallback: { value: elementCreatedHandler },
        attachedCallback: { value: elementAttachedHandler },
        detachedCallback: { value: elementDetachedCallback },
        attributeChangedCallback: { value: elementAttributeChangedHandler }
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
})();

//# sourceMappingURL=showcar-carousel.js.map