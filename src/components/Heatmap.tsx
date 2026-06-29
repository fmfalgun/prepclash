import type { Data } from '../types'
import { paletteCss } from '../store/selectors'
import { todayKey } from '../lib/dates'

interface Props { data: Data; cell?: number; gap?: number }

export function Heatmap({ data, cell = 13, gap = 3 }: Props) {
  const P = paletteCss(data)
  const colors = [
    'rgba(120,160,130,.10)',
    `rgba(${P.rgb},.26)`,
    `rgba(${P.rgb},.45)`,
    `rgba(${P.rgb},.66)`,
    P.a,
  ]

  function lvl(v: number) {
    if (v <= 0) return 0
    if (v < 20)  return 1
    if (v < 40)  return 2
    if (v < 65)  return 3
    return 4
  }

  const today = new Date()
  const cells = []
  for (let i = 181; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    const k = todayKey(d)
    const v = data.activity[k] || 0
    const L = lvl(v)
    cells.push(
      <div
        key={k}
        title={`${k} · ${v}`}
        style={{
          width: cell,
          height: cell,
          borderRadius: 2,
          background: colors[L],
        }}
      />
    )
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateRows: `repeat(7, ${cell}px)`,
      gridAutoFlow: 'column',
      gridAutoColumns: `${cell}px`,
      gap,
    }}>
      {cells}
    </div>
  )
}
