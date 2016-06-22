'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Poly-fill for CustomEvent.
 * ToDo: Move to ui utils library
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
 * Add a class to the given DOM element.
 * @param {string} className
 * @param {HTMLElement} element
 * @returns {HTMLElement}
 * ToDo: Move to ui utils library
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
 * ToDo: Move to ui utils library
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
 * ToDo: Move to ui utils library
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

    this.pagination = {
      left: null,
      right: null
    };

    this.index = 0;
    this.lastIndex = 0;
    this.refWidth = 330;
    this.itemWidth = 330;
    this.touchStart = {};

    this.speed = Carousel.Speed.SLOW;

    this.pager = document.createElement('a');
    addClass('as24-pagination', this.pager);
    addClass('hide', this.pager);
    this.pager.href = '#';
  }

  /**
   * Gets all carousel items.
   */


  _createClass(Carousel, [{
    key: 'attached',


    /**
     * Initializes the carousel by adding all necessary bits and bolts.
     */
    value: function attached() {
      // Get the initial window with
      this.windowWidth = this.getWindowWidth();

      // Create Listeners
      this.resizeListener = this.resizeTimeoutHandler.bind(this);
      this.touchStartListener = this.touchStartEventHandler.bind(this);
      this.touchMoveListener = this.touchMoveEventHandler.bind(this);
      this.touchEndListener = this.touchEndEventHandler.bind(this);

      // Add Listeners
      window.addEventListener('resize', this.resizeListener, true);
      this.element.addEventListener('touchstart', this.touchStartListener, true);
      this.element.addEventListener('touchmove', this.touchMoveListener, true);
      this.element.addEventListener('touchend', this.touchEndListener, true);

      // Add all necessary items and do the math
      this.addContainer();
      this.resizeItems();
      this.addPagination();
      this.calculateEnvironment();
      this.loadImages();
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
    }

    /**
     * Redraw the whole carousel.
     * @public
     */

  }, {
    key: 'redraw',
    value: function redraw() {
      var _this = this;

      this.resizeItems();
      this.calculateEnvironment();

      if (this.config.mode === Carousel.Mode.DEFAULT) {

        this.index = 0;
        this.move(0, this.container);
        this.setPaginationButtonsVisibility();
      } else if (this.config.mode === Carousel.Mode.SLIDER) {

        [].forEach.call(this.items, function (element, index) {
          if (index !== _this.index) {
            addClass('no-transition', element);
            _this.move(parseInt(_this.stepWidth), element);
            removeClass('no-transition', element);
          }
        });
      }

      this.loadImages();
    }

    /**
     * Resizes the carousel items.
     */

  }, {
    key: 'resizeItems',
    value: function resizeItems() {
      var _this2 = this;

      this.orgWidth = this.items[0].getBoundingClientRect().width + this.config.gap;
      if (this.orgWidth === this.refWidth && this.element.offsetWidth < this.refWidth) {
        this.itemWidth = this.element.offsetWidth - this.config.gap;
        [].forEach.call(this.items, function (element) {
          return element.style.width = _this2.itemWidth - _this2.config.gap + 'px';
        });
      } else {
        this.itemWidth = this.items[0].getBoundingClientRect().width + this.config.gap;
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
      if (!containsClass('as24-pagination', target)) {
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
          this.paginate(Carousel.Direction.RIGHT);
        } else if (touchDiffX < 0) {
          this.paginate(Carousel.Direction.LEFT);
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
      return new Carousel.Coordinate(event.clientX || touch && touch.clientX, event.clientY || touch && touch.clientY);
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
      var _this3 = this;

      if (containsClass('as24-carousel-wrapper', this.element.firstChild)) {
        this.wrapper = this.element.querySelector('.as24-carousel-wrapper');
        this.container = this.element.querySelector('.as24-carousel-container');
        return;
      }

      this.wrapper = document.createElement('div');
      addClass('as24-carousel-wrapper', this.wrapper);

      this.container = document.createElement('div');
      addClass('as24-carousel-container', this.container);

      [].forEach.call(this.element.children, function (element) {
        var item = element.cloneNode(true);
        _this3.container.appendChild(item);
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
      var _this4 = this;

      [].forEach.call(this.container.children, function (element) {
        _this4.container.removeChild(element);
      });
      this.wrapper.removeChild(this.container);
      this.element.removeChild(this.wrapper);
    }

    /**
     * Adds the 'left' and 'right 'pagination buttons.
     */

  }, {
    key: 'addPagination',
    value: function addPagination() {
      this.removePagination();
      var _arr = [Carousel.Direction.LEFT, Carousel.Direction.RIGHT];
      for (var _i = 0; _i < _arr.length; _i++) {
        var direction = _arr[_i];
        this.createPaginationButton(direction);
      }

      removeClass('hide', this.pagination.right);

      if (this.config.mode === Carousel.Mode.SLIDER) {
        removeClass('hide', this.pagination.left);
      }
    }

    /**
     * Removes the 'left' and 'right 'pagination buttons.
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
     * Creates the pagination buttons and event listeners.
     * @param {Direction|String} direction - the pagination direction. 'right' or 'left'
     */

  }, {
    key: 'createPaginationButton',
    value: function createPaginationButton(direction) {
      var _this5 = this;

      var button = this.pagination[direction] = this.pager.cloneNode(true);
      button.setAttribute('data-direction', direction);

      button.addEventListener('mouseup', function (e) {
        e.stopPropagation();
        e.preventDefault();
        _this5.paginate(direction);
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
      this.update(Carousel.Direction.RIGHT);
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
     */

  }, {
    key: 'calculateEnvironment',
    value: function calculateEnvironment() {
      this.itemsLength = this.container.children.length;
      this.itemsVisible = Math.floor(this.element.offsetWidth / this.itemWidth);
      this.totalReach = this.container.offsetWidth - this.element.offsetWidth;
      this.stepLength = this.speed === Carousel.Speed.SLOW ? this.itemsLength - this.itemsVisible : Math.ceil(this.itemsLength / this.itemsVisible);
      this.stepWidth = this.speed === Carousel.Speed.SLOW ? this.itemWidth : Math.floor(this.element.offsetWidth / this.itemWidth) * this.itemWidth;
    }

    /**
     * Get the new index for paginating depending on the direction.
     * @param {Number} index - the current index
     * @param {Direction|String} direction - the pagination direction. 'right' or 'left'
     */

  }, {
    key: 'getIndexOf',
    value: function getIndexOf(index, direction) {
      var i = parseInt(index);
      if (direction === Carousel.Direction.LEFT) {
        if (i > 0) {
          return i - 1;
        } else if (this.config.mode === Carousel.Mode.SLIDER) {
          return this.stepLength;
        } else {
          return 0;
        }
      } else if (direction === Carousel.Direction.RIGHT) {
        if (i < this.stepLength) {
          return i + 1;
        } else if (this.config.mode === Carousel.Mode.SLIDER) {
          return 0;
        } else {
          return this.stepLength;
        }
      }
    }

    /**
     * Updates the position of the carousel.
     */

  }, {
    key: 'update',
    value: function update(direction) {
      var _this6 = this;

      this.loadImages();

      if (this.config.mode === Carousel.Mode.DEFAULT) {

        var distance = this.index * this.stepWidth;
        distance = distance > this.totalReach ? this.totalReach : distance;
        distance = ~distance + 1;

        this.setPaginationButtonsVisibility();
        this.move(distance, this.container);
      } else if (this.config.mode === Carousel.Mode.SLIDER && this.lastIndex !== this.index) {
        (function () {

          var lastIndex = _this6.lastIndex;
          var lastDirection = direction === Carousel.Direction.LEFT ? '' : '-';
          var lastItem = _this6.items[lastIndex];

          var currentDirection = direction === Carousel.Direction.LEFT ? '-' : '';
          var currentItem = _this6.items[_this6.index];

          addClass('no-transition', currentItem);
          addClass('no-transition', lastItem);
          _this6.move(parseInt(currentDirection + _this6.stepWidth), currentItem);

          setTimeout(function () {

            removeClass('no-transition', currentItem);
            removeClass('no-transition', lastItem);
            currentItem.style.transform = 'translate3d(0px, 0, 0)';
            _this6.move(0, currentItem);
            _this6.move(parseInt(lastDirection + _this6.stepWidth), lastItem);
          }, 1);
        })();
      }
    }

    /**
     * Moves the element by the given distance.
     * @param {Number} distance - the moving distance
     * @param {HTMLElement} element
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
     * Only loads the images of the carousel items that are currently visible.
     * ToDo: Dependent on the current carousel mode.
     */

  }, {
    key: 'loadImages',
    value: function loadImages() {

      var items = [];

      if (this.config.mode === Carousel.Mode.DEFAULT) {
        var start = this.index;
        var itemsVisible = Math.ceil(this.element.offsetWidth / this.itemWidth);
        var end = this.speed === Carousel.Speed.SLOW ? this.index + itemsVisible : (this.index + 1) * itemsVisible;
        end = end > this.itemsLength ? this.itemsLength : end;
        for (var i = start; i < end; i++) {
          items.push(i);
        }
      } else if (this.config.mode === Carousel.Mode.SLIDER) {
        items = Array.of(this.getIndexOf(this.index, Carousel.Direction.LEFT), this.index, this.getIndexOf(this.index, Carousel.Direction.RIGHT));
      }

      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = items[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var _i2 = _step.value;

          var images = this.container.children[_i2].querySelectorAll('img');
          [].forEach.call(images, function (image) {
            var src = image.getAttribute('data-src');
            if (src !== null) {
              image.setAttribute('src', src);
              image.removeAttribute('data-src');
            }
          });
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }
    }

    /**
     * Triggers an custom event with the given name and payload.
     * @param {String} type - name of the event
     * @param {Object} payload - payload of the event
     */

  }, {
    key: 'triggerEvent',
    value: function triggerEvent(type, payload) {
      var event = new CustomEvent(type, { detail: payload });
      this.element.dispatchEvent(event);
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
      clearTimeout(this.resizeTimeout);
      this.resizeTimeout = setTimeout(this.resizeHandler.bind(this), 300);
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
  }, {
    key: 'items',
    get: function get() {
      return this.element.querySelectorAll('as24-carousel-item');
    }
  }]);

  return Carousel;
}();

/**
 * Direction Enum string values.
 * @enum {string}
 * @readonly
 */


Carousel.Direction = {
  LEFT: 'left',
  RIGHT: 'right'
};

/**
 * Speed Enum string values.
 * @enum {string}
 * @readonly
 */
Carousel.Speed = {
  SLOW: 'slow',
  FAST: 'fast'
};

/**
 * Mode Enum string values.
 * @enum {string}
 * @readonly
 */
Carousel.Mode = {
  DEFAULT: 'default',
  SLIDER: 'slider'
};

/**
 * @typedef Coordinate
 * @type Object
 * @property {number} [x = 0] - The X Coordinate
 * @property {number} [y = 0] - The Y Coordinate
 */
Carousel.Coordinate = function () {
  var x = arguments.length <= 0 || arguments[0] === undefined ? 0 : arguments[0];
  var y = arguments.length <= 1 || arguments[1] === undefined ? 0 : arguments[1];

  return {
    x: x,
    y: y
  };
};

Carousel.Attributes = [{ name: 'gap', value: 20, type: 'Number' }, { name: 'mode', value: Carousel.Mode.DEFAULT, type: 'String' }];

/**
 * Handler for creating the element.
 */
function elementCreatedHandler() {
  var config = {};
  var _iteratorNormalCompletion2 = true;
  var _didIteratorError2 = false;
  var _iteratorError2 = undefined;

  try {
    for (var _iterator2 = Carousel.Attributes[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
      var attribute = _step2.value;

      config[attribute.name] = checkValue(this.getAttribute(attribute.name), attribute.value, attribute.type);
    }
  } catch (err) {
    _didIteratorError2 = true;
    _iteratorError2 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion2 && _iterator2.return) {
        _iterator2.return();
      }
    } finally {
      if (_didIteratorError2) {
        throw _iteratorError2;
      }
    }
  }

  this.carousel = new Carousel(this, config);
}

/**
 * Handler for the attachment of the element to the dom.
 */
function elementAttachedHandler() {
  this.carousel.attached();
}

/**
 * Handler for detachment of the element from the dom.
 */
function elementDetachedCallback() {
  this.carousel.detached();
  delete this.carousel;
}

/**
 * Handler for the element attribute changes.
 * @property {String} attributeName
 */
function elementAttributeChangedHandler(attributeName) {
  if (Carousel.Attributes.hasOwnProperty(attributeName)) {
    var attribute = Carousel.Attributes[attributeName];
    this.carousel.config[attribute.name] = checkValue(this.getAttribute(attribute.name), attribute.value, attribute.type);
  }
}

/**
 * Method for assigning an default value if the given value is undefined or null.
 * @property {Object} value - value to check
 * @property {Object} defaultValue - the default value to be set if the given value is undefined
 * @property {String} type - the type of the value
 */
function checkValue(value, defaultValue) {
  var type = arguments.length <= 2 || arguments[2] === undefined ? 'String' : arguments[2];

  if (value !== 'undefined' && value !== null) {
    if (type === 'Number') {
      value = parseInt(value);
    }
    return value;
  } else {
    return defaultValue;
  }
}

/**
 * Try to register the carousel component.
 */
try {
  document.registerElement('as24-carousel', {
    prototype: Object.assign(Object.create(HTMLElement.prototype, {
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

//# sourceMappingURL=showcar-carousel.js.map