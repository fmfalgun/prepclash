(function () {
  'use strict';

  var _authReady = false;
  var _authReadyCallbacks = [];
  var _stateChangeListeners = [];

  window.currentUser = null;

  // Internal: called by onAuthStateChanged handler each time auth state changes.
  function _notifyStateListeners(user) {
    for (var i = 0; i < _stateChangeListeners.length; i++) {
      try {
        _stateChangeListeners[i](user);
      } catch (e) {
        console.error('[auth] state change listener error:', e);
      }
    }
  }

  // Internal: called once when Firebase auth state is first known.
  function _resolveAuthReady(user) {
    _authReady = true;
    var callbacks = _authReadyCallbacks.slice();
    _authReadyCallbacks = [];
    for (var i = 0; i < callbacks.length; i++) {
      try {
        callbacks[i](user);
      } catch (e) {
        console.error('[auth] onAuthReady callback error:', e);
      }
    }
  }

  // Set up the auth state listener as soon as this script runs.
  // firebase.initializeApp() has already been called by firebase-config.js.
  var _firstCall = true;

  firebase.auth().onAuthStateChanged(function (user) {
    window.currentUser = user || null;

    if (_firstCall) {
      _firstCall = false;
      // Note: initUserProfile is handled by initApp() in app.js to avoid duplicate writes.
      _resolveAuthReady(user);
    }

    _notifyStateListeners(user);
  });

  /**
   * Calls callback(user) once when Firebase auth state is first known.
   * If auth is already resolved, calls callback immediately (async via
   * setTimeout to keep call-order predictable for callers).
   */
  window.onAuthReady = function (callback) {
    if (typeof callback !== 'function') {
      throw new TypeError('[auth] onAuthReady: callback must be a function');
    }

    if (_authReady) {
      // Auth already resolved — call immediately but asynchronously so the
      // caller's surrounding code finishes executing first.
      setTimeout(function () {
        try {
          callback(window.currentUser);
        } catch (e) {
          console.error('[auth] onAuthReady callback error:', e);
        }
      }, 0);
    } else {
      _authReadyCallbacks.push(callback);
    }
  };

  /**
   * Triggers a Google OAuth popup sign-in.
   * Returns the Promise from signInWithPopup so callers can chain .catch().
   */
  window.signInWithGoogle = function () {
    var provider = new firebase.auth.GoogleAuthProvider();
    return firebase.auth().signInWithPopup(provider).then(function (result) {
      // initUserProfile is handled by initApp() via the onAuthReady callback.
      return result;
    }).catch(function (err) {
      console.error('[auth] signInWithGoogle error:', err);
      throw err;
    });
  };

  /**
   * Signs out the current user.
   * Returns the Promise from firebase.auth().signOut().
   */
  window.signOut = function () {
    return firebase.auth().signOut().catch(function (err) {
      console.error('[auth] signOut error:', err);
      throw err;
    });
  };

  /**
   * Register a listener that is called every time auth state changes
   * (after the initial resolution).  Not part of the public API spec but
   * useful for UI modules that want live updates.
   */
  window.onAuthStateChange = function (listener) {
    if (typeof listener !== 'function') {
      throw new TypeError('[auth] onAuthStateChange: listener must be a function');
    }
    _stateChangeListeners.push(listener);
  };

}());
