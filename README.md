# showcar-carousel

This module provides a easy to use carousel.

#####*Note: [v2.0.0] Breaking markup changes! There is no `<as24-carousel-item>` element anymore. Please have a look at the updated example*

***

## Usage

#####Live example:
Visit the [example](https://autoscout24.github.io/showcar-carousel/) on github pages.


#####Local example:
Just run the following command in the root of the carousel library.

```
$> npm start
```
This will open a small express server on your local machine where you can see the running example.

Visit: [http://localhost:8080](http://localhost:8080)



#### HTML Code

The whole carousel is defined by an `as24-carousel` element. 
Each item needs to be wrapped inside a `li` element with an `as24-carousel-item` class.
See the following example below:

```html
<as24-carousel>

  <div class="as24-carousel-item">
    <a href="http://autoscout24.com">
      <div class="as24-carousel-image-container">
        <img data-src="http://placehold.it/320x240?text=1,320x240"
             src=""
             alt="">
      </div>
      <div class="as24-carousel-description">
        <h5>Headline</h5>
        <p>Content</p>
      </div>
    </a>
  </div>
  ...
  
</as24-carousel>
```

#####*Note: [v.2.0.0] There is a new optional slide mode available.*
If you want to use it just add the following attributes to activate it. (Have an look at the updated example)
 
 - `mode="slider"`: (required) Activates the slider mode.
 - `gap="0"`: (required) Resets the default gap of the carousel items. ( will be removed in an upcoming release )
 - `preview="true"`: Activates the new preview mode.
 - `indicator="true"`: Adds an small pagination indicator. 

```html
  
<a href="javascript:void(0);">
  <as24-carousel mode="slider"
                 gap="0"
                 preview="true"
                 indicator="true">
    <div class="as24-carousel-item">
      <div class="as24-carousel-image-container">
        <img data-src="http://placehold.it/640x480?text=1,640x480"
             src=""
             alt="">
      </div>
    </div>
      ...
    
  </as24-carousel>
</a>

```




#### lazy loading
 For better performance it is possible to lazy load images.
 Therefor just replace the `src` attribute of your `img` with an `data-src` attribute.

#### CSS Styling ( Changing the image aspect ratio)

Currently the default style is set to support 4:3 images if the carousel uses an different format please overwrite "padding-bottom"
In order to change the aspect ratio of the images in the carousel add the following to you implementation.

```css
  /* CAROUSEL ITEM */
  as24-carousel-item > .carousel-image-container {
    /* Aspect ratio of the image ( 100% width / 75% height = 1.333 ) */
    padding-bottom: 75%;
  }
```

#### JS Interface


##### Re-rendering the complete carousel after manually setting the size:
If you need to change the width of the carousel dynamically, you can call the ``redraw()`` method, to force the carousel to recalculate its sizings and positionings.
*Note: Window resizing is included out of the box.*

```
document.getElementById('carousel-example').redraw();
```

##### Get the current image index:
In case you want to get current index of the carousel call the ``getIndex()`` method on the carousel element.

```
document.getElementById('carousel-example').getIndex();
```

##### Set the current image index:
For changing the current image index manually call the ``goTo()`` method on the carousel element.

```
document.getElementById('carousel-example').goTo(2);
```

##### Events

The following events are triggered on the carousel element:

- `slide` is called on every image index change.  
- ...




## Installation

#### How to install:

  To install showcar-carousel within your project use npm.

  ```
  $> npm install showcar-carousel --save
  ```

  Afterwards you need to add the css and js to your page.

  ```html
  <link rel="stylesheet" href="../dist/showcar-carousel.css">
  ```

  ```html
  <script src="../dist/showcar-carousel.js"></script>
  ```

  *Note: showcar-carousel has no further dependencies.*

***

## Contributing

#### How to contribute:

  * Fork this repository and `$> git clone` your fork. 
  * Then `$> npm install` the required dependencies.
  * Start the dev server `$> npm run dev`.
  * Visit [http://localhost:8080](http://localhost:8080)

*Note: changes will automatically build and refresh the browser.*

##### Contribute

  Save your changes and run `$> npm prod`.

  Commit your code _and_ the compiled libraries in _./dist_. Then create a pull-request.

## License

MIT License
