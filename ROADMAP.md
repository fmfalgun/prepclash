# PrepClash — Future Scope & Pending Updates

Items are grouped by screen. Effort tags: S = ~30 min, M = 2-3 h, L = 4-6 h.

---

## Reading Lab `[L]`

**Goal:** Segregate the library by book type and add rich metadata per entry.

### Categories to support
Manga · Manhwa · Manhua · Web Novel · Novel · Fiction · Hacking · (extensible)

- Books added for "just reading" (Manga, Manhwa, etc.) should contribute the **lowest weight** to overall Reading Lab progress.
- Previously defined study/hacking books keep their existing weight.

### New metadata fields
| Field | Applicable to |
|---|---|
| Author | all |
| Publisher | all |
| Edition | Novel / Non-fiction |
| Total pages | all |
| Total chapters | Manga / Manhwa / Web Novel / Novel |
| Total sections | Non-fiction / Hacking |
| Status | all — `ongoing` or `completed` |

### UI changes needed
- Filter bar in the library list (by category, status, ongoing/completed)
- Updated book-add/edit form with the new fields (show/hide fields based on category)
- Progress graphs updated to show comparative breakdown across categories and an overall combined view

---

## Workout Lab — Two-Mode Split `[M]`

**Goal:** Split the current workout screen into a lightweight Day view and a full Analysis view.

### Mode 1 — Day View (default landing)
- Shows the selected day name and its muscle group focus
- Minimal UI — just what you need at the gym
- Option to log a session directly from here if needed
- Mobile-first layout
- Each exercise row shows **last personal best**: `80 kg × 5 reps · 3 weeks ago`
  — derived from session history, computed on render, no extra store field needed

### Mode 2 — Analysis View
- Everything the current Workout Lab already shows (full session history, volume graphs, schedule overview)
- Accessible via a toggle / tab from the Day view
- Should work well on both desktop and mobile

---

## Workout Lab — Delete Session `[S]`

**Goal:** Let users delete a session that was logged by mistake.

- Delete button (with confirm dialog) on each row in the session history list
- Store action: `removeSession(id: string)`
- No cascading effects needed — just remove from `data.workoutSessions`

---

## Notes

- All three features are independent and can be built in any order.
- Estimated total effort: ~7-10 hours across 2-3 sessions.
- Design consistency: follow existing `var(--card0)` / `var(--a)` / `Roboto Mono` token patterns.
