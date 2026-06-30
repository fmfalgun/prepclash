import { useStore } from '../store/useStore'
import { PALETTES } from '../data/palettes'
import { Heatmap } from '../components/Heatmap'
import { AreaLine } from '../components/charts/AreaLine'
import { CompetitiveCard } from '../components/CompetitiveCard'
import { allSkills } from '../store/selectors'
import { todayKey } from '../lib/dates'

const card: React.CSSProperties = { background: 'var(--card0)', borderRadius: 11, padding: '22px 24px' }

function Label({ children }: { children: React.ReactNode }) {
  return <div style={{ font: "400 11px 'Roboto Mono'", color: 'var(--mut)', letterSpacing: '.02em', marginBottom: 6 }}>{children}</div>
}

function StatTile({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: boolean }) {
  return (
    <div style={{ ...card, padding: '16px 18px' }}>
      <div style={{ font: "400 11px 'Roboto Mono'", color: 'var(--mut)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</div>
      <div style={{ font: "500 26px/1.1 'Roboto Mono'", color: accent ? 'var(--a)' : 'var(--ink)', marginTop: 8 }}>{value}</div>
      {sub && <div style={{ font: "400 10px 'Roboto Mono'", color: 'var(--mut)', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub}</div>}
    </div>
  )
}

export function Study() {
  const data     = useStore(s => s.data)
  const setModal = useStore(s => s.setModal)
  const palette  = useStore(s => s.data.palette)
  const P = PALETTES[palette] || PALETTES.toxic

  const studyLogs = data.logs.filter(l => l.type === 'study')
  const skills    = allSkills(data)
  const today     = todayKey()

  // daily minutes for last 30 days
  const dailyMins: Record<string, number> = {}
  studyLogs.forEach(l => { dailyMins[l.date] = (dailyMins[l.date] || 0) + (l.mins || 0) })
  const minsSeries: number[] = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i)
    const k = d.toISOString().slice(0, 10)
    minsSeries.push(dailyMins[k] || 0)
  }

  // streaks
  const todayMins = dailyMins[today] || 0
  let dayStreak = 0, longestStreak = 0
  {
    const probe = new Date()
    if (!dailyMins[probe.toISOString().slice(0, 10)]) probe.setDate(probe.getDate() - 1)
    while (dailyMins[probe.toISOString().slice(0, 10)]) { dayStreak++; probe.setDate(probe.getDate() - 1) }
    const days = Object.keys(dailyMins).sort(); let run = 0; let prev: number | null = null
    days.forEach(k => {
      const t = new Date(k).getTime()
      if (prev !== null && Math.round((t - prev) / 86400000) === 1) run++
      else run = 1
      longestStreak = Math.max(longestStreak, run)
      prev = t
    })
  }

  const totalSessions = studyLogs.length
  const totalMins     = studyLogs.reduce((a, l) => a + (l.mins || 0), 0)
  const totalHours    = Math.round(totalMins / 60)
  const avgSession    = totalSessions ? Math.round(totalMins / totalSessions) : 0

  // category focus (minutes per skill)
  const catMins: Record<string, number> = {}
  studyLogs.forEach(l => {
    const kws = l.keywords || []
    const hit = new Set<string>()
    kws.forEach(label => {
      const kw = data.keywords.find(k => k.label === label)
      if (kw) hit.add(kw.skill)
    })
    hit.forEach(s => { catMins[s] = (catMins[s] || 0) + (l.mins || 0) })
  })
  const catArr = Object.entries(catMins).sort((a, b) => b[1] - a[1])
  const catMax = Math.max(1, ...catArr.map(c => c[1]))
  const topCat = catArr[0]
    ? (skills.find(s => s.id === catArr[0][0])?.name || catArr[0][0]).split(' ')[0].toLowerCase()
    : '—'

  // keyword heat
  const kwUsed  = Object.keys(data.kwCounts).filter(k => data.kwCounts[k] > 0)
  const kwMax   = Math.max(1, ...kwUsed.map(k => data.kwCounts[k]))
  const kwDefined = data.keywords.length

  // active days
  const activeDays = Object.keys(dailyMins).length

  const tiles = [
    { label: 'total focus', value: totalHours + 'h', sub: totalMins + ' minutes', accent: false },
    { label: 'sessions',    value: totalSessions,    sub: 'study sessions',       accent: true  },
    { label: 'avg session', value: avgSession + 'm', sub: 'per session',          accent: false },
    { label: 'top category',value: topCat,           sub: catArr[0] ? catArr[0][1] + ' min' : '—', accent: true },
    { label: 'keywords used',value: kwUsed.length,  sub: 'of ' + kwDefined + ' defined', accent: false },
    { label: 'categories',  value: catArr.length,   sub: 'active categories',    accent: false },
  ]

  return (
    <div style={{ maxWidth: 1180, margin: '0 auto', padding: '30px 34px 80px', display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ font: "300 30px/1 'Lexend Deca'", color: 'var(--ink)', letterSpacing: '.01em' }}>study lab</div>
          <div style={{ font: "400 11px 'Roboto Mono'", color: 'var(--mut)', marginTop: 5 }}>
            {totalSessions} sessions · {totalHours}h focused
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => {}} style={{
            cursor: 'pointer', border: 'none', background: 'var(--cardHi)', color: 'var(--txt)',
            font: "400 12px 'Roboto Mono'", padding: '11px 16px', borderRadius: 8,
          }}>categories</button>
          <button onClick={() => setModal('study')} style={{
            cursor: 'pointer', border: 'none', background: 'var(--a)', color: '#1b1c1e',
            font: "500 12px 'Roboto Mono'", padding: '11px 20px', borderRadius: 8,
          }}>+ log work</button>
        </div>
      </div>

      {/* Hero */}
      <div style={{ display: 'grid', gridTemplateColumns: '190px 1fr', gap: 26 }}>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 22, padding: '6px 0' }}>
          {[
            { label: 'focus today', val: todayMins, sub: 'minutes', accent: true },
            { label: 'day streak',  val: dayStreak, sub: 'longest ' + longestStreak, accent: false },
            { label: 'sessions',    val: totalSessions, sub: totalHours + 'h total', accent: false },
          ].map(({ label, val, sub, accent }) => (
            <div key={label}>
              <Label>{label}</Label>
              <div style={{ font: "500 44px/1 'Roboto Mono'", color: accent ? 'var(--a)' : 'var(--ink)', marginTop: 4 }}>{val}</div>
              <div style={{ font: "400 10px 'Roboto Mono'", color: 'var(--mut)', marginTop: 2 }}>{sub}</div>
            </div>
          ))}
        </div>
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
            <span style={{ font: "400 11px 'Roboto Mono'", color: 'var(--txt)' }}>focus minutes per day</span>
            <span style={{ font: "400 10px 'Roboto Mono'", color: 'var(--mut)' }}>last 30 days</span>
          </div>
          <AreaLine values={minsSeries} accent={P.a} strong={P.a2} rgb={P.rgb} />
        </div>
      </div>

      {/* Stat tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 14 }}>
        {tiles.map(t => <StatTile key={t.label} label={t.label} value={t.value} sub={t.sub} accent={t.accent} />)}
      </div>

      {/* Competitive programming lives in the Arena tab */}

      {/* Category focus + Keyword heat */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.25fr', gap: 24 }}>
        <div style={card}>
          <Label>category focus · by minutes</Label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 12 }}>
            {catArr.length === 0
              ? <div style={{ font: "400 11px 'Roboto Mono'", color: 'var(--mut)' }}>no sessions yet</div>
              : catArr.slice(0, 8).map(([id, mins]) => {
                  const name = (skills.find(s => s.id === id)?.name || id).toLowerCase()
                  return (
                    <div key={id}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ font: "400 13px 'Lexend Deca'", color: 'var(--ink)' }}>{name}</span>
                        <span style={{ font: "400 10px 'Roboto Mono'", color: 'var(--mut)' }}>{mins}m</span>
                      </div>
                      <div style={{ height: 6, background: 'var(--cardHi)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ height: '100%', borderRadius: 3, background: 'var(--a)', width: Math.round(mins / catMax * 100) + '%' }} />
                      </div>
                    </div>
                  )
                })
            }
          </div>
        </div>

        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 18 }}>
            <Label>keyword heat</Label>
            <span style={{ font: "400 10px 'Roboto Mono'", color: 'var(--mut)' }}>size = times tagged</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9, alignItems: 'center' }}>
            {kwUsed.length === 0
              ? <span style={{ font: "400 11px 'Roboto Mono'", color: 'var(--mut)' }}>no keywords used yet</span>
              : kwUsed.sort((a, b) => (data.kwCounts[b] || 0) - (data.kwCounts[a] || 0)).slice(0, 40).map(label => {
                  const cnt   = data.kwCounts[label] || 0
                  const t     = cnt / kwMax
                  const fs    = Math.round(9 + t * 5)
                  const alpha = (0.06 + t * 0.16).toFixed(2)
                  return (
                    <span key={label} style={{
                      display: 'inline-block', padding: '6px 11px', borderRadius: 7,
                      background: `rgba(var(--rgb),${alpha})`,
                      color: t > 0.6 ? 'var(--a)' : 'var(--txt)',
                      font: `400 ${fs}px 'Roboto Mono'`,
                    }}>
                      {label} <span style={{ opacity: .6 }}>{cnt}</span>
                    </span>
                  )
                })
            }
          </div>
        </div>
      </div>

      {/* Heatmap */}
      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16 }}>
          <Label>daily activity</Label>
          <span style={{ font: "400 10px 'Roboto Mono'", color: 'var(--mut)' }}>{activeDays} active days · 26 weeks</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <Heatmap data={data} />
        </div>
      </div>

      {/* Recent log */}
      <div style={card}>
        <Label>recent work log</Label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 10 }}>
          {studyLogs.length === 0
            ? <div style={{ font: "400 11px 'Roboto Mono'", color: 'var(--mut)', textAlign: 'center', padding: '20px 0' }}>no sessions yet · tap <span style={{ color: 'var(--a)' }}>+ log work</span> to start</div>
            : studyLogs.slice(0, 10).map((l, i) => {
                const d = new Date(l.ts)
                const dayNum = d.getDate()
                const mon = d.toLocaleDateString('en-US', { month: 'short' }).toLowerCase()
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 16, padding: '13px 4px', borderBottom: i < 9 ? '1px solid rgba(255,255,255,.06)' : 'none' }}>
                    <div style={{ width: 44, flexShrink: 0, textAlign: 'center', paddingTop: 2 }}>
                      <div style={{ font: "400 16px/1 'Roboto Mono'", color: 'var(--ink)' }}>{dayNum}</div>
                      <div style={{ font: "400 9px 'Roboto Mono'", color: 'var(--mut)' }}>{mon}</div>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ font: "400 14px 'Lexend Deca'", color: 'var(--ink)' }}>{l.title}</div>
                      {l.keywords?.length ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                          {l.keywords.map(t => (
                            <span key={t} style={{ font: "400 10px 'Roboto Mono'", color: 'var(--a)', background: `rgba(var(--rgb),.1)`, padding: '2px 7px', borderRadius: 5 }}>{t}</span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ font: "400 15px 'Roboto Mono'", color: 'var(--a)' }}>{l.mins}</div>
                      <div style={{ font: "400 9px 'Roboto Mono'", color: 'var(--mut)' }}>min</div>
                    </div>
                  </div>
                )
              })
          }
        </div>
      </div>

    </div>
  )
}
