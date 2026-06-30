import type { Data, Palette } from '../types'
import { SKILL_DEFS } from '../data/skills'
import { skillScore, allSkills } from '../store/selectors'
import { paletteCss } from '../store/selectors'
import { PALETTES } from '../data/palettes'

interface PropsData  { data: Data; size?: number; skillXp?: never; palette?: never }
interface PropsRaw   { skillXp: Record<string, number>; palette?: Palette; size?: number; data?: never }
type Props = PropsData | PropsRaw

export function Radar({ data, skillXp: rawXp, palette: rawPalette, size = 236 }: Props) {
  const P = data ? paletteCss(data) : PALETTES[rawPalette || 'toxic']
  const skills = data ? allSkills(data) : SKILL_DEFS
  const xpOf = (id: string) => data ? skillScore(data, id) : Math.min(99, Math.round((rawXp?.[id] || 0)))

  const n = skills.length
  const cx = size / 2, cy = size / 2, maxR = size / 2 - 28

  function pt(f: number, i: number): [number, number] {
    const a = (-90 + i * (360 / n)) * Math.PI / 180
    const r = maxR * f
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)]
  }

  const rings = [0.25, 0.5, 0.75, 1].map((f, ri) => (
    <polygon
      key={'r' + ri}
      points={skills.map((_, i) => pt(f, i).map(x => x.toFixed(1)).join(',')).join(' ')}
      fill="none"
      stroke={`rgba(${P.rgb},${0.05 + ri * 0.02})`}
      strokeWidth={1}
    />
  ))

  const spokes = skills.map((_, i) => {
    const [x, y] = pt(1, i)
    return <line key={'sp' + i} x1={cx} y1={cy} x2={x} y2={y} stroke={`rgba(${P.rgb},.1)`} strokeWidth={1} />
  })

  const dataPoints = skills.map((s, i) => pt(xpOf(s.id) / 100, i).map(x => x.toFixed(1)).join(',')).join(' ')

  const dots = skills.map((s, i) => {
    const [x, y] = pt(xpOf(s.id) / 100, i)
    return <circle key={'d' + i} cx={x} cy={y} r={2.4} fill={P.a2} />
  })

  const labels = skills.map((s, i) => {
    const [x, y] = pt(1.22, i)
    return (
      <text key={'l' + i} x={x} y={y} fill="#7a8c82" fontSize={7.5}
        fontFamily="'Roboto Mono',monospace" textAnchor="middle" dominantBaseline="middle">
        {s.name.split(' ')[0].slice(0, 7)}
      </text>
    )
  })

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {rings}{spokes}
      <polygon
        points={dataPoints}
        fill={`rgba(${P.rgb},.13)`}
        stroke={P.a}
        strokeWidth={1.6}
      />
      {dots}{labels}
    </svg>
  )
}
