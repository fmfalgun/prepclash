// village.js — PrepClash Village tab
// Plain browser JS. No ES modules. Depends on window.DB, window.Questions,
// window.TOPICS, window.getUnlockStatus, window.currentUser.

(function () {
  "use strict";

  // -------------------------------------------------------------------------
  // Internal state
  // -------------------------------------------------------------------------

  var _unsubscribe    = null;  // Firestore real-time listener teardown
  var _container      = null;  // last container passed to renderVillage
  var _collapsedTiers = {};    // { tierNum: true } means collapsed
  var _renderGen      = 0;     // M2: generation counter to discard stale renders

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  function buildProgressBar(xpTotal) {
    var xpInLevel = xpTotal % 100;
    var filled    = Math.round(xpInLevel / 10);
    var empty     = 10 - filled;
    return "█".repeat(filled) + "░".repeat(empty);
  }

  function pct(xpTotal) {
    return (xpTotal % 100) + "%";
  }

  // Given an array of topic-status docs from Firestore, return a map:
  // { topicId -> { status, proofUrl, xpValue } }
  function buildStatusMap(userTopics) {
    var map = {};
    for (var i = 0; i < userTopics.length; i++) {
      var t = userTopics[i];
      map[t.id] = t;
    }
    return map;
  }

  // Returns array of completed topic IDs from the status map.
  function completedIds(statusMap) {
    var ids = [];
    for (var id in statusMap) {
      if (statusMap[id].status === "completed") ids.push(id);
    }
    return ids;
  }

  // Escape HTML to prevent XSS in any user-supplied text.
  function esc(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // Group window.TOPICS by tier.
  function groupByTier(topics) {
    var tiers = {};
    for (var i = 0; i < topics.length; i++) {
      var t = topics[i];
      if (!tiers[t.tier]) tiers[t.tier] = [];
      tiers[t.tier].push(t);
    }
    return tiers;
  }

  // Truncate string to maxLen chars, appending "…" if truncated.
  function trunc(str, maxLen) {
    if (!str) return "";
    if (str.length <= maxLen) return str;
    return str.slice(0, maxLen - 1) + "…";
  }

  // Difficulty stars: easy=★, medium=★★, hard=★★★
  function diffStars(diff) {
    var d = (diff || "").toLowerCase();
    if (d === "hard")   return "★★★";
    if (d === "medium") return "★★";
    return "★";
  }

  // Source badge label from source string.
  // Returns { label, cssClass } so the caller can apply the right class.
  function sourceBadgeInfo(src) {
    var s = (src || "").toLowerCase();
    if (s === "leetcode")   return { label: "LC",   cssClass: "source-lc" };
    if (s === "lovebabbar") return { label: "LB",   cssClass: "source-lb" };
    if (s === "codeforces") return { label: "CF",   cssClass: "source-cf" };
    if (s === "a2oj")       return { label: "A2OJ", cssClass: "source-a2oj" };
    return { label: (src || "?").toUpperCase().slice(0, 5), cssClass: "" };
  }

  // Inline color per source (used for border + text where CSS class isn't wired yet).
  // source-cf (#ff6b35) is also declared in style.css.
  function sourceBadgeColor(src) {
    var s = (src || "").toLowerCase();
    if (s === "leetcode")   return "#00bcd4";   // cyan    — source-lc
    if (s === "lovebabbar") return "#f4d03f";   // gold    — source-lb
    if (s === "codeforces") return "#ff6b35";   // CF orange — source-cf
    if (s === "a2oj")       return "#ce93d8";   // magenta-ish
    return "#aaaaaa";
  }

  // -------------------------------------------------------------------------
  // Proof modal
  // -------------------------------------------------------------------------

  function showProofModal(topic, userId) {
    // Remove any existing modal first.
    var existing = document.getElementById("vc-modal-overlay");
    if (existing) existing.parentNode.removeChild(existing);

    var overlay = document.createElement("div");
    overlay.id = "vc-modal-overlay";
    overlay.style.cssText = [
      "position:fixed;top:0;left:0;width:100%;height:100%;",
      "background:rgba(0,0,0,0.82);display:flex;align-items:center;",
      "justify-content:center;z-index:9999;"
    ].join("");

    var modal = document.createElement("div");
    modal.style.cssText = [
      "background:#111111;border:1px solid #1e1e1e;padding:32px;",
      "min-width:360px;max-width:480px;font-family:'JetBrains Mono',monospace;",
      "color:#e0e0e0;"
    ].join("");

    modal.innerHTML = [
      '<div style="color:#00ff41;font-size:11px;letter-spacing:2px;margin-bottom:6px;">',
        "MARK COMPLETE",
      "</div>",
      '<div style="font-size:15px;font-weight:700;margin-bottom:24px;letter-spacing:1px;">',
        esc(topic.name.toUpperCase()),
      "</div>",
      '<label style="display:block;font-size:11px;color:#555555;letter-spacing:1px;margin-bottom:8px;">',
        "PASTE PROOF LINK",
      "</label>",
      '<input id="vc-proof-input" type="url" placeholder="https://github.com/..." ',
        'style="width:100%;box-sizing:border-box;background:#0d0d0d;border:1px solid #1e1e1e;',
        "color:#e0e0e0;font-family:'JetBrains Mono',monospace;font-size:13px;",
        'padding:10px;outline:none;margin-bottom:8px;" />',
      '<div id="vc-proof-error" style="color:#e74c3c;font-size:11px;min-height:16px;margin-bottom:16px;"></div>',
      '<div style="display:flex;gap:12px;">',
        '<button id="vc-confirm-btn" style="',
          "flex:1;background:#00ff41;color:#0d0d0d;border:none;padding:10px;",
          "font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:700;",
          'letter-spacing:1px;cursor:pointer;">CONFIRM COMPLETE</button>',
        '<button id="vc-cancel-btn" style="',
          "flex:0 0 auto;background:transparent;color:#555555;border:1px solid #1e1e1e;",
          "padding:10px 18px;font-family:'JetBrains Mono',monospace;font-size:12px;",
          'cursor:pointer;">CANCEL</button>',
      "</div>"
    ].join("");

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    var proofInput  = document.getElementById("vc-proof-input");
    var proofError  = document.getElementById("vc-proof-error");
    var confirmBtn  = document.getElementById("vc-confirm-btn");
    var cancelBtn   = document.getElementById("vc-cancel-btn");

    proofInput.focus();

    function close() {
      document.body.removeChild(overlay);
    }

    cancelBtn.addEventListener("click", close);
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) close();
    });

    confirmBtn.addEventListener("click", function () {
      var url = proofInput.value.trim();
      if (!url) {
        proofError.textContent = "Proof link is required.";
        return;
      }
      proofError.textContent = "";
      confirmBtn.disabled = true;
      confirmBtn.textContent = "SAVING...";

      window.DB.setTopicStatus(userId, topic.id, {
        status:    "completed",
        proofUrl:  url,
        xpValue:   topic.xp,
        topicName: topic.name,
        tier:      topic.tier
      })
      .then(function () {
        close();
        // C7/C8: Do NOT call renderVillage here. The onUserTopicsChange snapshot
        // listener will fire automatically after the Firestore write and trigger
        // _refreshCards(), which is the single source of truth for UI updates.
      })
      .catch(function (err) {
        proofError.textContent = "Error: " + (err.message || "save failed");
        confirmBtn.disabled = false;
        confirmBtn.textContent = "CONFIRM COMPLETE";
      });
    });
  }

  // -------------------------------------------------------------------------
  // Domain selector (one-time prompt)
  // -------------------------------------------------------------------------

  function buildDomainPrompt(userId, container) {
    var wrap = document.createElement("div");
    wrap.style.cssText = [
      "background:#111111;border:1px solid #1e1e1e;padding:16px 20px;",
      "margin-bottom:24px;font-family:'JetBrains Mono',monospace;"
    ].join("");

    var domains = [
      { key: "cybersec", label: "CYBERSEC" },
      { key: "ai",       label: "AI/ML"    },
      { key: "cs",       label: "CORE CS"  }
    ];

    var label = document.createElement("div");
    label.style.cssText = "font-size:11px;color:#555555;letter-spacing:2px;margin-bottom:12px;";
    label.textContent = "SELECT YOUR DOMAIN:";
    wrap.appendChild(label);

    var btnRow = document.createElement("div");
    btnRow.style.cssText = "display:flex;gap:10px;flex-wrap:wrap;";

    domains.forEach(function (d) {
      var btn = document.createElement("button");
      btn.textContent = d.label;
      btn.className = "domain-btn";
      btn.style.cssText = [
        "background:transparent;border:1px solid #00ff41;color:#00ff41;",
        "font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:700;",
        "letter-spacing:1px;padding:8px 16px;cursor:pointer;"
      ].join("");
      btn.addEventListener("click", function () {
        // M3: Disable all domain buttons while the write is in flight.
        container.querySelectorAll(".domain-btn").forEach(function (b) {
          b.disabled = true;
        });
        window.DB.updateUserProfile(userId, { domain: d.key })
          .then(function () {
            // Re-enable buttons (renderVillage will replace this DOM anyway).
            container.querySelectorAll(".domain-btn").forEach(function (b) {
              b.disabled = false;
            });
            if (_container) renderVillage(_container);
          })
          .catch(function (err) {
            console.error("updateUserProfile (domain) error:", err);
            container.querySelectorAll(".domain-btn").forEach(function (b) {
              b.disabled = false;
            });
          });
      });
      btnRow.appendChild(btn);
    });

    wrap.appendChild(btnRow);
    return wrap;
  }

  // -------------------------------------------------------------------------
  // Question list builder (used inside unlocked/completed cards)
  //
  // questions      — array from window.Questions.getQuestionsForTopic()
  // questionsDone  — { [questionId]: true }  (may be undefined → treat as {})
  // groupStats     — { [questionId]: { totalCompletions, friendsCompleted } }
  // isCompleted    — bool — if true, checkboxes are read-only
  // -------------------------------------------------------------------------

  function buildQuestionList(topic, questions, questionsDone, groupStats, isCompleted, userId) {
    var done  = questionsDone || {};
    var stats = groupStats   || {};

    var wrap = document.createElement("div");
    wrap.style.cssText = "margin-top:10px;";

    if (!questions || questions.length === 0) {
      var none = document.createElement("div");
      none.style.cssText = "font-size:10px;color:#555555;margin-bottom:8px;";
      none.textContent = "No questions defined.";
      wrap.appendChild(none);
      return wrap;
    }

    questions.forEach(function (q) {
      // H14: Use only q.id — never fall back to q.name (would create "undefined" Firestore keys).
      if (!q.id) {
        console.warn("Question missing id, skipping:", q);
        return;
      }
      var qId        = q.id;
      var isDone     = !!done[qId];
      var badgeInfo  = sourceBadgeInfo(q.source);
      var color      = sourceBadgeColor(q.source);
      var stars      = diffStars(q.difficulty);
      var diff       = (q.difficulty || "easy").toLowerCase();
      var name       = trunc(q.name || q.title || "Untitled", 30);
      var qStats     = stats[qId] || {};
      var totalComp  = qStats.totalCompletions || 0;

      var row = document.createElement("div");
      // L7: No border-radius on question rows (terminal aesthetic).
      row.style.cssText = [
        "display:flex;align-items:center;gap:6px;",
        "padding:4px 2px;cursor:pointer;",
        "font-size:11px;letter-spacing:0.5px;",
        "transition:background 0.1s;"
      ].join("");

      row.addEventListener("mouseenter", function () {
        row.style.background = "#1a1a1a";
      });
      row.addEventListener("mouseleave", function () {
        row.style.background = "transparent";
      });

      // Source badge
      var badgeEl = document.createElement("span");
      badgeEl.className = badgeInfo.cssClass;
      badgeEl.style.cssText = [
        "font-size:10px;font-weight:700;padding:1px 4px;",
        "border:1px solid ", color, ";color:", color, ";",
        "flex-shrink:0;min-width:38px;text-align:center;"
      ].join("");
      badgeEl.textContent = badgeInfo.label;
      row.appendChild(badgeEl);

      // Question name
      var nameEl = document.createElement("span");
      nameEl.style.cssText = "flex:1;color:#c0c0c0;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;";
      nameEl.textContent = name;
      row.appendChild(nameEl);

      // Difficulty
      var diffEl = document.createElement("span");
      var diffColor = diff === "hard" ? "#e74c3c" : diff === "medium" ? "#f4d03f" : "#00ff41";
      diffEl.style.cssText = "color:" + diffColor + ";flex-shrink:0;font-size:10px;";
      diffEl.textContent = stars + " " + diff;
      row.appendChild(diffEl);

      // Checkbox
      var cbEl = document.createElement("span");
      cbEl.style.cssText = [
        "flex-shrink:0;width:18px;text-align:center;font-size:12px;",
        isDone ? "color:#00ff41;" : "color:#444444;"
      ].join("");
      cbEl.textContent = isDone ? "[✓]" : "[ ]";
      row.appendChild(cbEl);

      // Friends-solved counter — only shown when totalCompletions > 0
      if (totalComp > 0) {
        var friendsEl = document.createElement("span");
        friendsEl.style.cssText = "flex-shrink:0;font-size:10px;color:#555555;white-space:nowrap;";
        friendsEl.textContent = totalComp + " friend" + (totalComp === 1 ? "" : "s") + " solved";
        row.appendChild(friendsEl);
      }

      // Click on row body (not checkbox) → open URL
      row.addEventListener("click", function (e) {
        // Don't intercept checkbox clicks — those are handled by the checkbox
        if (e.target === cbEl) return;
        if (q.url) {
          window.open(q.url, "_blank", "noopener,noreferrer");
        }
      });

      // Checkbox click → toggle done state
      if (!isCompleted) {
        cbEl.style.cursor = "pointer";
        cbEl.title = isDone ? "Mark undone" : "Mark done";
        // Capture current isDone in closure
        (function (currentState) {
          cbEl.addEventListener("click", function (e) {
            e.stopPropagation();
            // C7/C8: Do NOT call renderVillage here. The snapshot listener
            // (_refreshCards) handles all DOM updates after writes.
            window.DB.markQuestionDone(
              userId, topic.id, qId, !currentState,
              {
                source:       q.source,
                questionName: q.name || q.title || qId,
                displayName:  window.currentUser ? window.currentUser.displayName : ""
              }
            )
            .catch(function (err) {
              console.error("markQuestionDone error:", err);
            });
          });
        }(isDone));
      }

      wrap.appendChild(row);
    });

    return wrap;
  }

  // -------------------------------------------------------------------------
  // Node card builder
  //
  // questions     — array fetched from window.Questions (may be null while loading)
  // questionsDone — { [questionId]: true }
  // groupStats    — { [questionId]: { totalCompletions, ... } }
  // loading       — bool: true while getQuestionsForTopic is still in-flight
  // -------------------------------------------------------------------------

  function buildCard(topic, statusMap, unlockStatus, userId, questions, questionsDone, groupStats, loading) {
    var topicStatus = statusMap[topic.id];
    var status      = topicStatus ? topicStatus.status : "locked";
    var proofUrl    = topicStatus ? topicStatus.proofUrl : "";

    var isUnlocked  = unlockStatus.unlocked.has(topic.id);
    var hint        = unlockStatus.hints[topic.id] || "";

    // Resolve display status:
    // "completed" > "in_progress" > "unlocked" (=available) > "locked"
    var displayStatus;
    if (status === "completed") {
      displayStatus = "completed";
    } else if (status === "in_progress") {
      displayStatus = "in_progress";
    } else if (isUnlocked) {
      displayStatus = "available";
    } else {
      displayStatus = "locked";
    }

    var isLocked    = (displayStatus === "locked");
    var isCompleted = (displayStatus === "completed");
    var showQuestions = !isLocked; // show for available, in_progress, completed

    // Count question progress using the fetched list (may be empty while loading)
    var qList     = questions || [];
    var done      = questionsDone || {};
    var doneCount = 0;
    qList.forEach(function (q) {
      // H14: only use q.id; skip questions without one
      if (!q.id) return;
      if (done[q.id]) doneCount++;
    });

    // Completion threshold: use global default (questions.js may supply a per-topic
    // override via qList.completionThreshold if the module sets it in the future).
    var threshold    = (qList.completionThreshold) || (window.TOPIC_COMPLETION_THRESHOLD || 3);
    var thresholdMet = (doneCount >= threshold) && (qList.length > 0);

    var card = document.createElement("div");

    // Expanded cards need more width to accommodate question rows.
    var cardWidth = showQuestions ? "min-width:320px;max-width:480px;" : "min-width:180px;max-width:220px;";

    card.style.cssText = [
      "background:#111111;border:1px solid ",
      isLocked ? "#1e1e1e" : "#222222",
      ";padding:14px 16px;",
      cardWidth,
      "font-family:'JetBrains Mono',monospace;",
      isLocked ? "opacity:0.5;" : "",
      "flex:0 0 auto;"
    ].join("");

    if (isLocked && hint) {
      card.title = hint;
      card.style.cursor = "default";
    }

    // ---- Header row: name + tier + XP
    var headerRow = document.createElement("div");
    headerRow.style.cssText = "display:flex;align-items:baseline;justify-content:space-between;margin-bottom:6px;";

    var nameEl = document.createElement("div");
    nameEl.style.cssText = [
      "font-size:13px;font-weight:700;letter-spacing:1px;",
      "color:", isLocked ? "#555555" : "#e0e0e0", ";"
    ].join("");
    // L8: No emoji prefixes — the status badge below already communicates lock/progress state.
    nameEl.textContent = topic.name.toUpperCase();
    headerRow.appendChild(nameEl);

    if (!isLocked) {
      var tierXpEl = document.createElement("div");
      tierXpEl.style.cssText = "font-size:10px;color:#555555;letter-spacing:1px;white-space:nowrap;margin-left:8px;";
      tierXpEl.textContent = "TIER " + topic.tier + "  +" + topic.xp + " XP";
      headerRow.appendChild(tierXpEl);
    }

    card.appendChild(headerRow);

    // ---- Status tag
    var tagEl = document.createElement("div");
    tagEl.style.cssText = "font-size:11px;letter-spacing:1px;margin-bottom:8px;";
    if (displayStatus === "completed") {
      tagEl.style.color = "#00ff41";
      tagEl.textContent = "✓ COMPLETED";
    } else if (displayStatus === "in_progress") {
      tagEl.style.color = "#f4d03f";
      tagEl.textContent = "> IN PROGRESS";
    } else if (displayStatus === "available") {
      tagEl.style.color = "#f4d03f";
      tagEl.textContent = "○ AVAILABLE";
    } else {
      tagEl.style.color = "#e74c3c";
      tagEl.textContent = "○ LOCKED";
    }
    card.appendChild(tagEl);

    // ---- Proof URL (completed only)
    if (isCompleted && proofUrl) {
      var proofEl = document.createElement("div");
      proofEl.style.cssText = "font-size:10px;margin-bottom:8px;word-break:break-all;";
      var proofLink = document.createElement("a");
      // H15: Set href via DOM property (not esc()) — the DOM handles encoding correctly.
      proofLink.href = proofUrl;
      proofLink.target = "_blank";
      proofLink.rel = "noopener noreferrer";
      proofLink.style.cssText = "color:#00ff41;text-decoration:none;";
      proofLink.textContent = "PROOF: " + proofUrl;
      proofEl.appendChild(proofLink);
      card.appendChild(proofEl);
    }

    // ---- Unlocks list (locked cards only, keep as-is)
    if (isLocked && topic.unlocks && topic.unlocks.length > 0) {
      var unlocksEl = document.createElement("div");
      unlocksEl.style.cssText = "font-size:10px;color:#555555;margin-bottom:6px;";
      var unlockNames = topic.unlocks.map(function (uid) {
        var t = window.getTopicById ? window.getTopicById(uid) : null;
        return t ? t.name : uid;
      });
      unlocksEl.textContent = "UNLOCKS: " + unlockNames.join(", ");
      card.appendChild(unlocksEl);
    }

    // ---- Unlock hint (locked cards only)
    if (isLocked && hint) {
      var hintEl = document.createElement("div");
      hintEl.style.cssText = "font-size:10px;color:#e74c3c;margin-top:4px;";
      hintEl.textContent = hint;
      card.appendChild(hintEl);
    }

    // ---- Expanded question section (unlocked + completed)
    if (showQuestions) {
      if (loading) {
        // Show placeholder while CF API / questions.js is still fetching
        var loadingEl = document.createElement("div");
        loadingEl.style.cssText = "font-size:10px;color:#555555;letter-spacing:1px;margin-top:8px;padding:6px 0;";
        loadingEl.textContent = "[ LOADING QUESTIONS... ]";
        card.appendChild(loadingEl);
      } else if (qList.length > 0) {
        // Progress line
        var progressEl = document.createElement("div");
        progressEl.style.cssText = "font-size:10px;color:#555555;margin-bottom:6px;letter-spacing:0.5px;";
        var progressText = doneCount + " / " + qList.length + " done";
        if (!isCompleted && threshold > 0) {
          var needed = Math.max(0, threshold - doneCount);
          progressText += needed > 0
            ? "  (need " + needed + " more to unlock completion)"
            : "  (threshold met ✓)";
        }
        progressEl.textContent = progressText;
        card.appendChild(progressEl);

        // Thin divider
        var qDivider = document.createElement("div");
        qDivider.style.cssText = "border-top:1px solid #1a1a1a;margin-bottom:4px;";
        card.appendChild(qDivider);

        // Question rows
        card.appendChild(buildQuestionList(topic, qList, done, groupStats, isCompleted, userId));

        // Thin divider after questions
        var qDivider2 = document.createElement("div");
        qDivider2.style.cssText = "border-top:1px solid #1a1a1a;margin-top:6px;margin-bottom:10px;";
        card.appendChild(qDivider2);
      }
    }

    // ---- "MARK TOPIC COMPLETE" button — only for non-completed unlocked topics
    //      when threshold is met.
    if (!isLocked && !isCompleted && thresholdMet) {
      var completeBtn = document.createElement("button");
      completeBtn.textContent = "MARK TOPIC COMPLETE ✓";
      completeBtn.style.cssText = [
        "width:100%;background:transparent;border:1px solid #00ff41;color:#00ff41;",
        "font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:700;",
        "letter-spacing:1px;padding:8px 0;cursor:pointer;margin-top:4px;"
      ].join("");
      completeBtn.addEventListener("mouseenter", function () {
        completeBtn.style.background = "#00ff4122";
      });
      completeBtn.addEventListener("mouseleave", function () {
        completeBtn.style.background = "transparent";
      });
      completeBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        // C7/C8: Pass only topic + userId — no container needed since we no longer
        // call renderVillage from inside the modal.
        showProofModal(topic, userId);
      });
      card.appendChild(completeBtn);
    }

    // ---- Hover effect for non-locked, non-completed cards (border glow only;
    //      no whole-card click handler anymore — question rows handle their own clicks).
    if (!isLocked && !isCompleted) {
      card.addEventListener("mouseenter", function () {
        card.style.borderColor = "#00ff41";
      });
      card.addEventListener("mouseleave", function () {
        card.style.borderColor = "#222222";
      });
    }

    return card;
  }

  // -------------------------------------------------------------------------
  // _refreshCards — lightweight in-place update triggered by the snapshot.
  //
  // Receives the latest userTopics array from onUserTopicsChange, re-fetches
  // per-question done state for visible topics, then replaces each card's DOM
  // node in-place. Does NOT tear down or re-create the snapshot listener.
  // -------------------------------------------------------------------------

  function _refreshCards(userTopics) {
    if (!_container || !document.body.contains(_container)) {
      // Container gone — clean up listener.
      if (typeof _unsubscribe === "function") { _unsubscribe(); _unsubscribe = null; }
      return;
    }

    var userId = window.currentUser ? window.currentUser.uid : null;
    if (!userId) return;

    var statusMap    = buildStatusMap(userTopics);
    var doneIds      = completedIds(statusMap);
    var unlockStatus = window.getUnlockStatus(doneIds);

    var allTopics     = window.TOPICS || [];
    var visibleTopics = allTopics.filter(function (t) {
      return unlockStatus.unlocked.has(t.id) ||
             (statusMap[t.id] && statusMap[t.id].status === "completed") ||
             (statusMap[t.id] && statusMap[t.id].status === "in_progress");
    });

    var topicDataFetches = visibleTopics.map(function (t) {
      return Promise.all([
        window.Questions.getQuestionsForTopic(t.id, "all"),
        window.DB.getQuestionsDone(userId, t.id)
      ])
      .then(function (pair) {
        return { topicId: t.id, questions: pair[0] || [], done: pair[1] || {} };
      })
      .catch(function (err) {
        // M1: Log fetch errors instead of silently swallowing them.
        console.error("Failed to load topic data for", t.id, err);
        return { topicId: t.id, questions: [], done: {} };
      });
    });

    Promise.all(topicDataFetches).then(function (topicResults) {
      // Guard: if another full renderVillage started while we were fetching, abort.
      if (!_container || !document.body.contains(_container)) return;

      var questionsByTopic = {};
      var questionsDoneMap = {};
      topicResults.forEach(function (r) {
        questionsByTopic[r.topicId] = r.questions;
        questionsDoneMap[r.topicId] = r.done;
      });

      // Walk every card in the container and replace it with a freshly built one.
      // Cards are identified by their data-topic-id attribute set during initial render.
      var allTopicsList = window.TOPICS || [];
      allTopicsList.forEach(function (topic) {
        var oldCard = _container.querySelector('[data-topic-id="' + topic.id + '"]');
        if (!oldCard || !oldCard.parentNode) return;

        var questions     = questionsByTopic[topic.id] || null;
        var questionsDone = questionsDoneMap[topic.id]  || {};

        var newCard = buildCard(topic, statusMap, unlockStatus, userId, questions, questionsDone, {}, false);
        newCard.setAttribute("data-topic-id", topic.id);
        oldCard.parentNode.replaceChild(newCard, oldCard);
      });
    });
  }

  // -------------------------------------------------------------------------
  // Main render function — exposed as window.renderVillage
  // -------------------------------------------------------------------------

  function renderVillage(container) {
    _container = container;

    // M2: Increment generation so any in-flight async callbacks from a previous
    // render call bail out before writing to the DOM.
    var myGen = ++_renderGen;

    var userId = window.currentUser ? window.currentUser.uid : null;

    if (!userId) {
      container.innerHTML = '<div style="color:#e74c3c;font-family:monospace;padding:24px;">ERROR: Not authenticated.</div>';
      return;
    }

    // Show loading state immediately so the UI doesn't sit blank.
    container.innerHTML = '<div style="color:#555555;font-family:\'JetBrains Mono\',monospace;padding:24px;letter-spacing:1px;">LOADING VILLAGE...</div>';

    // Step 1 — Fetch profile and user topic statuses in parallel.
    Promise.all([
      window.DB.getUserProfile(userId),
      window.DB.getUserTopics(userId)
    ])
    .then(function (results) {
      // M2: Stale render guard — another renderVillage call superseded us.
      if (_renderGen !== myGen) return Promise.reject({ _stale: true });

      var profile    = results[0] || {};
      var userTopics = results[1] || [];

      var statusMap    = buildStatusMap(userTopics);
      var doneIds      = completedIds(statusMap);
      var unlockStatus = window.getUnlockStatus(doneIds);

      // -------------------------------------------------------------------
      // Determine which topics should show questions (non-locked).
      // -------------------------------------------------------------------
      var allTopics     = window.TOPICS || [];
      var visibleTopics = allTopics.filter(function (t) {
        return unlockStatus.unlocked.has(t.id) ||
               (statusMap[t.id] && statusMap[t.id].status === "completed") ||
               (statusMap[t.id] && statusMap[t.id].status === "in_progress");
      });

      // -------------------------------------------------------------------
      // Step 1a — For each visible topic, fetch questions (via Questions module)
      // AND the user's per-question done state (via DB) in parallel.
      // -------------------------------------------------------------------
      var topicDataFetches = visibleTopics.map(function (t) {
        return Promise.all([
          window.Questions.getQuestionsForTopic(t.id, "all"),
          window.DB.getQuestionsDone(userId, t.id)
        ])
        .then(function (pair) {
          return { topicId: t.id, questions: pair[0] || [], done: pair[1] || {} };
        })
        .catch(function (err) {
          // M1: Log fetch errors instead of silently swallowing them.
          console.error("Failed to load topic data for", t.id, err);
          return { topicId: t.id, questions: [], done: {} };
        });
      });

      return Promise.all(topicDataFetches).then(function (topicResults) {
        // M2: Guard again after the async question fetch.
        if (_renderGen !== myGen) return Promise.reject({ _stale: true });

        // Build lookup maps
        var questionsByTopic  = {};
        var questionsDoneMap  = {};

        topicResults.forEach(function (r) {
          questionsByTopic[r.topicId] = r.questions;
          questionsDoneMap[r.topicId] = r.done;
        });

        return {
          profile:          profile,
          statusMap:        statusMap,
          unlockStatus:     unlockStatus,
          questionsByTopic: questionsByTopic,
          questionsDoneMap: questionsDoneMap,
          visibleTopics:    visibleTopics
        };
      });
    })
    .then(function (ctx) {
      // M2: ctx is undefined if we returned early above — shouldn't reach here
      // but guard anyway.
      if (!ctx) return;

      var profile          = ctx.profile;
      var statusMap        = ctx.statusMap;
      var unlockStatus     = ctx.unlockStatus;
      var questionsByTopic = ctx.questionsByTopic;
      var questionsDoneMap = ctx.questionsDoneMap;

      var xpTotal     = profile.xpTotal    || 0;
      var villageLvl  = profile.villageLvl || 1;
      var domain      = (profile.domain    || "").toUpperCase();
      var displayName = (profile.displayName || "PLAYER").toUpperCase();

      // Clear container, begin render.
      container.innerHTML = "";
      container.style.fontFamily = "'JetBrains Mono', monospace";
      container.style.color      = "#e0e0e0";

      // ------------------------------------------------------------------
      // Domain selector prompt (if no domain set)
      // ------------------------------------------------------------------
      if (!profile.domain) {
        container.appendChild(buildDomainPrompt(userId, container));
      }

      // ------------------------------------------------------------------
      // Player header
      // ------------------------------------------------------------------
      var header = document.createElement("div");
      header.style.cssText = "margin-bottom:24px;";

      var titleLine = document.createElement("div");
      titleLine.style.cssText = "font-size:18px;font-weight:700;letter-spacing:2px;margin-bottom:4px;color:#e0e0e0;";
      titleLine.textContent = displayName + " // VILLAGE LVL " + villageLvl;
      header.appendChild(titleLine);

      var domainLine = document.createElement("div");
      domainLine.style.cssText = "font-size:12px;color:#555555;letter-spacing:1px;margin-bottom:10px;";
      domainLine.textContent = "DOMAIN: " + (domain || "—") + " | XP: " + xpTotal + " pts";
      header.appendChild(domainLine);

      var bar = document.createElement("div");
      bar.style.cssText = "font-size:13px;color:#00ff41;letter-spacing:1px;";
      bar.textContent = "PROGRESS " + buildProgressBar(xpTotal) + " " + pct(xpTotal);
      header.appendChild(bar);

      container.appendChild(header);

      // Divider
      var divider = document.createElement("div");
      divider.style.cssText = "border-top:1px solid #1e1e1e;margin-bottom:28px;";
      container.appendChild(divider);

      // ------------------------------------------------------------------
      // Tiers — render cards (loading=false since Step 1 is done)
      // ------------------------------------------------------------------
      var tierGroups = groupByTier(window.TOPICS);
      var tierKeys   = Object.keys(tierGroups).map(Number).sort(function (a, b) { return a - b; });

      var TIER_LABELS = window.TIER_LABELS || {
        0: "TIER 0",
        1: "TIER 1",
        2: "TIER 2",
        3: "TIER 3",
        4: "TIER 4",
        5: "CORE CS"
      };

      // Keep a registry of { card, topicId, questionIds } for Step 2 updates.
      var cardRegistry = [];

      // ------------------------------------------------------------------
      // Shared toggle-button base style (applied to each tier toggle and
      // the global COLLAPSE ALL / EXPAND ALL buttons).
      // ------------------------------------------------------------------
      var TOGGLE_BTN_CSS = [
        "background:transparent;border:1px solid #1e1e1e;color:#555555;",
        "font-family:'JetBrains Mono',monospace;font-size:11px;",
        "padding:2px 8px;cursor:pointer;"
      ].join("");

      function applyToggleBtnHover(btn) {
        btn.addEventListener("mouseenter", function () {
          btn.style.borderColor = "#00ff41";
          btn.style.color       = "#00ff41";
        });
        btn.addEventListener("mouseleave", function () {
          btn.style.borderColor = "#1e1e1e";
          btn.style.color       = "#555555";
        });
      }

      // ------------------------------------------------------------------
      // COLLAPSE ALL / EXPAND ALL — rendered once above the first tier
      // ------------------------------------------------------------------
      // We collect row and toggle-button references as we build each tier so
      // the global buttons can reach them. Built up in the loop below.
      var allTierRows       = {}; // { tierNum: rowEl }
      var allTierToggleBtns = {}; // { tierNum: toggleBtnEl }

      var globalCtrl = document.createElement("div");
      globalCtrl.style.cssText = "display:flex;gap:8px;margin-bottom:20px;";

      var collapseAllBtn = document.createElement("button");
      collapseAllBtn.textContent = "COLLAPSE ALL";
      collapseAllBtn.style.cssText = TOGGLE_BTN_CSS;
      applyToggleBtnHover(collapseAllBtn);

      var expandAllBtn = document.createElement("button");
      expandAllBtn.textContent = "EXPAND ALL";
      expandAllBtn.style.cssText = TOGGLE_BTN_CSS;
      applyToggleBtnHover(expandAllBtn);

      globalCtrl.appendChild(collapseAllBtn);
      globalCtrl.appendChild(expandAllBtn);
      container.appendChild(globalCtrl);

      tierKeys.forEach(function (tierNum) {
        var topics  = tierGroups[tierNum];
        var label   = TIER_LABELS[tierNum] || ("TIER " + tierNum);

        // Cards row — built first so the tier header toggle can reference it.
        var row = document.createElement("div");
        row.style.cssText = "display:flex;flex-wrap:wrap;gap:12px;margin-bottom:32px;";

        // Restore collapsed state from previous render within this session.
        if (_collapsedTiers[tierNum]) {
          row.style.display = "none";
        }

        // Track row for global collapse/expand buttons.
        allTierRows[tierNum] = row;

        // ---- Tier header
        var tierHeader = document.createElement("div");
        tierHeader.style.cssText = [
          "font-size:11px;letter-spacing:3px;color:#555555;",
          "margin-bottom:14px;display:flex;align-items:center;gap:12px;"
        ].join("");

        var tierLabel = document.createElement("span");
        tierLabel.textContent = "── " + label + " ";
        tierHeader.appendChild(tierLabel);

        var tierRule = document.createElement("span");
        tierRule.style.cssText = "flex:1;border-top:1px solid #1e1e1e;display:inline-block;";
        tierHeader.appendChild(tierRule);

        // Per-tier collapse toggle button
        var toggleBtn = document.createElement("button");
        toggleBtn.textContent = _collapsedTiers[tierNum] ? "[+]" : "[−]";
        toggleBtn.style.cssText = TOGGLE_BTN_CSS;
        applyToggleBtnHover(toggleBtn);

        (function (tn, r, btn) {
          btn.addEventListener("click", function () {
            _collapsedTiers[tn] = !_collapsedTiers[tn];
            r.style.display = _collapsedTiers[tn] ? "none" : "flex";
            btn.textContent = _collapsedTiers[tn] ? "[+]" : "[−]";
          });
        }(tierNum, row, toggleBtn));

        allTierToggleBtns[tierNum] = toggleBtn;
        tierHeader.appendChild(toggleBtn);
        container.appendChild(tierHeader);

        // ---- Cards
        topics.forEach(function (topic) {
          var questions     = questionsByTopic[topic.id] || null;
          var questionsDone = questionsDoneMap[topic.id] || {};
          // loading=false — all question data arrived before we rendered
          var card = buildCard(topic, statusMap, unlockStatus, userId, questions, questionsDone, {}, false);
          // Tag each card with its topic id so _refreshCards can find it by query.
          card.setAttribute("data-topic-id", topic.id);
          row.appendChild(card);

          // Register for Step 2 group-stats update (visible topics only)
          if (questions && questions.length > 0) {
            // H14: only use q.id; filter out any questions without one.
            var qIds = questions.reduce(function (acc, q) {
              if (q.id) { acc.push(q.id); }
              return acc;
            }, []);
            cardRegistry.push({ card: card, topic: topic, questions: questions, questionsDone: questionsDone, questionIds: qIds });
          }
        });

        container.appendChild(row);
      });

      // ------------------------------------------------------------------
      // Wire up COLLAPSE ALL / EXPAND ALL now that allTierRows is populated.
      // ------------------------------------------------------------------
      collapseAllBtn.addEventListener("click", function () {
        tierKeys.forEach(function (tn) {
          _collapsedTiers[tn] = true;
          if (allTierRows[tn])       allTierRows[tn].style.display = "none";
          if (allTierToggleBtns[tn]) allTierToggleBtns[tn].textContent = "[+]";
        });
      });

      expandAllBtn.addEventListener("click", function () {
        tierKeys.forEach(function (tn) {
          _collapsedTiers[tn] = false;
          if (allTierRows[tn])       allTierRows[tn].style.display = "flex";
          if (allTierToggleBtns[tn]) allTierToggleBtns[tn].textContent = "[−]";
        });
      });

      // ------------------------------------------------------------------
      // Step 2 — Async group stats fetch and per-question "friends solved"
      // label update. Runs after cards are in the DOM so the UI is
      // immediately usable while stats load in the background.
      // ------------------------------------------------------------------
      if (cardRegistry.length > 0 && window.Questions && window.Questions.getQuestionGroupStats) {
        // Collect all question IDs across all visible topic cards.
        var allQIds = [];
        cardRegistry.forEach(function (entry) {
          allQIds = allQIds.concat(entry.questionIds);
        });

        window.Questions.getQuestionGroupStats(allQIds)
          .then(function (groupStats) {
            // M2: Bail if a newer render has replaced our DOM.
            if (_renderGen !== myGen) return;
            if (!groupStats) return;

            // Re-render each registered card in-place with updated group stats.
            cardRegistry.forEach(function (entry) {
              var parent = entry.card.parentNode;
              if (!parent) return; // card was removed from DOM

              var newCard = buildCard(
                entry.topic,
                statusMap,
                unlockStatus,
                userId,
                entry.questions,
                entry.questionsDone,
                groupStats,
                false
              );
              newCard.setAttribute("data-topic-id", entry.topic.id);
              parent.replaceChild(newCard, entry.card);
              entry.card = newCard; // update registry ref
            });
          })
          .catch(function (err) {
            console.warn("getQuestionGroupStats error (non-fatal):", err);
          });
      }

      // ------------------------------------------------------------------
      // C7/C8: Set up real-time listener ONCE per renderVillage call.
      // The callback calls _refreshCards (lightweight, no new listener),
      // never renderVillage.  The _skipFirst flag avoids re-rendering the
      // same data that was just fetched synchronously in Step 1 above.
      // ------------------------------------------------------------------
      if (_unsubscribe) {
        _unsubscribe();
        _unsubscribe = null;
      }

      var _skipFirst = true;
      _unsubscribe = window.DB.onUserTopicsChange(userId, function (freshTopics) {
        if (_skipFirst) { _skipFirst = false; return; }
        _refreshCards(freshTopics);
      });
    })
    .catch(function (err) {
      // Swallow the sentinel we throw for stale renders.
      if (err && err._stale) return;
      container.innerHTML = [
        '<div style="color:#e74c3c;font-family:\'JetBrains Mono\',monospace;padding:24px;">',
          "ERROR: " + esc(err.message || "Failed to load village data."),
        "</div>"
      ].join("");
    });
  }

  // -------------------------------------------------------------------------
  // Expose on window
  // -------------------------------------------------------------------------

  window.renderVillage = renderVillage;

  // M5: Teardown — called when navigating away from the Village tab.
  window.destroyVillage = function () {
    if (typeof _unsubscribe === "function") { _unsubscribe(); _unsubscribe = null; }
  };

}());
