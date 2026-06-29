// topics.js — PrepClash topic definitions and unlock logic
// Plain browser JS — no modules, no build tool. Everything is exposed on window.

(function () {

  // ---------------------------------------------------------------------------
  // SOURCE LABELS
  // ---------------------------------------------------------------------------

  var SOURCE_LABELS = {
    leetcode:   "LC",
    lovebabbar: "LB",
    codeforces: "CF",
    a2oj:       "A2OJ"
  };

  // ---------------------------------------------------------------------------
  // getDifficultyXP(difficulty) — XP earned per question solved
  // ---------------------------------------------------------------------------

  function getDifficultyXP(difficulty) {
    if (difficulty === "easy")     return 2;
    if (difficulty === "medium")   return 5;
    if (difficulty === "hard")     return 10;
    // L12: 'unrated' (CF problems with no rating) earn a low XP value
    if (difficulty === "unrated")  return 1;
    return 0;
  }

  // ---------------------------------------------------------------------------
  // TOPIC DEFINITIONS
  // questions and completionThreshold are now managed by questions.js + Firestore.
  // ---------------------------------------------------------------------------

  var TOPICS = [

    // --- TIER 0 (always unlocked, xp: 10) ------------------------------------

    {
      id: "arrays",
      name: "Arrays",
      tier: 0,
      xp: 10,
      prerequisites: [],
      unlocks: ["linked_lists", "binary_search", "hashing", "two_pointers"]
    },

    {
      id: "stack",
      name: "Stack",
      tier: 0,
      xp: 10,
      prerequisites: [],
      unlocks: ["linked_lists", "recursion"]
    },

    {
      id: "queue",
      name: "Queue",
      tier: 0,
      xp: 10,
      prerequisites: [],
      unlocks: ["recursion"]
    },

    {
      id: "bubble_sort",
      name: "Bubble Sort",
      tier: 0,
      xp: 10,
      prerequisites: [],
      unlocks: []
    },

    {
      id: "selection_sort",
      name: "Selection Sort",
      tier: 0,
      xp: 10,
      prerequisites: [],
      unlocks: []
    },

    // --- TIER 1 (xp: 10, unlock: complete prerequisites) ---------------------

    {
      id: "linked_lists",
      name: "Linked Lists",
      tier: 1,
      xp: 10,
      prerequisites: ["arrays", "stack"],
      unlocks: ["trees"]
    },

    {
      id: "binary_search",
      name: "Binary Search",
      tier: 1,
      xp: 10,
      prerequisites: ["arrays"],
      unlocks: ["hashing", "two_pointers"]
    },

    {
      id: "recursion",
      name: "Recursion",
      tier: 1,
      xp: 10,
      prerequisites: ["stack"],
      unlocks: ["trees", "backtracking", "dynamic_programming"]
    },

    // --- TIER 2 (xp: 25, unlock: complete prerequisites) --------------------

    {
      id: "trees",
      name: "Trees",
      tier: 2,
      xp: 25,
      prerequisites: ["linked_lists", "recursion"],
      unlocks: ["graphs", "heaps", "backtracking", "tries"]
    },

    {
      id: "hashing",
      name: "Hashing",
      tier: 2,
      xp: 25,
      prerequisites: ["arrays", "binary_search"],
      unlocks: ["heaps", "tries"]
    },

    {
      id: "two_pointers",
      name: "Two Pointers",
      tier: 2,
      xp: 25,
      prerequisites: ["arrays", "binary_search"],
      unlocks: ["hashing"]
    },

    // --- TIER 3 (xp: 25, unlock: complete prerequisites) --------------------

    {
      id: "graphs",
      name: "Graphs",
      tier: 3,
      xp: 25,
      prerequisites: ["trees"],
      unlocks: ["dynamic_programming", "advanced_graphs"]
    },

    {
      id: "heaps",
      name: "Heaps",
      tier: 3,
      xp: 25,
      prerequisites: ["trees", "hashing"],
      unlocks: ["advanced_graphs"]
    },

    {
      id: "backtracking",
      name: "Backtracking",
      tier: 3,
      xp: 25,
      prerequisites: ["recursion", "trees"],
      unlocks: ["dynamic_programming"]
    },

    // --- TIER 4 (xp: 50, unlock: complete prerequisites) --------------------

    {
      id: "dynamic_programming",
      name: "Dynamic Programming",
      tier: 4,
      xp: 50,
      prerequisites: ["recursion", "backtracking"],
      unlocks: []
    },

    {
      id: "tries",
      name: "Tries",
      tier: 4,
      xp: 50,
      prerequisites: ["hashing", "trees"],
      unlocks: []
    },

    {
      id: "advanced_graphs",
      name: "Advanced Graphs",
      tier: 4,
      xp: 50,
      prerequisites: ["graphs", "heaps"],
      unlocks: []
    },

    // --- CORE CS (tier: 5, xp: 25, always visible in Clan Capital) ----------

    {
      id: "operating_systems",
      name: "Operating Systems",
      tier: 5,
      xp: 25,
      prerequisites: [],
      unlocks: []
    },

    {
      id: "dbms",
      name: "DBMS",
      tier: 5,
      xp: 25,
      prerequisites: [],
      unlocks: []
    },

    {
      id: "computer_networks",
      name: "Computer Networks",
      tier: 5,
      xp: 25,
      prerequisites: [],
      unlocks: []
    },

    {
      id: "oop",
      name: "OOP",
      tier: 5,
      xp: 25,
      prerequisites: [],
      unlocks: []
    },

    {
      id: "system_design",
      name: "System Design",
      tier: 5,
      xp: 25,
      prerequisites: [],
      unlocks: []
    }

  ];

  // ---------------------------------------------------------------------------
  // TIER LABELS
  // ---------------------------------------------------------------------------

  var TIER_LABELS = {
    0: "TIER 0",
    1: "TIER 1",
    2: "TIER 2",
    3: "TIER 3",
    4: "TIER 4",
    5: "CORE CS"
  };

  // ---------------------------------------------------------------------------
  // getTopicById(id) — returns topic object or null
  // ---------------------------------------------------------------------------

  function getTopicById(id) {
    for (var i = 0; i < TOPICS.length; i++) {
      if (TOPICS[i].id === id) return TOPICS[i];
    }
    return null;
  }

  // ---------------------------------------------------------------------------
  // getUnlockStatus(completedIds)
  //
  // Returns:
  //   {
  //     unlocked: Set<string>,          // topic IDs the player can see/attempt
  //     hints: { [topicId]: string }    // human-readable hint for locked topics
  //   }
  //
  // Rules:
  //   - Tier 0 topics are always unlocked.
  //   - Core CS topics (tier 5) are always unlocked (visible in Clan Capital).
  //   - All other topics are unlocked when ALL their prerequisites appear in
  //     completedIds.
  //   - Topics with no prerequisites (other than tier 0 / 5) are also unlocked.
  // ---------------------------------------------------------------------------

  function getUnlockStatus(completedIds) {
    if (!Array.isArray(completedIds)) {
      completedIds = completedIds ? [completedIds] : [];
    }

    // Normalise input to a plain object map for O(1) lookup
    var completedSet = {};
    if (completedIds && completedIds.length) {
      for (var i = 0; i < completedIds.length; i++) {
        completedSet[completedIds[i]] = true;
      }
    }

    var unlocked = new Set();
    var hints = {};

    for (var j = 0; j < TOPICS.length; j++) {
      var topic = TOPICS[j];

      // Tier 0 and Core CS (tier 5) are always unlocked
      if (topic.tier === 0 || topic.tier === 5) {
        unlocked.add(topic.id);
        continue;
      }

      // Topics with no prerequisites are unlocked automatically
      if (!topic.prerequisites || topic.prerequisites.length === 0) {
        unlocked.add(topic.id);
        continue;
      }

      // Check whether all prerequisites are completed
      var missingPrereqs = [];
      for (var k = 0; k < topic.prerequisites.length; k++) {
        var prereqId = topic.prerequisites[k];
        if (!completedSet[prereqId]) {
          var prereqTopic = getTopicById(prereqId);
          missingPrereqs.push(prereqTopic ? prereqTopic.name : prereqId);
        }
      }

      if (missingPrereqs.length === 0) {
        unlocked.add(topic.id);
      } else {
        // Build a readable hint listing what remains
        hints[topic.id] = "Complete " + missingPrereqs.join(" + ") + " to unlock";
      }
    }

    return { unlocked: unlocked, hints: hints };
  }

  // ---------------------------------------------------------------------------
  // Expose everything on window
  // ---------------------------------------------------------------------------

  window.TOPICS                      = TOPICS;
  window.TIER_LABELS                 = TIER_LABELS;
  window.SOURCE_LABELS               = SOURCE_LABELS;
  window.getTopicById                = getTopicById;
  window.getUnlockStatus             = getUnlockStatus;
  window.getDifficultyXP             = getDifficultyXP;

  // Global default completion threshold used by village.js when questions.js
  // does not return a count for a topic.
  window.TOPIC_COMPLETION_THRESHOLD  = 3;

}());
