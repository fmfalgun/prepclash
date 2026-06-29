import { useState } from 'react'
import { useStore } from '../store/useStore'
import { Radar } from '../components/Radar'
import { Heatmap } from '../components/Heatmap'
import { PALETTES } from '../data/palettes'
import { COURSE_DEFS } from '../data/skills'
import { allSkills, allBookDefs, skillScore, overallScore, level, rank, streak, todayGain } from '../store/selectors'
import { weekXpNow, ago } from '../lib/dates'
import { CompetitiveCard } from '../components/CompetitiveCard'

const LOG_ICONS: Record<string, string> = { study: '⚡', workout: '⚔', reading: '📖', node: '◈', arena: '▶', course: '✓' }

function squadNumber(sc: number): string {
  // lower score → higher number (Blue Lock style — rank higher = lower squad #)
  const n = Math.max(1, 300 - Math.floor(sc * 2.5))
  return String(n).padStart(3, '0')
}

function PlatformCard({
  title, handle, pulling, onHandleChange, onSync, children, note,
}: {
  title: string
  handle: string
  pulling: boolean
  onHandleChange: (v: string) => void
  onSync: () => void
  children: React.ReactNode
  note?: string
}) {
  return (
    <div style={{ background: 'var(--card0)', borderRadius: 10, padding: '18px 20px' }}>
      <div style={{ font: "500 9px 'Roboto Mono'", letterSpacing: '.12em', color: 'var(--mut)', marginBottom: 12 }}>{title}</div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <input
          value={handle}
          onChange={e => onHandleChange(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && onSync()}
          placeholder="username"
          style={{
            flex: 1, minWidth: 0, background: 'var(--bg0)', border: 'none', borderRadius: 7,
            color: 'var(--ink)', font: "400 12px 'Roboto Mono'", padding: '8px 11px', outline: 'none',
          }}
        />
        <button onClick={onSync} disabled={pulling} style={{
          cursor: pulling ? 'default' : 'pointer', border: 'none',
          background: 'var(--a)', color: '#111',
          font: "500 11px 'Roboto Mono'", padding: '0 14px', borderRadius: 7, opacity: pulling ? .6 : 1,
        }}>{pulling ? '…' : 'sync'}</button>
      </div>
      {children}
      {note && <div style={{ marginTop: 10, font: "400 9px 'Roboto Mono'", color: 'var(--dim2)', lineHeight: 1.5 }}>{note}</div>}
    </div>
  )
}

export function Home() {
  const data       = useStore(s => s.data)
  const setModal   = useStore(s => s.setModal)
  const setPalette = useStore(s => s.setPalette)
  const togglePhase = useStore(s => s.togglePhase)
  const syncMt     = useStore(s => s.syncMt)
  const syncLc     = useStore(s => s.syncLc)
  const setMtHandle = useStore(s => s.setMtHandle)
  const setLcHandle = useStore(s => s.setLcHandle)
  const mtPulling  = useStore(s => s.mtPulling)
  const lcPulling  = useStore(s => s.lcPulling)

  const [mtDraft, setMtDraft] = useState(data.mt.handle || '')
  const [lcDraft, setLcDraft] = useState(data.lc.handle || '')
  const [ccHandle, setCcHandle] = useState('')

  const sc   = Math.round(overallScore(data))
  const lvl  = level(data)
  const rk   = rank(data)
  const st   = streak(data)
  const wXp  = Math.round(weekXpNow(data) || 0)
  const gain = todayGain(data)
  const skills = allSkills(data)
  const sqn  = squadNumber(sc)

  const P = PALETTES[data.palette] || PALETTES.toxic

  function handleMtSync() {
    if (mtDraft !== data.mt.handle) setMtHandle(mtDraft)
    setTimeout(() => syncMt(), 0)
  }
  function handleLcSync() {
    if (lcDraft !== data.lc.handle) setLcHandle(lcDraft)
    setTimeout(() => syncLc(), 0)
  }

  const mt = data.mt
  const lc = data.lc

  const ACTIONS = [
    { icon: '⚡', label: 'STUDY', tip: 'log study session', modal: 'study' as const },
    { icon: '📖', label: 'READING', tip: 'log books & intel', modal: 'reading' as const },
  ]

  return (
    <div style={{ maxWidth: 1360, margin: '0 auto', padding: '28px 26px 80px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2.2fr 1fr', gap: 24, alignItems: 'start' }}>

        {/* LEFT — Face card + skills */}
        <div>
          {/* BLUE LOCK FACE CARD */}
          <div style={{
            position: 'relative', overflow: 'hidden',
            background: `linear-gradient(145deg, #1e2022 0%, var(--card0) 60%, var(--cardHi) 100%)`,
            border: `1px solid rgba(var(--rgb),.18)`,
            borderRadius: 14, padding: '28px 22px 24px',
            marginBottom: 18,
          }}>
            {/* Background squad number */}
            <div style={{
              position: 'absolute', top: -8, right: -10,
              font: "700 100px/1 'Roboto Mono'", letterSpacing: '-.04em',
              color: `rgba(var(--rgb),.055)`,
              userSelect: 'none', pointerEvents: 'none',
            }}>#{sqn}</div>

            {/* Accent stripe */}
            <div style={{
              position: 'absolute', top: 0, left: 0, bottom: 0, width: 4,
              background: `linear-gradient(180deg, var(--a) 0%, var(--a2) 100%)`,
              borderRadius: '14px 0 0 14px',
            }} />

            {/* Header badge */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 20,
              font: "500 8px 'Roboto Mono'", letterSpacing: '.14em', color: 'var(--a)',
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--a)' }} />
              OPERATIVE · PREPCLASH
            </div>

            {/* Avatar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
              <div style={{
                width: 64, height: 64, borderRadius: 12, flexShrink: 0,
                background: `rgba(var(--rgb),.1)`,
                border: `2px solid var(--a)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                font: "500 22px 'Lexend Deca'", color: 'var(--a)',
              }}>
                {(data.profile.name || 'OP').slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div style={{ font: "500 18px/1 'Lexend Deca'", color: 'var(--ink)', letterSpacing: '.02em' }}>
                  {data.profile.name.toUpperCase()}
                </div>
                {data.profile.handle && (
                  <div style={{ font: "400 10px 'Roboto Mono'", color: 'var(--mut)', marginTop: 4 }}>@{data.profile.handle}</div>
                )}
                <div style={{ marginTop: 6, display: 'flex', gap: 6 }}>
                  <span style={{
                    font: "500 10px 'Roboto Mono'", letterSpacing: '.06em',
                    color: '#1b1c1e', background: 'var(--a)',
                    padding: '2px 8px', borderRadius: 4,
                  }}>RANK {rk}</span>
                  <span style={{
                    font: "500 10px 'Roboto Mono'", color: 'var(--a2)',
                    border: '1px solid rgba(var(--a2rgb),.4)',
                    padding: '2px 8px', borderRadius: 4,
                  }}>LVL {lvl}</span>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: 'rgba(var(--rgb),.12)', marginBottom: 16 }} />

            {/* Stats grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { val: data.momentum.toLocaleString(), label: 'momentum' },
                { val: sc,                             label: 'score'    },
                { val: st + 'd',                       label: 'streak'   },
                { val: '+' + gain,                     label: 'today'    },
              ].map(({ val, label }) => (
                <div key={label}>
                  <div style={{ font: "500 20px/1 'Roboto Mono'", color: 'var(--a2)' }}>{val}</div>
                  <div style={{ font: "400 8px 'Roboto Mono'", color: 'var(--mut)', marginTop: 3, letterSpacing: '.06em' }}>{label.toUpperCase()}</div>
                </div>
              ))}
            </div>

            {/* Week XP bar */}
            <div style={{ marginTop: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', font: "400 8px 'Roboto Mono'", color: 'var(--mut)', marginBottom: 5 }}>
                <span>WEEK XP</span><span style={{ color: 'var(--a)' }}>{wXp}</span>
              </div>
              <div style={{ height: 3, background: 'rgba(var(--rgb),.12)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ width: Math.min(100, wXp / 2) + '%', height: '100%', background: `linear-gradient(90deg, var(--a), var(--a2))`, transition: 'width .4s' }} />
              </div>
            </div>
          </div>

          {/* Radar */}
          <div style={{ background: 'var(--card0)', borderRadius: 10, padding: '16px 18px', textAlign: 'center', marginBottom: 18 }}>
            <div style={{ font: "500 9px 'Roboto Mono'", letterSpacing: '.08em', color: 'var(--mut)', marginBottom: 10 }}>SKILL RADAR</div>
            <Radar data={data} size={200} />
          </div>

          {/* Skill bars */}
          <div style={{ background: 'var(--card0)', borderRadius: 10, padding: '16px 18px' }}>
            <div style={{ font: "500 9px 'Roboto Mono'", letterSpacing: '.08em', color: 'var(--mut)', marginBottom: 12 }}>SKILL AXES</div>
            {skills.map(s => {
              const v = skillScore(data, s.id)
              return (
                <div key={s.id} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', font: "400 9px 'Roboto Mono'", color: 'var(--txt)', marginBottom: 4 }}>
                    <span>{s.name}</span><span style={{ color: 'var(--a2)' }}>{v}</span>
                  </div>
                  <div style={{ height: 3, background: 'rgba(var(--rgb),.12)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ width: v + '%', height: '100%', background: 'linear-gradient(90deg,var(--a),var(--a2))', transition: 'width .4s ease' }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* CENTER — Platforms + heatmap + log */}
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
                <div style={{ font: "500 13px 'Lexend Deca'", letterSpacing: '.08em', color: 'var(--a2)' }}>{a.label}</div>
                <div style={{ font: "400 9px 'Roboto Mono'", color: 'var(--dim2)', marginTop: 3 }}>{a.tip}</div>
              </button>
            ))}
          </div>

          {/* Platform integrations */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ font: "500 9px 'Roboto Mono'", letterSpacing: '.12em', color: 'var(--mut)', marginBottom: 14 }}>PLATFORM STATS</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>

              {/* Monkeytype */}
              <PlatformCard
                title="MONKEYTYPE · TYPING SPEED"
                handle={mtDraft}
                pulling={mtPulling}
                onHandleChange={setMtDraft}
                onSync={handleMtSync}
              >
                {mt.error
                  ? <div style={{ font: "400 9px 'Roboto Mono'", color: '#e06060' }}>{mt.error}</div>
                  : mt.lastSync
                    ? <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                        {[
                          { l: '15s pb', v: mt.pb15 ? mt.pb15 + ' wpm' : '—' },
                          { l: '30s pb', v: mt.pb30 ? mt.pb30 + ' wpm' : '—' },
                          { l: '60s pb', v: mt.pb60 ? mt.pb60 + ' wpm' : '—' },
                        ].map(({ l, v }) => (
                          <div key={l} style={{ background: 'var(--bg0)', borderRadius: 7, padding: '8px 10px' }}>
                            <div style={{ font: "400 8px 'Roboto Mono'", color: 'var(--mut)', marginBottom: 3 }}>{l}</div>
                            <div style={{ font: "500 15px/1 'Roboto Mono'", color: 'var(--a)' }}>{v}</div>
                          </div>
                        ))}
                      </div>
                    : <div style={{ font: "400 9px 'Roboto Mono'", color: 'var(--mut)' }}>enter username and sync</div>
                }
                {mt.lastSync && (
                  <div style={{ marginTop: 8, font: "400 9px 'Roboto Mono'", color: 'var(--mut)' }}>
                    {mt.completed?.toLocaleString() ?? '—'} tests · synced {ago(mt.lastSync)}
                  </div>
                )}
              </PlatformCard>

              {/* LeetCode */}
              <PlatformCard
                title="LEETCODE · PROBLEM SOLVING"
                handle={lcDraft}
                pulling={lcPulling}
                onHandleChange={setLcDraft}
                onSync={handleLcSync}
                note={lc.error?.includes('CORS') ? 'LC blocks browser requests — try again or enter stats manually' : undefined}
              >
                {lc.error && !lc.error.includes('CORS')
                  ? <div style={{ font: "400 9px 'Roboto Mono'", color: '#e06060' }}>{lc.error}</div>
                  : lc.lastSync
                    ? <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8 }}>
                        {[
                          { l: 'solved', v: lc.solved ?? '—' },
                          { l: 'easy',   v: lc.easy   ?? '—' },
                          { l: 'medium', v: lc.medium  ?? '—' },
                          { l: 'hard',   v: lc.hard    ?? '—' },
                        ].map(({ l, v }) => (
                          <div key={l} style={{ background: 'var(--bg0)', borderRadius: 7, padding: '8px 10px' }}>
                            <div style={{ font: "400 8px 'Roboto Mono'", color: 'var(--mut)', marginBottom: 3 }}>{l}</div>
                            <div style={{ font: "500 15px/1 'Roboto Mono'", color: 'var(--a)' }}>{v}</div>
                          </div>
                        ))}
                      </div>
                    : <div style={{ font: "400 9px 'Roboto Mono'", color: 'var(--mut)' }}>enter username and sync</div>
                }
                {lc.lastSync && lc.ranking && (
                  <div style={{ marginTop: 8, font: "400 9px 'Roboto Mono'", color: 'var(--mut)' }}>
                    global rank #{lc.ranking.toLocaleString()}
                  </div>
                )}
              </PlatformCard>
            </div>

            {/* Codeforces + CodeChef row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <CompetitiveCard />

              {/* CodeChef — no public browser API, link only */}
              <div style={{ background: 'var(--card0)', borderRadius: 10, padding: '18px 20px' }}>
                <div style={{ font: "500 9px 'Roboto Mono'", letterSpacing: '.12em', color: 'var(--mut)', marginBottom: 12 }}>CODECHEF · COMPETITIVE</div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                  <input
                    value={ccHandle}
                    onChange={e => setCcHandle(e.target.value)}
                    placeholder="username"
                    style={{
                      flex: 1, background: 'var(--bg0)', border: 'none', borderRadius: 7,
                      color: 'var(--ink)', font: "400 12px 'Roboto Mono'", padding: '8px 11px', outline: 'none',
                    }}
                  />
                  <a
                    href={ccHandle ? `https://www.codechef.com/users/${ccHandle}` : 'https://www.codechef.com'}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      padding: '0 14px', borderRadius: 7, background: 'var(--cardHi)',
                      color: 'var(--a2)', font: "500 11px 'Roboto Mono'", textDecoration: 'none',
                    }}
                  >open ↗</a>
                </div>
                <div style={{ font: "400 9px 'Roboto Mono'", color: 'var(--dim2)', lineHeight: 1.6 }}>
                  CodeChef blocks browser API requests — enter your handle to open your profile page directly
                </div>
              </div>
            </div>
          </div>

          {/* Heatmap */}
          <div style={{ background: 'var(--card0)', borderRadius: 10, padding: '16px 18px', marginBottom: 20 }}>
            <div style={{ font: "500 9px 'Roboto Mono'", letterSpacing: '.08em', color: 'var(--mut)', marginBottom: 12 }}>26-WEEK ACTIVITY</div>
            <div style={{ overflowX: 'auto', paddingBottom: 4 }}>
              <Heatmap data={data} />
            </div>
          </div>

          {/* Activity log */}
          <div style={{ background: 'var(--card0)', borderRadius: 10, padding: 18 }}>
            <div style={{ font: "500 9px 'Roboto Mono'", letterSpacing: '.08em', color: 'var(--mut)', marginBottom: 12 }}>ACTIVITY FEED</div>
            {data.logs.length === 0 && (
              <div style={{ font: "400 10px 'Roboto Mono'", color: 'var(--dim2)', textAlign: 'center', padding: 20 }}>
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
                  <div style={{ font: "500 11px 'Lexend Deca'", color: 'var(--ink)', lineHeight: 1.3 }}>{log.title}</div>
                  {log.keywords?.length ? (
                    <div style={{ font: "400 9px 'Roboto Mono'", color: 'var(--dim2)', marginTop: 3 }}>{log.keywords.join(', ')}</div>
                  ) : null}
                </div>
                <span style={{ font: "500 11px 'Lexend Deca'", color: 'var(--a2)', whiteSpace: 'nowrap' }}>+{log.gain}</span>
                <span style={{ font: "400 9px 'Roboto Mono'", color: 'var(--dim2)', whiteSpace: 'nowrap' }}>{ago(log.ts)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT — Courses, books, palette */}
        <div>
          {/* Courses */}
          <div style={{ background: 'var(--card0)', borderRadius: 10, padding: 16, marginBottom: 18 }}>
            <div style={{ font: "500 9px 'Roboto Mono'", letterSpacing: '.08em', color: 'var(--mut)', marginBottom: 12 }}>TARGET COURSES</div>
            {COURSE_DEFS.map(c => {
              const state = data.courses.find(x => x.id === c.id)
              const done = state ? state.done.filter(Boolean).length : 0
              return (
                <div key={c.id} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', font: "500 10px 'Lexend Deca'", color: 'var(--ink)', marginBottom: 6 }}>
                    <span>{c.name}</span>
                    <span style={{ font: "400 9px 'Roboto Mono'", color: 'var(--mut)' }}>{done}/{c.phases.length}</span>
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

          {/* Books mini */}
          <div style={{ background: 'var(--card0)', borderRadius: 10, padding: 16, marginBottom: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ font: "500 9px 'Roboto Mono'", letterSpacing: '.08em', color: 'var(--mut)' }}>READING LIST</div>
              <button onClick={() => setModal('reading')} style={{ cursor: 'pointer', background: 'transparent', border: 'none', color: 'var(--a2)', fontSize: 14 }}>+</button>
            </div>
            {allBookDefs(data).slice(0, 8).map(def => {
              const st = data.books.find(x => x.id === def.id)
              const done = st ? st.done : 0
              const pct = Math.min(100, (done / def.total) * 100)
              return (
                <div key={def.id} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', font: "400 9px 'Roboto Mono'", color: 'var(--txt)', marginBottom: 4 }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>{def.title}</span>
                    <span style={{ color: 'var(--dim2)' }}>{done}/{def.total}</span>
                  </div>
                  <div style={{ height: 3, background: 'rgba(var(--rgb),.12)', borderRadius: 2 }}>
                    <div style={{ width: pct + '%', height: '100%', background: 'var(--a2)', transition: 'width .3s' }} />
                  </div>
                </div>
              )
            })}
            {allBookDefs(data).length > 8 && (
              <div style={{ font: "400 9px 'Roboto Mono'", color: 'var(--mut)', textAlign: 'center', marginTop: 8 }}>
                +{allBookDefs(data).length - 8} more → reading tab
              </div>
            )}
          </div>

          {/* Palettes */}
          <div style={{ background: 'var(--card0)', borderRadius: 10, padding: 16 }}>
            <div style={{ font: "500 9px 'Roboto Mono'", letterSpacing: '.08em', color: 'var(--mut)', marginBottom: 10 }}>PALETTE</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {(Object.entries(PALETTES) as [string, typeof PALETTES.toxic][]).map(([id, Pal]) => (
                <button
                  key={id}
                  onClick={() => setPalette(id as Parameters<typeof setPalette>[0])}
                  style={{
                    cursor: 'pointer', border: `1px solid ${data.palette === id ? Pal.a2 : 'rgba(255,255,255,.08)'}`,
                    background: `rgba(${Pal.rgb},.08)`, borderRadius: 5, padding: '8px 12px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    color: Pal.a, font: "500 10px 'Roboto Mono'", letterSpacing: '.06em',
                  }}
                >
                  <span>{Pal.name}</span>
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
