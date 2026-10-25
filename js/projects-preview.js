(function () {
  document.addEventListener('DOMContentLoaded', function () {
    var carousel = document.querySelector('.preview-carousel');
    if (!carousel) {
      return;
    }

    var prevArrow = carousel.querySelector('.preview-arrow.prev');
    var nextArrow = carousel.querySelector('.preview-arrow.next');
    var scroller = carousel.querySelector('.preview-track');
    var list = carousel.querySelector('.preview-list');

    if (!prevArrow || !nextArrow || !scroller || !list) {
      return;
    }

    var scrollAmount = function () {
      var item = list.querySelector('li');
      if (!item) {
        return scroller.clientWidth * 0.6;
      }
      return item.getBoundingClientRect().width * 1.2;
    };

    var updateArrows = function () {
      var maxScrollLeft = list.scrollWidth - scroller.clientWidth;
      prevArrow.disabled = maxScrollLeft <= 0 || scroller.scrollLeft <= 4;
      nextArrow.disabled = maxScrollLeft <= 0 || scroller.scrollLeft >= maxScrollLeft - 4;
    };

    var scheduleUpdate;
    scroller.addEventListener('scroll', function () {
      if (scheduleUpdate) {
        return;
      }
      scheduleUpdate = requestAnimationFrame(function () {
        updateArrows();
        scheduleUpdate = null;
      });
    });

    prevArrow.addEventListener('click', function () {
      scroller.scrollBy({ left: -scrollAmount(), behavior: 'smooth' });
    });

    nextArrow.addEventListener('click', function () {
      scroller.scrollBy({ left: scrollAmount(), behavior: 'smooth' });
    });

    window.addEventListener('resize', updateArrows);
    updateArrows();
  });
})();
