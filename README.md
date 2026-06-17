# PrepClash

> **PREPARE // COMPETE // CONQUER**

A gamified Google interview prep tracker for a small group of friends — built with Clash of Clans mechanics and a Bitburner × terminal operator aesthetic.

---

## What is this?

PrepClash turns interview preparation into a multiplayer progression game. Each player has a personal skill tree (Village), competes on a live XP leaderboard, and contributes to a shared roadmap (Clan Capital). Topics unlock as you complete prerequisites. Every completion requires a proof link.

---

## Features

- **Village** — Personal skill tree with tier-gated topic unlocks (Tier 0 → 4 + Core CS)
- **Clan Capital** — Shared roadmap showing all players' progress side by side
- **Leaderboard** — Live XP rankings with weekly delta tracking
- **Home Dashboard** — Blue Lock-style hexagonal radar chart with 6 skill axes (ALGORITHM, DIFFICULTY, FOUNDATIONS, DESIGN, CONSISTENCY, DOMAIN) + S→G grading
- **Question Bank** — Love Babbar DSA 450 sheet questions per topic + live Codeforces API problems filtered by tag and difficulty tier
- **Group Stats** — See how many friends have solved each question
- **Collapsible Tiers** — Collapse/expand tier sections in the Village for cleaner navigation
- **Google OAuth** — Login with Google, profile auto-created on first login

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Vanilla HTML + CSS + JavaScript (no build tool) |
| Auth | Firebase Authentication (Google OAuth) |
| Database | Firebase Firestore |
| Hosting | GitHub Pages |
| Fonts | JetBrains Mono (Google Fonts CDN) |
| Questions | Love Babbar DSA sheet (local JSON) + Codeforces API (live) |

---

## Project Structure

```
prepclash/
├── index.html                  # App shell, script load order
├── style.css                   # Full terminal theme (Bitburner aesthetic)
├── firebase-config.js          # Your Firebase keys — GITIGNORED, never commit
├── firebase-config.example.js  # Template — copy and fill in your keys
├── auth.js                     # Google OAuth via Firebase Auth
├── db.js                       # All Firestore read/write operations
├── topics.js                   # Topic definitions, tier data, unlock logic
├── questions.js                # Codeforces API fetcher + Love Babbar JSON loader
├── village.js                  # Village tab — skill tree rendering
├── clanCapital.js              # Clan Capital tab — shared roadmap
├── leaderboard.js              # Leaderboard tab — XP rankings
├── home.js                     # Home tab — player dashboard + radar chart
├── app.js                      # Tab routing, auth gate, topbar
└── data/
    └── lovebabbar/             # 22 JSON files, 120 curated questions
        ├── arrays.json
        ├── trees.json
        └── ...
```

---

## Setup

### 1. Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/prepclash.git
cd prepclash
```

### 2. Set up Firebase

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Create a new project
3. Add a Web App → copy the config object
4. Enable **Google** sign-in under Authentication → Sign-in method
5. Add your domains to Authentication → Settings → Authorized domains:
   - `localhost` (for local testing)
   - `YOUR_USERNAME.github.io` (for production)
6. Create a **Firestore Database** (production mode)
7. Set the following Firestore security rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    match /users/{userId}/topics/{topicId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    match /clanCapital/{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    match /leaderboard/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    match /questionStats/{questionId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

### 3. Configure your keys

```bash
cp firebase-config.example.js firebase-config.js
```

Open `firebase-config.js` and replace the placeholder values with your Firebase project config.

### 4. Run locally

```bash
cd prepclash
python3 -m http.server 8080
```

Open `http://localhost:8080` in your browser.

---

## Adding Questions

Questions live in `data/lovebabbar/`. Each file is a JSON array for one topic:

```json
{
  "topicId": "arrays",
  "source": "lovebabbar",
  "questions": [
    {
      "id": "lb_arrays_9",
      "name": "Your Question Name",
      "difficulty": "medium",
      "url": "https://leetcode.com/problems/your-problem/",
      "tags": ["array", "two-pointers"],
      "babbarIndex": 9
    }
  ]
}
```

Codeforces problems load automatically from the live API — no manual addition needed.

---

## Skill Axes (Radar Chart)

| Axis | Measures |
|---|---|
| ALGORITHM | Tier 0–2 DSA topics completed % |
| DIFFICULTY | Tier 3–4 (advanced) topics completed % |
| FOUNDATIONS | OS, DBMS, Networks, OOP completed % |
| DESIGN | System Design % |
| CONSISTENCY | XP earned this week (200 XP/week = 100%) |
| DOMAIN | Overall XP progress (500 XP = 100%) |

Grades: **S** (90-100) → **A** → **B** → **C** → **D** → **E** → **F** → **G** (0-29)

---

## Firestore Data Model

```
/users/{userId}                          # Player profile
/users/{userId}/topics/{topicId}         # Per-topic completion state + questions done
/clanCapital/meta                        # Clan level + XP
/clanCapital/topics/topics/{topicId}     # Shared topic completions map
/leaderboard/{userId}                    # Denormalized XP rankings
/questionStats/{questionId}              # Group stats per question
```

---

## How It Was Built

Built entirely with AI-assisted development using Claude (Anthropic). No build tools, no npm, no frameworks — just vanilla browser JS served as static files on GitHub Pages.

