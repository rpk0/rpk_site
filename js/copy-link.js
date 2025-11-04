(function () {
  function setLabel(button, label) {
    var labelEl = button.querySelector('.btn-label');
    if (labelEl) {
      labelEl.textContent = label;
    } else {
      button.textContent = label;
    }
  }

  function fallbackCopy(text, onSuccess, onError) {
    try {
      var temp = document.createElement('textarea');
      temp.value = text;
      temp.setAttribute('readonly', '');
      temp.style.position = 'absolute';
      temp.style.left = '-9999px';
      document.body.appendChild(temp);
      temp.select();
      var successful = document.execCommand('copy');
      document.body.removeChild(temp);
      if (successful) {
        onSuccess();
      } else {
        onError();
      }
    } catch (error) {
      onError();
    }
  }

  function copyToClipboard(text, onSuccess, onError) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(onSuccess).catch(function () {
        fallbackCopy(text, onSuccess, onError);
      });
      return;
    }

    fallbackCopy(text, onSuccess, onError);
  }

  function createRestore(button) {
    return function restore() {
      setLabel(button, button.getAttribute('data-label') || 'Copy link');
      button.classList.remove('is-copied');
      delete button.dataset.copied;
    };
  }

  function handleCopy(event) {
    event.preventDefault();
    var button = event.currentTarget;
    var url = button.getAttribute('data-copy-url');
    if (!url) {
      return;
    }

    var restore = createRestore(button);

    function onSuccess() {
      if (button.dataset.copied === 'true') {
        return;
      }

      button.dataset.copied = 'true';
      button.classList.add('is-copied');
      setLabel(button, button.getAttribute('data-success-label') || 'Link copied!');
      setTimeout(restore, 2000);
    }

    function onError() {
      setLabel(button, 'Copy failed');
      setTimeout(restore, 2000);
    }

    copyToClipboard(url, onSuccess, onError);
  }

  function initCopyLinkButtons() {
    var buttons = document.querySelectorAll('.js-copy-link');
    if (!buttons.length) {
      return;
    }

    buttons.forEach(function (button) {
      if (button.dataset.copyInitialized === 'true') {
        return;
      }

      button.dataset.copyInitialized = 'true';
      var initialLabel = button.getAttribute('data-label');
      if (initialLabel) {
        setLabel(button, initialLabel);
      }

      button.addEventListener('click', handleCopy);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCopyLinkButtons);
  } else {
    initCopyLinkButtons();
  }
})();
