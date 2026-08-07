// Sidebar menu toggle. Replaces the jQuery 1.12 snippet that used to live
// inline in _layouts/layout.html (90KB of jQuery for one classList.toggle).
(function () {
  'use strict';

  var button = document.querySelector('.menu-icon');
  var sidebar = document.getElementById('sidebar');
  var scrim = document.querySelector('.sidebar-scrim');

  if (!button || !sidebar) {
    return;
  }

  function setOpen(open) {
    button.classList.toggle('active', open);
    button.setAttribute('aria-expanded', String(open));
    sidebar.classList.toggle('toggle', open);
    if (scrim) {
      scrim.hidden = !open;
    }
    // Only lock scroll on the narrow layouts where the sidebar is an overlay.
    document.body.classList.toggle('nav-open', open);
  }

  function isOpen() {
    return button.getAttribute('aria-expanded') === 'true';
  }

  button.addEventListener('click', function () {
    setOpen(!isOpen());
  });

  if (scrim) {
    scrim.addEventListener('click', function () {
      setOpen(false);
    });
  }

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && isOpen()) {
      setOpen(false);
      button.focus();
    }
  });

  // A resize past the breakpoint leaves the overlay state stale otherwise.
  var desktop = window.matchMedia('(min-width: 961px)');
  desktop.addEventListener('change', function (event) {
    if (event.matches) {
      setOpen(false);
    }
  });
})();
