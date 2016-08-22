/// <reference path="../node_modules/typescript/lib/lib.es6.d.ts" />

(function() {

  (function(){
    if ( typeof window['CustomEvent'] === "function" ) return false;
    function CustomEvent ( event, params ) {
      params = params || { bubbles: false, cancelable: false, detail: undefined };
      var evt = document.createEvent( 'CustomEvent' );
      evt.initCustomEvent( event, params.bubbles, params.cancelable, params.detail );
      return evt;
    }
    CustomEvent.prototype = window['Event'].prototype;
    window['CustomEvent'] = CustomEvent;
  })();

  (function() {
    if (typeof Object.assign != 'function') {
    Object.assign = function(target) {
      'use strict';
      if (target == null) {
        throw new TypeError('Cannot convert undefined or null to object');
      }

      target = Object(target);
      for (var index = 1; index < arguments.length; index++) {
        var source = arguments[index];
        if (source != null) {
          for (var key in source) {
            if (Object.prototype.hasOwnProperty.call(source, key)) {
              target[key] = source[key];
            }
          }
        }
      }
      return target;
    };
  }
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
   */
  function addClass(className:string, element:HTMLElement):HTMLElement {
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
   */
  function removeClass(className:string, element:HTMLElement):HTMLElement {
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
   */
  function containsClass(className:string, element:HTMLElement):boolean {
    if (!element.getAttribute) return false;

    let classList = [], classesString = element.getAttribute('class');
    if (classesString) {
      classList = classesString.split(' ');
    }
    return classList.indexOf(className) > -1;
  }

  class Coordinate {
    x:number;
    y:number;
    constructor(x:number, y:number) {
      this.x = x;
      this.y = y;
    }
  }


  /**
   * Main Class for the Carousel component.
   * ToDo: v3 -> Create a CarouselBase class with all the basics where the final carousel and slider should extend from.
   * ToDo: v3 -> Remove the carousel mode instead use two custom elements with own classes. ( as24-carousel, as24-slider )
   */
  class Carousel {

    config = null;
    element = null;
    container = null;
    wrapper = null;
    stepLength = null;

    role:string = 'unspecified-role';

    resizeListener = null;
    touchStartListener = null;
    touchMoveListener = null;
    touchEndListener = null;
    imgSrcDataAttrName = 'data-src';

    windowWidth = 0;
    orgWidth = 0;

    Enums = {
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

    pagination = {
      left: null,
      right: null,
      indicator: null
    };

    stepWidth = null;
    totalReach = null;
    index = 0;
    lastIndex = 0;
    refWidth = 330;
    itemWidth = 330;
    itemsVisible = 0;
    touchStart:Coordinate|any;
    itemsLength = 1;

    speed = null
    time = null;

    /** @constructor */
    constructor(element, config) {
      this.touchStart = new Coordinate(0,0);
      this.config = config;
      this.element = element;
      this.speed = this.Enums.Speed.SLOW;
      this.role = this.element.getAttribute('role');
    }

    items() {
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
      this.redraw('data-src');
    }

    addOnItemTapped() {
      [].forEach.call(this.items(), (item:HTMLElement) => {
        let eventName = item.ontouchend ? 'touchend'
          : item.onpointerup ? 'pointerup'
          : item.onmspointerup ? 'mspointerup'
          : 'click';
        item.addEventListener(eventName, this.itemTapped.bind(this));
      });
    }

    itemTapped() {
      this.triggerEvent('as24-carousel.tap', {
        id: this.element.id,
        role: this.role,
        index: this.index
      }, true);
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
    redraw(dataAttrName = '') {
      this.imgSrcDataAttrName = dataAttrName;
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
      this.addOnItemTapped();
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

      this.orgWidth = this.items()[0].getBoundingClientRect().width + this.config.gap;
      if(this.orgWidth === this.refWidth && this.getElementWidth() < this.refWidth){
        this.itemWidth = this.getElementWidth() - this.config.gap;
        [].forEach.call(this.items(), element => element.style.width = `${this.itemWidth-this.config.gap}px`);
      } else {
        if(this.orgWidth === 0) {
          this.itemWidth = 640 + this.config.gap;
        } else {
          this.itemWidth = this.items()[0].getBoundingClientRect().width + this.config.gap;
        }
      }

      if(this.config.mode === this.Enums.Mode.SLIDER){
        let width = 40;
        let left = null;
        if(this.getElementWidth() > this.config.previewBreakpoint && this.config.preview){
          let offset = (this.getElementWidth() - this.itemWidth)/2;
          width = offset > 40 ? Math.ceil(offset) : 40;
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
      this.resetTouch();
      if (!containsClass('as24-pagination-button', event.target)) {
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

      const touchEndCoords = this.getTouchCoords(event.changedTouches[0]);
      let touchDiffX    = this.touchStart.x - touchEndCoords.x;
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
    getTouchCoords(event:any):Coordinate {
      let touch = event.touches && event.touches[0];
      return new Coordinate(
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
     * ToDo: v3 -> should be extended by Slider class.
     */
    addPagination() {
      this.removePagination();

      this.createPaginationButton(this.Enums.Direction.LEFT);
      this.createPaginationButton(this.Enums.Direction.RIGHT);

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
      this.lastIndex = this.index;
      if(index < 0) index = 0;
      this.index = index;
      this.update({
        transition: false,
        direction: index > this.lastIndex ?  this.Enums.Direction.RIGHT : this.Enums.Direction.LEFT
      });
    }

    /**
     * The handler for the pagination event.
     * @param {Direction|String} direction - the pagination direction. 'right' or 'left'
     */
    paginate(direction){
      this.lastIndex = this.index;
      this.index = this.getIndexOf(this.index, direction);
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
      let i = index;
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
    update(config) {

      this.triggerEvent('as24-carousel.slide', {
        id: this.element.id,
        role: this.role,
        direction: config.direction,
        index: this.index
      }, true);

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
     * ToDo: v3 -> move to Slider class.
     */
    updateSlider(config){

      let {direction, transition: transition = true} = config;
      let previewState = this.getElementWidth() > this.config.previewBreakpoint && this.config.preview;
      let initialPosition = direction === this.Enums.Direction.RIGHT ? this.getElementWidth() : ~ this.getElementWidth() + 1;

      // slowing down the hard hitters ;)
      let userSpeed = this.endTime();
      this.startTime();
      let animationSpeed = userSpeed > 300 ? 300 : 0;

      [].forEach.call(this.items(), (element, index) => {
        addClass('no-transition', element);
        if(previewState === false && index !== this.lastIndex) this.move(initialPosition, element);
        element.style.zIndex = 0;
        element.style.transitionDuration = `${animationSpeed}ms`;
      });

      let positionConfig = {
        previewState: previewState,
        previewSize: previewState ? 2 : 1,
        offset: previewState ? (this.getElementWidth() - this.itemWidth)/2 : 0,
        initialPosition: initialPosition,
        direction: direction,
        transition: transition
      };

      if(transition){
        setTimeout(function(){
          this._positionAllItems(positionConfig)
        }.bind(this),10);
      } else {
        this._positionAllItems(positionConfig);
      }
    }

    /**
     * Positions and animates all items by the rules given in the config.
     * @param {Object} config - the movement configuration for the items.
     * @private
     */
    _positionAllItems(config){

      let {direction, transition, offset, initialPosition, previewState, previewSize} = config;
      let currentItem = this.items()[this.index];

      if(transition) removeClass('no-transition', currentItem);
      this.move(offset, currentItem);

      let previous, next;
      let positionConfig = {
        current: this.index,
        direction: direction,
        previewSize: previewSize,
        transition: transition,
        offset: offset,
        side: null
      };

      let lastElement = this.items()[this.lastIndex];

      if(direction === this.Enums.Direction.LEFT || previewState) {
        if(previewState){
          positionConfig.side = this.Enums.Direction.LEFT;
          previous = this.positionItems(positionConfig);
        } else {
          if(transition) removeClass('no-transition', lastElement);
          this.move(this.getElementWidth(), lastElement);
        }
      }

      if(direction === this.Enums.Direction.RIGHT || previewState){
        if(previewState){
          positionConfig.side = this.Enums.Direction.RIGHT;
          next = this.positionItems(positionConfig);
        } else {
          if(transition) removeClass('no-transition', lastElement);
          this.move(~ this.getElementWidth() + 1, lastElement);
        }
      }

      let affected = previewState ? [].concat(previous,[this.index],next) : [this.index];
      if(previewState){
        [].forEach.call(this.items(), (element, index) => {
          if(affected.indexOf(index) === -1) {
            element.style.zIndex = -100;
            addClass('no-transition', element);
            this.move(initialPosition, element);
          }
        });
      }

      this.loadImages(affected);

    }

    /**
     * Positions and animates the items by the rules given in the config.
     * @param {Object} config - the movement configuration for the items.
     */
    positionItems(config){
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
          removeClass('no-transition', this.items()[index]);
        }
        let distance = this.itemWidth * i;
        distance = side === right ? offset + distance : offset - distance;
        this.move(distance, this.items()[index]);
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
          let src = image.getAttribute(this.imgSrcDataAttrName);
          if(src !== null) {
            image.setAttribute('src', src);
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
    triggerEvent(type, payload, bubbles = false, element = this.element){
      let event = new CustomEvent(type, {
        detail: payload,
        bubbles: bubbles
      });
      element.dispatchEvent(event);
    }

    /**
     * Checks if the window width has changed and starts the redraw process.
     */
    resizeHandler() {
      let currentWindowWidth = this.getWindowWidth();
      if (this.windowWidth !== currentWindowWidth) {
        this.windowWidth = currentWindowWidth;
        this.redraw(this.imgSrcDataAttrName);
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
        return now.getTime() - this.time;
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
      {name: 'preview',           value: false,      type: 'Boolean'},
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
      document['registerElement']('as24-carousel', {
        prototype: Object.assign(
          Object.create( HTMLElement.prototype, {
            createdCallback:          { value: elementCreatedHandler },
            attachedCallback:         { value: elementAttachedHandler },
            detachedCallback:         { value: elementDetachedCallback },
            attributeChangedCallback: { value: elementAttributeChangedHandler }
          }), {
            redraw:         function (dataAttrName){ this.carousel.redraw(dataAttrName); },
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

})();
