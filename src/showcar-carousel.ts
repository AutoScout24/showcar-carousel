/// <reference path="../node_modules/typescript/lib/lib.es6.d.ts" />

import { Carousel } from './carousel';

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
        prototype: Object.assign(
            Object.create(HTMLElement.prototype, {
                createdCallback: { value: elementCreatedHandler },
                attachedCallback: { value: elementAttachedHandler },
                detachedCallback: { value: elementDetachedCallback },
                attributeChangedCallback: { value: function () { } }
            }), {
                goTo: function (index) { this.carousel.goTo(index); },
                getIndex: function () { return this.carousel.index; }
            }
        )
    });
} catch (e) {
    if (window && window.console) {
        window.console.warn('Failed to register CustomElement "as24-carousel".', e);
    }
}
