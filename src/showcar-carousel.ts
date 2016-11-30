/// <reference path="../node_modules/typescript/lib/lib.es6.d.ts" />

import { Carousel } from './carousel';

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
        prototype: Object.assign(
            Object.create(HTMLElement.prototype, {
                attachedCallback: { value: elementAttachedHandler },
                detachedCallback: { value: elementDetachedCallback },
                attributeChangedCallback: { value: function () { } }
            }), {
                goTo: function (index, options) { this.carousel.goTo(index, options || { notify: true }); },
                getIndex: function () { return this.carousel.index; },
                redraw: function (triggerNotifications) { this.carousel.redraw(triggerNotifications); },
                removeItem: function(index) { this.carousel.removeItem(index); }
            }
        )
    });
} catch (e) {
    if (window && window.console) {
        window.console.warn('Failed to register CustomElement "as24-carousel".', e);
    }
}
