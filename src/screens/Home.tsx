import { useStore } from '../store/useStore'
import { Radar } from '../components/Radar'
import { Heatmap } from '../components/Heatmap'
import { PALETTES } from '../data/palettes'
import { COURSE_DEFS } from '../data/skills'
import { allSkills, allBookDefs, skillScore, overallScore, cpScore, level, rank, streak, todayGain } from '../store/selectors'
import { weekXpNow, ago } from '../lib/dates'

const LOG_ICONS: Record<string, string> = { study: '⚡', workout: '⚔', reading: '📖', node: '◈', arena: '▶', course: '✓' }

export function Home() {
  const data     = useStore(s => s.data)
  const setModal = useStore(s => s.setModal)
  const setPalette = useStore(s => s.setPalette)
  const togglePhase = useStore(s => s.togglePhase)

  const sc   = Math.round(overallScore(data))
  const lvl  = level(data)
  const rk   = rank(data)
  const st   = streak(data)
  const wXp  = Math.round(weekXpNow(data) || 0)
  const gain = todayGain(data)
  const skills = allSkills(data)

  const ACTIONS = [
    { icon: '⚡', label: 'STUDY', tip: 'Log office session', modal: 'study' as const },
    { icon: '⚔', label: 'WORKOUT', tip: 'Toji split', modal: 'workout' as const },
    { icon: '📖', label: 'READING', tip: 'Books & intel', modal: 'reading' as const },
  ]

  return (
    <div style={{ maxWidth: 1360, margin: '0 auto', padding: '28px 26px 80px' }}>
      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2.4fr 1fr', gap: 24, alignItems: 'start' }}>

        {/* LEFT — Radar + identity */}
        <div>
          <div style={{ background: 'rgba(var(--rgb),.04)', border: '1px solid rgba(var(--rgb),.12)', borderRadius: 7, padding: 18, textAlign: 'center', marginBottom: 18 }}>
            <Radar data={data} size={220} />
            <div style={{ marginTop: 12, font: "700 28px 'Rajdhani'", color: 'var(--ink)' }}>
              {data.profile.name.toUpperCase()}
            </div>
            <div style={{ font: "400 10px 'Share Tech Mono'", color: 'var(--mut)', letterSpacing: '.2em' }}>
              {data.profile.handle} · {rk}
            </div>
          </div>

          {/* Skill bars */}
          <div style={{ background: 'rgba(var(--rgb),.03)', border: '1px solid rgba(var(--rgb),.1)', borderRadius: 7, padding: 16 }}>
            <div style={{ font: "700 9px 'Share Tech Mono'", letterSpacing: '.2em', color: 'var(--mut)', marginBottom: 12 }}>SKILL AXES</div>
            {skills.map(s => {
              const v = skillScore(data, s.id)
              return (
                <div key={s.id} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', font: "400 9px 'Share Tech Mono'", color: 'var(--txt)', marginBottom: 4 }}>
                    <span>{s.name}</span><span style={{ color: 'var(--a2)' }}>{v}</span>
                  </div>
                  <div style={{ height: 3, background: 'rgba(var(--rgb),.12)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ width: v + '%', height: '100%', background: 'linear-gradient(90deg,var(--a),var(--a2))', boxShadow: '0 0 6px rgba(var(--a2rgb),.5)', transition: 'width .4s ease' }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* CENTER — Hero + heatmap + log */}
        <div>
          {/* Action bar */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 22 }}>
            {ACTIONS.map(a => (
              <button
                key={a.modal}
                onClick={() => setModal(a.modal)}
                style={{
                  cursor: 'pointer', flex: 1, border: '1px solid rgba(var(--a2rgb),.22)',
                  background: 'linear-gradient(180deg,rgba(var(--a2rgb),.08),rgba(var(--rgb),.04))',
                  borderRadius: 7, padding: '16px 10px', textAlign: 'center', color: 'var(--ink)',
                }}
              >
                <div style={{ fontSize: 22, marginBottom: 4 }}>{a.icon}</div>
                <div style={{ font: "700 13px 'Rajdhani'", letterSpacing: '.08em', color: 'var(--a2)' }}>{a.label}</div>
                <div style={{ font: "400 9px 'Share Tech Mono'", color: 'var(--dim2)', marginTop: 3 }}>{a.tip}</div>
              </button>
            ))}
          </div>

          {/* Score hero */}
          <div style={{ background: 'rgba(var(--a2rgb),.04)', border: '1px solid rgba(var(--a2rgb),.18)', borderRadius: 7, padding: '22px 24px', marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 20 }}>
              <div>
                <div style={{ font: "700 9px 'Share Tech Mono'", letterSpacing: '.3em', color: 'var(--mut)' }}>OVERALL SCORE</div>
                <div style={{ font: "700 64px/1 'Rajdhani'", color: 'var(--ink)', textShadow: '0 0 30px rgba(var(--a2rgb),.3)', marginTop: 4 }}>{sc}</div>
                <div style={{ font: "700 11px 'Share Tech Mono'", color: 'var(--a)', marginTop: 6 }}>LVL {lvl} · RANK {rk}</div>
              </div>
              <div style={{ display: 'flex', gap: 18, alignItems: 'flex-end' }}>
                {[
                  { n: data.momentum.toLocaleString(), l: 'MOMENTUM' },
                  { n: '+' + gain, l: 'TODAY' },
                  { n: wXp, l: 'THIS WEEK' },
                  { n: st + 'd', l: 'STREAK' },
                ].map(({ n, l }) => (
                  <div key={l} style={{ textAlign: 'center' }}>
                    <div style={{ font: "700 20px/1 'Rajdhani'", color: 'var(--a2)' }}>{n}</div>
                    <div style={{ font: "400 8px 'Share Tech Mono'", color: 'var(--mut)', marginTop: 3 }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Heatmap */}
          <div style={{ background: 'rgba(var(--rgb),.03)', border: '1px solid rgba(var(--rgb),.1)', borderRadius: 7, padding: '16px 18px', marginBottom: 20 }}>
            <div style={{ font: "700 9px 'Share Tech Mono'", letterSpacing: '.2em', color: 'var(--mut)', marginBottom: 12 }}>26-WEEK ACTIVITY</div>
            <div style={{ overflowX: 'auto', paddingBottom: 4 }}>
              <Heatmap data={data} />
            </div>
          </div>

          {/* Activity log */}
          <div style={{ background: 'rgba(var(--rgb),.03)', border: '1px solid rgba(var(--rgb),.1)', borderRadius: 7, padding: 16 }}>
            <div style={{ font: "700 9px 'Share Tech Mono'", letterSpacing: '.2em', color: 'var(--mut)', marginBottom: 12 }}>ACTIVITY FEED</div>
            {data.logs.length === 0 && (
              <div style={{ font: "400 10px 'Share Tech Mono'", color: 'var(--dim2)', textAlign: 'center', padding: 20 }}>
                No entries yet. Log your first session.
              </div>
            )}
            {data.logs.slice(0, 20).map((log, i) => (
              <div
                key={i}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10, padding: '9px 0',
                  borderBottom: i < 19 && i < data.logs.length - 1 ? '1px solid rgba(var(--rgb),.07)' : 'none',
                }}
              >
                <span style={{ fontSize: 14, marginTop: 1, flex: '0 0 20px', textAlign: 'center' }}>{LOG_ICONS[log.type] || '·'}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ font: "500 11px 'Inter'", color: 'var(--ink)', lineHeight: 1.3 }}>{log.title}</div>
                  {log.keywords?.length ? (
                    <div style={{ font: "400 9px 'Share Tech Mono'", color: 'var(--dim2)', marginTop: 3 }}>{log.keywords.join(', ')}</div>
                  ) : null}
                </div>
                <span style={{ font: "700 11px 'Rajdhani'", color: 'var(--a2)', whiteSpace: 'nowrap' }}>+{log.gain}</span>
                <span style={{ font: "400 9px 'Share Tech Mono'", color: 'var(--dim2)', whiteSpace: 'nowrap' }}>{ago(log.ts)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT — Courses, workout, palette */}
        <div>
          {/* CP Score / Codeforces */}
          <div style={{ background: 'rgba(var(--rgb),.03)', border: '1px solid rgba(var(--rgb),.1)', borderRadius: 7, padding: 16, marginBottom: 18 }}>
            <div style={{ font: "700 9px 'Share Tech Mono'", letterSpacing: '.2em', color: 'var(--mut)', marginBottom: 10 }}>COMPETITIVE PROG</div>
            <div style={{ font: "700 36px/1 'Rajdhani'", color: 'var(--ink)' }}>{cpScore(data)}</div>
            <div style={{ font: "400 9px 'Share Tech Mono'", color: 'var(--dim2)', marginTop: 4 }}>CP SCORE</div>
            <div style={{ marginTop: 10, font: "400 10px 'Share Tech Mono'", color: 'var(--txt)' }}>
              {data.cf.handle && <span>CF: <span style={{ color: 'var(--a2)' }}>{data.cf.rating || '—'}</span></span>}
            </div>
          </div>

          {/* Courses */}
          <div style={{ background: 'rgba(var(--rgb),.03)', border: '1px solid rgba(var(--rgb),.1)', borderRadius: 7, padding: 16, marginBottom: 18 }}>
            <div style={{ font: "700 9px 'Share Tech Mono'", letterSpacing: '.2em', color: 'var(--mut)', marginBottom: 12 }}>COURSES</div>
            {COURSE_DEFS.map(c => {
              const state = data.courses.find(x => x.id === c.id)
              const done = state ? state.done.filter(Boolean).length : 0
              return (
                <div key={c.id} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', font: "500 10px 'Inter'", color: 'var(--ink)', marginBottom: 6 }}>
                    <span>{c.name}</span>
                    <span style={{ font: "400 9px 'Share Tech Mono'", color: 'var(--mut)' }}>{done}/{c.phases.length}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {c.phases.map((ph, idx) => {
                      const on = !!(state?.done[idx])
                      return (
                        <div
                          key={idx}
                          title={ph}
                          onClick={() => togglePhase(c.id, idx)}
                          style={{
                            flex: 1, height: 20, borderRadius: 3, cursor: 'pointer',
                            background: on ? 'var(--a2)' : 'rgba(var(--rgb),.1)',
                            boxShadow: on ? '0 0 8px rgba(var(--a2rgb),.4)' : 'none',
                            transition: 'background .2s',
                          }}
                        />
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Books */}
          <div style={{ background: 'rgba(var(--rgb),.03)', border: '1px solid rgba(var(--rgb),.1)', borderRadius: 7, padding: 16, marginBottom: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ font: "700 9px 'Share Tech Mono'", letterSpacing: '.2em', color: 'var(--mut)' }}>INTEL / BOOKS</div>
              <button onClick={() => setModal('reading')} style={{ cursor: 'pointer', background: 'transparent', border: 'none', color: 'var(--a2)', fontSize: 14 }}>+</button>
            </div>
            {allBookDefs(data).map(def => {
              const st = data.books.find(x => x.id === def.id)
              const done = st ? st.done : 0
              const pct = Math.min(100, (done / def.total) * 100)
              return (
                <div key={def.id} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', font: "400 9px 'Share Tech Mono'", color: 'var(--txt)', marginBottom: 4 }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>{def.title}</span>
                    <span style={{ color: 'var(--dim2)' }}>{done}/{def.total}</span>
                  </div>
                  <div style={{ height: 3, background: 'rgba(var(--rgb),.12)', borderRadius: 2 }}>
                    <div style={{ width: pct + '%', height: '100%', background: 'var(--a2)', transition: 'width .3s' }} />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Palettes */}
          <div style={{ background: 'rgba(var(--rgb),.03)', border: '1px solid rgba(var(--rgb),.1)', borderRadius: 7, padding: 16 }}>
            <div style={{ font: "700 9px 'Share Tech Mono'", letterSpacing: '.2em', color: 'var(--mut)', marginBottom: 10 }}>PALETTE</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {(Object.entries(PALETTES) as [string, typeof PALETTES.toxic][]).map(([id, P]) => (
                <button
                  key={id}
                  onClick={() => setPalette(id as any)}
                  style={{
                    cursor: 'pointer', border: `1px solid ${data.palette === id ? P.a2 : 'rgba(255,255,255,.08)'}`,
                    background: `rgba(${P.rgb},.08)`, borderRadius: 5, padding: '8px 12px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    color: P.a, font: "700 10px 'Share Tech Mono'", letterSpacing: '.06em',
                  }}
                >
                  <span>{P.name}</span>
                  {data.palette === id && <span style={{ fontSize: 12 }}>◈</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
