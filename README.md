# showcar-carousel

This module provides a lightweight and easy to use Carousel for any content. There are two modes, an infinite and a finite mode.

***

## Usage

#####Live example:

Visit the [example](https://autoscout24.github.io/showcar-carousel/) on github pages.

#####Local example:

Just run the following command in the root of the carousel library.

```
$ npm start
```
This will open a small express server on your local machine where you can see the running example.

Visit: [http://localhost:8080](http://localhost:8080)

#### HTML Code

The whole carousel is defined by an `as24-carousel` element.
Each carousel item must have `as24-carousel__item` class.
See the following example below:

```html
<as24-carousel>

  <div class="as24-carousel__container" role="container">

    <div class="as24-carousel__item"> <!-- Here goes your content --> </div>
    <div class="as24-carousel__item"> <!-- Here goes your content --> </div>
    <!-- ... -->
    <div class="as24-carousel__item"> <!-- Here goes your content --> </div>

  </div>

  <a href="#" class="as24-carousel__button" role="nav-button" data-direction="left"></a>
  <a href="#" class="as24-carousel__button" role="nav-button" data-direction="right"></a>

  <div class="as24-carousel__indicator" role="indicator"></div>

</as24-carousel>
```

*Note: pagination indicator is not a mandatory element*

*Note: please, pay attention to `role` attributes*

#### Modes

You can choose between two modes:
* Infinite - The carousel behaves like a real carousel. This means you can go through all the elements without stopping
at the end of the list.
* Finite (default) - In this mode you can not go further than the list of elements.

To change the mode you can use the loop attribute on the as24-carousel element:

```html
<as24-carousel loop="finite"> ... </as24-carousel>
```

or

```html
<as24-carousel loop="infinite"> ... </as24-carousel>
```


#### DOM Events

 * `as24-carousel.slide` - when carousel has been moved. The playload is as following:

    ```js
    {
      id: String,         // Id of the carousel
      role: String,       // Role attr of the carousel
      direction: String,  // Sliding direction
      index: Number       // New Slide's index
    }
    ```

#### CSS Styling

The library uses Flexbox as box model. Also, the carousel item does not depend on the content. Thus, you have to specify the dimensions of the items in your CSS code. For example,

```html
<as24-carousel class="top-cars">
  <div class="as24-carousel__container" role="container">
    <div class="as24-carousel__item"> <!-- content --> </div>
  </div>
</as24-carousel>
```

```css
.top-cars .as24-carousel__item {
  width: 310px;
  height: 280px;
}
```

However, it is better to check [examples](docs/example)

### Migration from v3

 * Wrapp your items with

    ```html
    <div class="as24-carousel__container" role="container">
    <!-- items -->
    </div>
    ```
 * Use a new class for the items, `as24-carousel__item`

    ```html
    <div class="as24-carousel-item">...</div>
    ```
    becomes

    ```html
    <div class="as24-carousel__item"></div>
    ```

 * Add buttons:

    ```html
    <a href="#" class="as24-carousel__button" role="nav-button" data-direction="left"></a>
    <a href="#" class="as24-carousel__button" role="nav-button" data-direction="right"></a>
    ```

 * If needed, add indicator (the one that shows x/y images)

    ```html
    <div class="as24-carousel__indicator" role="indicator"></div>
    ```

 * Don't forget to review your CSS so that you use proper class names for customisation.

 * The component doesn't emit `as24-carousel.tap` event any more. This means you can add event listeners to the content of items or to items directly.

### JS Interface

#### Get the current image index:
In case you want to get current index of the carousel call the `getIndex()` method on the carousel element.

```
document.getElementById('carousel-example').getIndex();
```

#### Trigger recalculation of the position of the carousel:

```
document.getElementById('carousel-example').redraw();
```

#### Set the current image index:
For changing the current image index manually call the `goTo()` method on the carousel element.

```
document.getElementById('carousel-example').goTo(2);
```

## Installation

#### How to install:

To install showcar-carousel within your project use npm.

```
$> npm install showcar-carousel --save
```

Afterwards you need to include the CSS and JS to your page.

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
  * Start the dev server `$> npm run watch`.
  * Visit [http://localhost:8080](http://localhost:8080)

*Note: changes will automatically build and refresh the browser.*

##### Contribute

Save your changes and run `$> npm run build`.

Commit your code _and_ the compiled libraries in _./dist_. Then create a pull-request.

## License

MIT License
