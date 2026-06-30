import { useMemo, useState } from 'react'
import { useStore } from '../store/useStore'
import { PALETTES } from '../data/palettes'
import { computePBs, computeStreaks, fmtK, fmtSets, weekKey, exVolume, loadKg } from '../lib/workoutStats'
import { AreaLine } from '../components/charts/AreaLine'
import { DualLine } from '../components/charts/DualLine'
import type { WorkoutSession } from '../types'

const card: React.CSSProperties = {
  background: 'var(--card0)', borderRadius: 12, padding: '20px 22px',
}

function Label({ children }: { children: React.ReactNode }) {
  return <div style={{ font: "400 10px 'Roboto Mono'", color: 'var(--mut)', letterSpacing: '.08em', textTransform: 'lowercase', marginBottom: 6 }}>{children}</div>
}

function StatTile({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Label>{label}</Label>
      <div style={{ font: "500 28px/1 'Roboto Mono'", color: 'var(--a)' }}>{value}</div>
      {sub && <div style={{ font: "400 10px 'Roboto Mono'", color: 'var(--mut)' }}>{sub}</div>}
    </div>
  )
}

export function Workout() {
  const data           = useStore(s => s.data)
  const openLog        = useStore(s => s.openLog)
  const openEdit       = useStore(s => s.openEdit)
  const openEditSession = useStore(s => s.openEditSession)
  const selEx          = useStore(s => s.selEx)
  const setSelEx       = useStore(s => s.setSelEx)
  const toggleSession  = useStore(s => s.toggleSession)
  const openSession    = useStore(s => s.openSession)

  const palette = useStore(s => s.data.palette)
  const P = PALETTES[palette] || PALETTES.toxic

  const wl       = data.workoutLab
  const sessions: WorkoutSession[] = wl?.sessions || []
  const days     = wl?.schedule.days || []

  const { best, prSessions } = computePBs(sessions)
  const streaks = computeStreaks(sessions)

  // Weekly volume series (last 12 weeks)
  const weeklyVol: Record<string, number> = {}
  sessions.forEach(s => { const k = weekKey(s.ts); weeklyVol[k] = (weeklyVol[k] || 0) + s.volume })
  const wkKeys = Object.keys(weeklyVol).sort().slice(-12)
  const volSeries = wkKeys.map(k => weeklyVol[k] || 0)

  // All exercise names across sessions
  const allExNames = [...new Set(sessions.flatMap(s => s.exercises.map(e => e.name)))].sort()
  const activeEx   = selEx || allExNames[0] || ''

  // Exercise detail series
  const exSessions = sessions
    .filter(s => s.exercises.some(e => e.name === activeEx))
    .sort((a, b) => a.ts - b.ts)
    .slice(-20)
  const exWeights = exSessions.map(s => {
    const e = s.exercises.find(ex => ex.name === activeEx)
    return e ? Math.max(...e.sets.map(st => st.weight)) : 0
  })
  const exOrms = exSessions.map(s => {
    const e = s.exercises.find(ex => ex.name === activeEx)
    if (!e) return 0
    return Math.max(0, ...e.sets.map(st => loadKg(st.weight, e.mode) * (1 + st.reps / 30)))
  })

  // Total stats
  const totalVol  = sessions.reduce((a, s) => a + s.volume, 0)
  const totalSets = sessions.reduce((a, s) => a + s.totalSets, 0)
  const bestPRName = Object.entries(best).sort((a, b) => b[1].orm - a[1].orm)[0]?.[0] || '—'
  const bestPRORM  = Object.entries(best).sort((a, b) => b[1].orm - a[1].orm)[0]?.[1]

  const now = Date.now()
  const tenDays = 10 * 86400000
  const newPRs = Object.entries(best).filter(([, pb]) => now - pb.ts < tenDays)

  // Week-grouped session history
  const weekGroups = useMemo(() => {
    const groups: { key: string; label: string; sessions: WorkoutSession[] }[] = []
    const sorted = [...sessions].sort((a, b) => b.ts - a.ts)
    sorted.forEach(s => {
      const wk = weekKey(s.ts)
      let g = groups.find(x => x.key === wk)
      if (!g) {
        const dt = new Date(wk)
        const end = new Date(wk); end.setDate(end.getDate() + 6)
        const fmt = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
        g = { key: wk, label: `${fmt(dt)} – ${fmt(end)}`, sessions: [] }
        groups.push(g)
      }
      g.sessions.push(s)
    })
    return groups
  }, [sessions])

  const [collapsedWeeks, setCollapsedWeeks] = useState<Set<string>>(
    () => new Set(weekGroups.slice(1).map(g => g.key))
  )

  const toggleWeek = (key: string) => {
    setCollapsedWeeks(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14 }}>
        <div>
          <div style={{ font: "300 26px/1 'Lexend Deca'", color: 'var(--ink)' }}>workout lab</div>
          <div style={{ font: "400 12px 'Roboto Mono'", color: 'var(--mut)', marginTop: 6 }}>
            {sessions.length} sessions · schedule v{wl?.schedule.version || 1}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={openEdit} style={{
            cursor: 'pointer', border: '1px solid rgba(255,255,255,.12)',
            background: 'var(--cardHi)', color: 'var(--txt)',
            font: "400 12px 'Roboto Mono'", padding: '10px 18px', borderRadius: 8,
          }}>edit schedule</button>
          <button onClick={openLog} style={{
            cursor: 'pointer', border: 'none',
            background: 'var(--a)', color: '#111',
            font: "500 12px 'Roboto Mono'", padding: '10px 20px', borderRadius: 8,
          }}>+ log session</button>
        </div>
      </div>

      {/* Stat tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        <StatTile label="total volume" value={fmtK(totalVol) + ' kg'} sub={`${fmtK(totalSets)} sets logged`} />
        <StatTile label="week streak" value={streaks.cur + ' wk'} sub={`best ${streaks.longest} wk`} />
        <StatTile label="sessions" value={sessions.length} sub={`${days.length}-day split`} />
        <StatTile
          label="top lift"
          value={bestPRName.slice(0, 16)}
          sub={bestPRORM ? `est 1rm ${bestPRORM.orm.toFixed(1)} kg` : '—'}
        />
      </div>

      {/* New PRs banner */}
      {newPRs.length > 0 && (
        <div style={{
          ...card, background: `rgba(${P.rgb},.08)`,
          border: `1px solid rgba(${P.rgb},.2)`,
          display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap',
        }}>
          <span style={{ font: "500 11px 'Roboto Mono'", color: P.a }}>★ new prs</span>
          {newPRs.map(([name, pb]) => (
            <span key={name} style={{ font: "400 11px 'Roboto Mono'", color: 'var(--ink)', background: 'var(--cardHi)', padding: '3px 9px', borderRadius: 5 }}>
              {name} · {pb.orm.toFixed(1)} kg
            </span>
          ))}
        </div>
      )}

      {/* Weekly volume chart */}
      {volSeries.length > 1 && (
        <div style={card}>
          <Label>weekly volume (kg)</Label>
          <AreaLine values={volSeries} accent={P.a} strong={P.a2} rgb={P.rgb} />
        </div>
      )}

      {/* Exercise detail + PR board */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 14 }}>
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
            <Label>exercise</Label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', flex: 1 }}>
              {allExNames.slice(0, 12).map(nm => (
                <button key={nm} onClick={() => setSelEx(nm)} style={{
                  cursor: 'pointer', border: 'none',
                  background: nm === activeEx ? P.a : 'var(--cardHi)',
                  color: nm === activeEx ? '#111' : 'var(--mut)',
                  font: "400 10px 'Roboto Mono'", padding: '5px 10px', borderRadius: 5,
                }}>{nm.slice(0, 20)}</button>
              ))}
            </div>
          </div>
          {exWeights.length > 1
            ? <DualLine weights={exWeights} orms={exOrms} accent={P.a} strong={P.a2} />
            : <div style={{ font: "400 12px 'Roboto Mono'", color: 'var(--mut)', textAlign: 'center', padding: '30px 0' }}>
                {sessions.length ? 'pick an exercise above' : 'log your first session to see charts'}
              </div>
          }
          {best[activeEx] && (
            <div style={{ marginTop: 12, font: "400 10px 'Roboto Mono'", color: 'var(--mut)' }}>
              pb · {best[activeEx].orm.toFixed(1)} kg est 1rm ({best[activeEx].weight.toFixed(1)} kg × {best[activeEx].reps} reps)
            </div>
          )}
        </div>

        <div style={card}>
          <Label>personal records</Label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 6 }}>
            {Object.entries(best).length === 0
              ? <div style={{ font: "400 11px 'Roboto Mono'", color: 'var(--mut)' }}>no prs yet</div>
              : Object.entries(best)
                  .sort((a, b) => b[1].orm - a[1].orm)
                  .slice(0, 18)
                  .map(([name, pb]) => {
                    const isNew = now - pb.ts < tenDays
                    return (
                      <div key={name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ font: "400 11px 'Roboto Mono'", color: 'var(--ink)' }}>
                            {name.slice(0, 22)}
                            {isNew && <span style={{ color: P.a, marginLeft: 5 }}>★</span>}
                          </div>
                          <div style={{ font: "400 9px 'Roboto Mono'", color: 'var(--mut)' }}>
                            {pb.weight.toFixed(1)} kg × {pb.reps}
                          </div>
                        </div>
                        <div style={{ font: "500 12px 'Roboto Mono'", color: P.a }}>
                          {pb.orm.toFixed(0)}
                        </div>
                      </div>
                    )
                  })
            }
          </div>
        </div>
      </div>

      {/* Schedule overview */}
      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Label>current split</Label>
          <span style={{ font: "400 10px 'Roboto Mono'", color: 'var(--mut)' }}>
            v{wl?.schedule.version || 1} · {days.length} days
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
          {days.map(d => (
            <div key={d.id} style={{ background: 'var(--cardHi)', borderRadius: 8, padding: '12px 14px' }}>
              <div style={{ font: "500 11px 'Roboto Mono'", color: 'var(--ink)' }}>{d.name}</div>
              <div style={{ font: "400 9px 'Roboto Mono'", color: 'var(--mut)', marginBottom: 8 }}>{d.muscle}</div>
              {d.exercises.slice(0, 5).map((e, i) => (
                <div key={i} style={{ font: "400 9px 'Roboto Mono'", color: 'var(--mut)', padding: '1px 0' }}>
                  · {e.name.slice(0, 22)}
                </div>
              ))}
              {d.exercises.length > 5 && <div style={{ font: "400 9px 'Roboto Mono'", color: 'var(--mut)' }}>+{d.exercises.length - 5} more</div>}
            </div>
          ))}
        </div>
      </div>

      {/* Session history — week-grouped */}
      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
          <Label>session history · {sessions.length} total</Label>
          <span style={{ font: "400 10px 'Roboto Mono'", color: 'var(--mut)' }}>{weekGroups.length} weeks</span>
        </div>

        {sessions.length === 0
          ? <div style={{ font: "400 12px 'Roboto Mono'", color: 'var(--mut)', textAlign: 'center', padding: '24px 0' }}>
              no sessions yet · tap <span style={{ color: 'var(--a)' }}>+ log session</span> to start
            </div>
          : <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {weekGroups.map(grp => {
                const collapsed = collapsedWeeks.has(grp.key)
                const weekVol = grp.sessions.reduce((a, s) => a + s.volume, 0)
                return (
                  <div key={grp.key} style={{ borderRadius: 9, overflow: 'hidden', border: '1px solid rgba(255,255,255,.07)' }}>
                    {/* Week header */}
                    <button
                      onClick={() => toggleWeek(grp.key)}
                      style={{
                        cursor: 'pointer', border: 'none', background: 'var(--cardHi)',
                        width: '100%', textAlign: 'left', padding: '10px 14px',
                        display: 'flex', alignItems: 'center', gap: 10,
                      }}
                    >
                      <span style={{ font: "500 10px 'Roboto Mono'", color: P.a, flexShrink: 0 }}>{grp.label}</span>
                      <span style={{ font: "400 10px 'Roboto Mono'", color: 'var(--mut)', flex: 1 }}>
                        {grp.sessions.length} session{grp.sessions.length > 1 ? 's' : ''} · {fmtK(weekVol)} kg
                      </span>
                      <span style={{ font: "400 9px 'Roboto Mono'", color: 'var(--mut)' }}>{collapsed ? '▼' : '▲'}</span>
                    </button>

                    {/* Sessions within week */}
                    {!collapsed && (
                      <div style={{ padding: '6px 8px 8px', display: 'flex', flexDirection: 'column', gap: 5 }}>
                        {grp.sessions.map(s => {
                          const open   = openSession === s.id
                          const hasPRs = prSessions[s.id]?.length > 0
                          const date   = new Date(s.ts)
                          const label  = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
                          return (
                            <div key={s.id} style={{ borderRadius: 7, overflow: 'hidden', background: 'rgba(255,255,255,.04)' }}>
                              <div style={{
                                display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px',
                              }}>
                                <button onClick={() => toggleSession(s.id)} style={{
                                  cursor: 'pointer', border: 'none', background: 'transparent',
                                  display: 'flex', alignItems: 'center', gap: 10, flex: 1, textAlign: 'left',
                                }}>
                                  <span style={{ font: "400 10px 'Roboto Mono'", color: 'var(--mut)', flexShrink: 0 }}>{label}</span>
                                  <span style={{ font: "400 11px 'Roboto Mono'", color: 'var(--ink)', flex: 1 }}>{s.dayName}</span>
                                  {hasPRs && <span style={{ font: "500 9px 'Roboto Mono'", color: P.a }}>★ pr</span>}
                                  <span style={{ font: "400 10px 'Roboto Mono'", color: 'var(--mut)' }}>{fmtK(s.volume)} kg</span>
                                  <span style={{ font: "400 10px 'Roboto Mono'", color: 'var(--mut)', flexShrink: 0 }}>{s.durationMin}m</span>
                                  <span style={{ color: 'var(--mut)', fontSize: 9 }}>{open ? '▲' : '▼'}</span>
                                </button>
                                <button
                                  onClick={() => openEditSession(s.id)}
                                  title="edit session"
                                  style={{
                                    cursor: 'pointer', border: 'none', background: 'transparent',
                                    color: 'var(--mut)', fontSize: 11, padding: '2px 4px',
                                    flexShrink: 0,
                                  }}
                                >✎</button>
                              </div>
                              {open && (
                                <div style={{ padding: '0 12px 10px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                                  {s.exercises.map((e, i) => {
                                    const isPR = prSessions[s.id]?.includes(e.name)
                                    const vol  = Math.round(exVolume(e))
                                    return (
                                      <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                        <span style={{ font: "400 10px 'Roboto Mono'", color: 'var(--ink)', flex: 1 }}>
                                          {e.name}
                                          {isPR && <span style={{ color: P.a, marginLeft: 5 }}>★</span>}
                                        </span>
                                        <span style={{ font: "400 9px 'Roboto Mono'", color: 'var(--mut)' }}>
                                          {fmtSets(e)}
                                        </span>
                                        <span style={{ font: "400 9px 'Roboto Mono'", color: 'var(--mut)', minWidth: 48, textAlign: 'right' }}>
                                          {fmtK(vol)} kg
                                        </span>
                                      </div>
                                    )
                                  })}
                                  <div style={{ marginTop: 3, font: "400 9px 'Roboto Mono'", color: 'var(--mut)', borderTop: '1px solid rgba(255,255,255,.07)', paddingTop: 5 }}>
                                    {s.muscle} · {s.totalSets} sets · {s.totalReps} reps · {fmtK(s.volume)} kg total
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
        }
      </div>

    </div>
  )
}
