// clanCapital.js — PrepClash Clan Capital tab
// Plain browser JS. No ES modules. Depends on window.DB and window.TOPICS.
// Exposes: window.renderClanCapital(container)

(function () {
  "use strict";

  // ---------------------------------------------------------------------------
  // Constants
  // ---------------------------------------------------------------------------

  // Topic IDs tracked in /clanCapital/topics/
  // Tier 5 (Core CS): OS, DBMS, Networks, OOP, System Design
  // Tier 4 (Advanced DSA): DP, Tries, Advanced Graphs
  var CLAN_TOPIC_IDS = [
    "operating_systems",
    "dbms",
    "computer_networks",
    "oop",
    "system_design",
    "dynamic_programming",
    "tries",
    "advanced_graphs"
  ];

  // Group labels
  var GROUP_CORE_CS  = "CORE CS";
  var GROUP_ADV_DSA  = "TIER 4 — ADVANCED DSA";

  // Progress bar config
  var BAR_LEN = 10;
  // C10: Match db.js::updateClanCapitalLevel() which uses divisor of 10.
  var COMPLETIONS_PER_LEVEL = 10;

  // ---------------------------------------------------------------------------
  // Real-time listener state (M13)
  // ---------------------------------------------------------------------------

  var _ccUnsubscribe = null;

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  function progressBar(filled, total) {
    var pct   = total === 0 ? 0 : Math.min(1, filled / total);
    var count = Math.round(pct * BAR_LEN);
    var bar   = "";
    for (var i = 0; i < BAR_LEN; i++) {
      bar += i < count ? "█" : "░";
    }
    return bar;
  }

  // Returns the topic definition from window.TOPICS by id, or null
  function topicDef(id) {
    var topics = window.TOPICS;
    if (!topics || !topics.length) return null;
    for (var i = 0; i < topics.length; i++) {
      if (topics[i].id === id) return topics[i];
    }
    return null;
  }

  // Build a map of topicId -> firestore data from onClanCapitalTopicsChange results
  function buildTopicMap(firestoreDocs) {
    var map = {};
    for (var i = 0; i < firestoreDocs.length; i++) {
      var doc = firestoreDocs[i];
      map[doc.id] = doc;
    }
    return map;
  }

  // Count total completions across all firestore clan topic docs
  function countTotalCompletions(firestoreDocs) {
    var total = 0;
    for (var i = 0; i < firestoreDocs.length; i++) {
      var completions = firestoreDocs[i].completions || {};
      total += Object.keys(completions).length;
    }
    return total;
  }

  // Escapes text for use in HTML
  function esc(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // ---------------------------------------------------------------------------
  // Render helpers — build HTML strings
  // ---------------------------------------------------------------------------

  // C10/M14: level comes from getClanCapitalMeta(); localLevel is the fallback.
  function renderHeader(level, totalCompletions) {
    var completionsInLevel = totalCompletions % COMPLETIONS_PER_LEVEL;
    var bar  = progressBar(completionsInLevel, COMPLETIONS_PER_LEVEL);
    var pct  = Math.round((completionsInLevel / COMPLETIONS_PER_LEVEL) * 100);

    // C13: Add [ GO TO VILLAGE ] button so users can contribute completions there.
    return (
      '<div class="cc-header">' +
        '<div class="cc-title-row" style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap;">' +
          '<div class="cc-title">CLAN CAPITAL <span class="cc-lvl">// LVL ' + level + '</span></div>' +
          '<button class="cc-village-btn" style="' +
            'font-family:var(--font);font-size:0.72rem;font-weight:700;' +
            'letter-spacing:0.1em;text-transform:uppercase;cursor:pointer;' +
            'background:transparent;border:1px solid var(--green);color:var(--green);' +
            'padding:0.25rem 0.6rem;">' +
            '[ GO TO VILLAGE ]' +
          '</button>' +
        '</div>' +
        '<div class="cc-village-hint" style="font-size:0.7rem;color:var(--muted);margin-top:0.25rem;letter-spacing:0.06em;">' +
          '// Complete topics in VILLAGE to contribute here.' +
        '</div>' +
        '<div class="cc-progress-row">' +
          '<span class="cc-progress-label">PROGRESS TO LVL ' + (level + 1) + ':&nbsp;</span>' +
          '<span class="cc-bar">' + bar + '</span>' +
          '<span class="cc-pct">&nbsp;' + pct + '%</span>' +
        '</div>' +
      '</div>'
    );
  }

  function renderCommonTopicsSummary(firestoreDocs) {
    // Count how many of the tracked clan topics have at least one completion
    var completed = 0;
    var total = CLAN_TOPIC_IDS.length;
    for (var i = 0; i < firestoreDocs.length; i++) {
      var completions = firestoreDocs[i].completions || {};
      if (Object.keys(completions).length > 0) completed++;
    }
    return (
      '<div class="cc-summary">COMMON TOPICS: ' +
        '<span class="cc-summary-count">' + completed + ' / ' + total + '</span>' +
        ' COMPLETED' +
      '</div>'
    );
  }

  function renderPlayerRow(userId, entry, isLast) {
    var prefix    = isLast ? "└── " : "├── ";
    var name      = esc(entry.displayName || userId);
    var status    = (entry.status || "").toLowerCase();
    var proofUrl  = entry.proofUrl || "";

    var barFill, statusTag, statusClass;
    if (status === "completed") {
      barFill     = progressBar(BAR_LEN, BAR_LEN);
      statusTag   = "COMPLETED";
      statusClass = "cc-status-completed";
    } else if (status === "in_progress") {
      // M15: Show empty bar for in_progress — actual progress unknown at clan level.
      barFill     = progressBar(0, BAR_LEN);
      statusTag   = "IN PROGRESS";
      statusClass = "cc-status-inprogress";
    } else {
      barFill     = progressBar(0, BAR_LEN);
      statusTag   = "LOCKED";
      statusClass = "cc-status-locked";
    }

    var proofHtml = "";
    if (status === "completed" && proofUrl) {
      proofHtml =
        '  <a class="cc-proof-link" href="' + esc(proofUrl) + '" target="_blank" rel="noopener">' +
          '[' + esc(proofUrl.replace(/^https?:\/\//, "").substring(0, 40)) + ']' +
        '</a>';
    }

    return (
      '<div class="cc-player-row">' +
        '<span class="cc-tree-prefix">' + prefix + '</span>' +
        '<span class="cc-player-name">' + name + '</span>' +
        '  <span class="cc-bar">' + barFill + '</span>' +
        '  <span class="cc-status ' + statusClass + '">' + statusTag + '</span>' +
        proofHtml +
      '</div>'
    );
  }

  function renderTopicBlock(topicId, firestoreDoc) {
    var def  = topicDef(topicId);
    var name = def ? def.name.toUpperCase() : topicId.replace(/_/g, " ").toUpperCase();

    var completions = (firestoreDoc && firestoreDoc.completions) ? firestoreDoc.completions : {};
    var userIds     = Object.keys(completions);

    var playersHtml = "";
    if (userIds.length === 0) {
      playersHtml = '<div class="cc-no-activity">[ NO ACTIVITY YET ]</div>';
    } else {
      // Sort players: completed first, then in_progress, then others; tie-break by name
      userIds.sort(function (a, b) {
        var order = { completed: 0, in_progress: 1, locked: 2 };
        var sa = (completions[a].status || "").toLowerCase();
        var sb = (completions[b].status || "").toLowerCase();
        var oa = order[sa] !== undefined ? order[sa] : 3;
        var ob = order[sb] !== undefined ? order[sb] : 3;
        if (oa !== ob) return oa - ob;
        var na = (completions[a].displayName || a).toLowerCase();
        var nb = (completions[b].displayName || b).toLowerCase();
        return na < nb ? -1 : na > nb ? 1 : 0;
      });

      for (var i = 0; i < userIds.length; i++) {
        var uid  = userIds[i];
        var isLast = i === userIds.length - 1;
        playersHtml += renderPlayerRow(uid, completions[uid], isLast);
      }
    }

    return (
      '<div class="cc-topic-block">' +
        '<div class="cc-topic-name">TOPIC: ' + name + '</div>' +
        playersHtml +
      '</div>'
    );
  }

  function renderGroup(label, topicIds, topicMap) {
    // Sort topic IDs alphabetically by display name within the group
    var sorted = topicIds.slice().sort(function (a, b) {
      var defA = topicDef(a);
      var defB = topicDef(b);
      var na   = defA ? defA.name.toLowerCase() : a;
      var nb   = defB ? defB.name.toLowerCase() : b;
      return na < nb ? -1 : na > nb ? 1 : 0;
    });

    var topicsHtml = "";
    if (sorted.length === 0) {
      topicsHtml = '<div class="cc-no-activity">[ NO TOPICS IN THIS GROUP ]</div>';
    } else {
      for (var i = 0; i < sorted.length; i++) {
        var id  = sorted[i];
        var doc = topicMap[id] || null;
        topicsHtml += renderTopicBlock(id, doc);
      }
    }

    return (
      '<div class="cc-group">' +
        '<div class="cc-group-label">── ' + label + ' ' + repeatChar('─', Math.max(0, 40 - label.length)) + '</div>' +
        topicsHtml +
      '</div>'
    );
  }

  function repeatChar(ch, n) {
    var s = "";
    for (var i = 0; i < n; i++) s += ch;
    return s;
  }

  // ---------------------------------------------------------------------------
  // Inner render — called from the real-time listener callback (M13)
  // ---------------------------------------------------------------------------

  function _renderClanCapitalContent(container, firestoreDocs, metaLevel) {
    var topicMap         = buildTopicMap(firestoreDocs);
    var totalCompletions = countTotalCompletions(firestoreDocs);
    // C10/M14: prefer authoritative level from meta; fall back to local computation.
    var level = (typeof metaLevel === 'number' && metaLevel >= 1)
      ? metaLevel
      : Math.floor(totalCompletions / COMPLETIONS_PER_LEVEL) + 1;

    // Split clan topic IDs into groups
    var coreCSIds  = [];
    var advDSAIds  = [];

    for (var i = 0; i < CLAN_TOPIC_IDS.length; i++) {
      var id  = CLAN_TOPIC_IDS[i];
      var def = topicDef(id);
      if (def && def.tier === 5) {
        coreCSIds.push(id);
      } else {
        advDSAIds.push(id);
      }
    }

    var html =
      '<div class="cc-root">' +
        renderHeader(level, totalCompletions) +
        renderCommonTopicsSummary(firestoreDocs) +
        renderGroup(GROUP_CORE_CS, coreCSIds, topicMap) +
        renderGroup(GROUP_ADV_DSA, advDSAIds, topicMap) +
      '</div>';

    container.innerHTML = html;

    // C13: Wire up the [ GO TO VILLAGE ] button.
    var villageBtn = container.querySelector('.cc-village-btn');
    if (villageBtn) {
      villageBtn.addEventListener('click', function () {
        var villageTab = document.querySelector('.tab-btn[data-tab="village"]');
        if (villageTab) villageTab.click();
      });
    }
  }

  // ---------------------------------------------------------------------------
  // Main render — sets up real-time listener (M13) and meta fetch (M14)
  // ---------------------------------------------------------------------------

  function renderClanCapital(container) {
    if (!container) return;

    // M13: Tear down any existing listener before re-mounting.
    if (_ccUnsubscribe) { _ccUnsubscribe(); _ccUnsubscribe = null; }

    // Show loading state immediately
    container.innerHTML = '<div class="cc-loading">// LOADING CLAN CAPITAL DATA...</div>';

    // M14: Fetch authoritative level from /clanCapital/meta once at render time.
    // The meta level is used on the first data delivery and kept in closure.
    var _metaLevel = null;

    window.DB.getClanCapitalMeta().then(function (meta) {
      _metaLevel = (meta && typeof meta.level === 'number') ? meta.level : null;
      // If the listener has already delivered data, re-render with the real level.
      // (The listener callback stores the latest docs so we can re-render.)
    }).catch(function () {
      // Meta fetch failed — _metaLevel stays null; local computation used as fallback.
    });

    // Latest docs cache so meta arrival can trigger a re-render.
    var _latestDocs = null;

    // M13: Subscribe to real-time updates.
    _ccUnsubscribe = window.DB.onClanCapitalTopicsChange(function (docs) {
      _latestDocs = docs;
      _renderClanCapitalContent(container, docs, _metaLevel);
    }, function (err) {
      container.innerHTML =
        '<div class="cc-error">// ERROR LOADING CLAN CAPITAL: ' +
        esc(String(err && err.message ? err.message : err)) + '</div>';
    });

    // M14: When meta arrives after the first snapshot, re-render with real level.
    window.DB.getClanCapitalMeta().then(function (meta) {
      _metaLevel = (meta && typeof meta.level === 'number') ? meta.level : null;
      if (_latestDocs !== null) {
        _renderClanCapitalContent(container, _latestDocs, _metaLevel);
      }
    }).catch(function () {
      // Meta unavailable — already using local fallback.
    });
  }

  // ---------------------------------------------------------------------------
  // Expose
  // ---------------------------------------------------------------------------

  window.renderClanCapital = renderClanCapital;

}());
