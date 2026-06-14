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
| DESIGN | System Design + Advanced Graphs % |
| CONSISTENCY | XP earned this week (50 XP/week = 100%) |
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

Built entirely with AI-assisted development using Claude (Anthropic) in a single session. The architecture, feature set, and design spec were planned collaboratively, then individual files were built in parallel using subagents — each agent responsible for one file. The project uses no build tools, no npm, no frameworks — just vanilla browser JS served as static files.

**Session flow:**
1. Defined the full spec in a markdown design document
2. Fanned out 9 parallel agents to write the initial file set simultaneously
3. Iteratively added features (question APIs, home dashboard, collapsible tiers) with additional parallel agent runs
4. Sanity-checked all files for cross-reference bugs, Firestore path consistency, and infinite loop risks

---

*PrepClash — Built for the grind. Designed for the operator.*
