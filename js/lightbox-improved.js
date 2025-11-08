/**
 * Enhanced Lightbox v1.0
 * Improved version with visible navigation arrows and touch swipe support
 */
(function() {
  'use strict';

  const Lightbox = {
    options: {
      fadeDuration: 300,
      resizeDuration: 400,
      fitImagesInViewport: true,
      showImageNumberLabel: true,
      wrapAround: true,
      swipeThreshold: 50
    },

    album: [],
    currentImageIndex: 0,
    touchStartX: 0,
    touchStartY: 0,
    isDragging: false,

    init: function() {
      this.createMarkup();
      this.bindEvents();
    },

    createMarkup: function() {
      const markup = `
        <div id="lightboxOverlay" class="lightboxOverlay"></div>
        <div id="lightbox" class="lightbox">
          <div class="lb-outerContainer">
            <div class="lb-container">
              <img class="lb-image" src="" alt="">
              <div class="lb-click-zone left"></div>
              <div class="lb-click-zone right"></div>
              <div class="lb-loader">
                <div class="lb-spinner"></div>
              </div>
            </div>
          </div>
          <div class="lb-nav">
            <button class="lb-prev" aria-label="Previous image">
              <svg width="30" height="30" viewBox="0 0 30 30">
                <path d="M20 5 L10 15 L20 25" stroke="white" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
            <button class="lb-next" aria-label="Next image">
              <svg width="30" height="30" viewBox="0 0 30 30">
                <path d="M10 5 L20 15 L10 25" stroke="white" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
          <div class="lb-swipe-hint">
            <svg width="80" height="80" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="35" fill="rgba(0,0,0,0.5)" stroke="white" stroke-width="2"/>
              <g class="swipe-arrow">
                <path d="M25 40 L55 40" stroke="white" stroke-width="2" stroke-linecap="round"/>
                <path d="M45 30 L55 40 L45 50" stroke="white" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
              </g>
            </svg>
          </div>
          <div class="lb-dataContainer">
            <div class="lb-data">
              <div class="lb-details">
                <span class="lb-caption"></span>
                <span class="lb-number"></span>
              </div>
              <button class="lb-close" aria-label="Close lightbox">
                <svg width="30" height="30" viewBox="0 0 30 30">
                  <path d="M5 5 L25 25 M25 5 L5 25" stroke="white" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      `;
      document.body.insertAdjacentHTML('beforeend', markup);

      this.$overlay = document.getElementById('lightboxOverlay');
      this.$lightbox = document.getElementById('lightbox');
      this.$outerContainer = this.$lightbox.querySelector('.lb-outerContainer');
      this.$container = this.$lightbox.querySelector('.lb-container');
      this.$image = this.$lightbox.querySelector('.lb-image');
      this.$nav = this.$lightbox.querySelector('.lb-nav');
      this.$prevButton = this.$lightbox.querySelector('.lb-prev');
      this.$nextButton = this.$lightbox.querySelector('.lb-next');
      this.$clickZoneLeft = this.$lightbox.querySelector('.lb-click-zone.left');
      this.$clickZoneRight = this.$lightbox.querySelector('.lb-click-zone.right');
      this.$loader = this.$lightbox.querySelector('.lb-loader');
      this.$caption = this.$lightbox.querySelector('.lb-caption');
      this.$number = this.$lightbox.querySelector('.lb-number');
      this.$closeButton = this.$lightbox.querySelector('.lb-close');
      this.$dataContainer = this.$lightbox.querySelector('.lb-dataContainer');
      this.$swipeHint = this.$lightbox.querySelector('.lb-swipe-hint');
    },

    bindEvents: function() {
      const self = this;

      // Click to open lightbox
      document.addEventListener('click', function(e) {
        const link = e.target.closest('a[rel^="lightbox"], a[data-lightbox]');
        if (link) {
          e.preventDefault();
          self.start(link);
        }
      });

      // Overlay click to close
      this.$overlay.addEventListener('click', () => this.end());

      // Close button
      this.$closeButton.addEventListener('click', () => this.end());

      // Navigation buttons
      this.$prevButton.addEventListener('click', (e) => {
        e.stopPropagation();
        this.previousImage();
      });

      this.$nextButton.addEventListener('click', (e) => {
        e.stopPropagation();
        this.nextImage();
      });

      // Click zones for image navigation (desktop only)
      this.$clickZoneLeft.addEventListener('click', (e) => {
        e.stopPropagation();
        this.previousImage();
      });

      this.$clickZoneRight.addEventListener('click', (e) => {
        e.stopPropagation();
        this.nextImage();
      });

      // Keyboard navigation
      document.addEventListener('keydown', (e) => {
        if (!this.$lightbox.classList.contains('active')) return;

        switch(e.key) {
          case 'Escape':
            this.end();
            break;
          case 'ArrowLeft':
            this.previousImage();
            break;
          case 'ArrowRight':
            this.nextImage();
            break;
        }
      });

      // Touch events for swipe
      this.$container.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: true });
      this.$container.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
      this.$container.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: true });

      // Mouse drag for desktop
      this.$container.addEventListener('mousedown', (e) => this.handleMouseDown(e));
      document.addEventListener('mousemove', (e) => this.handleMouseMove(e));
      document.addEventListener('mouseup', (e) => this.handleMouseUp(e));

      // Window resize
      window.addEventListener('resize', () => {
        if (this.$lightbox.classList.contains('active')) {
          this.sizeImage();
        }
      });
    },

    start: function(link) {
      this.album = [];
      let imageIndex = 0;

      const dataLightbox = link.getAttribute('data-lightbox');
      const rel = link.getAttribute('rel');

      if (dataLightbox) {
        // Group by data-lightbox attribute
        const links = document.querySelectorAll(`a[data-lightbox="${dataLightbox}"]`);
        links.forEach((el, index) => {
          this.album.push({
            link: el.href,
            title: el.getAttribute('title') || ''
          });
          if (el === link) imageIndex = index;
        });
      } else if (rel && rel !== 'lightbox') {
        // Group by rel attribute
        const links = document.querySelectorAll(`a[rel="${rel}"]`);
        links.forEach((el, index) => {
          this.album.push({
            link: el.href,
            title: el.getAttribute('title') || ''
          });
          if (el === link) imageIndex = index;
        });
      } else {
        // Single image
        this.album.push({
          link: link.href,
          title: link.getAttribute('title') || ''
        });
      }

      this.open();
      this.changeImage(imageIndex);
    },

    open: function() {
      document.body.style.overflow = 'hidden';
      this.$overlay.style.display = 'block';
      this.$lightbox.style.display = 'block';

      setTimeout(() => {
        this.$overlay.classList.add('active');
        this.$lightbox.classList.add('active');
      }, 10);

      // Show swipe hint on mobile for albums (no longer needed with visible arrows)
      // Keeping the code but not showing hint since arrows are now visible
    },

    isMobile: function() {
      return window.innerWidth <= 768;
    },

    showSwipeHint: function() {
      if (sessionStorage.getItem('lightbox-swipe-hint-shown') || !this.isMobile()) {
        return;
      }

      const hint = document.createElement('div');
      hint.className = 'swipe-hint';
      hint.textContent = '← Swipe to navigate →';
      document.body.appendChild(hint);

      sessionStorage.setItem('lightbox-swipe-hint-shown', 'true');
      
      setTimeout(() => {
        hint.remove();
      }, 3000);
    },

    changeImage: function(index) {
      this.currentImageIndex = index;
      
      this.$loader.style.display = 'block';
      this.$image.style.opacity = '0';
      this.$dataContainer.style.opacity = '0';

      const img = new Image();
      img.onload = () => {
        this.$image.src = img.src;
        this.sizeImage();
        this.updateDetails();
        this.updateNav();
        this.preloadNeighborImages();

        this.$loader.style.display = 'none';
        this.$image.style.opacity = '1';
        this.$dataContainer.style.opacity = '1';
      };
      img.onerror = () => {
        console.error('Failed to load image:', this.album[index].link);
        this.$loader.style.display = 'none';
      };
      img.src = this.album[index].link;
    },

    sizeImage: function() {
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      const maxWidth = windowWidth - 40;
      const maxHeight = windowHeight - 150;

      const img = this.$image;
      const naturalWidth = img.naturalWidth;
      const naturalHeight = img.naturalHeight;

      if (this.options.fitImagesInViewport) {
        let width = naturalWidth;
        let height = naturalHeight;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.floor(width * ratio);
          height = Math.floor(height * ratio);
        }

        this.$outerContainer.style.width = width + 'px';
        this.$outerContainer.style.height = height + 'px';
      }
    },

    updateNav: function() {
      if (this.album.length > 1) {
        this.$nav.style.display = 'flex';
        
        if (this.options.wrapAround) {
          this.$prevButton.style.display = 'flex';
          this.$nextButton.style.display = 'flex';
        } else {
          this.$prevButton.style.display = this.currentImageIndex > 0 ? 'flex' : 'none';
          this.$nextButton.style.display = this.currentImageIndex < this.album.length - 1 ? 'flex' : 'none';
        }
      } else {
        this.$nav.style.display = 'none';
      }
    },

    updateDetails: function() {
      const current = this.album[this.currentImageIndex];
      
      if (current.title) {
        this.$caption.textContent = current.title;
        this.$caption.style.display = 'block';
      } else {
        this.$caption.style.display = 'none';
      }

      if (this.album.length > 1 && this.options.showImageNumberLabel) {
        this.$number.textContent = `Image ${this.currentImageIndex + 1} of ${this.album.length}`;
        this.$number.style.display = 'block';
      } else {
        this.$number.style.display = 'none';
      }
    },

    preloadNeighborImages: function() {
      if (this.currentImageIndex > 0) {
        new Image().src = this.album[this.currentImageIndex - 1].link;
      }
      if (this.currentImageIndex < this.album.length - 1) {
        new Image().src = this.album[this.currentImageIndex + 1].link;
      }
    },

    previousImage: function() {
      if (this.currentImageIndex > 0) {
        this.changeImage(this.currentImageIndex - 1);
      } else if (this.options.wrapAround) {
        this.changeImage(this.album.length - 1);
      }
    },

    nextImage: function() {
      if (this.currentImageIndex < this.album.length - 1) {
        this.changeImage(this.currentImageIndex + 1);
      } else if (this.options.wrapAround) {
        this.changeImage(0);
      }
    },

    // Touch handlers
    handleTouchStart: function(e) {
      this.touchStartX = e.touches[0].clientX;
      this.touchStartY = e.touches[0].clientY;
    },

    handleTouchMove: function(e) {
      if (!this.touchStartX) return;

      const touchX = e.touches[0].clientX;
      const touchY = e.touches[0].clientY;
      const diffX = this.touchStartX - touchX;
      const diffY = this.touchStartY - touchY;

      // Prevent default only if horizontal swipe
      if (Math.abs(diffX) > Math.abs(diffY)) {
        e.preventDefault();
      }
    },

    handleTouchEnd: function(e) {
      if (!this.touchStartX) return;

      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const diffX = this.touchStartX - touchEndX;
      const diffY = this.touchStartY - touchEndY;

      // Check if horizontal swipe
      if (Math.abs(diffX) > Math.abs(diffY)) {
        if (Math.abs(diffX) > this.options.swipeThreshold) {
          if (diffX > 0) {
            this.nextImage();
          } else {
            this.previousImage();
          }
        }
      }

      this.touchStartX = 0;
      this.touchStartY = 0;
    },

    // Mouse drag handlers
    handleMouseDown: function(e) {
      // Only for desktop, not for buttons
      if (e.target.closest('button')) return;
      this.isDragging = true;
      this.touchStartX = e.clientX;
      e.preventDefault();
    },

    handleMouseMove: function(e) {
      if (!this.isDragging) return;
      e.preventDefault();
    },

    handleMouseUp: function(e) {
      if (!this.isDragging) return;
      
      const diffX = this.touchStartX - e.clientX;
      
      if (Math.abs(diffX) > this.options.swipeThreshold) {
        if (diffX > 0) {
          this.nextImage();
        } else {
          this.previousImage();
        }
      }

      this.isDragging = false;
      this.touchStartX = 0;
    },

    end: function() {
      this.$overlay.classList.remove('active');
      this.$lightbox.classList.remove('active');

      setTimeout(() => {
        this.$overlay.style.display = 'none';
        this.$lightbox.style.display = 'none';
        document.body.style.overflow = '';
      }, this.options.fadeDuration);
    }
  };

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Lightbox.init());
  } else {
    Lightbox.init();
  }

})();
