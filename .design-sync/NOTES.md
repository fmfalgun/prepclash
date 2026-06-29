# PrepClash Design Sync Notes

## Repo shape

- **Not a component library** — prepClash is a Vite SPA. No dist/ entry, no `.d.ts` tree, no barrel exports.
- Build command: `npm run build` (produces SPA dist/, not a library — not used by the converter)
- Converter runs in synth-entry mode: `--entry ./src/ds-entry.ts` (handmade barrel)
- All DTS props are hand-written via `cfg.dtsPropsFor` (no emitted types, `noEmit: true` in tsconfig)

## Components bundled

- **Radar** — prop-driven; takes `data` with `palette`, `skillXp`, `extraSkills`, `cf`, `a2oj`. Real authored preview.
- **Heatmap** — prop-driven; takes `data` with `palette`, `activity`. Real authored preview. `cardMode: column` applied (grid overflow — component is wider than cards).
- **Toast** — store-connected, renders null without active toast → floor card (expected, not a failure).
- **TopBar** — store-connected, renders with initial store defaults (empty operative name, momentum=0, tabs visible). Renders correctly.

## Known issues / warnings

- **Playwright grading screenshots appear very dark for Heatmap**: The per-story capture (`package-capture.mjs`) renders cells much darker than the actual browser render. Verified via direct chromium screenshot — cells render correctly with vivid palette colors. Root cause unknown (possibly a Playwright CDP color profile issue). Grades were set based on the verified direct render.
- **Heatmap mock data**: Activity keys use `toISOString().split('T')[0]` — should match `todayKey()` in UTC; verify if timezone drift causes mismatch in a different environment.
- **CSS entry is stable**: `src/ds-tokens.css` is committed and stable across builds (unlike the hashed Vite SPA output).

## Build command for re-sync

```sh
node .ds-sync/package-build.mjs \
  --config .design-sync/config.json \
  --node-modules ./node_modules \
  --entry ./src/ds-entry.ts \
  --out ./ds-bundle
```

If components are added, update `src/ds-entry.ts` to include the new export, and add it to `cfg.componentSrcMap`.

## Re-sync risks

- **`src/ds-entry.ts` can drift**: New components added to `src/components/` won't appear in the bundle unless manually added to `ds-entry.ts` and `cfg.componentSrcMap`.
- **`dtsPropsFor` can rot**: If the component signatures change (e.g. `Radar` stops accepting the `data.skills` field), the hand-written props will be stale. Re-sync should spot-check the rendered previews against the live source.
- **Heatmap preview colors**: Authoring used a pseudo-random activity generator. If the heatmap rendering changes (color formula change), re-verify the preview looks correct via a direct browser open.
- **TopBar renders with initial Zustand state**: If seedData() defaults change significantly, TopBar might render differently (different momentum value, different palette). Not a blocker.
- **Firebase imports in bundle**: The bundle includes firebase import URLs (gstatic.com CDN). These dynamic imports are no-ops in the preview context — they don't block rendering. If Firebase is removed or the CDN URL changes, the bundle is unaffected (the imports are never called in preview).
- **Playwright version**: `playwright@latest` installed in `.ds-sync/node_modules`. Chromium headless shell 1228 downloaded to `~/.cache/ms-playwright/`. On a fresh machine, run `npx playwright install chromium` from `.ds-sync/`.
