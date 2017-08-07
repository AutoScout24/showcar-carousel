(function () {
    var console = document.querySelector('#console')

    document.querySelector('#events-catcher')
        .addEventListener('as24-carousel.slide', function (e) {
            console.innerText += JSON.stringify(e.detail, 2) + '\n';
        });

    var items = Array.from(document.querySelectorAll('.gallery-picture')).forEach(function (item) {
        item.addEventListener('click', function (e) {
            console.innerText += 'click\n';
        });
    });

})();
