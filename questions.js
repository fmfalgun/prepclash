// questions.js — PrepClash question loader
// Plain browser JS — no modules, no build tool. Loaded after db.js and topics.js.
// Exposes window.Questions

(function () {
  "use strict";

  // ---------------------------------------------------------------------------
  // Codeforces tag mapping
  // ---------------------------------------------------------------------------

  var CF_TAGS = {
    arrays:               ['arrays'],
    stack:                ['data structures'],
    queue:                ['data structures'],
    bubble_sort:          ['sortings'],
    selection_sort:       ['sortings'],
    linked_lists:         ['data structures'],
    binary_search:        ['binary search'],
    recursion:            ['divide and conquer'],
    trees:                ['trees', 'dfs and similar'],
    hashing:              ['hashing'],
    two_pointers:         ['two pointers'],
    graphs:               ['graphs', 'dfs and similar'],
    heaps:                ['data structures'],
    backtracking:         ['backtracking'],
    dynamic_programming:  ['dp'],
    tries:                ['string suffix structures'],
    advanced_graphs:      ['shortest paths'],
    operating_systems:    [],
    dbms:                 [],
    computer_networks:    [],
    oop:                  ['implementation'],
    system_design:        ['implementation'],
  };

  // ---------------------------------------------------------------------------
  // Codeforces rating range per tier
  // ---------------------------------------------------------------------------

  var CF_RATING = {
    0: [800,  1100],
    1: [1000, 1300],
    2: [1200, 1500],
    3: [1400, 1700],
    4: [1600, 2000],
    5: [1000, 1400],
  };

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  function ratingToDifficulty(rating) {
    if (!rating) return 'medium';
    if (rating <= 1200) return 'easy';
    if (rating <= 1600) return 'medium';
    return 'hard';
  }

  // Fisher-Yates shuffle — returns a new shuffled copy
  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = a[i];
      a[i] = a[j];
      a[j] = tmp;
    }
    return a;
  }

  // ---------------------------------------------------------------------------
  // Internal caches
  // ---------------------------------------------------------------------------

  var _cfCache = null;          // full CF problemset response (fetched once)
  var _lbCache = {};            // per-topicId LB question arrays

  // ---------------------------------------------------------------------------
  // fetchCFProblemset
  // ---------------------------------------------------------------------------

  function fetchCFProblemset() {
    if (_cfCache !== null) {
      return Promise.resolve(_cfCache);
    }

    return fetch('https://codeforces.com/api/problemset.problems')
      .then(function (res) {
        if (!res.ok) {
          throw new Error('CF API returned status ' + res.status);
        }
        return res.json();
      })
      .then(function (data) {
        if (!data || data.status !== 'OK') {
          throw new Error('CF API response not OK: ' + JSON.stringify(data && data.comment));
        }
        _cfCache = data.result;
        return _cfCache;
      })
      .catch(function (err) {
        console.warn('[Questions] Codeforces API fetch failed:', err);
        return null;
      });
  }

  // ---------------------------------------------------------------------------
  // getCFProblemsForTopic
  // ---------------------------------------------------------------------------

  function getCFProblemsForTopic(topicId, tier) {
    if (!_cfCache) return [];

    var requiredTags = CF_TAGS[topicId];
    if (!requiredTags || requiredTags.length === 0) return [];

    var tierKey = (tier !== undefined && tier !== null) ? tier : 0;
    var ratingRange = CF_RATING[tierKey] || CF_RATING[0];
    var minRating = ratingRange[0];
    var maxRating = ratingRange[1];

    var problems = _cfCache.problems || [];

    var filtered = problems.filter(function (p) {
      // Must have a contestId and index
      if (!p.contestId || !p.index) return false;

      // Must have a rating and be within range
      if (!p.rating) return false;
      if (p.rating < minRating || p.rating > maxRating) return false;

      // Must match at least one required CF tag
      var pTags = p.tags || [];
      return requiredTags.some(function (t) {
        return pTags.indexOf(t) !== -1;
      });
    });

    // Pick up to 8 random problems
    var picked = shuffle(filtered).slice(0, 8);

    return picked.map(function (p) {
      return {
        id: 'cf_' + p.contestId + '_' + p.index,
        name: p.name,
        difficulty: ratingToDifficulty(p.rating),
        url: 'https://codeforces.com/problemset/problem/' + p.contestId + '/' + p.index,
        source: 'codeforces',
        tags: p.tags || [],
        cfRating: p.rating,
      };
    });
  }

  // ---------------------------------------------------------------------------
  // getLBQuestionsForTopic
  // ---------------------------------------------------------------------------

  function getLBQuestionsForTopic(topicId) {
    if (_lbCache[topicId] !== undefined) {
      return Promise.resolve(_lbCache[topicId]);
    }

    return fetch('./data/lovebabbar/' + topicId + '.json')
      .then(function (res) {
        if (!res.ok) {
          // 404 or similar — gracefully return []
          _lbCache[topicId] = [];
          return [];
        }
        return res.json().then(function (data) {
          var questions = (data && data.questions) ? data.questions : [];
          var normalized = questions.map(function (q) {
            return {
              id: q.id,
              name: q.name,
              difficulty: q.difficulty,
              url: q.url,
              source: 'lovebabbar',
              tags: q.tags || [],
            };
          });
          _lbCache[topicId] = normalized;
          return normalized;
        });
      })
      .catch(function (err) {
        console.warn('[Questions] LB JSON fetch failed for topic "' + topicId + '":', err);
        _lbCache[topicId] = [];
        return [];
      });
  }

  // ---------------------------------------------------------------------------
  // getQuestionsForTopic
  // ---------------------------------------------------------------------------

  function getQuestionsForTopic(topicId, source) {
    source = source || 'all';

    // Resolve the tier for this topic via window.getTopicById if available
    var tier = 0;
    if (typeof window.getTopicById === 'function') {
      var topicDef = window.getTopicById(topicId);
      if (topicDef && topicDef.tier !== undefined) {
        tier = topicDef.tier;
      }
    }

    if (source === 'lovebabbar') {
      return getLBQuestionsForTopic(topicId).catch(function () { return []; });
    }

    if (source === 'codeforces') {
      return fetchCFProblemset().then(function () {
        return getCFProblemsForTopic(topicId, tier);
      }).catch(function () { return []; });
    }

    // source === 'all'
    return Promise.all([
      getLBQuestionsForTopic(topicId).catch(function () { return []; }),
      fetchCFProblemset().then(function () {
        return getCFProblemsForTopic(topicId, tier);
      }).catch(function () { return []; }),
    ]).then(function (results) {
      return results[0].concat(results[1]);
    });
  }

  // ---------------------------------------------------------------------------
  // getQuestionGroupStats
  // ---------------------------------------------------------------------------

  function getQuestionGroupStats(questionIds) {
    if (!questionIds || questionIds.length === 0) {
      return Promise.resolve({});
    }
    return window.DB.getQuestionStats(questionIds)
      .then(function (raw) {
        // Normalise completedBy from { userId: { displayName, ... } } → [displayName, ...]
        var result = {};
        Object.keys(raw).forEach(function (qid) {
          var entry = raw[qid];
          var completedByObj = entry.completedBy || {};
          var names = Object.keys(completedByObj).map(function (uid) {
            var rec = completedByObj[uid];
            return (rec && rec.displayName) ? rec.displayName : uid;
          });
          result[qid] = {
            totalCompletions: entry.totalCompletions || 0,
            completedBy: names,
          };
        });
        return result;
      })
      .catch(function (err) {
        console.warn('[Questions] getQuestionGroupStats failed:', err);
        return {};
      });
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  window.Questions = {
    getQuestionsForTopic:   getQuestionsForTopic,
    fetchCFProblemset:      fetchCFProblemset,
    getCFProblemsForTopic:  getCFProblemsForTopic,
    getLBQuestionsForTopic: getLBQuestionsForTopic,
    getQuestionGroupStats:  getQuestionGroupStats,

    // Expose cache for debugging / advanced consumers
    _cfCache: null,   // alias kept; actual cache is module-local _cfCache

    // Allow callers to inspect/test internals
    _getCFCache: function () { return _cfCache; },
    _getLBCache: function () { return _lbCache; },
  };

}());
