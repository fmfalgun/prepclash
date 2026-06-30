# PrepClash — Course chapter data contract

The Shadow Cracker trail reads these files at runtime. Drop a chapter file in and the
matching level fills itself in automatically (no code change). Until the file exists,
the level shows **CONTENT PENDING** (dim + lock).

## Layout

```
data/courses/
  manifest.json                 # the 5 acts (courses) + act-boss heavyProblems
  course<N>/
    manifest.json               # ordered chapter list: [{ code, title }]
    ch<code>.json               # ONE file per chapter — the content below
```

`code` is a string so sub-chapters work: `ch10a.json`, `ch10b.json`.

## Chapter file schema (`ch<code>.json`)

```json
{
  "title": "Linux Fundamentals",
  "summary": "one-line description of the chapter",
  "topics": ["short topic", "short topic"],

  "fights": [
    { "id": "stable-id", "title": "one problem the student solves", "kind": "problem|project" }
  ],

  "boss": {
    "title": "Chapter boss name",
    "questions": ["2 to 5 questions drawn from this chapter"]
  },

  "reading": [{ "label": "source name", "url": "https://..." }],
  "links":   [{ "label": "doc/repo",    "url": "https://..." }]
}
```

### Rules
- **Each fight = one problem.** Cleared (for now) by submitting a GitHub link. Real
  validation comes later — the GUI just records the submission.
- **The chapter boss** is the 2–5 question set. It unlocks only after every fight in the
  chapter is logged; clearing it clears the chapter.
- A course's **act boss** (Vyper, Recursa, …) unlocks once every chapter *and* every side
  lane (books / ladder / CF / physique) in that act is cleared. It then hands out the
  `heavyProblems` listed in `manifest.json` — heavy CSE problems to finish the level.
- `id`s must be stable — progress is keyed on `course/ch<code>#<fightId>`.
