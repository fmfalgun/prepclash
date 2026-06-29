# PrepClash Design System — Agent Conventions

## Setup: wrap every design in the palette root

All CSS custom properties are scoped to `.rtt.pal-{palette}`. Without this wrapper nothing is styled — tokens don't resolve and components appear unstyled.

```jsx
<div className="rtt pal-toxic" style={{ background: 'var(--bg0)', minHeight: '100vh' }}>
  {/* your content here */}
</div>
```

The four palettes swap the accent pair `--a` / `--a2`:

| Palette class | `--a`   | `--a2`   | Mood           |
|---------------|---------|----------|----------------|
| `pal-toxic`   | #39ff88 | #9bff39  | Neon green     |
| `pal-ember`   | #ff5a5a | #ff9f43  | Red / orange   |
| `pal-ice`     | #2da0ff | #00e5ff  | Blue / cyan    |
| `pal-violet`  | #a855f7 | #22d3ee  | Purple / teal  |

Choosing a palette is arbitrary — pick the one that fits the design's mood. `pal-toxic` is the default.

## Token vocabulary

All styling uses inline `style` props with CSS custom properties — **no utility classes** (Tailwind only controls resets in the app shell, never component innards). Reference tokens like `style={{ color: 'var(--ink)' }}`.

| Token      | Value in `.rtt`  | Meaning              |
|------------|-----------------|----------------------|
| `--bg0`    | #050806         | page / modal backdrop |
| `--card0`  | #0b110c         | card surface          |
| `--cardHi` | #111813         | elevated card / hover |
| `--ink`    | #eafff2         | primary text          |
| `--txt`    | #b8d8c4         | body text             |
| `--mut`    | #6a7a72         | muted label           |
| `--dim2`   | #38423c         | very dim / placeholder|
| `--a`      | palette accent  | primary highlight, borders, interactive |
| `--a2`     | palette secondary | gradients, secondary numbers |
| `--rgb`    | e.g. 57,255,136 | raw R,G,B for rgba() overlays |

Use `rgba(var(--rgb), 0.12)` for translucent accent fills (cards, hover states, polygon fills).

## Typography

No CSS classes for type — use inline `font` shorthand with these families:

- **Numbers / code**: `font: "500 18px/1 'Roboto Mono'"` (scores, timestamps, stats)
- **UI labels / headings**: `font: "500 13px 'Lexend Deca'"` (tab names, card titles)
- **Body**: `font: "400 12px 'Inter'"` (descriptions, prose)

Both Roboto Mono and Lexend Deca are loaded from Google Fonts at runtime. No `@font-face` ships in the bundle.

## Where the truth lives

- **Tokens**: `styles.css` → `_ds_bundle.css` → `.rtt` and `.pal-*` rules
- **Per-component props**: `components/general/<Name>/<Name>.d.ts` (e.g. `RadarProps`, `HeatmapProps`)
- **Usage examples**: `components/general/<Name>/<Name>.prompt.md`

## Idiomatic snippet

Dark stat card, neon number, muted label:

```jsx
<div className="rtt pal-toxic" style={{ background: 'var(--bg0)', padding: 32 }}>
  <div style={{
    background: 'var(--card0)',
    border: '1px solid rgba(var(--rgb), .18)',
    borderRadius: 12,
    padding: '24px 28px',
  }}>
    <div style={{ font: "500 32px/1 'Roboto Mono'", color: 'var(--a2)' }}>
      4,821
    </div>
    <div style={{ font: "400 9px 'Roboto Mono'", color: 'var(--mut)', marginTop: 6, letterSpacing: '.08em' }}>
      MOMENTUM
    </div>
  </div>

  {/* Radar component requires a data object with palette + skillXp fields */}
  <PrepClash.Radar
    data={{ palette: 'toxic', extraSkills: [], skillXp: { python: 20, web: 30 }, cf: {}, a2oj: [] }}
    size={240}
  />
</div>
```
