/**
 * Poly-fill for "CustomEvent".
 * ToDo: v3 -> Move to ui utils library.
 */
(function(){
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
 * Poly-fill for "Array.of".
 * ToDo: v3 -> Move to ui utils library.
 */
(function(){
  if (!Array.of) {
    Array.of = function() {
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
 * ToDo: v3 -> Move to ui utils library.
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
 * ToDo: v3 -> Move to ui utils library.
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
 * ToDo: v3 -> Create a CarouselBase class with all the basics where the final carousel and slider should extend from.
 * ToDo: v3 -> Remove the carousel mode instead use two custom elements with own classes. ( as24-carousel, as24-slider )
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
  Coordinate(x = 0, y = 0){
    return { x: x, y: y }
  }

  /**
   * Gets all carousel items.
   */
  get items() {
    return this.element.querySelectorAll('.as24-carousel-item');
  }

  /**
   * Initializes the carousel by adding all necessary bits and bolts.
   */
  attached() {
    // Get the initial window with.
    this.windowWidth = this.getWindowWidth();

    // Create Listeners.
    this.resizeListener     = this.resizeTimeoutHandler.bind(this);
    this.touchStartListener = this.touchStartEventHandler.bind(this);
    this.touchMoveListener  = this.touchMoveEventHandler.bind(this);
    this.touchEndListener   = this.touchEndEventHandler.bind(this);

    // Add Listeners.
    window.addEventListener(      'resize',     this.resizeListener,      true);
    this.element.addEventListener('touchstart', this.touchStartListener,  true);
    this.element.addEventListener('touchmove',  this.touchMoveListener,   true);
    this.element.addEventListener('touchend',   this.touchEndListener,    true);

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
  detached() {
    // Remove Listeners
    window.removeEventListener(      'resize',     this.resizeListener,     true);
    this.element.removeEventListener('touchstart', this.touchStartListener, true);
    this.element.removeEventListener('touchmove',  this.touchMoveListener,  true);
    this.element.removeEventListener('touchend',   this.touchEndListener,   true);

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
  redraw() {

    this.resizeItems();
    this.calculateEnvironment();

    // ToDo: v3 -> move to Carousel class.
    if(this.config.mode === this.Enums.Mode.DEFAULT){
      this.index = 0;
      this.updateDefault();

      // ToDo: v3 -> move to Slider class.
    } else if(this.config.mode === this.Enums.Mode.SLIDER){
      this.updateSlider({transition: false});
    }

    this.updateIndicator();
  }

  /**
   * Resizes the carousel items.
   */
  resizeItems(){

    // ToDo: v3 -> move to Slider class.
    if(this.config.mode === this.Enums.Mode.SLIDER &&
      this.config.preview &&
      this.getElementWidth() > this.config.previewBreakpoint
    ){
      addClass('dynamic-ratio', this.element);
    } else {
      removeClass('dynamic-ratio', this.element);
    }

    this.orgWidth = this.items[0].getBoundingClientRect().width + this.config.gap;
    if(this.orgWidth === this.refWidth && this.getElementWidth() < this.refWidth){
      this.itemWidth = this.getElementWidth() - this.config.gap;
      [].forEach.call(this.items, element => element.style.width = `${this.itemWidth-this.config.gap}px`);
    } else {
      this.itemWidth = this.items[0].getBoundingClientRect().width + this.config.gap;
    }

    if(this.config.mode === this.Enums.Mode.SLIDER){
      let width = 40;
      let left = null;
      if(this.getElementWidth() > this.config.previewBreakpoint && this.config.preview){
        let offset = (this.getElementWidth() - this.itemWidth)/2;
        width = offset > 40 ? offset : 40;
        left = `${width}px`
      }
      let buttons = this.element.querySelectorAll('[data-direction]');
      [].forEach.call(buttons, element => {
        element.style.width = `${width}px`;
      });
      if(this.config.indicator){
        this.pagination.indicator.style.left = left;
      }
    }
  }

  /**
   * Handles the touch start event.
   * @param {Event} event - the event object
   */
  touchStartEventHandler(event) {
    const target = event.target;
    this.resetTouch();
    if (!containsClass('as24-pagination-button', target)) {
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
  getTouchCoords(event) {
    let touch = event.touches && event.touches[0];
    return new this.Coordinate(
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

    this.container = document.createElement('ul');
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
   * ToDo: v3 -> should be extended by Slider class.
   */
  addPagination() {
    this.removePagination();
    for (let direction of [this.Enums.Direction.LEFT, this.Enums.Direction.RIGHT]){
      this.createPaginationButton(direction);
    }
    removeClass('hide', this.pagination.right);

    // ToDo: v3 -> move to Slider class.
    if(this.config.mode === this.Enums.Mode.SLIDER){
      removeClass('hide', this.pagination.left);
    }
  }

  /**
   * Removes the pagination 'left', 'right' buttons and indicator.
   */
  removePagination() {
    let buttons = this.element.querySelectorAll('[data-direction]');
    [].forEach.call(buttons, element => {
      element.parentNode.removeChild(element);
    });
  }

  /**
   * Adds the page indicator
   */
  addIndicator(){
    this.removeIndicator();
    if(!this.config.indicator) return;
    this.pagination.indicator = document.createElement('div');
    addClass('as24-pagination-indicator', this.pagination.indicator);
    this.element.appendChild(this.pagination.indicator);
    this.updateIndicator();
  }

  /**
   * Removes the page indicator
   */
  removeIndicator(){
    let indicator = this.element.querySelector('.as24-pagination-indicator');
    if(indicator !== null) this.element.removeChild(indicator);
  }

  /**
   * Creates the pagination buttons and event listeners.
   * @param {Direction|String} direction - the pagination direction. 'right' or 'left'
   */
  createPaginationButton(direction) {
    let button = this.pagination[direction] = document.createElement('a');
    addClass('as24-pagination-button', button);
    addClass('hide', button);
    button.href = '#';
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
    if(index < 0) index = 0;
    this.index = index;
    this.triggerEvent('slide',{
      index: this.index
    });
    this.update({
      transition: false
    });
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
    this.update({
      direction: direction
    });
  }

  /**
   * Gets all the necessary dimensions and values for calculating distances and the index.
   * ToDo: v3 -> should be extended by Carousel and Slider class.
   */
  calculateEnvironment(){
    this.itemsLength  = this.container.children.length;
    this.itemsVisible = Math.floor(this.getElementWidth() / this.itemWidth);
    this.totalReach   = this.container.offsetWidth - this.getElementWidth();
    this.stepLength   = this.speed === this.Enums.Speed.SLOW ? this.itemsLength - this.itemsVisible : Math.ceil(this.itemsLength / this.itemsVisible);
    if(this.config.mode === this.Enums.Mode.SLIDER) this.stepLength = this.container.children.length - 1;
    this.stepWidth    = this.speed === this.Enums.Speed.SLOW ? this.itemWidth : Math.floor(this.getElementWidth() / this.itemWidth) * this.itemWidth;
  }

  /**
   * Get the new index for paginating depending on the direction.
   * @param {Number} index - the current index
   * @param {Direction|String} direction - the pagination direction. 'right' or 'left'
   * ToDo: v3 -> should be extended by Carousel and Slider class.
   */
  getIndexOf(index, direction){
    let i = parseInt(index);
    if(direction === this.Enums.Direction.LEFT){
      if(i > 0){
        return i - 1;
      } else if(this.config.mode === this.Enums.Mode.SLIDER){
        return this.stepLength;
      } else {
        return 0;
      }
    } else if(direction === this.Enums.Direction.RIGHT) {
      if(i < this.stepLength){
        return i + 1;
      } else if(this.config.mode === this.Enums.Mode.SLIDER){
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
  update(config = {direction: this.Enums.Direction.RIGHT, transition: true}) {

    this.triggerEvent('as24-carousel:change', {
      detail: {
        id: this.element.id
      }
    }, window.document);

    this.updateIndicator();

    if (this.config.mode === this.Enums.Mode.DEFAULT) {
      this.updateDefault();
    } else if(this.config.mode === this.Enums.Mode.SLIDER && this.lastIndex !== this.index) {
      this.updateSlider(config);
    }
  }

  /**
   * Update the default carousel
   * ToDo: v3 -> move to Carousel class.
   */
  updateDefault(){

    let distance = this.index * this.stepWidth;
    distance = distance > this.totalReach ? this.totalReach : distance;
    distance = ~distance + 1;
    distance = this.stepLength > 0 ? distance : 0;

    let items = [];
    let start = this.index;
    let itemsVisible = Math.ceil(this.getElementWidth() / this.itemWidth);
    let end = this.speed === this.Enums.Speed.SLOW ? this.index + itemsVisible : (this.index + 1) * itemsVisible;
    end = end > this.itemsLength ? this.itemsLength : end;
    for(let i = start; i < end; i++ ) {
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
  updateSlider(config = {direction: this.Enums.Direction.RIGHT, transition: true}){

    let {direction, transition: transition = true} = config;
    let left = this.Enums.Direction.LEFT;
    let right = this.Enums.Direction.RIGHT;
    let previewSize = this.getElementWidth() > this.config.previewBreakpoint && this.config.preview ? 2 : 1;
    let offset = this.config.preview ? (this.getElementWidth() - this.itemWidth)/2 : 0;
    let currentItem = this.items[this.index];

    // slowing down the hard hitters ;)
    let userSpeed = this.endTime();
    this.startTime();
    let animationSpeed = userSpeed > 300 ? 300 : 0;
    [].forEach.call(this.items, element => {
      addClass('no-transition', element);
      element.style.transitionDuration = `${animationSpeed}ms`;
    });

    if(transition) removeClass('no-transition', currentItem);
    this.move(offset, currentItem);

    let previous = this.positionItems({
      current: this.index,
      side: left,
      direction: direction,
      previewSize: previewSize,
      transition: transition,
      offset: offset
    });

    let next = this.positionItems({
      current: this.index,
      side: right,
      direction: direction,
      previewSize: previewSize,
      transition: transition,
      offset: offset
    });

    // Sadly IE doesn't allowed me to do this
    // let affected = [...new Set([].concat(previous,current,next))];
    // var all = Array.apply(null, Array(this.items.length)).map(function (x, i) { return i });
    // let excluded = all.filter((el) => { return !affected.includes(el);});

    // So i did this...
    let current = [this.index];
    let affected = [].concat(previous,current,next);
    [].forEach.call(this.items, (element, index) => {
      if(affected.indexOf(index) === -1) this.move(this.getElementWidth(), this.items[index]);
    });

    this.loadImages(affected);
    return affected;
  }

  /**
   * Positions and animates the items by the rules given in the config.
   * @param {Object} config - the movement configuration for the items.
   */
  positionItems(config = {previewSize: 2, transition: true}){
    let affected = [];
    let {current, side, direction, previewSize, transition, offset} = config;

    let left = this.Enums.Direction.LEFT;
    let right = this.Enums.Direction.RIGHT;

    var index = parseInt(current);
    let removeTransition = side === left ? right : left;

    for(let i = 1; i <= previewSize; i++){
      index = this.getIndexOf(index,side);
      affected.push(index);
      if((i < previewSize || i === previewSize && direction === removeTransition) && transition){
        removeClass('no-transition', this.items[index]);
      }
      let distance = this.itemWidth * i;
      distance = side === right ? offset + distance : offset - distance;
      this.move(distance, this.items[index]);
    }

    return affected;
  }

  /**
   * Updates the pagination indicator count based on the index.
   */
  updateIndicator(){
    if(this.pagination.indicator !== null) this.pagination.indicator.innerHTML = `${this.index+1}/${this.itemsLength}`;
  }

  /**
   * Moves the element by the given distance.
   * @param {Number} distance - the moving distance.
   * @param {HTMLElement} element.
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
    if(this.index === this.stepLength || this.stepLength <= 0){
      addClass('hide', this.pagination.right);
    } else {
      removeClass('hide', this.pagination.right);
    }
  }

  /**
   * Lazy loads the images of the carousel items.
   * @param {Array} items - the items to be loaded.
   */
  loadImages(items = []){
    [].forEach.call(items, i => {
      let images = this.container.children[i].querySelectorAll('img');
      [].forEach.call(images, image => {
        let src = image.getAttribute('data-src');
        if(src !== null){
          image.setAttribute('src',src);
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
  triggerEvent(type,payload,element = this.element){
    let event = new CustomEvent(type, {detail: payload});
    element.dispatchEvent(event)
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
    // ToDo: v3 -> Uncomment the following two lines and remove the last one if there is a need for an resize maniac execution blocker.
    // clearTimeout(this.resizeTimeout);
    // this.resizeTimeout = setTimeout(this.resizeHandler.bind(this), 300);
    this.resizeHandler();
  }

  /**
   * gets the current client height.
   * @returns {Number} the width.
   */
  getWindowWidth() {
    return window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
  }

  /**
   * Get the element width without padding.
   * @return {Number} the width.
   */
  getElementWidth() {
    let computed = getComputedStyle(this.element);
    let width = this.element.offsetWidth;
    width -= parseFloat(computed.paddingLeft) + parseFloat(computed.paddingRight);
    return width;
  }

  /**
   * Starts the time measurement.
   */
  startTime(){
    this.time = new Date();
  }

  /**
   * Ends the time measurement.
   * @return {Number} time in ms.
   */
  endTime(){
    if(this.time !== null){
      let now = new Date();
      return now - this.time;
    } else {
      return 300;
    }
  }
}

(function(){

  /**
   * Allowed custom element attributes and there defaults.
   */
  let attributes = [
    {name: 'gap',               value: 20,        type: 'Number'},
    {name: 'mode',              value: 'default', type: 'String'},
    {name: 'preview',           value: true,      type: 'Boolean'},
    {name: 'previewBreakpoint', value: 640,       type: 'Number'},
    {name: 'indicator',         value: false,     type: 'Boolean'}
  ];

  /**
   * Handler for creating the element.
   */
  let elementCreatedHandler = function() {
    let config = {};
    [].forEach.call(attributes, attribute => {
      config[attribute.name] = checkValue(this.getAttribute(attribute.name), attribute.value, attribute.type);
    });
    this.carousel = new Carousel(this, config);
  };

  /**
   * Handler for the attachment of the element to the dom.
   */
  let elementAttachedHandler = function() {
    this.carousel.attached();
  };

  /**
   * Handler for detachment of the element from the dom.
   */
  let elementDetachedCallback = function() {
    this.carousel.detached();
    delete this.carousel;
  };

  /**
   * Handler for the element attribute changes.
   * @property {String} attributeName.
   */
  let elementAttributeChangedHandler = function(attributeName) {
    [].forEach.call(attributes, attribute => {
      if(attribute.name === attributeName){
        this.carousel.config[attribute.name] = checkValue(this.getAttribute(attribute.name), attribute.value, attribute.type);
      }
    });
  };

  /**
   * Method for assigning an default value if the given value is undefined or null.
   * @property {Object} value - value to check.
   * @property {Object} defaultValue - the default value to be set if the given value is undefined.
   * @property {String} type - the type of the value.
   */
  let checkValue = function (value, defaultValue, type = 'String') {
    if(value !== 'undefined' && value !== null){
      if(type === 'Number'){
        value = parseInt(value);
      }
      if(type === 'Boolean'){
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
      prototype: Object.assign(
        Object.create( HTMLElement.prototype, {
          createdCallback:          { value: elementCreatedHandler },
          attachedCallback:         { value: elementAttachedHandler },
          detachedCallback:         { value: elementDetachedCallback },
          attributeChangedCallback: { value: elementAttributeChangedHandler }
        }), {
          redraw:         function (){ this.carousel.redraw(); },
          goTo:           function (index){ this.carousel.goTo(index); },
          getIndex:       function (){ return this.carousel.index; },
          getStepLength:  function (){ return this.carousel.stepLength }
        }
      )
    });
  } catch (e) {
    if (window && window.console) {
      window.console.warn('Failed to register CustomElement "as24-carousel".', e);
    }
  }
})();
