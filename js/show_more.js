// "Load more" on the photo essays index. Vanilla rewrite of the jQuery version.
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    var button = document.querySelector('.load-more');
    if (!button) {
      return;
    }

    button.addEventListener('click', function () {
      var hidden = document.querySelectorAll('.photo-listing li:nth-child(n + 13):not(.active)');
      if (!hidden.length) {
        return;
      }

      hidden.forEach(function (item) {
        item.classList.add('active');
      });
      button.classList.add('hide');

      hidden[0].scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Move focus to the first revealed item so keyboard users land there too.
      var link = hidden[0].querySelector('a');
      if (link) {
        link.focus({ preventScroll: true });
      }
    });
  });
})();
