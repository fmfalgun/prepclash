(function () {
  "use strict";

  // ─── State ──────────────────────────────────────────────────────────────────

  var _entries = [];          // raw data from DB, sorted by xpTotal desc
  var _mode = "alltime";      // "alltime" | "thisweek"
  var _unsubscribe = null;    // real-time listener cleanup
  var _listEl = null;         // the rows container — re-rendered on toggle

  // ─── Helpers ────────────────────────────────────────────────────────────────

  function avatarOf(displayName) {
    var name = (displayName || "??").trim();
    return name.slice(0, 2).toUpperCase();
  }

  // L13: Thousands separator for XP values.
  function formatXP(n) {
    return (n || 0).toLocaleString();
  }

  function domainLabel(domain) {
    var map = {
      cybersec: "CYBERSEC",
      "ai/ml":  "AI/ML",
      corecs:   "CORE CS",
      "core cs":"CORE CS",
    };
    var key = (domain || "").toLowerCase().trim();
    return map[key] || (domain ? domain.toUpperCase() : "—");
  }

  function deltaHtml(xpThisWeek) {
    // L14: TODO: xpThisWeek requires a weekly Cloud Function reset — see db.js updateWeeklyXP.
    // Until that is implemented the "THIS WEEK" column shows accumulated total.
    var val = xpThisWeek || 0;
    if (val > 0) {
      return '<span style="color:var(--green)">&#8593; +' + formatXP(val) + "</span>";
    }
    if (val < 0) {
      return '<span style="color:var(--red)">&#8595; ' + formatXP(val) + "</span>";
    }
    return '<span style="color:var(--muted)">&#8594; +0</span>';
  }

  function rankColor(rank) {
    if (rank === 1) return "var(--gold)";
    if (rank === 2) return "#aaaaaa";
    if (rank === 3) return "#cd7f32";
    return "var(--text)";
  }

  function sortedEntries() {
    var copy = _entries.slice();
    if (_mode === "thisweek") {
      copy.sort(function (a, b) {
        return (b.xpThisWeek || 0) - (a.xpThisWeek || 0);
      });
    } else {
      copy.sort(function (a, b) {
        return (b.xpTotal || 0) - (a.xpTotal || 0);
      });
    }
    return copy;
  }

  // ─── Row builder ────────────────────────────────────────────────────────────

  function buildRowEl(entry, rank) {
    var currentUid =
      window.currentUser ? window.currentUser.uid : null;
    var isSelf = currentUid && entry.userId === currentUid;

    var xpDisplay =
      _mode === "thisweek"
        ? (entry.xpThisWeek || 0)
        : (entry.xpTotal || 0);

    var topicsCount = entry.topicsCompleted || 0;
    var avatar = avatarOf(entry.displayName);
    var playerName = entry.displayName || "???";
    var domain = domainLabel(entry.domain);

    var row = document.createElement("div");
    row.className = "lb-row" + (isSelf ? " lb-row-self" : "");
    row.style.cssText = [
      "display:grid",
      "grid-template-columns:3.5rem 4rem 1fr 7rem 7rem 6rem",
      "align-items:center",
      "padding:0.55rem 0.75rem",
      "border-bottom:1px solid var(--border)",
      "background:" + (isSelf ? "#0a1a0a" : "var(--bg)"),
      "font-size:0.78rem",
      "letter-spacing:0.04em",
      "transition:background 0.1s",
    ].join(";");

    // hover effect
    row.addEventListener("mouseenter", function () {
      if (!isSelf) row.style.background = "var(--surface)";
    });
    row.addEventListener("mouseleave", function () {
      row.style.background = isSelf ? "#0a1a0a" : "var(--bg)";
    });

    // RANK cell
    var rankCell = document.createElement("div");
    rankCell.style.cssText =
      "font-weight:700;font-size:0.82rem;color:" + rankColor(rank);
    rankCell.textContent = "#" + rank;

    // AVATAR cell
    var avatarCell = document.createElement("div");
    avatarCell.style.cssText =
      "color:var(--green);font-weight:700;letter-spacing:0.08em";
    avatarCell.textContent = "[" + avatar + "]";

    // PLAYER cell
    var playerCell = document.createElement("div");
    playerCell.style.cssText =
      "font-weight:700;letter-spacing:0.06em;color:" +
      (isSelf ? "var(--green)" : "var(--text)") +
      ";white-space:nowrap;overflow:hidden;text-overflow:ellipsis";
    playerCell.textContent = (isSelf ? "► " : "") + playerName;

    // DOMAIN cell
    var domainCell = document.createElement("div");
    domainCell.style.cssText =
      "color:var(--muted);font-size:0.7rem;text-transform:uppercase;" +
      "letter-spacing:0.08em";
    domainCell.textContent = domain;

    // XP cell
    var xpCell = document.createElement("div");
    xpCell.style.cssText =
      "color:var(--gold);font-weight:700;text-align:right";
    // L13: Use thousands separator for XP values.
    xpCell.textContent =
      formatXP(xpDisplay) + " XP";
    if (topicsCount > 0) {
      var topicsSpan = document.createElement("span");
      topicsSpan.style.cssText =
        "color:var(--muted);font-size:0.68rem;font-weight:400;" +
        "margin-left:0.4em";
      topicsSpan.textContent = "(" + topicsCount + " topics)";
      xpCell.appendChild(topicsSpan);
    }

    // DELTA cell
    var deltaCell = document.createElement("div");
    deltaCell.style.cssText = "text-align:right;font-weight:700";
    deltaCell.innerHTML = deltaHtml(entry.xpThisWeek || 0);

    row.appendChild(rankCell);
    row.appendChild(avatarCell);
    row.appendChild(playerCell);
    row.appendChild(domainCell);
    row.appendChild(xpCell);
    row.appendChild(deltaCell);

    return row;
  }

  // ─── List renderer (re-runs on toggle, no re-fetch) ─────────────────────────

  function renderList() {
    if (!_listEl) return;

    // Clear existing rows
    while (_listEl.firstChild) {
      _listEl.removeChild(_listEl.firstChild);
    }

    var sorted = sortedEntries();

    if (sorted.length === 0) {
      var empty = document.createElement("div");
      empty.style.cssText =
        "padding:3rem 1rem;text-align:center;color:var(--muted);" +
        "font-size:0.78rem;letter-spacing:0.12em;text-transform:uppercase";
      empty.textContent = "[ NO COMPETITORS DETECTED ]";
      _listEl.appendChild(empty);
      return;
    }

    sorted.forEach(function (entry, idx) {
      _listEl.appendChild(buildRowEl(entry, idx + 1));
    });
  }

  // ─── Full panel builder ──────────────────────────────────────────────────────

  function buildPanel(container) {
    container.innerHTML = "";

    // ── Header ────────────────────────────────────────────────────────────────
    var header = document.createElement("div");
    header.style.cssText =
      "display:flex;align-items:baseline;gap:0.6rem;margin-bottom:1.25rem";

    var title = document.createElement("span");
    title.style.cssText =
      "font-size:0.85rem;font-weight:700;letter-spacing:0.2em;" +
      "text-transform:uppercase;color:var(--green)";
    title.textContent = "LEADERBOARD";

    var sep = document.createElement("span");
    sep.style.cssText = "color:var(--border);font-size:0.75rem";
    sep.textContent = "//";

    var sub = document.createElement("span");
    sub.style.cssText =
      "font-size:0.72rem;letter-spacing:0.18em;text-transform:uppercase;" +
      "color:var(--muted)";
    sub.textContent = "LIVE RANKINGS";

    header.appendChild(title);
    header.appendChild(sep);
    header.appendChild(sub);
    container.appendChild(header);

    // ── Toggle buttons ────────────────────────────────────────────────────────
    var toggleRow = document.createElement("div");
    toggleRow.style.cssText = "display:flex;gap:0.5rem;margin-bottom:1.25rem";

    function makeToggleBtn(label, modeKey) {
      var btn = document.createElement("button");
      btn.textContent = label;
      btn.style.cssText = [
        "padding:0.35rem 0.9rem",
        "font-family:var(--font)",
        "font-size:0.72rem",
        "font-weight:700",
        "letter-spacing:0.12em",
        "text-transform:uppercase",
        "background:transparent",
        "border:1px solid var(--border)",
        "cursor:pointer",
        "transition:color 0.15s,border-color 0.15s",
      ].join(";");

      function applyActive(isActive) {
        if (isActive) {
          btn.style.color = "var(--green)";
          btn.style.borderColor = "var(--green)";
        } else {
          btn.style.color = "var(--muted)";
          btn.style.borderColor = "var(--border)";
        }
      }

      applyActive(_mode === modeKey);

      btn.addEventListener("click", function () {
        if (_mode === modeKey) return;
        _mode = modeKey;
        // Update both button states
        allTimeBtn.style.color =
          _mode === "alltime" ? "var(--green)" : "var(--muted)";
        allTimeBtn.style.borderColor =
          _mode === "alltime" ? "var(--green)" : "var(--border)";
        weekBtn.style.color =
          _mode === "thisweek" ? "var(--green)" : "var(--muted)";
        weekBtn.style.borderColor =
          _mode === "thisweek" ? "var(--green)" : "var(--border)";
        renderList();
      });

      return btn;
    }

    var allTimeBtn = makeToggleBtn("ALL TIME", "alltime");
    var weekBtn    = makeToggleBtn("THIS WEEK", "thisweek");

    toggleRow.appendChild(allTimeBtn);
    toggleRow.appendChild(weekBtn);
    container.appendChild(toggleRow);

    // ── Column header bar ─────────────────────────────────────────────────────
    var colHeader = document.createElement("div");
    colHeader.style.cssText = [
      "display:grid",
      "grid-template-columns:3.5rem 4rem 1fr 7rem 7rem 6rem",
      "align-items:center",
      "padding:0.35rem 0.75rem",
      "border-top:1px solid var(--border)",
      "border-bottom:1px solid var(--border)",
      "margin-bottom:0",
      "font-size:0.65rem",
      "font-weight:700",
      "letter-spacing:0.14em",
      "text-transform:uppercase",
      "color:var(--muted)",
    ].join(";");

    // M16: Header order matches data columns exactly: RANK, avatar (unlabeled), PLAYER, DOMAIN, XP, THIS WEEK.
    ["RANK", "", "PLAYER", "DOMAIN", "XP", "THIS WEEK"].forEach(function (h) {
      var cell = document.createElement("div");
      cell.textContent = h;
      if (h === "XP" || h === "THIS WEEK") {
        cell.style.textAlign = "right";
      }
      colHeader.appendChild(cell);
    });

    container.appendChild(colHeader);

    // ── Divider (monospace-style separator) ────────────────────────────────────
    var divider = document.createElement("div");
    divider.style.cssText =
      "color:var(--border);font-size:0.7rem;letter-spacing:0.02em;" +
      "padding:0.2rem 0.75rem;border-bottom:1px solid var(--border);" +
      "overflow:hidden;white-space:nowrap";
    divider.textContent =
      "──────────" +
      "──────────" +
      "──────────" +
      "──────────" +
      "──────────" +
      "──────────";
    container.appendChild(divider);

    // ── Rows container ────────────────────────────────────────────────────────
    _listEl = document.createElement("div");
    _listEl.className = "lb-rows";
    container.appendChild(_listEl);

    // Initial render
    renderList();
  }

  // ─── Public: renderLeaderboard ───────────────────────────────────────────────

  function renderLeaderboard(container) {
    // Tear down any existing real-time listener
    if (_unsubscribe) {
      try { _unsubscribe(); } catch (e) { /* ignore */ }
      _unsubscribe = null;
    }

    // Reset module state for fresh mount
    _entries = [];
    _mode = "alltime";
    _listEl = null;

    // Build the static chrome immediately (header, toggles, col-headers)
    buildPanel(container);

    // Subscribe to real-time updates. onSnapshot fires immediately with current
    // data, so no separate one-shot getLeaderboard() fetch is needed.
    _unsubscribe = window.DB.onLeaderboardChange(
      function (entries) {
        _entries = entries || [];
        renderList();
      },
      function (err) {
        console.error("[leaderboard] onLeaderboardChange error:", err);
        if (_listEl) {
          var errEl = document.createElement("div");
          errEl.style.cssText =
            "padding:3rem 1rem;text-align:center;color:var(--red);" +
            "font-size:0.78rem;letter-spacing:0.12em;text-transform:uppercase";
          errEl.textContent =
            "[ ERROR LOADING LEADERBOARD: " +
            (err && err.message ? err.message : String(err)) +
            " ]";
          while (_listEl.firstChild) _listEl.removeChild(_listEl.firstChild);
          _listEl.appendChild(errEl);
        }
      }
    );
  }

  // ─── Expose ──────────────────────────────────────────────────────────────────

  window.renderLeaderboard = renderLeaderboard;

  // M11: Teardown — call when unmounting the leaderboard to stop the listener.
  window.destroyLeaderboard = function () {
    if (typeof _unsubscribe === 'function') { _unsubscribe(); _unsubscribe = null; }
  };

})();
