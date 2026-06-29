import { smoothPath } from './chartUtils'

interface Props {
  values: number[]
  width?: number
  height?: number
  accent: string
  strong: string
  rgb: string
}

export function MiniLine({ values, width = 420, height = 120, accent, strong, rgb }: Props) {
  const pad = { l: 6, r: 8, t: 14, b: 12 }
  const iw = width - pad.l - pad.r
  const ih = height - pad.t - pad.b
  const max = Math.max(1, ...values)
  const n = Math.max(1, values.length)
  const pts: [number, number][] = values.map((v, i) => [
    pad.l + (n === 1 ? iw / 2 : i * iw / (n - 1)),
    pad.t + ih - ih * (v / max),
  ])

  const gridYs = [0, 0.33, 0.66, 1].map(f => pad.t + ih * f)
  const line = smoothPath(pts)
  const area = pts.length > 1
    ? line + ` L${pts[pts.length - 1][0].toFixed(1)},${pad.t + ih} L${pts[0][0].toFixed(1)},${pad.t + ih} Z`
    : ''

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ maxWidth: '100%', minWidth: 260 }}>
      {gridYs.map((y, i) => (
        <line key={i} x1={pad.l} x2={width - pad.r} y1={y} y2={y} stroke="rgba(255,255,255,.055)" strokeWidth={1} />
      ))}
      {area && <path d={area} fill={`rgba(${rgb},.08)`} />}
      {pts.length > 1 && <path d={line} fill="none" stroke={accent} strokeWidth={2.2} strokeLinejoin="round" strokeLinecap="round" />}
      {pts.length > 0 && <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r={3} fill={strong} />}
    </svg>
  )
}
