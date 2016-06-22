/**
 * Poly-fill for CustomEvent.
 * ToDo: Move to ui utils library
 */
(function () {
  if ( typeof window.CustomEvent === "function" ) return false;
  function CustomEvent ( event, params ) {
    params = params || { bubbles: false, cancelable: false, detail: undefined };
    var evt = document.createEvent( 'CustomEvent' );
    evt.initCustomEvent( event, params.bubbles, params.cancelable, params.detail );
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

  let classList = [], classesString = element.getAttribute('class');
  if (classesString) {
    classList = classesString.split(' ');
    if (classList.indexOf(className) === -1) {
      classesString = classList.concat(className).join(' ');
    }
  } else {
    classesString = className
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

  let classList = [], classesString = element.getAttribute('class');
  if (classesString) {
    classList = classesString.split(' ');
    if(classList.indexOf(className) !== -1){
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

  let classList = [], classesString = element.getAttribute('class');
  if (classesString) {
    classList = classesString.split(' ');
  }
  return classList.indexOf(className) > -1;
}


/**
 * Main Class for the Carousel component.
 */
class Carousel {

  /** @constructor */
  constructor(element, config) {

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
  get items() {
    return this.element.querySelectorAll('as24-carousel-item');
  }

  /**
   * Initializes the carousel by adding all necessary bits and bolts.
   */
  attached() {
    // Get the initial window with
    this.windowWidth = this.getWindowWidth();

    // Create Listeners
    this.resizeListener     = this.resizeTimeoutHandler.bind(this);
    this.touchStartListener = this.touchStartEventHandler.bind(this);
    this.touchMoveListener  = this.touchMoveEventHandler.bind(this);
    this.touchEndListener   = this.touchEndEventHandler.bind(this);

    // Add Listeners
    window.addEventListener(      'resize',     this.resizeListener,      true);
    this.element.addEventListener('touchstart', this.touchStartListener,  true);
    this.element.addEventListener('touchmove',  this.touchMoveListener,   true);
    this.element.addEventListener('touchend',   this.touchEndListener,    true);

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
  detached() {
    // Remove Listeners
    window.removeEventListener(      'resize',     this.resizeListener,     true);
    this.element.removeEventListener('touchstart', this.touchStartListener, true);
    this.element.removeEventListener('touchmove',  this.touchMoveListener,  true);
    this.element.removeEventListener('touchend',   this.touchEndListener,   true);

    // Remove dynamically created Elements
    this.removeContainer();
    this.removePagination();
  }

  /**
   * Redraw the whole carousel.
   * @public
   */
  redraw() {

    this.resizeItems();
    this.calculateEnvironment();

    if(this.config.mode === Carousel.Mode.DEFAULT){

      this.index = 0;
      this.move(0, this.container);
      this.setPaginationButtonsVisibility();

    } else if(this.config.mode === Carousel.Mode.SLIDER){

      [].forEach.call(this.items, (element, index) => {
        if(index !== this.index){
          addClass('no-transition', element);
          this.move(parseInt(this.stepWidth), element);
          removeClass('no-transition', element);
        }
      });

    }

    this.loadImages();
  }

  /**
   * Resizes the carousel items.
   */
  resizeItems(){
    this.orgWidth = this.items[0].getBoundingClientRect().width + this.config.gap;
    if(this.orgWidth === this.refWidth && this.element.offsetWidth < this.refWidth){
      this.itemWidth = this.element.offsetWidth - this.config.gap;
      [].forEach.call(this.items, element => element.style.width = `${this.itemWidth-this.config.gap}px`);
    } else {
      this.itemWidth = this.items[0].getBoundingClientRect().width + this.config.gap;
    }
  }

  /**
   * Handles the touch start event.
   * @param {Event} event - the event object
   */
  touchStartEventHandler(event) {
    const target = event.target;
    this.resetTouch();
    if (!containsClass('as24-pagination', target)) {
      this.touchStart = this.getTouchCoords(event);
    }
  }

  /**
   * Handles the touch move event.
   * @param {Event} event - the event object
   */
  touchMoveEventHandler(event) {
    if (!this.isSwiping()) {
      return;
    }

    const touchCoords = this.getTouchCoords(event);
    const startDiffX  = Math.abs(touchCoords.x - this.touchStart.x);
    const startDiffY  = Math.abs(touchCoords.y - this.touchStart.y);

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
  touchEndEventHandler(event) {
    if (!this.isSwiping()) {
      return;
    }

    const touchCoords = this.getTouchCoords(event.changedTouches[0]);
    let touchDiffX    = this.touchStart.x - touchCoords.x;
    let absTouchDiffX = Math.abs(touchDiffX);
    let howMany       = Math.ceil(absTouchDiffX / this.itemWidth);

    for (let i = 0; i < howMany; i++) {
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
  getTouchCoords(event) {
    let touch = event.touches && event.touches[0];
    return new Carousel.Coordinate(
      event.clientX || (touch && touch.clientX),
      event.clientY || (touch && touch.clientY)
    );
  }

  /**
   * Resets the touch coordinates.
   */
  resetTouch() {
    this.touchStart = {};
  }

  /**
   * Checks if the carousel is in swiping mode.
   * @returns {boolean}
   */
  isSwiping() {
    return (Object.keys(this.touchStart).length > 0);
  }

  /**
   * Wraps all the carousel items in a wrapper plus a container.
   */
  addContainer() {
    if (containsClass('as24-carousel-wrapper', this.element.firstChild)){
      this.wrapper = this.element.querySelector('.as24-carousel-wrapper');
      this.container = this.element.querySelector('.as24-carousel-container');
      return;
    }

    this.wrapper = document.createElement('div');
    addClass('as24-carousel-wrapper', this.wrapper);

    this.container = document.createElement('div');
    addClass('as24-carousel-container', this.container);

    [].forEach.call(this.element.children, element => {
      let item = element.cloneNode(true);
      this.container.appendChild(item);
    });

    this.wrapper.appendChild(this.container);
    this.element.innerHTML = '';
    this.element.appendChild(this.wrapper);
  }

  /**
   * Removes the container.
   */
  removeContainer() {
    [].forEach.call(this.container.children, element => {
      this.container.removeChild(element);
    });
    this.wrapper.removeChild(this.container);
    this.element.removeChild(this.wrapper);
  }

  /**
   * Adds the 'left' and 'right 'pagination buttons.
   */
  addPagination() {
    this.removePagination();
    for (let direction of [Carousel.Direction.LEFT, Carousel.Direction.RIGHT]){
      this.createPaginationButton(direction);
    }

    removeClass('hide', this.pagination.right);

    if(this.config.mode === Carousel.Mode.SLIDER){
      removeClass('hide', this.pagination.left);
    }
  }

  /**
   * Removes the 'left' and 'right 'pagination buttons.
   */
  removePagination() {
    let buttons = this.element.querySelectorAll('[data-direction]');
    [].forEach.call(buttons, element => {
      element.parentNode.removeChild(element);
    });
  }

  /**
   * Creates the pagination buttons and event listeners.
   * @param {Direction|String} direction - the pagination direction. 'right' or 'left'
   */
  createPaginationButton(direction) {
    let button = this.pagination[direction] = this.pager.cloneNode(true);
    button.setAttribute('data-direction',direction);

    button.addEventListener('mouseup', e => {
      e.stopPropagation();
      e.preventDefault();
      this.paginate(direction);
    });

    button.addEventListener('click', e => e.preventDefault());

    this.element.appendChild(button);
  }

  /**
   * Move the carousel to an specified image.
   * @public
   * @param {Number} index
   */
  goTo(index){
    this.lastIndex = parseInt(this.index);
    this.index = index;
    this.triggerEvent('slide',{
      index: this.index
    });
    this.update(Carousel.Direction.RIGHT);
  }

  /**
   * The handler for the pagination event.
   * @param {Direction|String} direction - the pagination direction. 'right' or 'left'
   */
  paginate(direction){
    this.lastIndex = parseInt(this.index);
    this.index = this.getIndexOf(this.index, direction);
    this.triggerEvent('slide',{
      direction: direction,
      index: this.index
    });
    this.update(direction);
  }

  /**
   * Gets all the necessary dimensions and values for calculating distances and the index.
   */
  calculateEnvironment(){
    this.itemsLength  = this.container.children.length;
    this.itemsVisible = Math.floor(this.element.offsetWidth / this.itemWidth);
    this.totalReach   = this.container.offsetWidth - this.element.offsetWidth;
    this.stepLength   = this.speed === Carousel.Speed.SLOW ? this.itemsLength - this.itemsVisible : Math.ceil(this.itemsLength / this.itemsVisible);
    this.stepWidth    = this.speed === Carousel.Speed.SLOW ? this.itemWidth : Math.floor(this.element.offsetWidth / this.itemWidth) * this.itemWidth;
  }

  /**
   * Get the new index for paginating depending on the direction.
   * @param {Number} index - the current index
   * @param {Direction|String} direction - the pagination direction. 'right' or 'left'
   */
  getIndexOf(index, direction){
    let i = parseInt(index);
    if(direction === Carousel.Direction.LEFT){
      if(i > 0){
        return i - 1;
      } else if(this.config.mode === Carousel.Mode.SLIDER){
        return this.stepLength;
      } else {
        return 0;
      }
    } else if(direction === Carousel.Direction.RIGHT) {
      if(i < this.stepLength){
        return i + 1;
      } else if(this.config.mode === Carousel.Mode.SLIDER){
        return 0;
      } else {
        return this.stepLength;
      }
    }
  }

  /**
   * Updates the position of the carousel.
   */
  update(direction) {

    this.loadImages();

    if (this.config.mode === Carousel.Mode.DEFAULT) {

      let distance = this.index * this.stepWidth;
      distance = distance > this.totalReach ? this.totalReach : distance;
      distance = ~distance + 1;

      this.setPaginationButtonsVisibility();
      this.move(distance, this.container);

    } else if(this.config.mode === Carousel.Mode.SLIDER && this.lastIndex !== this.index) {

      let lastIndex = this.lastIndex;
      let lastDirection = direction === Carousel.Direction.LEFT ? '' : '-';
      let lastItem = this.items[lastIndex];

      let currentDirection = direction === Carousel.Direction.LEFT ? '-' : '';
      let currentItem = this.items[this.index];

      addClass('no-transition', currentItem);
      addClass('no-transition', lastItem);
      this.move(parseInt(currentDirection + this.stepWidth), currentItem);

      setTimeout(() => {

        removeClass('no-transition', currentItem);
        removeClass('no-transition', lastItem);
        currentItem.style.transform = 'translate3d(0px, 0, 0)';
        this.move(0, currentItem);
        this.move(parseInt(lastDirection + this.stepWidth), lastItem);
      }, 1);
    }
  }

  /**
   * Moves the element by the given distance.
   * @param {Number} distance - the moving distance
   * @param {HTMLElement} element
   */
  move(distance, element){
    element.style.transform = 'translate3d(' + distance + 'px, 0, 0)';
    element.style.webkitTransform = 'translate3d(' + distance + 'px, 0, 0)';
  }

  /**
   * Sets the visibility of the pagination buttons.
   */
  setPaginationButtonsVisibility(){
    if(this.index === 0){
      addClass('hide', this.pagination.left);
    } else {
      removeClass('hide', this.pagination.left);
    }
    if(this.index === this.stepLength){
      addClass('hide', this.pagination.right);
    } else {
      removeClass('hide', this.pagination.right);
    }
  }

  /**
   * Only loads the images of the carousel items that are currently visible.
   * ToDo: Dependent on the current carousel mode.
   */
  loadImages(){

    let items = [];

    if(this.config.mode === Carousel.Mode.DEFAULT){
      let start = this.index;
      let itemsVisible = Math.ceil(this.element.offsetWidth / this.itemWidth);
      let end = this.speed === Carousel.Speed.SLOW ? this.index + itemsVisible : (this.index + 1) * itemsVisible;
      end = end > this.itemsLength ? this.itemsLength : end;
      for(let i = start; i < end; i++ ) {
        items.push(i);
      }
    } else if(this.config.mode === Carousel.Mode.SLIDER){
      items = Array.of(
        this.getIndexOf(this.index, Carousel.Direction.LEFT),
        this.index,
        this.getIndexOf(this.index, Carousel.Direction.RIGHT)
      );
    }

    for(let i of items ) {
      let images = this.container.children[i].querySelectorAll('img');
      [].forEach.call(images, image => {
        let src = image.getAttribute('data-src');
        if(src !== null){
          image.setAttribute('src',src);
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
  triggerEvent(type,payload){
    let event = new CustomEvent(type, {detail: payload});
    this.element.dispatchEvent(event);
  }

  /**
   * Checks if the window width has changed and starts the redraw process.
   */
  resizeHandler() {
    let currentWindowWidth = this.getWindowWidth();
    if (this.windowWidth !== currentWindowWidth) {
      this.windowWidth = currentWindowWidth;
      this.redraw();
    }
  }

  /**
   * Resize timeout call blocker.
   */
  resizeTimeoutHandler(){
    clearTimeout(this.resizeTimeout);
    this.resizeTimeout = setTimeout(this.resizeHandler.bind(this), 300);
  }

  /**
   * gets the current client height.
   * @returns {number}
   */
  getWindowWidth() {
    return window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
  }
}


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
Carousel.Coordinate = function(x = 0, y = 0){
  return {
    x: x,
    y: y
  }
};


Carousel.Attributes = [
  {name: 'gap',   value: 20,                    type: 'Number'},
  {name: 'mode',  value: Carousel.Mode.DEFAULT, type: 'String'}
];

/**
 * Handler for creating the element.
 */
function elementCreatedHandler() {
  let config = {};
  for(let attribute of Carousel.Attributes){
    config[attribute.name] = checkValue(this.getAttribute(attribute.name), attribute.value, attribute.type);
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
  if(Carousel.Attributes.hasOwnProperty(attributeName)){
    let attribute = Carousel.Attributes[attributeName];
    this.carousel.config[attribute.name] = checkValue(this.getAttribute(attribute.name), attribute.value, attribute.type);
  }
}

/**
 * Method for assigning an default value if the given value is undefined or null.
 * @property {Object} value - value to check
 * @property {Object} defaultValue - the default value to be set if the given value is undefined
 * @property {String} type - the type of the value
 */
function checkValue(value, defaultValue, type = 'String') {
  if(value !== 'undefined' && value !== null){
    if(type === 'Number'){
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
    prototype: Object.assign(
      Object.create( HTMLElement.prototype, {
        createdCallback:          { value: elementCreatedHandler },
        attachedCallback:         { value: elementAttachedHandler },
        detachedCallback:         { value: elementDetachedCallback },
        attributeChangedCallback: { value: elementAttributeChangedHandler }
      }), {
        redraw:   function (){ this.carousel.redraw(); },
        goTo:     function (index){ this.carousel.goTo(index); },
        getIndex: function (){ return this.carousel.index; }
      }
    )
  });
} catch (e) {
  if (window && window.console) {
    window.console.warn('Failed to register CustomElement "as24-carousel".', e);
  }
}
