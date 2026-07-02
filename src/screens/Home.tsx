import { useState, useMemo } from 'react'
import { useStore } from '../store/useStore'
import { Radar } from '../components/Radar'
import { Heatmap } from '../components/Heatmap'
import { PALETTES } from '../data/palettes'
import { COURSE_DEFS } from '../data/skills'
import { allSkills, allBookDefs, skillScore, overallScore, level, rank, streak, todayGain } from '../store/selectors'
import { weekXpNow, ago } from '../lib/dates'
import type { LogEntry } from '../types'
import { CompetitiveCard } from '../components/CompetitiveCard'

const LOG_ICONS: Record<string, string> = { study: '⚡', workout: '⚔', reading: '📖', node: '◈', arena: '▶', course: '✓' }

function squadNumber(sc: number): string {
  // lower score → higher number (Blue Lock style — rank higher = lower squad #)
  const n = Math.max(1, 300 - Math.floor(sc * 2.5))
  return String(n).padStart(3, '0')
}

function dateLabel(ts: number): string {
  const now = Date.now()
  const diffD = Math.floor((now - ts) / 86400000)
  if (diffD === 0) return 'today'
  if (diffD === 1) return 'yesterday'
  if (diffD < 7) return `${diffD} days ago`
  if (diffD < 14) return '1 week ago'
  return `${Math.floor(diffD / 7)} weeks ago`
}

function feedDateKey(ts: number): string {
  return new Date(ts).toDateString()
}

