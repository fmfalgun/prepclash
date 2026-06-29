// home.js — PrepClash HOME tab
// Plain browser JS, no ES modules. Exposes window.renderHome(container).
// Depends on: window.DB, window.TOPICS, window.currentUser, window.TIER_LABELS

(function () {
  'use strict';

  // M11 — render generation guard: prevents a stale slow render from
  // overwriting a faster second render triggered by rapid tab switching.
  var _homeRenderGen = 0;

  // ---------------------------------------------------------------------------
  // Constants / palette
  // ---------------------------------------------------------------------------

  var C = {
    bg:      '#0d0d0d',
    surface: '#111111',
    border:  '#1e1e1e',
    green:   '#00ff41',
    gold:    '#f4d03f',
    red:     '#e74c3c',
    muted:   '#555555',
    text:    '#e0e0e0',
    font:    "'JetBrains Mono', 'Courier New', Courier, monospace"
  };

  // Tiers to show (0-4 = DSA tiers, 5 = CORE CS)
  var TIERS = [0, 1, 2, 3, 4, 5];

  // ---------------------------------------------------------------------------
  // Radar stat definitions
  // ---------------------------------------------------------------------------

  var STATS = [
    { key: 'ALGORITHM',   label: 'ALGORITHM',   angle: -90  },
    { key: 'DIFFICULTY',  label: 'DIFFICULTY',  angle: -30  },
    { key: 'DOMAIN',      label: 'DOMAIN',      angle: 30   },
    { key: 'DESIGN',      label: 'DESIGN',      angle: 90   },
    { key: 'FOUNDATIONS', label: 'FOUNDATIONS', angle: 150  },
    { key: 'CONSISTENCY', label: 'CONSISTENCY', angle: -150 }
  ];

  // ---------------------------------------------------------------------------
  // Grade helpers
  // ---------------------------------------------------------------------------

  function toGrade(score) {
    if (score >= 90) return 'S';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B';
    if (score >= 60) return 'C';
    if (score >= 50) return 'D';
    if (score >= 40) return 'E';
    if (score >= 30) return 'F';
    return 'G';
  }

  function gradeColor(grade) {
    if (grade === 'S')             return C.gold;
    if (grade === 'A' || grade === 'B') return C.green;
    if (grade === 'C' || grade === 'D') return C.gold;
    return C.red;  // E F G
  }

  // ---------------------------------------------------------------------------
  // Radar stat computation
  // ---------------------------------------------------------------------------

  function computeRadarScores(userTopics, xpThisWeek, xpTotal) {
    var TOPICS = window.TOPICS || [];

    var completedSet = new Set();
    if (userTopics && userTopics.length) {
      userTopics.forEach(function (ut) {
        if (ut.status === 'completed') completedSet.add(ut.id);
      });
    }

    // ALGORITHM — Tier 0, 1, 2
    var dsa_basic = TOPICS.filter(function (t) { return [0, 1, 2].indexOf(t.tier) !== -1; });
    var ALGORITHM = dsa_basic.length > 0
      ? (dsa_basic.filter(function (t) { return completedSet.has(t.id); }).length / dsa_basic.length) * 100
      : 0;

    // DIFFICULTY — Tier 3, 4
    var dsa_hard = TOPICS.filter(function (t) { return [3, 4].indexOf(t.tier) !== -1; });
    var DIFFICULTY = dsa_hard.length > 0
      ? (dsa_hard.filter(function (t) { return completedSet.has(t.id); }).length / dsa_hard.length) * 100
      : 0;

    // FOUNDATIONS — Core CS fundamentals
    // system_design is scored under DESIGN, not FOUNDATIONS
    var foundations_ids = ['operating_systems', 'dbms', 'computer_networks', 'oop'];
    var FOUNDATIONS = (foundations_ids.filter(function (id) { return completedSet.has(id); }).length / foundations_ids.length) * 100;

    // DESIGN — architecture thinking (H8: advanced_graphs removed — it is a
    // Tier 4 DSA topic already counted in the DIFFICULTY axis)
    var design_ids = ['system_design'];
    var DESIGN = (design_ids.filter(function (id) { return completedSet.has(id); }).length / design_ids.length) * 100;

    // CONSISTENCY — activity this week (200 XP/week = 100%; ~4–8 topics/week)
    var CONSISTENCY = Math.min(((xpThisWeek || 0) / 200) * 100, 100);

    // DOMAIN — overall XP progress (500 XP = 100)
    var DOMAIN = Math.min(((xpTotal || 0) / 500) * 100, 100);

    return {
      ALGORITHM:   Math.round(ALGORITHM),
      DIFFICULTY:  Math.round(DIFFICULTY),
      DOMAIN:      Math.round(DOMAIN),
      DESIGN:      Math.round(DESIGN),
      FOUNDATIONS: Math.round(FOUNDATIONS),
      CONSISTENCY: Math.round(CONSISTENCY)
    };
  }

  // ---------------------------------------------------------------------------
  // Utility helpers
  // ---------------------------------------------------------------------------

  function el(tag, styles, attrs) {
    var node = document.createElement(tag);
    if (styles) {
      Object.keys(styles).forEach(function (k) {
        node.style[k] = styles[k];
      });
    }
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (k === 'textContent') {
          node.textContent = attrs[k];
        } else {
          node.setAttribute(k, attrs[k]);
        }
      });
    }
    return node;
  }

  function txt(content) {
    return document.createTextNode(content);
  }

  // Block-character progress bar — 10 chars wide
  function progressBar(done, total, width) {
    width = width || 10;
    var pct = total > 0 ? done / total : 0;
    var filled = Math.round(pct * width);
    var empty  = width - filled;
    var bar = '';
    for (var i = 0; i < filled; i++) bar += '█';
    for (var j = 0; j < empty;  j++) bar += '░';
    return bar;
  }

  // Score to 10-char progress bar
  function scoreBar(score) {
    var filled = Math.round((score / 100) * 10);
    var empty  = 10 - filled;
    var bar = '';
    for (var i = 0; i < filled; i++) bar += '█';
    for (var j = 0; j < empty;  j++) bar += '░';
    return bar;
  }

  // Compute per-tier stats from TOPICS + userTopics array
  function computeTierStats(userTopics) {
    var completedSet = {};
    if (userTopics && userTopics.length) {
      userTopics.forEach(function (ut) {
        if (ut.status === 'completed') {
          completedSet[ut.id] = true;
        }
      });
    }

    var stats = {};
    TIERS.forEach(function (tier) {
      stats[tier] = { done: 0, total: 0 };
    });

    var topics = window.TOPICS || [];
    topics.forEach(function (topic) {
      var tier = topic.tier;
      if (stats[tier] === undefined) return;
      stats[tier].total++;
      if (completedSet[topic.id]) {
        stats[tier].done++;
      }
    });

    return stats;
  }

  // Get avatar initials from displayName (first 2 chars, uppercase)
  function getAvatar(displayName) {
    var name = (displayName || 'PL').trim();
    return name.substring(0, 2).toUpperCase();
  }

  // ---------------------------------------------------------------------------
  // Section 1: HOW TO USE (terminal-style, collapsible)
  // ---------------------------------------------------------------------------

  function buildGuide() {
    var wrapper = el('div', {
      marginBottom: '1.5rem',
      border: '1px solid ' + C.border,
      background: C.surface,
      fontFamily: C.font
    });

    var header = el('div', {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0.6rem 1rem',
      borderBottom: '1px solid ' + C.border,
      cursor: 'pointer',
      userSelect: 'none'
    });

    var title = el('span', {
      fontSize: '0.72rem',
      fontWeight: '700',
      letterSpacing: '0.18em',
      textTransform: 'uppercase',
      color: C.green
    });
    title.textContent = '── HOW TO USE PREPCLASH ───────────────────────────────';

    var toggleBtn = el('button', {
      background: 'transparent',
      border: '1px solid ' + C.border,
      color: C.muted,
      fontFamily: C.font,
      fontSize: '0.65rem',
      fontWeight: '700',
      letterSpacing: '0.12em',
      padding: '0.2rem 0.6rem',
      cursor: 'pointer',
      textTransform: 'uppercase',
      whiteSpace: 'nowrap'
    });
    toggleBtn.textContent = '▼ HIDE GUIDE';

    header.appendChild(title);
    header.appendChild(toggleBtn);

    var body = el('div', {
      padding: '0.75rem 1rem 1rem 1rem'
    });

    var steps = [
      ['01', 'LOGIN WITH GOOGLE', 'your account is created automatically'],
      ['02', 'SELECT YOUR DOMAIN', 'CHOOSE YOUR DOMAIN in the Village tab to specialise your learning path'],
      ['03', 'OPEN YOUR VILLAGE', 'your personal skill tree'],
      ['04', 'UNLOCK TOPICS', 'complete prereqs to unlock next tier'],
      ['05', 'SOLVE QUESTIONS', 'LB and Codeforces problems per topic'],
      ['06', 'MARK COMPLETE', 'paste a proof link to earn XP'],
      ['07', 'CLAN CAPITAL', 'see how your friends are doing'],
      ['08', 'LEADERBOARD', 'compete on XP rankings']
    ];

    steps.forEach(function (step) {
      var row = el('div', {
        display: 'flex',
        alignItems: 'baseline',
        gap: '0.75rem',
        marginBottom: '0.35rem',
        fontSize: '0.75rem',
        lineHeight: '1.6'
      });

      var num = el('span', {
        color: C.green,
        fontWeight: '700',
        flexShrink: '0',
        width: '2.2rem'
      });
      num.textContent = '[' + step[0] + ']';

      var label = el('span', {
        color: C.text,
        fontWeight: '700',
        letterSpacing: '0.08em',
        flexShrink: '0',
        minWidth: '10rem'
      });
      label.textContent = step[1];

      var desc = el('span', {
        color: C.muted,
        fontSize: '0.68rem',
        letterSpacing: '0.04em'
      });
      desc.textContent = '— ' + step[2];

      row.appendChild(num);
      row.appendChild(label);
      row.appendChild(desc);
      body.appendChild(row);
    });

    wrapper.appendChild(header);
    wrapper.appendChild(body);

    var collapsed = false;
    function toggleGuide() {
      collapsed = !collapsed;
      body.style.display = collapsed ? 'none' : 'block';
      toggleBtn.textContent = collapsed ? '► SHOW GUIDE' : '▼ HIDE GUIDE';
      header.style.borderBottom = collapsed ? 'none' : '1px solid ' + C.border;
    }

    header.addEventListener('click', toggleGuide);
    toggleBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      toggleGuide();
    });

    return wrapper;
  }

  // ---------------------------------------------------------------------------
  // Section 2a: Player Stat Card
  // ---------------------------------------------------------------------------

  function buildStatCard(profile, rank, tierStats, totalTopics, doneTopics) {
    var displayName = (profile && profile.displayName) ? profile.displayName.toUpperCase() : 'PLAYER';
    var domain      = (profile && profile.domain)      ? profile.domain.toUpperCase()      : '—';
    var xpTotal     = (profile && profile.xpTotal  != null) ? profile.xpTotal  : 0;
    var xpWeek      = (profile && profile.xpThisWeek != null) ? profile.xpThisWeek : 0;
    var villageLvl  = (profile && profile.villageLvl != null) ? profile.villageLvl : 1;
    var avatar      = getAvatar(profile ? profile.displayName : '');

    var card = el('div', {
      background: C.surface,
      border: '1px solid ' + C.border,
      fontFamily: C.font,
      padding: '0',
      flex: '1',
      minWidth: '0'
    });

    // ── TOP ROW: avatar + name + rank ──
    var topRow = el('div', {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0.75rem 1rem',
      borderBottom: '1px solid ' + C.border,
      gap: '0.75rem'
    });

    var avatarBox = el('div', {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '2.2rem',
      height: '2.2rem',
      border: '1px solid ' + C.green,
      color: C.green,
      fontWeight: '700',
      fontSize: '0.85rem',
      letterSpacing: '0.04em',
      flexShrink: '0',
      background: 'rgba(0,255,65,0.05)'
    });
    avatarBox.textContent = avatar;

    var nameBlock = el('div', { flex: '1', minWidth: '0' });
    var nameEl = el('div', {
      fontSize: '0.9rem',
      fontWeight: '700',
      letterSpacing: '0.1em',
      color: C.text,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    });
    nameEl.textContent = displayName;
    var metaEl = el('div', {
      fontSize: '0.65rem',
      color: C.muted,
      letterSpacing: '0.1em',
      marginTop: '0.1rem'
    });
    metaEl.textContent = 'DOMAIN: ' + domain + '    VILLAGE LVL: ' + villageLvl;
    nameBlock.appendChild(nameEl);
    nameBlock.appendChild(metaEl);

    var rankEl = el('div', {
      fontSize: '0.78rem',
      fontWeight: '700',
      color: rank === 1 ? C.gold : (rank !== null ? C.green : C.muted),
      letterSpacing: '0.1em',
      flexShrink: '0',
      textAlign: 'right'
    });
    // H10: show N/A for users not yet on the leaderboard
    rankEl.textContent = rank !== null ? 'RANK: #' + rank : 'RANK: N/A';

    topRow.appendChild(avatarBox);
    topRow.appendChild(nameBlock);
    topRow.appendChild(rankEl);
    card.appendChild(topRow);

    // ── STATS ROW: XP / WEEK / TOPICS ──
    var statsRow = el('div', {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 1fr',
      borderBottom: '1px solid ' + C.border
    });

    function statCell(label, value, color, sub) {
      var cell = el('div', {
        padding: '0.7rem 1rem',
        borderRight: '1px solid ' + C.border
      });
      var lbl = el('div', {
        fontSize: '0.6rem',
        fontWeight: '700',
        letterSpacing: '0.15em',
        color: C.muted,
        textTransform: 'uppercase',
        marginBottom: '0.25rem'
      });
      lbl.textContent = label;
      var val = el('div', {
        fontSize: '1.5rem',
        fontWeight: '700',
        color: color || C.text,
        lineHeight: '1.1'
      });
      val.textContent = value;
      cell.appendChild(lbl);
      cell.appendChild(val);
      if (sub) {
        var subEl = el('div', {
          fontSize: '0.6rem',
          color: C.muted,
          marginTop: '0.1rem',
          letterSpacing: '0.05em'
        });
        subEl.textContent = sub;
        cell.appendChild(subEl);
      }
      return cell;
    }

    var xpCell    = statCell('TOTAL XP',    xpTotal, C.gold);
    var weekXpStr = xpWeek > 0 ? '+' + xpWeek : String(xpWeek);
    var weekCell  = statCell('THIS WEEK',   weekXpStr, xpWeek > 0 ? C.green : C.muted);
    var topicCell = statCell('TOPICS DONE', doneTopics + ' / ' + totalTopics, C.text);

    topicCell.style.borderRight = 'none';

    statsRow.appendChild(xpCell);
    statsRow.appendChild(weekCell);
    statsRow.appendChild(topicCell);
    card.appendChild(statsRow);

    // ── TIER COVERAGE ──
    var coverageSection = el('div', { padding: '0.75rem 1rem' });
    var coverageTitle = el('div', {
      fontSize: '0.62rem',
      fontWeight: '700',
      letterSpacing: '0.18em',
      color: C.muted,
      textTransform: 'uppercase',
      marginBottom: '0.5rem'
    });
    coverageTitle.textContent = 'TIER COVERAGE';
    coverageSection.appendChild(coverageTitle);

    var tierLabels = window.TIER_LABELS || { 0: 'TIER 0', 1: 'TIER 1', 2: 'TIER 2', 3: 'TIER 3', 4: 'TIER 4', 5: 'CORE CS' };

    TIERS.forEach(function (tier) {
      var ts    = tierStats[tier] || { done: 0, total: 0 };
      var pct   = ts.total > 0 ? Math.round((ts.done / ts.total) * 100) : 0;
      var bar   = progressBar(ts.done, ts.total, 10);
      var label = tierLabels[tier] || ('TIER ' + tier);

      var row = el('div', {
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        marginBottom: '0.3rem',
        fontSize: '0.72rem',
        lineHeight: '1.4'
      });

      var tierLabel = el('span', {
        color: C.muted,
        letterSpacing: '0.08em',
        width: '5.5rem',
        flexShrink: '0'
      });
      tierLabel.textContent = label;

      var barEl = el('span', {
        fontFamily: C.font,
        letterSpacing: '0.02em',
        color: pct === 0 ? C.border : C.green,
        flexShrink: '0'
      });
      barEl.textContent = bar;

      var countEl = el('span', {
        color: C.muted,
        fontSize: '0.65rem',
        flexShrink: '0'
      });
      countEl.textContent = ts.done + '/' + ts.total;

      var pctEl = el('span', {
        color: pct === 100 ? C.gold : (pct === 0 ? C.border : C.green),
        fontWeight: '700',
        fontSize: '0.65rem',
        flexShrink: '0',
        marginLeft: 'auto'
      });
      pctEl.textContent = pct + '%';

      row.appendChild(tierLabel);
      row.appendChild(barEl);
      row.appendChild(countEl);
      row.appendChild(pctEl);
      coverageSection.appendChild(row);
    });

    card.appendChild(coverageSection);
    return card;
  }

  // ---------------------------------------------------------------------------
  // Section 2b: Radar Chart — Blue Lock aesthetic (Canvas) + Grade System
  // ---------------------------------------------------------------------------

  function buildRadarSection(scores) {
    // ----- Canvas -----
    var SIZE = 340;  // C12: increased from 320 to give labels breathing room
    var canvas = document.createElement('canvas');
    canvas.width  = SIZE;
    canvas.height = SIZE;
    canvas.style.display = 'block';
    canvas.style.flexShrink = '0';

    var ctx = canvas.getContext('2d');
    var cx  = SIZE / 2;   // 160
    var cy  = SIZE / 2;   // 160
    var R   = 120;        // outer hex radius

    // Convert degrees to radians
    function deg2rad(d) { return d * Math.PI / 180; }

    // Point from center along an angle (degrees) at distance r
    function anglePoint(angleDeg, r) {
      var a = deg2rad(angleDeg);
      return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r };
    }

    ctx.clearRect(0, 0, SIZE, SIZE);

    // -- Layer 1: Outer tick ring --
    // M20: moved ring to r=152 (thin 4px band) so it sits outside label zone
    // (labels now at r=125 after C12 fix, hex outer vertex at R=120)
    ctx.beginPath();
    ctx.arc(cx, cy, 152, 0, Math.PI * 2);
    ctx.strokeStyle = '#1e1e1e';
    ctx.lineWidth = 4;
    ctx.stroke();

    var totalTicks = 60;
    for (var t = 0; t < totalTicks; t++) {
      var tickAngle = (t / totalTicks) * 360;
      var isMajor = (t % 10 === 0);
      var innerR  = isMajor ? 148 : 150;
      var outerR  = 156;
      ctx.globalAlpha = isMajor ? 1.0 : 0.4;
      ctx.beginPath();
      var pInner = anglePoint(tickAngle, innerR);
      var pOuter = anglePoint(tickAngle, outerR);
      ctx.moveTo(pOuter.x, pOuter.y);
      ctx.lineTo(pInner.x, pInner.y);
      ctx.strokeStyle = '#00ff41';
      ctx.lineWidth = isMajor ? 1.5 : 1;
      ctx.stroke();
    }
    ctx.globalAlpha = 1.0;

    // -- Layer 2: Grid hexagon rings at 33%, 66%, 100% --
    [0.3333, 0.6666, 1.0].forEach(function (frac) {
      ctx.beginPath();
      STATS.forEach(function (stat, i) {
        var p = anglePoint(stat.angle, frac * R);
        if (i === 0) ctx.moveTo(p.x, p.y);
        else         ctx.lineTo(p.x, p.y);
      });
      ctx.closePath();
      ctx.strokeStyle = '#1e1e1e';
      ctx.lineWidth   = 1;
      ctx.stroke();
    });

    // -- Layer 3: Axis lines center -> vertex --
    STATS.forEach(function (stat) {
      var outer = anglePoint(stat.angle, R);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(outer.x, outer.y);
      ctx.strokeStyle = '#1e1e1e';
      ctx.lineWidth   = 1;
      ctx.stroke();
    });

    // -- Layer 4: Player polygon --
    ctx.beginPath();
    STATS.forEach(function (stat, i) {
      var frac = scores[stat.key] / 100;
      var r    = Math.max(0.02, frac) * R;
      var p    = anglePoint(stat.angle, r);
      if (i === 0) ctx.moveTo(p.x, p.y);
      else         ctx.lineTo(p.x, p.y);
    });
    ctx.closePath();
    ctx.fillStyle = 'rgba(0,255,65,0.15)';
    ctx.fill();
    ctx.shadowColor = '#00ff41';
    ctx.shadowBlur  = 8;
    ctx.strokeStyle = '#00ff41';
    ctx.lineWidth   = 2;
    ctx.stroke();
    ctx.shadowBlur  = 0;

    // -- Layer 5: Score dots --
    STATS.forEach(function (stat) {
      var frac = scores[stat.key] / 100;
      var r    = Math.max(0.02, frac) * R;
      var p    = anglePoint(stat.angle, r);
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#00ff41';
      ctx.fill();
    });

    // -- Layer 6: Axis labels --
    // C12: label radius reduced from 155 to 125 so top/bottom labels stay
    // on-screen. At r=125: top label y=170-125=45, bottom label y=170+125=295.
    STATS.forEach(function (stat) {
      var p     = anglePoint(stat.angle, 125);
      var grade = toGrade(scores[stat.key]);

      ctx.font         = "700 10px 'JetBrains Mono', 'Courier New', monospace";
      ctx.fillStyle    = '#e0e0e0';
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(stat.label, p.x, p.y - 7);

      ctx.font      = "700 14px 'JetBrains Mono', 'Courier New', monospace";
      ctx.fillStyle = '#00ff41';
      ctx.fillText(grade, p.x, p.y + 8);
    });

    // -- Center text: avg score + overall grade --
    var total = 0;
    STATS.forEach(function (s) { total += scores[s.key]; });
    var avgScore  = Math.round(total / STATS.length);
    var avgGrade  = toGrade(avgScore);

    ctx.font         = "700 28px 'JetBrains Mono', 'Courier New', monospace";
    ctx.fillStyle    = '#00ff41';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(avgScore), cx, cy - 14);

    ctx.font      = "700 16px 'JetBrains Mono', 'Courier New', monospace";
    ctx.fillStyle = C.gold;
    ctx.fillText(avgGrade, cx, cy + 14);

    // ----- Stat breakdown list -----
    var breakdown = el('div', {
      display: 'flex',
      flexDirection: 'column',
      gap: '0.35rem',
      fontFamily: C.font,
      justifyContent: 'center'
    });

    // Section label
    var bkLabel = el('div', {
      fontSize: '0.6rem',
      fontWeight: '700',
      letterSpacing: '0.18em',
      color: C.muted,
      textTransform: 'uppercase',
      marginBottom: '0.4rem'
    });
    bkLabel.textContent = 'STAT BREAKDOWN';
    breakdown.appendChild(bkLabel);

    STATS.forEach(function (stat) {
      var score = scores[stat.key];
      var grade = toGrade(score);
      var bar   = scoreBar(score);
      var gCol  = gradeColor(grade);

      var row = el('div', {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        fontSize: '0.7rem',
        whiteSpace: 'nowrap'
      });

      var nameSpan = el('span', {
        color: C.muted,
        letterSpacing: '0.06em',
        width: '6.8rem',
        flexShrink: '0',
        fontSize: '0.65rem'
      });
      nameSpan.textContent = stat.label;

      var barSpan = el('span', {
        color: C.gold,
        letterSpacing: '0.02em',
        flexShrink: '0'
      });
      barSpan.textContent = bar;

      var pctSpan = el('span', {
        color: C.text,
        fontWeight: '700',
        width: '3rem',
        textAlign: 'right',
        flexShrink: '0',
        fontSize: '0.65rem'
      });
      pctSpan.textContent = score + '%';

      var gradeSpan = el('span', {
        color: gCol,
        fontWeight: '700',
        flexShrink: '0',
        fontSize: '0.72rem'
      });
      gradeSpan.textContent = '[' + grade + ']';

      row.appendChild(nameSpan);
      row.appendChild(barSpan);
      row.appendChild(pctSpan);
      row.appendChild(gradeSpan);
      breakdown.appendChild(row);
    });

    // ----- Grade legend -----
    var legendWrap = el('div', {
      marginTop: '1rem',
      fontFamily: C.font
    });

    var legendTitle = el('div', {
      fontSize: '0.58rem',
      fontWeight: '700',
      letterSpacing: '0.18em',
      color: C.muted,
      textTransform: 'uppercase',
      marginBottom: '0.4rem'
    });
    legendTitle.textContent = 'GRADE SYSTEM';
    legendWrap.appendChild(legendTitle);

    var legendRows = [
      [ { g: 'S', range: '90-100' }, { g: 'A', range: '80-89' }, { g: 'B', range: '70-79' }, { g: 'C', range: '60-69' } ],
      [ { g: 'D', range: '50-59' }, { g: 'E', range: '40-49' }, { g: 'F', range: '30-39' }, { g: 'G', range: ' 0-29' } ]
    ];

    legendRows.forEach(function (rowDefs) {
      var legendRow = el('div', {
        display: 'flex',
        gap: '0.9rem',
        marginBottom: '0.2rem',
        fontSize: '0.62rem'
      });
      rowDefs.forEach(function (item) {
        var cell = el('span', { display: 'inline-flex', alignItems: 'center', gap: '0.25rem' });
        var gSpan = el('span', {
          color: gradeColor(item.g),
          fontWeight: '700',
          fontFamily: C.font
        });
        gSpan.textContent = item.g;
        var rSpan = el('span', {
          color: C.muted,
          fontFamily: C.font
        });
        rSpan.textContent = ' ' + item.range;
        cell.appendChild(gSpan);
        cell.appendChild(rSpan);
        legendRow.appendChild(cell);
      });
      legendWrap.appendChild(legendRow);
    });

    breakdown.appendChild(legendWrap);

    // ----- Outer container: flex row (canvas left, breakdown right) -----
    var sectionWrap = el('div', {
      background: C.surface,
      border: '1px solid ' + C.border,
      fontFamily: C.font,
      padding: '0'
    });

    var secLabel = el('div', {
      fontSize: '0.62rem',
      fontWeight: '700',
      letterSpacing: '0.18em',
      color: C.muted,
      textTransform: 'uppercase',
      padding: '0.6rem 1rem',
      borderBottom: '1px solid ' + C.border
    });
    secLabel.textContent = '── PERFORMANCE RADAR';
    sectionWrap.appendChild(secLabel);

    var innerFlex = el('div', {
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: '1.5rem',
      padding: '1rem'
    });

    innerFlex.appendChild(canvas);
    innerFlex.appendChild(breakdown);
    sectionWrap.appendChild(innerFlex);

    return sectionWrap;
  }

  // ---------------------------------------------------------------------------
  // Section 2c: Leaderboard Preview (top 3)
  // ---------------------------------------------------------------------------

  function buildLeaderboardPreview(leaderboard, currentUid) {
    var panel = el('div', {
      background: C.surface,
      border: '1px solid ' + C.border,
      fontFamily: C.font,
      padding: '0.75rem 1rem'
    });

    var heading = el('div', {
      fontSize: '0.62rem',
      fontWeight: '700',
      letterSpacing: '0.18em',
      color: C.muted,
      textTransform: 'uppercase',
      marginBottom: '0.6rem'
    });
    heading.textContent = '── TOP OPERATORS ─────────────────────────';
    panel.appendChild(heading);

    var top3 = (leaderboard || []).slice(0, 3);

    if (top3.length === 0) {
      var empty = el('div', {
        color: C.muted,
        fontSize: '0.7rem',
        letterSpacing: '0.08em',
        padding: '0.5rem 0'
      });
      empty.textContent = 'NO OPERATORS YET';
      panel.appendChild(empty);
      return panel;
    }

    top3.forEach(function (entry, idx) {
      var rank   = idx + 1;
      var name   = (entry.displayName || 'UNKNOWN').toUpperCase();
      var domain = (entry.domain || '—').toUpperCase();
      var xp     = entry.xpTotal || 0;
      var avatar = getAvatar(entry.displayName);
      var isSelf = (entry.id === currentUid || entry.userId === currentUid);

      var rankColor = rank === 1 ? C.gold : (rank === 2 ? C.text : C.muted);

      var row = el('div', {
        display: 'flex',
        alignItems: 'center',
        gap: '0.6rem',
        padding: '0.4rem 0.5rem',
        marginBottom: '0.2rem',
        background: isSelf ? 'rgba(0,255,65,0.04)' : 'transparent',
        border: isSelf ? '1px solid rgba(0,255,65,0.12)' : '1px solid transparent',
        fontSize: '0.72rem'
      });

      var rankEl = el('span', {
        color: rankColor,
        fontWeight: '700',
        width: '1.6rem',
        flexShrink: '0'
      });
      rankEl.textContent = '#' + rank;

      var avatarEl = el('span', {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '1.8rem',
        height: '1.8rem',
        border: '1px solid ' + C.border,
        color: isSelf ? C.green : C.muted,
        fontSize: '0.6rem',
        fontWeight: '700',
        flexShrink: '0'
      });
      avatarEl.textContent = avatar;

      var nameEl = el('span', {
        color: isSelf ? C.green : C.text,
        fontWeight: isSelf ? '700' : '400',
        letterSpacing: '0.06em',
        flex: '1',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis'
      });
      nameEl.textContent = name;

      var domainEl = el('span', {
        color: C.muted,
        fontSize: '0.65rem',
        letterSpacing: '0.05em',
        flexShrink: '0',
        width: '5.5rem',
        textAlign: 'right'
      });
      domainEl.textContent = domain;

      var xpEl = el('span', {
        color: C.gold,
        fontWeight: '700',
        fontSize: '0.75rem',
        flexShrink: '0',
        width: '4.5rem',
        textAlign: 'right'
      });
      xpEl.textContent = xp + ' XP';

      row.appendChild(rankEl);
      row.appendChild(avatarEl);
      row.appendChild(nameEl);
      row.appendChild(domainEl);
      row.appendChild(xpEl);
      panel.appendChild(row);
    });

    var nudge = el('div', {
      marginTop: '0.6rem',
      fontSize: '0.6rem',
      color: C.muted,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      cursor: 'pointer',
      padding: '0.3rem 0'
    });
    nudge.textContent = '[ VIEW FULL LEADERBOARD → ]';
    nudge.addEventListener('click', function () {
      var lbBtn = document.querySelector('.tab-btn[data-tab="leaderboard"]');
      if (lbBtn) lbBtn.click();
    });
    nudge.addEventListener('mouseenter', function () { nudge.style.color = C.green; });
    nudge.addEventListener('mouseleave', function () { nudge.style.color = C.muted; });
    panel.appendChild(nudge);

    return panel;
  }

  // ---------------------------------------------------------------------------
  // Section 2d: Clan Capital Status
  // ---------------------------------------------------------------------------

  function buildClanStatus(clanMeta, leaderboard) {
    var level       = (clanMeta && clanMeta.level)   ? clanMeta.level   : 1;
    var totalXP     = (clanMeta && clanMeta.totalXP) ? clanMeta.totalXP : 0;

    // C11: use fixed 10-completion bands, matching db.js::updateClanCapitalLevel
    // which uses Math.floor(total/10)+1. Each band is exactly 10 wide.
    var BAND = 10;
    var xpInThisLevel  = totalXP - ((level - 1) * BAND);
    var xpForNextLevel = BAND;
    var pct  = Math.min(1, xpInThisLevel / xpForNextLevel);
    var bar  = progressBar(Math.round(pct * 10), 10, 10);
    var pctDisplay = Math.round(pct * 100);

    var playerCount = leaderboard ? leaderboard.length : 0;

    var panel = el('div', {
      background: C.surface,
      border: '1px solid ' + C.border,
      fontFamily: C.font,
      padding: '0.75rem 1rem'
    });

    var heading = el('div', {
      fontSize: '0.62rem',
      fontWeight: '700',
      letterSpacing: '0.18em',
      color: C.muted,
      textTransform: 'uppercase',
      marginBottom: '0.6rem'
    });
    heading.textContent = '── CLAN STATUS ───────────────────────────';
    panel.appendChild(heading);

    var lvlRow = el('div', {
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      marginBottom: '0.5rem'
    });
    var lvlLabel = el('span', {
      fontSize: '0.65rem',
      color: C.muted,
      letterSpacing: '0.1em',
      textTransform: 'uppercase'
    });
    lvlLabel.textContent = 'CLAN CAPITAL LVL';
    var lvlVal = el('span', {
      fontSize: '1.2rem',
      fontWeight: '700',
      color: C.gold,
      letterSpacing: '0.05em'
    });
    lvlVal.textContent = String(level);
    lvlRow.appendChild(lvlLabel);
    lvlRow.appendChild(lvlVal);
    panel.appendChild(lvlRow);

    var progRow = el('div', { marginBottom: '0.4rem' });
    var progLabel = el('div', {
      fontSize: '0.6rem',
      color: C.muted,
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      marginBottom: '0.2rem'
    });
    progLabel.textContent = 'PROGRESS TO LVL ' + (level + 1);
    var progBar = el('div', {
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      fontSize: '0.75rem'
    });
    var barSpan = el('span', {
      fontFamily: C.font,
      color: pct === 0 ? C.border : C.gold,
      letterSpacing: '0.02em'
    });
    barSpan.textContent = bar;
    var pctSpan = el('span', {
      color: pct >= 1 ? C.gold : C.green,
      fontWeight: '700',
      fontSize: '0.7rem'
    });
    pctSpan.textContent = pctDisplay + '%' + (pct >= 1 ? ' ★ LVL UP!' : ' to LVL ' + (level + 1));
    progBar.appendChild(barSpan);
    progBar.appendChild(pctSpan);
    progRow.appendChild(progLabel);
    progRow.appendChild(progBar);
    panel.appendChild(progRow);

    var membersRow = el('div', {
      fontSize: '0.68rem',
      color: C.muted,
      letterSpacing: '0.06em',
      marginTop: '0.5rem',
      borderTop: '1px solid ' + C.border,
      paddingTop: '0.5rem'
    });
    var memberVal = el('span', { color: C.text, fontWeight: '700' });
    memberVal.textContent = String(playerCount);
    membersRow.appendChild(txt('CLAN MEMBERS: '));
    membersRow.appendChild(memberVal);
    panel.appendChild(membersRow);

    var compRow = el('div', {
      fontSize: '0.68rem',
      color: C.muted,
      letterSpacing: '0.06em',
      marginTop: '0.3rem'
    });
    var compVal = el('span', { color: C.green, fontWeight: '700' });
    compVal.textContent = String(totalXP);
    compRow.appendChild(txt('TOTAL COMPLETIONS: '));
    compRow.appendChild(compVal);
    panel.appendChild(compRow);

    var nudge = el('div', {
      marginTop: '0.6rem',
      fontSize: '0.6rem',
      color: C.muted,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      cursor: 'pointer',
      padding: '0.3rem 0'
    });
    nudge.textContent = '[ OPEN CLAN CAPITAL → ]';
    nudge.addEventListener('click', function () {
      var clanBtn = document.querySelector('.tab-btn[data-tab="clan-capital"]');
      if (clanBtn) clanBtn.click();
    });
    nudge.addEventListener('mouseenter', function () { nudge.style.color = C.gold; });
    nudge.addEventListener('mouseleave', function () { nudge.style.color = C.muted; });
    panel.appendChild(nudge);

    return panel;
  }

  // ---------------------------------------------------------------------------
  // Main render function
  // ---------------------------------------------------------------------------

  window.renderHome = function (container) {
    if (!container) return;

    // M11: bump generation so any in-flight render from a prior call becomes stale
    var myGen = ++_homeRenderGen;

    container.innerHTML = '';
    container.style.fontFamily = C.font;

    var loadingEl = el('div', {
      color: C.green,
      fontSize: '0.78rem',
      letterSpacing: '0.15em',
      textTransform: 'uppercase',
      padding: '2rem 1rem'
    });
    loadingEl.textContent = '> LOADING INTEL...';
    container.appendChild(loadingEl);

    var uid = window.currentUser ? window.currentUser.uid : null;
    if (!uid) {
      loadingEl.textContent = 'ERROR: NOT AUTHENTICATED';
      loadingEl.style.color = C.red;
      return;
    }

    Promise.all([
      window.DB.getUserProfile(uid),
      window.DB.getUserTopics(uid),
      window.DB.getLeaderboard(),
      window.DB.getClanCapitalMeta()
    ]).then(function (results) {
      var profile     = results[0];
      var userTopics  = results[1] || [];
      var leaderboard = results[2] || [];
      var clanMeta    = results[3] || {};

      // Compute rank — H10: default to null so new users not in the leaderboard
      // show as N/A instead of incorrectly showing as #1.
      var rank = null;
      for (var i = 0; i < leaderboard.length; i++) {
        var entry = leaderboard[i];
        if (entry.id === uid || entry.userId === uid) {
          rank = i + 1;
          break;
        }
      }

      // M11: abort if a newer renderHome call has already taken over
      if (_homeRenderGen !== myGen) return;

      // Compute tier stats (for stat card)
      var tierStats   = computeTierStats(userTopics);
      var totalTopics = (window.TOPICS || []).length;
      var doneTopics  = userTopics.filter(function (t) { return t.status === 'completed'; }).length;

      // Compute radar scores
      var xpTotal    = (profile && profile.xpTotal    != null) ? profile.xpTotal    : 0;
      var xpThisWeek = (profile && profile.xpThisWeek != null) ? profile.xpThisWeek : 0;
      var scores = computeRadarScores(userTopics, xpThisWeek, xpTotal);

      // Clear container and build layout
      container.innerHTML = '';

      var root = el('div', { maxWidth: '1200px', margin: '0 auto' });

      // ── Section 1: Guide ──
      root.appendChild(buildGuide());

      // ── Dashboard label ──
      var dashLabel = el('div', {
        fontSize: '0.62rem',
        fontWeight: '700',
        letterSpacing: '0.18em',
        color: C.muted,
        textTransform: 'uppercase',
        marginBottom: '0.75rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem'
      });
      dashLabel.textContent = '── PLAYER DASHBOARD';
      var dashLine = el('div', { flex: '1', height: '1px', background: C.border });
      dashLabel.appendChild(dashLine);
      root.appendChild(dashLabel);

      // ── 2-column grid: left = stat card; right = leaderboard + clan ──
      var grid = el('div', {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '1rem',
        alignItems: 'start',
        marginBottom: '1rem'
      });

      var leftCol = el('div', { display: 'flex', flexDirection: 'column', gap: '1rem' });
      leftCol.appendChild(buildStatCard(profile, rank, tierStats, totalTopics, doneTopics));

      var rightCol = el('div', { display: 'flex', flexDirection: 'column', gap: '1rem' });
      rightCol.appendChild(buildLeaderboardPreview(leaderboard, uid));
      rightCol.appendChild(buildClanStatus(clanMeta, leaderboard));

      grid.appendChild(leftCol);
      grid.appendChild(rightCol);
      root.appendChild(grid);

      // ── Radar section (full width, between stat card row and bottom) ──
      root.appendChild(buildRadarSection(scores));

      container.appendChild(root);

    }).catch(function (err) {
      console.error('renderHome error:', err);
      container.innerHTML = '';
      var errEl = el('div', {
        color: C.red,
        fontSize: '0.75rem',
        letterSpacing: '0.1em',
        padding: '2rem 1rem'
      });
      errEl.textContent = 'ERROR LOADING INTEL: ' + (err.message || String(err));
      container.appendChild(errEl);
    });
  };

}());
