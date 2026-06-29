import { Heatmap } from 'prepclash-v2'

// Deterministic activity with high enough values to show vivid color contrast
function makeActivity(seed: number): Record<string, number> {
  const result: Record<string, number> = {}
  const base = new Date('2026-06-29')
  for (let i = 0; i < 182; i++) {
    const d = new Date(base)
    d.setDate(base.getDate() - i)
    const key = d.toISOString().split('T')[0]
    // ~75% fill density, all values in 40-100 range so level 2-4 cells are visible
    const fill = (seed * 7 + i * 43) % 10
    if (fill < 8) {
      result[key] = 40 + ((seed * i * 13 + 11) % 60) // 40–100
    }
  }
  return result
}

const wrap = (palette: string, children: React.ReactNode) => (
  <div className={`rtt pal-${palette}`} style={{ background: '#050806', padding: 20 }}>
    {children}
  </div>
)

export function ToxicActivity() {
  return wrap('toxic', (
    <Heatmap data={{ palette: 'toxic', activity: makeActivity(7) } as any} />
  ))
}

export function EmberActivity() {
  return wrap('ember', (
    <Heatmap data={{ palette: 'ember', activity: makeActivity(13) } as any} />
  ))
}

export function IceCompact() {
  return wrap('ice', (
    <Heatmap data={{ palette: 'ice', activity: makeActivity(5) } as any} cell={10} gap={2} />
  ))
}
