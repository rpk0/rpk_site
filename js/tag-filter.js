// Tag filtering functionality for posts page
(function() {
  'use strict';

  // Initialize tag filtering on page load
  document.addEventListener('DOMContentLoaded', function() {
    const tagBadges = document.querySelectorAll('.tag-badge');
    const postItems = document.querySelectorAll('.post-item');
    
    if (tagBadges.length === 0 || postItems.length === 0) {
      return; // Not on posts page
    }

    // Check URL for tag parameter
    const urlParams = new URLSearchParams(window.location.search);
    const selectedTag = urlParams.get('tag');
    
    if (selectedTag) {
      filterByTag(selectedTag);
      setActiveBadges(selectedTag);
      showClearButton();
    }

    // Add click event to all tag badges
    tagBadges.forEach(function(badge) {
      badge.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        const tag = this.getAttribute('data-tag');
        
        // Update URL without page reload
        const newUrl = window.location.pathname + '?tag=' + tag;
        window.history.pushState({tag: tag}, '', newUrl);
        
        filterByTag(tag);
        setActiveBadges(tag);
        showClearButton();
      });
    });

    // Handle browser back/forward buttons
    window.addEventListener('popstate', function(e) {
      const urlParams = new URLSearchParams(window.location.search);
      const tag = urlParams.get('tag');
      
      if (tag) {
        filterByTag(tag);
        setActiveBadges(tag);
        showClearButton();
      } else {
        clearFilter();
      }
    });

    function filterByTag(tag) {
      postItems.forEach(function(item) {
        const postTags = item.getAttribute('data-tags');
        if (postTags && postTags.includes(tag)) {
          item.style.display = '';
        } else {
          item.style.display = 'none';
        }
      });

      // Show message if no posts found
      const visiblePosts = Array.from(postItems).filter(function(item) {
        return item.style.display !== 'none';
      });

      const existingMessage = document.querySelector('.no-posts-message');
      if (existingMessage) {
        existingMessage.remove();
      }

      if (visiblePosts.length === 0) {
        const message = document.createElement('li');
        message.className = 'no-posts-message';
        message.textContent = 'No posts found with this tag.';
        document.querySelector('.listing').appendChild(message);
      }

      // Hide pagination when filtering
      const pagination = document.getElementById('pagination');
      if (pagination) {
        pagination.style.display = 'none';
      }
    }

    function setActiveBadges(tag) {
      tagBadges.forEach(function(badge) {
        const badgeTag = badge.getAttribute('data-tag');
        if (badgeTag === tag) {
          badge.classList.add('active');
        } else {
          badge.classList.remove('active');
        }
      });
    }

    function clearFilter() {
      postItems.forEach(function(item) {
        item.style.display = '';
      });
      
      tagBadges.forEach(function(badge) {
        badge.classList.remove('active');
      });

      const existingMessage = document.querySelector('.no-posts-message');
      if (existingMessage) {
        existingMessage.remove();
      }

      const clearBtn = document.querySelector('.clear-filter-btn');
      if (clearBtn) {
        clearBtn.remove();
      }

      // Show pagination again when filter is cleared
      const pagination = document.getElementById('pagination');
      if (pagination) {
        pagination.style.display = '';
      }
    }

    function showClearButton() {
      // Remove existing button if present
      const existingBtn = document.querySelector('.clear-filter-btn');
      if (existingBtn) {
        existingBtn.remove();
      }

      // Create clear button
      const clearBtn = document.createElement('div');
      clearBtn.className = 'clear-filter-btn';
      clearBtn.innerHTML = '<i class="fa fa-times"></i> Clear Filter';
      clearBtn.addEventListener('click', function() {
        window.history.pushState({}, '', window.location.pathname);
        clearFilter();
      });

      // Insert before the listing
      const listing = document.querySelector('.listing');
      listing.parentNode.insertBefore(clearBtn, listing);
    }
  });
})();
