(function () {
  'use strict';
  // Internet Explorer has its own entry screen and preference.
  if (window.watertubeIE) return;

  var editionKey = 'watertube.home.edition.v1';
  var hideNoticeKey = 'watertube.home.hideNotice.v1';
  var isClassic = document.documentElement.getAttribute('data-home-edition') === 'classic';

  function readPreference(key) {
    var stores = ['sessionStorage', 'localStorage'];
    for (var i = 0; i < stores.length; i++) {
      try {
        var value = window[stores[i]].getItem(key);
        if (value !== null) return value;
      } catch (error) { /* The browser may disable storage. */ }
    }
    return history.state && history.state[key];
  }

  function savePreference(key, value, address) {
    // History also covers a refresh when persistent storage is disabled.
    var state = Object.assign({}, history.state);
    state[key] = value;
    try { history.replaceState(state, '', address || location.href); } catch (error) { /* Keep the page usable. */ }
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      try { sessionStorage.setItem(key, value); } catch (blocked) { /* Follow the link normally. */ }
      return;
    }
    try { sessionStorage.removeItem(key); } catch (error) { /* No session fallback to clear. */ }
  }

  // An explicit return also works when storage rejects writes.
  var address = new URL(location.href);
  var returning = !isClassic && address.searchParams.get('edition') === 'modern';
  if (returning) {
    address.searchParams.delete('edition');
    savePreference(editionKey, 'modern', address.href);
  } else if (!isClassic && readPreference(editionKey) === 'classic') {
    location.replace(new URL('./classic.html', location.href).href);
    return;
  }

  document.addEventListener('DOMContentLoaded', function () {
    var dialog = document.getElementById('edition-dialog');
    var checkbox = document.getElementById('hide-edition-notice');

    function openNotice() {
      if (!dialog || dialog.open) return;
      if (checkbox) checkbox.checked = readPreference(hideNoticeKey) === 'true';
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else dialog.setAttribute('open', '');
    }

    function closeNotice() {
      if (!dialog || !dialog.open) return;
      if (typeof dialog.close === 'function') dialog.close();
      else dialog.removeAttribute('open');
    }

    document.addEventListener('click', function (event) {
      var control = event.target.closest('[data-enter-modern], [data-enter-classic], [data-open-edition]');
      if (!control) return;
      if (control.hasAttribute('data-enter-classic')) {
        savePreference(editionKey, 'classic');
        closeNotice();
      } else if (control.hasAttribute('data-enter-modern')) {
        savePreference(editionKey, 'modern');
        closeNotice();
      } else {
        openNotice();
      }
    });

    if (isClassic) {
      // Communicate the choice to the destination even across isolated documents.
      document.querySelector('[data-enter-modern]').search = '?edition=modern';
    } else if (dialog) {
      if (checkbox) checkbox.addEventListener('change', function () {
        savePreference(hideNoticeKey, String(checkbox.checked));
      });
      if (!returning && readPreference(hideNoticeKey) !== 'true') openNotice();
    }
  });
})();
