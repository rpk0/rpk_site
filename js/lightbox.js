// Photo viewer for gallery links (a[data-lightbox]). Built on <dialog>, so the
// browser handles focus, Esc, the Android back gesture and the inert page
// behind it. Touch: swipe sideways to change photo, swipe down to close, pinch
// to zoom (gestures pause while zoomed so the zoomed photo can be panned).
(() => {
  'use strict';

  const icon = (d) => `<svg width="30" height="30" viewBox="0 0 30 30" aria-hidden="true"><path d="${d}" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

  const dialog = document.createElement('dialog');
  dialog.className = 'lb';
  dialog.setAttribute('aria-label', 'Photo viewer');
  dialog.tabIndex = -1;
  dialog.innerHTML = `
    <img class="lb-image" alt="" draggable="false">
    <button type="button" class="lb-prev" aria-label="Previous photo">${icon('M20 5 10 15l10 10')}</button>
    <button type="button" class="lb-next" aria-label="Next photo">${icon('M10 5l10 10-10 10')}</button>
    <div class="lb-bar">
      <span class="lb-number" aria-live="polite"></span>
      <button type="button" class="lb-close" aria-label="Close">${icon('M5 5l20 20M25 5 5 25')}</button>
    </div>`;
  document.body.append(dialog);

  const image = dialog.querySelector('.lb-image');
  const number = dialog.querySelector('.lb-number');
  const canHover = window.matchMedia('(hover: hover)');
  const isZoomed = () => (window.visualViewport ? window.visualViewport.scale > 1.01 : false);
  let album = [];
  let index = 0;
  let drag = null;
  let draggedAt = 0;

  function show(i) {
    index = (i + album.length) % album.length;
    const photo = album[index];
    if (image.src !== photo.src) {
      dialog.classList.add('is-loading');
      image.src = photo.src;
    }
    image.alt = photo.alt;
    number.textContent = `Image ${index + 1} of ${album.length}`;
    [index - 1, index + 1].forEach((n) => {
      new Image().src = album[(n + album.length) % album.length].src;
    });
  }

  image.addEventListener('load', () => dialog.classList.remove('is-loading'));
  image.addEventListener('error', () => dialog.classList.remove('is-loading'));

  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[data-lightbox]');
    if (!link || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    const links = [...document.querySelectorAll(`a[data-lightbox="${CSS.escape(link.dataset.lightbox)}"]`)];
    album = links.map((a) => ({ src: a.href, alt: a.querySelector('img')?.alt || '' }));
    dialog.classList.toggle('is-single', album.length < 2);
    show(links.indexOf(link));
    dialog.showModal();
    dialog.focus();
  });

  dialog.querySelector('.lb-prev').addEventListener('click', () => show(index - 1));
  dialog.querySelector('.lb-next').addEventListener('click', () => show(index + 1));
  dialog.querySelector('.lb-close').addEventListener('click', () => dialog.close());

  dialog.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') show(index - 1);
    if (e.key === 'ArrowRight') show(index + 1);
  });

  // Empty space closes; on desktop the photo's left and right halves step through.
  dialog.addEventListener('click', (e) => {
    if (Date.now() - draggedAt < 300) return;
    if (e.target === dialog) dialog.close();
    if (e.target === image && canHover.matches) {
      const box = image.getBoundingClientRect();
      show(index + (e.clientX < box.left + box.width / 2 ? -1 : 1));
    }
  });

  dialog.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || e.target.closest('button') || isZoomed()) return;
    drag = { id: e.pointerId, x: e.clientX, y: e.clientY, axis: null };
  });

  dialog.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x;
    const dy = e.clientY - drag.y;
    if (!drag.axis) {
      if (Math.hypot(dx, dy) < 10) return;
      drag.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      dialog.setPointerCapture(e.pointerId);
      dialog.classList.add('is-dragging');
    }
    if (drag.axis === 'x') {
      image.style.transform = `translateX(${dx}px)`;
    } else {
      const down = Math.max(dy, 0);
      image.style.transform = `translateY(${down}px)`;
      dialog.style.opacity = String(1 - Math.min(down / 400, 0.6));
    }
  });

  function endDrag(e) {
    if (!drag || e.pointerId !== drag.id) return;
    const { axis } = drag;
    const dx = e.clientX - drag.x;
    const dy = e.clientY - drag.y;
    drag = null;
    dialog.classList.remove('is-dragging');
    image.style.transform = '';
    dialog.style.opacity = '';
    if (!axis || e.type === 'pointercancel') return;
    draggedAt = Date.now();
    if (axis === 'x' && Math.abs(dx) > 50) show(index + (dx < 0 ? 1 : -1));
    if (axis === 'y' && dy > 100) dialog.close();
  }

  dialog.addEventListener('pointerup', endDrag);
  dialog.addEventListener('pointercancel', endDrag);

  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', () => dialog.classList.toggle('is-zoomed', isZoomed()));
  }
})();
