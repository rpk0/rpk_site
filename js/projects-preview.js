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
      if (maxScrollLeft <= 0) {
        prevArrow.classList.add('disabled');
        nextArrow.classList.add('disabled');
        return;
      }

      if (scroller.scrollLeft <= 4) {
        prevArrow.classList.add('disabled');
      } else {
        prevArrow.classList.remove('disabled');
      }

      if (scroller.scrollLeft >= maxScrollLeft - 4) {
        nextArrow.classList.add('disabled');
      } else {
        nextArrow.classList.remove('disabled');
      }
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
