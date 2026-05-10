// admin/shared/auth-check.js — guard for /admin/* pages.
//
// HTML keeps <body style="visibility:hidden"> until this script confirms the
// session is valid. On 401 we redirect to the OAuth start; on 200 we reveal
// body and stash the email on window.__adminEmail for the topbar.

(function () {
  'use strict';

  function go(url) {
    window.location.replace(url);
  }

  function reveal(email) {
    window.__adminEmail = email;
    document.body.style.visibility = 'visible';
    var slot = document.querySelector('[data-admin-email]');
    if (slot) slot.textContent = email;
  }

  fetch('/api/admin/me', {
    method: 'GET',
    credentials: 'same-origin',
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  })
    .then(function (r) {
      if (r.status === 200) return r.json();
      if (r.status === 401 || r.status === 403) {
        go('/api/auth/google/login');
        return null;
      }
      throw new Error('me HTTP ' + r.status);
    })
    .then(function (data) {
      if (!data) return;
      var email = data && typeof data.email === 'string' ? data.email : '';
      if (!email) {
        go('/api/auth/google/login');
        return;
      }
      reveal(email);
    })
    .catch(function () {
      go('/api/auth/google/login');
    });
})();
