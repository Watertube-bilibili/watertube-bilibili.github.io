(function () {
  'use strict';
  // Internet Explorer has its own entry screen and preference.
  if (window.watertubeIE) return;

  var storageKey = 'watertube.home.edition.v1';
  var isClassic = document.documentElement.getAttribute('data-home-edition') === 'classic';

  function readEdition() {
    var stores = ['sessionStorage', 'localStorage'];
    for (var i = 0; i < stores.length; i++) {
      try {
        var edition = window[stores[i]].getItem(storageKey);
        if (edition === 'modern' || edition === 'classic') return edition;
      } catch (error) { /* The browser may disable storage. */ }
    }
    return history.state && history.state[storageKey];
  }

  function rememberOnPage(edition, address) {
    // History also covers a refresh when persistent storage is disabled.
    var state = Object.assign({}, history.state);
    state[storageKey] = edition;
    try { history.replaceState(state, '', address); } catch (error) { /* Keep the page usable. */ }
  }

  function saveEdition(edition) {
    rememberOnPage(edition, location.href);
    try {
      localStorage.setItem(storageKey, edition);
    } catch (error) {
      try { sessionStorage.setItem(storageKey, edition); } catch (blocked) { /* Follow the link normally. */ }
      return;
    }
    try { sessionStorage.removeItem(storageKey); } catch (error) { /* No session fallback to clear. */ }
  }

  // An explicit return also works when storage rejects writes.
  var address = new URL(location.href);
  var returning = !isClassic && address.searchParams.get('edition') === 'modern';
  if (returning) {
    saveEdition('modern');
    address.searchParams.delete('edition');
    rememberOnPage('modern', address.href);
  } else if (!isClassic && readEdition() === 'classic') {
    location.replace(new URL('./classic.html', location.href).href);
    return;
  }

  document.addEventListener('DOMContentLoaded', function () {
    var dialog = document.getElementById('edition-dialog');

    function openNotice() {
      if (!dialog || dialog.open) return;
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
        saveEdition('classic');
        closeNotice();
      } else if (control.hasAttribute('data-enter-modern')) {
        saveEdition('modern');
        closeNotice();
      } else {
        openNotice();
      }
    });

    if (isClassic) {
      // Communicate the choice to the destination even across isolated documents.
      document.querySelector('[data-enter-modern]').search = '?edition=modern';
    } else if (dialog) {
      dialog.addEventListener('cancel', function () { saveEdition('modern'); });
      if (!returning && !readEdition()) openNotice();
    }
  });
})();
