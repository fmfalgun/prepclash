(function () {
  'use strict';

  // ---------------------------------------------------------------------------
  // Auth gate
  // ---------------------------------------------------------------------------

  window.onAuthReady(function (user) {
    if (user) {
      document.getElementById('login-screen').style.display = 'none';
      document.getElementById('app').style.display = 'block';
      initApp(user);
    } else {
      document.getElementById('login-screen').style.display = 'flex';
      document.getElementById('app').style.display = 'none';
    }
  });

  // ---------------------------------------------------------------------------
  // Tab switching
  // ---------------------------------------------------------------------------

  var TAB_RENDERERS = {
    'home': function () {
      window.renderHome(document.getElementById('tab-home'));
    },
    'village': function () {
      window.renderVillage(document.getElementById('tab-village'));
    },
    'clan-capital': function () {
      window.renderClanCapital(document.getElementById('tab-clan-capital'));
    },
    'leaderboard': function () {
      window.renderLeaderboard(document.getElementById('tab-leaderboard'));
    }
  };

  document.addEventListener('DOMContentLoaded', function () {
    var tabButtons = document.querySelectorAll('.tab-btn');

    tabButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var targetTab = btn.getAttribute('data-tab');

        // Deactivate all buttons
        tabButtons.forEach(function (b) { b.classList.remove('active'); });

        // Deactivate all panels
        document.querySelectorAll('.tab-panel').forEach(function (panel) {
          panel.classList.remove('active');
        });

        // Activate clicked button and its panel
        btn.classList.add('active');
        var panel = document.getElementById('tab-' + targetTab);
        if (panel) {
          panel.classList.add('active');
        }

        // Render the tab content
        if (TAB_RENDERERS[targetTab]) {
          TAB_RENDERERS[targetTab]();
        }
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Top bar
  // ---------------------------------------------------------------------------

  function updateTopbar() {
    var uid = window.currentUser ? window.currentUser.uid : null;
    if (!uid) return Promise.resolve();
    return window.DB.getUserProfile(uid).then(function (profile) {
      var displayName = (profile && profile.displayName) ? profile.displayName : 'PLAYER';
      var xpTotal = (profile && profile.xpTotal != null) ? profile.xpTotal : 0;
      var topbarPlayer = document.getElementById('topbar-player');
      if (topbarPlayer) {
        topbarPlayer.textContent = '// ' + displayName + ' // XP: ' + xpTotal;
      }
    }).catch(function (err) {
      console.error('updateTopbar error:', err);
    });
  }

  window.updateTopbar = updateTopbar;

  // ---------------------------------------------------------------------------
  // initApp
  // ---------------------------------------------------------------------------

  function initApp(user) {
    window.DB.initUserProfile(user)
      .then(function () {
        return updateTopbar();
      })
      .then(function () {
        // Render the default active tab (home)
        window.renderHome(document.getElementById('tab-home'));
      })
      .catch(function (err) {
        console.error('initApp error:', err);
      });

    // Refresh topbar XP every 30 seconds
    setInterval(function () {
      updateTopbar();
    }, 30000);
  }

  // ---------------------------------------------------------------------------
  // Modal management (global, used by village.js)
  // ---------------------------------------------------------------------------

  window.showModal = function (opts) {
    // opts: { title: string, onConfirm: function(proofUrl) }
    var overlay = document.getElementById('modal-overlay');
    var titleEl = document.getElementById('modal-title');
    var input = document.getElementById('modal-proof-input');
    var errorEl = document.getElementById('modal-error');
    var confirmBtn = document.getElementById('modal-confirm');
    var cancelBtn = document.getElementById('modal-cancel');

    // Reset state
    input.value = '';
    errorEl.style.display = 'none';
    errorEl.textContent = '';
    titleEl.textContent = opts.title || '';

    // Show the overlay
    overlay.style.display = 'flex';
    input.focus();

    // Clone buttons to remove old listeners
    var newConfirm = confirmBtn.cloneNode(true);
    var newCancel = cancelBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirm, confirmBtn);
    cancelBtn.parentNode.replaceChild(newCancel, cancelBtn);

    function hideModal() {
      overlay.style.display = 'none';
    }

    newConfirm.addEventListener('click', function () {
      var proofUrl = input.value.trim();

      if (!proofUrl) {
        errorEl.textContent = 'ERROR: PROOF LINK REQUIRED';
        errorEl.style.display = 'block';
        return;
      }

      // Basic URL validation
      try {
        new URL(proofUrl);
      } catch (_) {
        errorEl.textContent = 'ERROR: INVALID URL FORMAT';
        errorEl.style.display = 'block';
        return;
      }

      hideModal();
      if (typeof opts.onConfirm === 'function') {
        opts.onConfirm(proofUrl);
      }
    });

    newCancel.addEventListener('click', function () {
      hideModal();
    });

    // Also close on overlay background click.
    // Remove any previously-registered overlay click listener before adding a new one.
    if (window._modalOverlayClickHandler) {
      overlay.removeEventListener('click', window._modalOverlayClickHandler);
    }
    window._modalOverlayClickHandler = function (e) {
      if (e.target === overlay) {
        hideModal();
        overlay.removeEventListener('click', window._modalOverlayClickHandler);
        window._modalOverlayClickHandler = null;
      }
    };
    overlay.addEventListener('click', window._modalOverlayClickHandler);
  };

}());