function FeedCard({ logs, showAll, onToggle }: { logs: LogEntry[]; showAll: boolean; onToggle: () => void }) {
  const visible = showAll ? logs : logs.slice(0, 25)
  const groups = useMemo(() => {
    const map = new Map<string, { label: string; entries: LogEntry[] }>()
    visible.forEach(log => {
      const k = feedDateKey(log.ts)
      if (!map.has(k)) map.set(k, { label: dateLabel(log.ts), entries: [] })
      map.get(k)!.entries.push(log)
    })
    return Array.from(map.values())
  }, [visible])

  return (
    <div style={{ background: 'var(--card0)', borderRadius: 10, padding: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ font: "500 9px 'Roboto Mono'", letterSpacing: '.08em', color: 'var(--mut)' }}>ACTIVITY</div>
        {logs.length > 25 && (
          <button onClick={onToggle} style={{
            cursor: 'pointer', background: 'transparent', border: 'none',
            font: "400 9px 'Roboto Mono'", color: 'var(--a)',
          }}>
            {showAll ? 'show less' : `show all (${logs.length})`}
          </button>
        )}
      </div>
      {logs.length === 0 && (
        <div style={{ font: "400 10px 'Roboto Mono'", color: 'var(--dim2)', textAlign: 'center', padding: 20 }}>
          no entries yet — log your first session
        </div>
      )}
      {groups.map((g, gi) => (
        <div key={gi}>
          <div style={{
            font: "400 8px 'Roboto Mono'", letterSpacing: '.08em', color: 'var(--dim)', textTransform: 'uppercase',
            padding: '10px 0 6px', borderTop: gi > 0 ? '1px solid rgba(var(--rgb),.06)' : 'none',
          }}>{g.label}</div>
          {g.entries.map((log, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '7px 0' }}>
              <div style={{
                width: 28, height: 28, borderRadius: 6, flexShrink: 0,
                background: 'rgba(var(--rgb),.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13,
              }}>{LOG_ICONS[log.type] || '·'}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ font: "500 11px 'Lexend Deca'", color: 'var(--ink)', lineHeight: 1.3 }}>{log.title}</div>
                {log.keywords?.length ? (
                  <div style={{ font: "400 9px 'Roboto Mono'", color: 'var(--dim2)', marginTop: 2 }}>{log.keywords.join(', ')}</div>
                ) : null}
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ font: "500 11px 'Roboto Mono'", color: 'var(--a2)' }}>+{log.gain}</div>
                <div style={{ font: "400 8px 'Roboto Mono'", color: 'var(--dim2)', marginTop: 1 }}>{ago(log.ts)}</div>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
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
  const data        = useStore(s => s.data)
  const setModal    = useStore(s => s.setModal)
  const togglePhase = useStore(s => s.togglePhase)
  const syncMt      = useStore(s => s.syncMt)
  const syncLc      = useStore(s => s.syncLc)
  const syncCc      = useStore(s => s.syncCc)
  const syncGh      = useStore(s => s.syncGh)
  const setMtHandle = useStore(s => s.setMtHandle)
  const setLcHandle = useStore(s => s.setLcHandle)
  const setCcHandle = useStore(s => s.setCcHandle)
  const setGhHandle = useStore(s => s.setGhHandle)
  const mtPulling   = useStore(s => s.mtPulling)
  const lcPulling   = useStore(s => s.lcPulling)
  const ccPulling   = useStore(s => s.ccPulling)
  const ghPulling   = useStore(s => s.ghPulling)

  const [mtDraft, setMtDraft] = useState(data.mt.handle || '')
  const [lcDraft, setLcDraft] = useState(data.lc.handle || '')
  const [ccDraft, setCcDraft] = useState(data.cc?.handle || '')
  const [ghDraft, setGhDraft] = useState(data.gh?.handle || '')
  const [lcEditing, setLcEditing] = useState(false)
  const [ccEditing, setCcEditing] = useState(false)
  const [showAllFeed, setShowAllFeed] = useState(false)

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
    setTimeout(() => { syncLc(); setLcEditing(false) }, 0)
  }
  function handleCcSync() {
    if (ccDraft !== data.cc?.handle) setCcHandle(ccDraft.trim())
    setTimeout(() => { syncCc(); setCcEditing(false) }, 0)
  }
  function handleGhSync() {
    if (ghDraft !== data.gh?.handle) setGhHandle(ghDraft)
    setTimeout(() => syncGh(), 0)
  }

  const mt = data.mt
  const lc = data.lc
  const cc = data.cc || { handle: '', rating: null, maxRating: null, stars: null, rank: '', solved: null, lastSync: null, error: null }
  const gh = data.gh || { handle: '', public_repos: null, followers: null, lastSync: null, error: null }

  // Only show courses with at least one phase completed
  const activeCourses = COURSE_DEFS.filter(c => {
    const state = data.courses.find(x => x.id === c.id)
    return state && state.done.some(Boolean)
  })
  // Only show books with progress
  const activeBooks = allBookDefs(data).filter(def => {
    const b = data.books.find(x => x.id === def.id)
    return b && b.done > 0
  })

  const ACTIONS = [
    { icon: '⚡', label: 'STUDY', tip: 'log study session', modal: 'study' as const },
    { icon: '📖', label: 'READING', tip: 'log books & intel', modal: 'reading' as const },
  ]

  return (
    <div className="screen-pad" style={{ maxWidth: 1360, margin: '0 auto', padding: '20px 16px 80px' }}>
      <div className="home-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 2.2fr 1fr', gap: 24, alignItems: 'start' }}>

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
            <div className="platform-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>

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

              {/* LeetCode — compact when handle is set (CORS blocks live fetch) */}
              {lc.handle && !lcEditing
                ? (
                  <div style={{ background: 'var(--card0)', borderRadius: 10, padding: '14px 16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <span style={{ font: "500 9px 'Roboto Mono'", letterSpacing: '.12em', color: 'var(--mut)' }}>LEETCODE</span>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{ font: "400 8px 'Roboto Mono'", color: 'var(--dim2)' }}>@{lc.handle}</span>
                        <button onClick={() => { setLcDraft(lc.handle); setLcEditing(true) }} style={{ cursor: 'pointer', background: 'transparent', border: '1px solid rgba(255,255,255,.12)', color: 'var(--dim2)', font: "400 8px 'Roboto Mono'", padding: '2px 8px', borderRadius: 4 }}>edit</button>
                      </div>
                    </div>
                    {lc.lastSync
                      ? <>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 7 }}>
                            {[
                              { l: 'solved', v: lc.solved ?? '—' },
                              { l: 'easy',   v: lc.easy   ?? '—' },
                              { l: 'med',    v: lc.medium  ?? '—' },
                              { l: 'hard',   v: lc.hard    ?? '—' },
                            ].map(({ l, v }) => (
                              <div key={l} style={{ background: 'var(--bg0)', borderRadius: 6, padding: '7px 8px' }}>
                                <div style={{ font: "400 7px 'Roboto Mono'", color: 'var(--mut)', marginBottom: 2 }}>{l}</div>
                                <div style={{ font: "500 14px/1 'Roboto Mono'", color: 'var(--a)' }}>{v}</div>
                              </div>
                            ))}
                          </div>
                          {lc.ranking && <div style={{ marginTop: 7, font: "400 8px 'Roboto Mono'", color: 'var(--mut)' }}>global rank #{lc.ranking.toLocaleString()}</div>}
                        </>
                      : <div style={{ font: "400 8px 'Roboto Mono'", color: 'var(--dim2)', lineHeight: 1.6 }}>
                          {lc.error ? 'fetch blocked (CORS) — no cached data yet' : 'not yet synced'}
                        </div>
                    }
                  </div>
                )
                : (
                  <PlatformCard
                    title="LEETCODE · PROBLEM SOLVING"
                    handle={lcDraft}
                    pulling={lcPulling}
                    onHandleChange={setLcDraft}
                    onSync={handleLcSync}
                    note="LC API is blocked by browsers (CORS) — sync may fail; data from last successful sync is shown"
                  >
                    <div style={{ font: "400 9px 'Roboto Mono'", color: 'var(--mut)' }}>enter username and sync</div>
                  </PlatformCard>
                )
              }
            </div>

            {/* Codeforces row */}
            <div style={{ marginBottom: 14 }}>
              <CompetitiveCard />
            </div>

            {/* CodeChef */}
            {cc.handle && !ccEditing
              ? (
                <div style={{ background: 'var(--card0)', borderRadius: 10, padding: '14px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ font: "500 9px 'Roboto Mono'", letterSpacing: '.12em', color: 'var(--mut)' }}>CODECHEF</span>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <a href={`https://www.codechef.com/users/${cc.handle}`} target="_blank" rel="noopener noreferrer" style={{ font: "400 8px 'Roboto Mono'", color: 'var(--a2)', textDecoration: 'none' }}>↗</a>
                      <span style={{ font: "400 8px 'Roboto Mono'", color: 'var(--dim2)' }}>@{cc.handle}</span>
                      <button onClick={() => { setCcDraft(cc.handle); setCcEditing(true) }} style={{ cursor: 'pointer', background: 'transparent', border: '1px solid rgba(255,255,255,.12)', color: 'var(--dim2)', font: "400 8px 'Roboto Mono'", padding: '2px 8px', borderRadius: 4 }}>edit</button>
                    </div>
                  </div>
                  {cc.lastSync
                    ? <>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 7 }}>
                          {[
                            { l: 'rating',  v: cc.rating   ?? '—' },
                            { l: 'stars',   v: cc.stars != null ? cc.stars + '★' : '—' },
                            { l: 'max',     v: cc.maxRating ?? '—' },
                          ].map(({ l, v }) => (
                            <div key={l} style={{ background: 'var(--bg0)', borderRadius: 6, padding: '7px 8px' }}>
                              <div style={{ font: "400 7px 'Roboto Mono'", color: 'var(--mut)', marginBottom: 2 }}>{l}</div>
                              <div style={{ font: "500 14px/1 'Roboto Mono'", color: 'var(--a)' }}>{v}</div>
                            </div>
                          ))}
                        </div>
                        {cc.rank && <div style={{ marginTop: 7, font: "400 8px 'Roboto Mono'", color: 'var(--mut)' }}>{cc.rank}</div>}
                        {cc.error && <div style={{ marginTop: 6, font: "400 8px 'Roboto Mono'", color: '#ff5a5a' }}>{cc.error}</div>}
                      </>
                    : <div style={{ font: "400 8px 'Roboto Mono'", color: 'var(--dim2)', lineHeight: 1.6 }}>
                        {cc.error || 'not yet synced'}
                      </div>
                  }
                </div>
              )
              : (
                <PlatformCard
                  title="CODECHEF · COMPETITIVE"
                  handle={ccDraft}
                  pulling={ccPulling}
                  onHandleChange={setCcDraft}
                  onSync={handleCcSync}
                  note="syncs rating and star level — contributes to LOGIC score"
                >
                  <div style={{ font: "400 9px 'Roboto Mono'", color: 'var(--mut)' }}>enter username and sync</div>
                </PlatformCard>
              )
            }
          </div>

          {/* Heatmap */}
          <div style={{ background: 'var(--card0)', borderRadius: 10, padding: '16px 18px', marginBottom: 20 }}>
            <div style={{ font: "500 9px 'Roboto Mono'", letterSpacing: '.08em', color: 'var(--mut)', marginBottom: 12 }}>26-WEEK ACTIVITY</div>
            <div style={{ overflowX: 'auto', paddingBottom: 4 }}>
              <Heatmap data={data} />
            </div>
          </div>

          {/* Activity log */}
          <FeedCard logs={data.logs} showAll={showAllFeed} onToggle={() => setShowAllFeed(x => !x)} />
        </div>

        {/* RIGHT — Active courses, active books, GitHub */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* GitHub */}
          <PlatformCard
            title="GITHUB"
            handle={ghDraft}
            pulling={ghPulling}
            onHandleChange={setGhDraft}
            onSync={handleGhSync}
          >
            {gh.error
              ? <div style={{ font: "400 9px 'Roboto Mono'", color: '#e06060' }}>{gh.error}</div>
              : gh.lastSync
                ? <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {[
                      { l: 'repos',     v: gh.public_repos ?? '—' },
                      { l: 'followers', v: gh.followers    ?? '—' },
                    ].map(({ l, v }) => (
                      <div key={l} style={{ background: 'var(--bg0)', borderRadius: 7, padding: '8px 10px' }}>
                        <div style={{ font: "400 8px 'Roboto Mono'", color: 'var(--mut)', marginBottom: 3 }}>{l}</div>
                        <div style={{ font: "500 15px/1 'Roboto Mono'", color: 'var(--a)' }}>{v}</div>
                      </div>
                    ))}
                  </div>
                : <div style={{ font: "400 9px 'Roboto Mono'", color: 'var(--mut)' }}>enter username and sync</div>
            }
          </PlatformCard>

          {/* Active courses — only what's started */}
          {(activeCourses.length > 0 || COURSE_DEFS.length > 0) && (
            <div style={{ background: 'var(--card0)', borderRadius: 10, padding: 16 }}>
              <div style={{ font: "500 9px 'Roboto Mono'", letterSpacing: '.08em', color: 'var(--mut)', marginBottom: 12 }}>VILLAGE ACTS</div>
              {activeCourses.length === 0 && (
                <div style={{ font: "400 9px 'Roboto Mono'", color: 'var(--dim2)' }}>no acts started · toggle phases below to track</div>
              )}
              {COURSE_DEFS.map((c, actIdx) => {
                const state = data.courses.find(x => x.id === c.id)
                const done = state ? state.done.filter(Boolean).length : 0
                if (done === 0 && activeCourses.length > 0) return null
                return (
                  <div key={c.id} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', font: "500 10px 'Lexend Deca'", color: done > 0 ? 'var(--ink)' : 'var(--mut)', marginBottom: 5 }}>
                      <span>ACT {c.actNum} · {c.actName}</span>
                      <span style={{ font: "400 9px 'Roboto Mono'", color: 'var(--mut)' }}>{done}/{c.phases.length}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 3 }}>
                      {c.phases.map((ph, idx) => {
                        const on = !!(state?.done[idx])
                        return (
                          <div
                            key={idx}
                            title={ph}
                            onClick={() => togglePhase(c.id, idx)}
                            style={{
                              flex: 1, height: 18, borderRadius: 3, cursor: 'pointer',
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
          )}

          {/* Active books */}
          {activeBooks.length > 0 && (
            <div style={{ background: 'var(--card0)', borderRadius: 10, padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ font: "500 9px 'Roboto Mono'", letterSpacing: '.08em', color: 'var(--mut)' }}>IN PROGRESS</div>
                <button onClick={() => setModal('reading')} style={{ cursor: 'pointer', background: 'transparent', border: 'none', color: 'var(--a2)', fontSize: 14 }}>+</button>
              </div>
              {activeBooks.slice(0, 6).map(def => {
                const b = data.books.find(x => x.id === def.id)
                const done = b ? b.done : 0
                const pct = Math.min(100, (done / def.total) * 100)
                return (
                  <div key={def.id} style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', font: "400 9px 'Roboto Mono'", color: 'var(--txt)', marginBottom: 4 }}>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '72%' }}>{def.title}</span>
                      <span style={{ color: 'var(--dim2)' }}>{Math.round(pct)}%</span>
                    </div>
                    <div style={{ height: 3, background: 'rgba(var(--rgb),.12)', borderRadius: 2 }}>
                      <div style={{ width: pct + '%', height: '100%', background: 'var(--a2)', transition: 'width .3s' }} />
                    </div>
                  </div>
                )
              })}
              {activeBooks.length > 6 && (
                <div style={{ font: "400 9px 'Roboto Mono'", color: 'var(--mut)', textAlign: 'center', marginTop: 4 }}>
                  +{activeBooks.length - 6} more → reading tab
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  )
}