**Session 1 — Initial build:**
1. Defined the full spec in a markdown design document
2. Fanned out 9 parallel subagents to write the initial file set simultaneously
3. Iteratively added features (question APIs, home dashboard, collapsible tiers) with additional parallel agent runs
4. Wired up Firebase Auth (Google OAuth), Firestore, and Google Analytics
5. Deployed to GitHub Pages at `fmfalgun.github.io/prepclash`

**Session 2 — Production readiness audit + fix pass:**

Ran a second round of 8 parallel audit agents (one per file/module), then 7 parallel fix agents. 13 files changed, 816 insertions, 432 deletions.

---

## Changelog

### v0.2.0 — Production Readiness Pass (2026-06-17)

**Critical fixes**
- `questions.js` — CF API failure now sets a negative sentinel (`false`) so failed fetches don't retry infinitely; CF tags fixed for `recursion` (was `divide and conquer`), `tries` (was `string suffix structures`), `oop` and `system_design` (were `implementation`) — all now use empty tags and fall back to Love Babbar data only
- `db.js` — XP updates now run inside a Firestore `runTransaction` to prevent double-counting on concurrent writes; `totalCompletions` uses `FieldValue.increment(±1)`; `markQuestionDone` uses dotted-path field updates (`questionsDone.<id>`) to prevent full-map clobber; clan topic write is now a single atomic `set({merge:true})`
- `village.js` — Fixed infinite render loop: snapshot is now the sole re-render trigger; explicit `renderVillage()` calls removed from click handlers; replaced with lightweight `_refreshCards()` that updates cards in-place without tearing down the listener
- `style.css` — Fixed broken CSS selectors: topbar (`#topbar-title`, `#topbar-player`, `#logout-btn`), modal input (`#modal-proof-input`), modal buttons (`#modal-confirm`, `#modal-cancel`); added full `cc-*` class styles (Clan Capital tab was entirely unstyled); added `lb-row`/`lb-rows` styles; removed 90+ lines of dead `.leaderboard-table` CSS
- `home.js` — Radar chart canvas increased to 340×340, label radius reduced from 155 to 125 to prevent top/bottom labels clipping off-screen; clan progress bar formula fixed (now uses fixed 10-band consistent with `db.js`); new users no longer falsely show `RANK #1`
- `clanCapital.js` — Level formula unified (divisor 10, matching `db.js`); replaced one-shot GET with real-time `onSnapshot` listener; added `[ GO TO VILLAGE ]` CTA since completion happens via Village tab

**High severity fixes**
- `home.js` — DESIGN axis now only measures `system_design` (removed `advanced_graphs` which was double-counted in DIFFICULTY)
- `topics.js` — Fixed wrong prerequisites: `recursion` no longer requires `queue`; `dynamic_programming` no longer requires `graphs` (replaced with `backtracking`); added missing unlocks for `two_pointers → hashing`, `heaps → advanced_graphs`, `backtracking → dynamic_programming`
- `village.js` — Question keys now strictly use `q.id`; `proofLink.href` set to raw URL instead of HTML-escaped string

**Medium fixes**
- `auth.js` — `onAuthStateChange` returns an unsubscribe function; late-resolve captures `currentUser` at registration time; `signOut` clears `window.currentUser` synchronously; `_notifyStateListeners` deferred via `setTimeout(0)` to let downstream modules register first
- `home.js` — CONSISTENCY threshold raised to 200 XP/week (was 50); tick ring moved outside label zone; `_homeRenderGen` render race guard added
- `leaderboard.js` — Column headers re-aligned; XP displayed with thousands separator; `destroyLeaderboard()` teardown exported
- `village.js` — `_renderGen` stale render guard added; domain button disables during save; `destroyVillage()` teardown exported; silent fetch errors now logged
- `questions.js` — LB data path derived dynamically from script URL (no more relative path breakage); `ratingToDifficulty` returns `'unrated'` for CF problems with no rating

**Low / cosmetic fixes**
- `index.html` — Favicon (SVG ⚡), `<meta name="description">`, Open Graph tags added; modal label changed to `<label for="...">` for accessibility; `type="button"` on modal buttons; ARIA attributes added throughout (`role="dialog"`, `role="tab"`, `aria-selected`, `aria-live`)
- `style.css` — Font no longer loaded twice; login logo flicker animation wired to correct class; double padding removed; `.modal-error` styled; `:focus-visible` outline added globally; loading dots animation fixed; dead CSS removed (`.login-decoration`, `.modal-subtitle`)
- `village.js` — Emoji removed from card titles; `border-radius` removed from question rows (breaks terminal aesthetic)
- `data/lovebabbar/graphs.json` — Question IDs renamed `lb_graph_` → `lb_graphs_` for consistency
- `data/lovebabbar/system_design.json` — GFG-sourced questions tagged with `"source": "geeksforgeeks"`
- `data/lovebabbar/bubble_sort.json` — Question 5 marked `"hard"` with note (requires merge sort, not a beginner exercise)

**Known limitations (deferred)**
- `xpThisWeek` requires a Cloud Function to reset weekly — until then "THIS WEEK" leaderboard converges to all-time
- LeetCode API integration not implemented
- Clan Capital completion flow requires going through Village tab (by design)

---

*PrepClash — Built for the grind. Designed for the operator.*
