import { Radar } from 'prepclash-v2'

// Minimal data shape Radar actually reads: palette, extraSkills, skillXp, cf.rating, a2oj
const mkData = (
  palette: 'toxic' | 'ember' | 'ice' | 'violet',
  xp: Record<string, number>,
) => ({
  palette,
  extraSkills: [] as any[],
  skillXp: xp,
  cf: {} as any,
  a2oj: [] as any[],
  village: {} as any,
  logs: [] as any[],
  study: {} as any,
  arena: {} as any,
  reading: {} as any,
  workout: {} as any,
  node: {} as any,
  courses: [] as any[],
  books: [] as any[],
  activity: {} as any,
  momentum: 2400,
})

const wrap = (palette: string, children: React.ReactNode) => (
  <div className={`rtt pal-${palette}`} style={{ background: '#050806', padding: 24, display: 'inline-block' }}>
    {children}
  </div>
)

export function ToxicGreen() {
  return wrap('toxic', (
    <Radar data={mkData('toxic', { python: 20, systems: 10, network: 25, web: 30, exploit: 15, cp: 20, physique: 20 })} size={240} />
  ))
}

export function EmberRed() {
  return wrap('ember', (
    <Radar data={mkData('ember', { python: 35, systems: 55, network: 18, web: 42, exploit: 28, cp: 8, physique: 40 })} size={240} />
  ))
}

export function IceBlue() {
  return wrap('ice', (
    <Radar data={mkData('ice', { python: 10, systems: 20, network: 40, web: 35, exploit: 45, cp: 50, physique: 12 })} size={240} />
  ))
}

export function VioletAllRounder() {
  return wrap('violet', (
    <Radar data={mkData('violet', { python: 28, systems: 28, network: 28, web: 28, exploit: 28, cp: 28, physique: 28 })} size={240} />
  ))
}
