// Photo viewer for gallery links (a[data-lightbox]). Built on <dialog>, so the
// browser handles focus, Esc, the Android back gesture and the inert page
// behind it. Three slides (previous, current, next) move together, so a swipe
// drags the neighbour in under the finger; buttons, keys and clicks crossfade
// instead. Swipe down to close, pinch to zoom (gestures pause while zoomed so
// the zoomed photo can be panned).
(() => {
  'use strict';

  const GAP = 24;
  const DRIFT = 30;
  const EASE = 'cubic-bezier(0.25, 1, 0.5, 1)';

  const icon = (d) => `<svg width="30" height="30" viewBox="0 0 30 30" aria-hidden="true"><path d="${d}" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const slide = '<img class="lb-image" alt="" draggable="false">';

  const dialog = document.createElement('dialog');
  dialog.className = 'lb';
  dialog.setAttribute('aria-label', 'Photo viewer');
  dialog.tabIndex = -1;
  dialog.innerHTML = `
    <p class="lb-caption" aria-hidden="true"><span class="lb-title"></span><span class="lb-meta"></span></p>
    ${slide}${slide}${slide}
    <button type="button" class="lb-prev" aria-label="Previous photo">${icon('M20 5 10 15l10 10')}</button>
    <button type="button" class="lb-next" aria-label="Next photo">${icon('M10 5l10 10-10 10')}</button>
    <div class="lb-bar">
      <span class="lb-number" aria-live="polite"></span>
      <button type="button" class="lb-close" aria-label="Close">${icon('M5 5l20 20M25 5 5 25')}</button>
    </div>`;
  document.body.append(dialog);

  const slides = [...dialog.querySelectorAll('.lb-image')];
  const number = dialog.querySelector('.lb-number');
  const title = dialog.querySelector('.lb-title');
  const meta = dialog.querySelector('.lb-meta');
  const canHover = window.matchMedia('(hover: hover)');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const isZoomed = () => (window.visualViewport ? window.visualViewport.scale > 1.01 : false);
  let album = [];
  let index = 0;
  let drag = null;
  let draggedAt = 0;
  let moving = false;
  let settling = 0;

  const wrap = (i) => (i + album.length) % album.length;
  const step = () => window.innerWidth + GAP;
  const duration = () => (reduceMotion.matches ? 0 : 320);

  // slides[1] is always the photo on screen; slides[0] and [2] wait one step either side.
  function place(dx, animate) {
    const ms = animate ? duration() : 0;
    slides.forEach((img, slot) => {
      img.style.transition = ms ? `transform ${ms}ms ${EASE}, opacity 0.2s ease` : '';
      img.style.transform = `translate3d(${(slot - 1) * step() + dx}px, 0, 0)`;
    });
    return ms;
  }

  function fill() {
    slides.forEach((img, slot) => {
      const photo = album[wrap(index + slot - 1)];
      if (img.src !== photo.src) img.src = photo.src;
      img.alt = slot === 1 ? photo.alt : '';
      img.classList.toggle('is-current', slot === 1);
      img.toggleAttribute('aria-hidden', slot !== 1);
    });
    number.textContent = `Image ${index + 1} of ${album.length}`;
    dialog.classList.toggle('is-loading', !slides[1].complete);
  }

  function settle(ms, then) {
    moving = true;
    settling = setTimeout(() => {
      if (then) then();
      moving = false;
    }, ms);
  }

  function fade(dir) {
    const ms = reduceMotion.matches ? 0 : 280;
    const from = slides[1];
    const to = slides[1 + dir];
    to.style.transition = 'none';
    to.style.opacity = '0';
    to.style.transform = `translate3d(${dir * DRIFT}px, 0, 0)`;
    to.getBoundingClientRect();
    [from, to].forEach((img) => {
      img.style.transition = ms ? `transform ${ms}ms ${EASE}, opacity ${ms}ms ease` : 'none';
    });
    from.style.opacity = '0';
    from.style.transform = `translate3d(${-dir * DRIFT}px, 0, 0)`;
    to.style.opacity = '';
    to.style.transform = 'translate3d(0, 0, 0)';
    return ms;
  }

  // Dragging finishes the slide the finger started; everything else crossfades.
  function go(dir, slide) {
    if (moving || album.length < 2) return;
    settle(slide ? place(-dir * step(), true) : fade(dir), () => {
      index = wrap(index + dir);
      if (dir > 0) slides.push(slides.shift());
      else slides.unshift(slides.pop());
      slides.forEach((img) => {
        img.style.opacity = '';
      });
      place(0, false);
      fill();
    });
  }

  slides.forEach((img) => {
    const done = () => {
      if (img === slides[1]) dialog.classList.remove('is-loading');
    };
    img.addEventListener('load', done);
    img.addEventListener('error', done);
  });

  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[data-lightbox]');
    if (!link || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    const links = [...document.querySelectorAll(`a[data-lightbox="${CSS.escape(link.dataset.lightbox)}"]`)];
    const gallery = link.closest('.gallery');
    album = links.map((a) => ({ src: a.href, alt: a.querySelector('img')?.alt || '' }));
    index = links.indexOf(link);
    title.textContent = gallery?.dataset.title || '';
    meta.textContent = gallery?.dataset.meta || '';
    dialog.classList.toggle('is-single', album.length < 2);
    place(0, false);
    fill();
    dialog.showModal();
    dialog.focus();
  });

  dialog.querySelector('.lb-prev').addEventListener('click', () => go(-1));
  dialog.querySelector('.lb-next').addEventListener('click', () => go(1));
  dialog.querySelector('.lb-close').addEventListener('click', () => dialog.close());

  dialog.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') go(-1);
    if (e.key === 'ArrowRight') go(1);
  });

  // Empty space closes; on desktop the photo's left and right halves step through.
  dialog.addEventListener('click', (e) => {
    if (Date.now() - draggedAt < 300) return;
    if (e.target === dialog) dialog.close();
    if (e.target === slides[1] && canHover.matches) {
      const box = slides[1].getBoundingClientRect();
      go(e.clientX < box.left + box.width / 2 ? -1 : 1);
    }
  });

  dialog.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || moving || e.target.closest('button') || isZoomed()) return;
    drag = { id: e.pointerId, x: e.clientX, y: e.clientY, axis: null, lastX: e.clientX, lastT: e.timeStamp, vx: 0 };
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
    if (e.timeStamp > drag.lastT) {
      drag.vx = (e.clientX - drag.lastX) / (e.timeStamp - drag.lastT);
      drag.lastX = e.clientX;
      drag.lastT = e.timeStamp;
    }
    if (drag.axis === 'x') {
      place(album.length < 2 ? dx * 0.3 : dx, false);
    } else {
      const down = Math.max(dy, 0);
      slides[1].style.transform = `translate3d(0, ${down}px, 0)`;
      dialog.style.opacity = String(1 - Math.min(down / 400, 0.6));
    }
  });

  function endDrag(e) {
    if (!drag || e.pointerId !== drag.id) return;
    const { axis, vx } = drag;
    const dx = e.clientX - drag.x;
    const dy = e.clientY - drag.y;
    drag = null;
    dialog.classList.remove('is-dragging');
    dialog.style.opacity = '';
    if (!axis) return;
    draggedAt = Date.now();
    const cancelled = e.type === 'pointercancel';
    if (!cancelled && axis === 'y' && dy > 100) {
      dialog.close();
      return;
    }
    const flick = Math.abs(vx) > 0.4 && Math.abs(dx) > 20 && Math.sign(vx) === Math.sign(dx);
    if (!cancelled && axis === 'x' && album.length > 1 && (Math.abs(dx) > step() * 0.2 || flick)) {
      go(dx < 0 ? 1 : -1, true);
    } else {
      settle(place(0, true));
    }
  }

  dialog.addEventListener('pointerup', endDrag);
  dialog.addEventListener('pointercancel', endDrag);

  // A step still animating when the viewer closes is dropped, so reopening
  // never lands on a photo the pending callback moved to.
  dialog.addEventListener('close', () => {
    clearTimeout(settling);
    moving = false;
    slides.forEach((img) => {
      img.style.opacity = '';
    });
    place(0, false);
    dialog.style.opacity = '';
  });

  window.addEventListener('resize', () => {
    if (dialog.open && !moving) place(0, false);
  });

  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', () => dialog.classList.toggle('is-zoomed', isZoomed()));
  }
})();
