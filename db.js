(function () {
  "use strict";

  var db = firebase.firestore();

  // ---------------------------------------------------------------------------
  // Users
  // ---------------------------------------------------------------------------

  function initUserProfile(firebaseUser) {
    var ref = db.collection("users").doc(firebaseUser.uid);
    return ref.get().then(function (snap) {
      if (snap.exists) return snap.data();
      var profile = {
        displayName: firebaseUser.displayName || "",
        email: firebaseUser.email || "",
        domain: "",
        xpTotal: 0,
        xpThisWeek: 0,
        villageLvl: 1,
        joinedAt: firebase.firestore.FieldValue.serverTimestamp(),
      };
      return ref.set(profile).then(function () {
        return profile;
      });
    });
  }

  function getUserProfile(userId) {
    return db
      .collection("users")
      .doc(userId)
      .get()
      .then(function (snap) {
        if (!snap.exists) return null;
        return Object.assign({ id: snap.id }, snap.data());
      });
  }

  function updateUserProfile(userId, data) {
    return db.collection("users").doc(userId).set(data, { merge: true });
  }

  // ---------------------------------------------------------------------------
  // Village topics
  // ---------------------------------------------------------------------------

  function getUserTopics(userId) {
    return db
      .collection("users")
      .doc(userId)
      .collection("topics")
      .get()
      .then(function (snap) {
        return snap.docs.map(function (doc) {
          return Object.assign({ id: doc.id }, doc.data());
        });
      });
  }

  function setTopicStatus(userId, topicId, opts) {
    // opts: { status, proofUrl, xpValue, topicName, tier }
    var status = opts.status;
    var proofUrl = opts.proofUrl || "";
    var xpValue = opts.xpValue || 0;
    var topicName = opts.topicName || "";
    var tier = opts.tier || "";

    var userRef = db.collection("users").doc(userId);
    var topicRef = userRef.collection("topics").doc(topicId);
    var leaderboardRef = db.collection("leaderboard").doc(userId);
    var clanTopicRef = db
      .collection("clanCapital")
      .doc("topics")
      .collection("topics")
      .doc(topicId);

    // Fetch existing topic and user profile first
    return Promise.all([topicRef.get(), userRef.get()]).then(function (results) {
      var topicSnap = results[0];
      var userSnap = results[1];

      var prevStatus = topicSnap.exists ? topicSnap.data().status : "locked";
      var userData = userSnap.exists ? userSnap.data() : {};

      var xpTotal = userData.xpTotal || 0;
      var xpThisWeek = userData.xpThisWeek || 0;
      var topicsCompleted = userData.topicsCompleted || 0;

      // Only award XP when transitioning into "completed"
      var xpDelta = 0;
      var completedCountDelta = 0;
      if (status === "completed" && prevStatus !== "completed") {
        xpDelta = xpValue;
        completedCountDelta = 1;
      }
      // If reverting from completed, subtract XP
      if (prevStatus === "completed" && status !== "completed") {
        xpDelta = -xpValue;
        completedCountDelta = -1;
      }

      var newXpTotal = Math.max(0, xpTotal + xpDelta);
      var newXpThisWeek = Math.max(0, xpThisWeek + xpDelta);
      var newVillageLvl = Math.floor(newXpTotal / 100) + 1;
      var newTopicsCompleted = Math.max(0, topicsCompleted + completedCountDelta);

      var topicData = {
        topicName: topicName,
        tier: tier,
        status: status,
        proofUrl: proofUrl,
        xpValue: xpValue,
      };
      if (status === "completed" && prevStatus !== "completed") {
        topicData.completedAt = firebase.firestore.FieldValue.serverTimestamp();
        // Snapshot the current questionsDone count for denormalization
        var questionsDoneMap =
          topicSnap.exists && topicSnap.data().questionsDone
            ? topicSnap.data().questionsDone
            : {};
        topicData.questionsCompletedCount = Object.keys(questionsDoneMap).length;
      }
      if (status !== "completed") {
        topicData.completedAt = null;
      }

      var userUpdate = {
        xpTotal: newXpTotal,
        xpThisWeek: newXpThisWeek,
        villageLvl: newVillageLvl,
        topicsCompleted: newTopicsCompleted,
      };

      var leaderboardData = {
        userId: userId,
        displayName: userData.displayName || "",
        domain: userData.domain || "",
        xpTotal: newXpTotal,
        xpThisWeek: newXpThisWeek,
        topicsCompleted: newTopicsCompleted,
        lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
      };

      var completionEntry = {};
      if (status === "completed") {
        completionEntry["completions." + userId] = {
          status: status,
          proofUrl: proofUrl,
          completedAt: firebase.firestore.FieldValue.serverTimestamp(),
          displayName: userData.displayName || "",
        };
      } else {
        // Use FieldValue.delete() to remove the user's completion entry
        completionEntry["completions." + userId] =
          firebase.firestore.FieldValue.delete();
      }

      var clanTopicBase = {
        topicName: topicName,
        tier: tier,
      };

      return Promise.all([
        topicRef.set(topicData, { merge: true }),
        userRef.set(userUpdate, { merge: true }),
        leaderboardRef.set(leaderboardData, { merge: true }),
        clanTopicRef
          .set(clanTopicBase, { merge: true })
          .then(function () {
            return clanTopicRef.update(completionEntry);
          }),
      ]);
    });
  }

  // ---------------------------------------------------------------------------
  // Question-level tracking
  // ---------------------------------------------------------------------------

  function markQuestionDone(userId, topicId, questionId, done, opts) {
    // opts: { source, questionName, displayName }
    var source = (opts && opts.source) || "";
    var questionName = (opts && opts.questionName) || "";
    var displayName = (opts && opts.displayName) || "";

    var topicRef = db
      .collection("users")
      .doc(userId)
      .collection("topics")
      .doc(topicId);

    return topicRef.get().then(function (snap) {
      var data = snap.exists ? snap.data() : {};
      var questionsDone = Object.assign({}, data.questionsDone || {});

      if (done) {
        questionsDone[questionId] = true;
      } else {
        delete questionsDone[questionId];
      }

      return topicRef
        .set({ questionsDone: questionsDone }, { merge: true })
        .then(function () {
          return updateQuestionStat(questionId, {
            source: source,
            topicId: topicId,
            questionName: questionName,
            userId: userId,
            displayName: displayName,
            done: done,
          });
        })
        .then(function () {
          return { questionsDone: questionsDone, count: Object.keys(questionsDone).length };
        });
    });
  }

  // ---------------------------------------------------------------------------
  // Group-level question stats
  // ---------------------------------------------------------------------------

  function getQuestionStats(questionIds) {
    if (!questionIds || questionIds.length === 0) return Promise.resolve({});

    // Batch into groups of 10 to stay within Firestore limits
    var batches = [];
    for (var i = 0; i < questionIds.length; i += 10) {
      batches.push(questionIds.slice(i, i + 10));
    }

    return Promise.all(
      batches.map(function (batch) {
        return Promise.all(
          batch.map(function (qid) {
            return db
              .collection("questionStats")
              .doc(qid)
              .get()
              .then(function (snap) {
                if (!snap.exists) {
                  return { id: qid, totalCompletions: 0, completedBy: {} };
                }
                var d = snap.data();
                return {
                  id: qid,
                  totalCompletions: d.totalCompletions || 0,
                  completedBy: d.completedBy || {},
                };
              });
          })
        );
      })
    ).then(function (batchResults) {
      var result = {};
      batchResults.forEach(function (batch) {
        batch.forEach(function (entry) {
          result[entry.id] = {
            totalCompletions: entry.totalCompletions,
            completedBy: entry.completedBy,
          };
        });
      });
      return result;
    });
  }

  function updateQuestionStat(questionId, opts) {
    // opts: { source, topicId, questionName, userId, displayName, done }
    var source = opts.source || "";
    var topicId = opts.topicId || "";
    var questionName = opts.questionName || "";
    var userId = opts.userId || "";
    var displayName = opts.displayName || "";
    var done = !!opts.done;

    var ref = db.collection("questionStats").doc(questionId);

    return ref.get().then(function (snap) {
      var data = snap.exists ? snap.data() : {};
      var currentTotal = data.totalCompletions || 0;
      var completedBy = Object.assign({}, data.completedBy || {});

      var newTotal;
      if (done) {
        newTotal = currentTotal + 1;
        completedBy[userId] = {
          displayName: displayName,
          completedAt: firebase.firestore.FieldValue.serverTimestamp(),
        };
      } else {
        newTotal = Math.max(0, currentTotal - 1);
        delete completedBy[userId];
      }

      return ref.set(
        {
          source: source,
          topicId: topicId,
          questionName: questionName,
          totalCompletions: newTotal,
          completedBy: completedBy,
        },
        { merge: true }
      );
    });
  }

  function onQuestionStatsChange(questionId, callback) {
    return db
      .collection("questionStats")
      .doc(questionId)
      .onSnapshot(function (snap) {
        if (!snap.exists) {
          callback({ totalCompletions: 0, completedBy: {} });
          return;
        }
        var d = snap.data();
        callback({
          totalCompletions: d.totalCompletions || 0,
          completedBy: d.completedBy || {},
        });
      });
  }

  function getQuestionsDone(userId, topicId) {
    return db
      .collection("users")
      .doc(userId)
      .collection("topics")
      .doc(topicId)
      .get()
      .then(function (snap) {
        if (!snap.exists) return {};
        return snap.data().questionsDone || {};
      });
  }

  // ---------------------------------------------------------------------------
  // Clan Capital
  // ---------------------------------------------------------------------------

  function getClanCapitalMeta() {
    return db
      .collection("clanCapital")
      .doc("meta")
      .get()
      .then(function (snap) {
        if (!snap.exists) return { level: 1, totalXP: 0 };
        return snap.data();
      });
  }

  function getClanCapitalTopics() {
    return db
      .collection("clanCapital")
      .doc("topics")
      .collection("topics")
      .get()
      .then(function (snap) {
        return snap.docs.map(function (doc) {
          return Object.assign({ id: doc.id }, doc.data());
        });
      });
  }

  function updateClanCapitalLevel() {
    return getClanCapitalTopics().then(function (topics) {
      var totalCompletions = 0;
      topics.forEach(function (topic) {
        var completions = topic.completions || {};
        totalCompletions += Object.keys(completions).length;
      });
      var level = Math.floor(totalCompletions / 10) + 1;
      return db
        .collection("clanCapital")
        .doc("meta")
        .set({ level: level, totalXP: totalCompletions }, { merge: true });
    });
  }

  // ---------------------------------------------------------------------------
  // Leaderboard
  // ---------------------------------------------------------------------------

  function getLeaderboard() {
    return db
      .collection("leaderboard")
      .orderBy("xpTotal", "desc")
      .get()
      .then(function (snap) {
        return snap.docs.map(function (doc) {
          return Object.assign({ id: doc.id }, doc.data());
        });
      });
  }

  // ---------------------------------------------------------------------------
  // Real-time listeners
  // ---------------------------------------------------------------------------

  function onLeaderboardChange(callback, onError) {
    return db
      .collection("leaderboard")
      .orderBy("xpTotal", "desc")
      .onSnapshot(function (snap) {
        var entries = snap.docs.map(function (doc) {
          return Object.assign({ id: doc.id }, doc.data());
        });
        callback(entries);
      }, function (err) {
        console.error('[DB] onLeaderboardChange snapshot error:', err);
        if (typeof onError === 'function') onError(err);
      });
  }

  function onUserTopicsChange(userId, callback, onError) {
    return db
      .collection("users")
      .doc(userId)
      .collection("topics")
      .onSnapshot(function (snap) {
        var topics = snap.docs.map(function (doc) {
          return Object.assign({ id: doc.id }, doc.data());
        });
        callback(topics);
      }, function (err) {
        console.error('[DB] onUserTopicsChange snapshot error:', err);
        if (typeof onError === 'function') onError(err);
      });
  }

  // ---------------------------------------------------------------------------
  // Expose window.DB
  // ---------------------------------------------------------------------------

  window.DB = {
    initUserProfile: initUserProfile,
    getUserProfile: getUserProfile,
    updateUserProfile: updateUserProfile,

    getUserTopics: getUserTopics,
    setTopicStatus: setTopicStatus,
    markQuestionDone: markQuestionDone,
    getQuestionsDone: getQuestionsDone,

    getClanCapitalMeta: getClanCapitalMeta,
    getClanCapitalTopics: getClanCapitalTopics,
    updateClanCapitalLevel: updateClanCapitalLevel,

    getLeaderboard: getLeaderboard,

    getQuestionStats: getQuestionStats,
    updateQuestionStat: updateQuestionStat,
    onQuestionStatsChange: onQuestionStatsChange,

    onLeaderboardChange: onLeaderboardChange,
    onUserTopicsChange: onUserTopicsChange,
  };
})();
