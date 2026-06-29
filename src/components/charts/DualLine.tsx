import { smoothPath } from './chartUtils'

interface Props {
  weights: number[]
  orms: number[]
  width?: number
  height?: number
  accent: string
  strong: string
}

export function DualLine({ weights, orms, width = 860, height = 200, accent, strong }: Props) {
  const pad = { l: 10, r: 12, t: 20, b: 12 }
  const iw = width - pad.l - pad.r
  const ih = height - pad.t - pad.b
  const max = Math.max(1, ...weights, ...orms)
  const n = Math.max(1, weights.length)
  const xp = (i: number) => pad.l + (n === 1 ? iw / 2 : i * iw / (n - 1))
  const wPts: [number, number][] = weights.map((v, i) => [xp(i), pad.t + ih - ih * (v / max)])
  const oPts: [number, number][] = orms.map((v, i) => [xp(i), pad.t + ih - ih * (v / max)])

  const gridYs = [0, 0.33, 0.66, 1].map(f => pad.t + ih * f)
  const maxLabel = Math.round(max) >= 1000 ? (max / 1000).toFixed(1) + 'k' : max.toFixed(1)

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ maxWidth: '100%' }}>
      {gridYs.map((y, i) => (
        <line key={i} x1={pad.l} x2={width - pad.r} y1={y} y2={y} stroke="rgba(255,255,255,.055)" strokeWidth={1} />
      ))}
      <text x={pad.l} y={pad.t - 5} fill={strong} fontSize={9} fontFamily="'Roboto Mono',monospace" opacity={0.55}>{maxLabel} kg</text>
      {oPts.length > 1 && (
        <path d={smoothPath(oPts)} fill="none" stroke="rgba(255,255,255,.28)" strokeWidth={1.6} strokeDasharray="4 4" strokeLinejoin="round" />
      )}
      {wPts.length > 1 && (
        <path d={smoothPath(wPts)} fill="none" stroke={accent} strokeWidth={2.4} strokeLinejoin="round" strokeLinecap="round" />
      )}
      {wPts.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r={2.6} fill={accent} />)}
      {oPts.length > 0 && (
        <circle cx={oPts[oPts.length - 1][0]} cy={oPts[oPts.length - 1][1]} r={3} fill={strong} />
      )}
    </svg>
  )
}
