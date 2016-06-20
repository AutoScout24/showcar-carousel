'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Poly-fill for CustomEvent.
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
 * @param {HTMLElement} domEl
 * @returns {HTMLElement}
 */
function addClass(className, domEl) {
  if (!domEl.getAttribute) return domEl;

  var classList = [],
      classesString = domEl.getAttribute('class');
  if (classesString) {
    classList = classesString.split(' ');
    if (classList.indexOf(className) === -1) {
      classesString = classList.concat(className).join(' ');
    }
  } else {
    classesString = className;
  }
  domEl.setAttribute('class', classesString);
  return domEl;
}

/**
 * Remove a class from the given DOM element.
 * @param {string} className
 * @param {HTMLElement} domEl
 * @returns {HTMLElement}
 */
function removeClass(className, domEl) {
  if (!domEl.getAttribute) return domEl;

  var classList = [],
      classesString = domEl.getAttribute('class');
  if (classesString) {
    classList = classesString.split(' ');
    if (classList.indexOf(className) !== -1) {
      classList.splice(classList.indexOf(className), 1);
    }
    domEl.setAttribute('class', classList.join(' '));
  }
  return domEl;
}

/**
 * Check if the given DOM element has a class.
 * @param {string} className
 * @param {HTMLElement} domEl
 * @returns {boolean}
 */
function containsClass(className, domEl) {
  if (!domEl.getAttribute) return false;

  var classList = [],
      classesString = domEl.getAttribute('class');
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

  function Carousel(element) {
    var config = arguments.length <= 1 || arguments[1] === undefined ? {
      gap: 20
    } : arguments[1];

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
      this.index = 0;
      this.resizeItems();
      this.calculateEnvironment();
      this.setPaginationButtonsVisibility();
      this.loadImages();
      this.moveContainer(0);
    }

    /**
     * Resizes the carousel items.
     */

  }, {
    key: 'resizeItems',
    value: function resizeItems() {
      var _this = this;

      this.orgWidth = this.items[0].getBoundingClientRect().width + this.config.gap;
      if (this.orgWidth === this.refWidth && this.element.offsetWidth < this.refWidth) {
        this.itemWidth = this.element.offsetWidth - this.config.gap;
        [].forEach.call(this.items, function (element) {
          return element.style.width = _this.itemWidth - _this.config.gap + 'px';
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
     * @param {Direction|String} direction - the pagination direction. 'right' or 'left'
     */

  }, {
    key: 'getNewIndex',
    value: function getNewIndex(direction) {
      if (direction === Carousel.Direction.LEFT && this.index > 0) {
        this.index -= 1;
      } else if (direction === Carousel.Direction.RIGHT && this.index < this.stepLength) {
        this.index += 1;
      }
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

      this.container = document.createElement('div');
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
      var _this4 = this;

      var button = this.pagination[direction] = this.pager.cloneNode(true);
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
      this.index = index;
      this.triggerEvent('slide', {
        index: this.index
      });
      this.update();
    }

    /**
     * The handler for the pagination event.
     * @param {Direction|String} direction - the pagination direction. 'right' or 'left'
     */

  }, {
    key: 'paginate',
    value: function paginate(direction) {
      this.getNewIndex(direction);
      this.triggerEvent('slide', {
        direction: direction,
        index: this.index
      });
      this.update();
    }

    /**
     * Updates the position of the carousel.
     */

  }, {
    key: 'update',
    value: function update() {
      var distance = this.calculateDistance();
      this.setPaginationButtonsVisibility();
      this.loadImages();
      this.moveContainer(distance);
    }
  }, {
    key: 'calculateDistance',
    value: function calculateDistance() {
      var distance = this.index * this.stepWidth;
      distance = distance > this.totalReach ? this.totalReach : distance;
      return ~distance + 1;
    }

    /**
     * Moves the container by the given distance.
     * @param {Number} distance - the moving distance
     */

  }, {
    key: 'moveContainer',
    value: function moveContainer() {
      var distance = arguments.length <= 0 || arguments[0] === undefined ? 0 : arguments[0];

      this.container.style.transform = 'translate3d(' + distance + 'px, 0, 0)';
      this.container.style.webkitTransform = 'translate3d(' + distance + 'px, 0, 0)';
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
     */

  }, {
    key: 'loadImages',
    value: function loadImages() {
      var start = this.index;
      var itemsVisible = Math.ceil(this.element.offsetWidth / this.itemWidth);
      var end = this.speed === Carousel.Speed.SLOW ? this.index + itemsVisible : (this.index + 1) * itemsVisible;
      end = end > this.itemsLength ? this.itemsLength : end;
      for (var i = start; i < end; i++) {
        var images = this.container.children[i].querySelectorAll('img');
        [].forEach.call(images, function (image) {
          var src = image.getAttribute('data-src');
          if (src !== null) {
            image.setAttribute('src', src);
            image.removeAttribute('data-src');
          }
        });
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
      var currentWindowWidth = getWindowWidth();
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

/**
 * Handler for creating the element.
 */
function elementCreatedHandler() {
  var gap = parseInt(checkValue(this.getAttribute('gap'), 20));
  this.carousel = new Carousel(this, {
    gap: gap
  });
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
  if (attributeName === 'gap') {
    this.carousel.config.gap = parseInt(checkValue(this.getAttribute('gap'), 20));
  }
}

/**
 * Method for assigning an default value if the given value is undefined or null.
 * @property {Object} value - value to check
 * @property {Object} defaultValue - the default value to be set if the given value is undefined
 */
function checkValue(value, defaultValue) {
  return typeof value !== 'undefined' && value !== null ? value : defaultValue;
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