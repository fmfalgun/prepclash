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
        return Object.assign({}, profile, { joinedAt: new Date() });
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

    // Fetch the topic doc first (outside the transaction — only needed for
    // prevStatus and questionsDoneMap; these fields are only written by this
    // user so a non-transactional read is safe here).
    return topicRef.get().then(function (topicSnap) {
      var prevStatus = topicSnap.exists ? topicSnap.data().status : "locked";

      var xpDelta = 0;
      var completedCountDelta = 0;
      if (status === "completed" && prevStatus !== "completed") {
        xpDelta = xpValue;
        completedCountDelta = 1;
      }
      if (prevStatus === "completed" && status !== "completed") {
        xpDelta = -xpValue;
        completedCountDelta = -1;
      }

      var topicData = {
        topicName: topicName,
        tier: tier,
        status: status,
        proofUrl: proofUrl,
        xpValue: xpValue,
      };
      if (status === "completed" && prevStatus !== "completed") {
        topicData.completedAt = firebase.firestore.FieldValue.serverTimestamp();
        var questionsDoneMap =
          topicSnap.exists && topicSnap.data().questionsDone
            ? topicSnap.data().questionsDone
            : {};
        topicData.questionsCompletedCount = Object.keys(questionsDoneMap).length;
      }
      if (status !== "completed") {
        topicData.completedAt = null;
      }

      // Use a transaction so concurrent calls cannot double-count XP (C9).
      // The transaction returns displayName so the clan write can use it.
      return db.runTransaction(function (transaction) {
        return transaction.get(userRef).then(function (userSnap) {
          var userData = userSnap.exists ? userSnap.data() : {};

          var xpTotal = userData.xpTotal || 0;
          var xpThisWeek = userData.xpThisWeek || 0;
          var topicsCompleted = userData.topicsCompleted || 0;

          var newXpTotal = Math.max(0, xpTotal + xpDelta);
          var newXpThisWeek = Math.max(0, xpThisWeek + xpDelta);
          var newVillageLvl = Math.floor(newXpTotal / 100) + 1;
          var newTopicsCompleted = Math.max(0, topicsCompleted + completedCountDelta);

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

          transaction.set(userRef, userUpdate, { merge: true });
          transaction.set(leaderboardRef, leaderboardData, { merge: true });

          // Return displayName so the post-transaction clan write can use it.
          return userData.displayName || "";
        });
      }).then(function (displayName) {
        // Build the clan completion entry (H6: single merged set, no chained update).
        var completionValue;
        if (status === "completed") {
          completionValue = {
            status: status,
            proofUrl: proofUrl,
            completedAt: firebase.firestore.FieldValue.serverTimestamp(),
            displayName: displayName,
          };
        } else {
          completionValue = firebase.firestore.FieldValue.delete();
        }

        var clanTopicData = {
          topicName: topicName,
          tier: tier,
        };
        clanTopicData["completions." + userId] = completionValue;

        return Promise.all([
          topicRef.set(topicData, { merge: true }),
          clanTopicRef.set(clanTopicData, { merge: true }),
        ]);
      });
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

    // H7: Use a dotted-path atomic field update instead of read-then-write-map
    // to avoid clobbering concurrent checkmarks on the same topic.
    var FieldValue = firebase.firestore.FieldValue;
    var fieldPath = "questionsDone." + questionId;
    var fieldUpdate = {};
    fieldUpdate[fieldPath] = done ? true : FieldValue.delete();

    return topicRef.update(fieldUpdate)
      .catch(function (err) {
        // update() fails if the document doesn't exist yet; fall back to set.
        // Firebase compat SDK uses "firestore/not-found" but guard both forms.
        var code = err.code || "";
        if (code === "not-found" || code === "firestore/not-found") {
          var setUpdate = {};
          setUpdate[fieldPath] = done ? true : FieldValue.delete();
          return topicRef.set({ questionsDone: {} }, { merge: true }).then(function () {
            return topicRef.update(setUpdate);
          });
        }
        throw err;
      })
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
        // Return the updated questionsDone map by reading it back so callers
        // get a consistent count.  This is a single read after the write,
        // not a read-modify-write, so it is safe.
        return topicRef.get().then(function (snap) {
          var questionsDone = (snap.exists && snap.data().questionsDone) || {};
          return { questionsDone: questionsDone, count: Object.keys(questionsDone).length };
        });
      });
  }

  // ---------------------------------------------------------------------------
  // Group-level question stats
  // ---------------------------------------------------------------------------

  function getQuestionStats(questionIds) {
    if (!questionIds || questionIds.length === 0) return Promise.resolve({});

    // M18: Fire all reads in parallel via Promise.all instead of N serial calls.
    var refs = questionIds.map(function (qid) {
      return db.collection("questionStats").doc(qid);
    });

    return Promise.all(refs.map(function (ref) { return ref.get(); }))
      .then(function (snaps) {
        var result = {};
        snaps.forEach(function (snap) {
          if (!snap.exists) {
            result[snap.id] = { totalCompletions: 0, completedBy: {} };
          } else {
            var d = snap.data();
            result[snap.id] = {
              totalCompletions: d.totalCompletions || 0,
              completedBy: d.completedBy || {},
            };
          }
        });
        return result;
      });
  }

  function updateQuestionStat(questionId, opts) {
    // opts: { source, topicId, questionName, userId, displayName, done }
    var userId = opts.userId || "";
    var displayName = opts.displayName || "";
    var done = !!opts.done;

    // H4: Use FieldValue.increment to avoid read-then-write race on totalCompletions.
    // H5: Do not write topicId/source/questionName — they can corrupt stats when
    //     question IDs are shared across topics.
    var FieldValue = firebase.firestore.FieldValue;
    var ref = db.collection("questionStats").doc(questionId);

    var completedByUpdate = {};
    if (done) {
      completedByUpdate["completedBy." + userId] = {
        displayName: displayName,
        completedAt: FieldValue.serverTimestamp(),
      };
    } else {
      completedByUpdate["completedBy." + userId] = FieldValue.delete();
    }

    var payload = Object.assign(
      { totalCompletions: FieldValue.increment(done ? 1 : -1) },
      completedByUpdate
    );

    return ref.set(payload, { merge: true });
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

  function onClanCapitalTopicsChange(callback, onError) {
    return db
      .collection("clanCapital")
      .doc("topics")
      .collection("topics")
      .onSnapshot(function (snap) {
        var docs = snap.docs.map(function (doc) {
          return Object.assign({ id: doc.id }, doc.data());
        });
        callback(docs);
      }, function (err) {
        console.error('[DB] onClanCapitalTopicsChange snapshot error:', err);
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
    onClanCapitalTopicsChange: onClanCapitalTopicsChange,
  };
})();
