// Tag filtering on /posts/.
//
// Filters the full post list in place. The old version filtered only the posts
// on the current pagination page, so with more than one page a tag could
// silently miss matches; the index no longer paginates for that reason.
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    var bar = document.querySelector('.tag-filter');
    var cards = Array.prototype.slice.call(document.querySelectorAll('.post-card'));
    if (!bar || !cards.length) {
      return;
    }

    var pills = Array.prototype.slice.call(bar.querySelectorAll('.tag-badge'));
    var status = document.querySelector('.tag-filter-status');
    var count = document.querySelector('.tag-filter-count');
    var clear = document.querySelector('.tag-filter-clear');
    var empty = document.querySelector('.post-list-empty');

    function label(tag) {
      var pill = pills.filter(function (p) {
        return p.getAttribute('data-tag') === tag;
      })[0];
      return pill ? pill.textContent.trim() : tag.replace(/-/g, ' ');
    }

    function apply(tag) {
      var shown = 0;

      cards.forEach(function (card) {
        var tags = ' ' + (card.getAttribute('data-tags') || '') + ' ';
        var match = !tag || tags.indexOf(' ' + tag + ' ') !== -1;
        card.hidden = !match;
        if (match) {
          shown++;
        }
      });

      pills.forEach(function (p) {
        var on = p.getAttribute('data-tag') === tag;
        p.classList.toggle('is-active', on);
        p.setAttribute('aria-pressed', String(on));
      });

      if (tag) {
        count.textContent = shown + (shown === 1 ? ' post' : ' posts') + ' tagged “' + label(tag) + '”';
      }
      status.hidden = !tag;
      empty.hidden = shown !== 0;
    }

    function go(tag, push) {
      if (push) {
        var url = tag ? window.location.pathname + '?tag=' + encodeURIComponent(tag) : window.location.pathname;
        window.history.pushState({ tag: tag }, '', url);
      }
      apply(tag);
    }

    function fromUrl() {
      return new URLSearchParams(window.location.search).get('tag') || '';
    }

    bar.addEventListener('click', function (e) {
      var pill = e.target.closest('.tag-badge');
      if (pill) {
        go(pill.getAttribute('data-tag') || '', true);
      }
    });

    clear.addEventListener('click', function () {
      go('', true);
    });

    window.addEventListener('popstate', function () {
      apply(fromUrl());
    });

    apply(fromUrl());
  });
})();
