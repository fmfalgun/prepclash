import { useState, useMemo } from 'react'
import { useStore } from '../store/useStore'
import { A2OJ_DEFS } from '../data/a2oj'
import { cpScore, a2ojTotal } from '../store/selectors'
import type { CpSnapshot } from '../types'

// ─── helpers ─────────────────────────────────────────────────────────────────

const CF_TIERS = [
  { label: 'Newbie',        min: 0,    max: 1200, color: '#aaaaaa' },
  { label: 'Pupil',         min: 1200, max: 1400, color: '#008000' },
  { label: 'Specialist',    min: 1400, max: 1600, color: '#03a89e' },
  { label: 'Expert',        min: 1600, max: 1900, color: '#0000ff' },
  { label: 'Cand. Master',  min: 1900, max: 2100, color: '#aa00aa' },
  { label: 'Master',        min: 2100, max: 2400, color: '#ff8c00' },
  { label: 'Grand Master',  min: 2400, max: 3000, color: '#ff2020' },
]

const CC_TIERS = [
  { label: '1★',  min: 0,    max: 1400, color: '#888' },
  { label: '2★',  min: 1400, max: 1600, color: '#888' },
  { label: '3★',  min: 1600, max: 1800, color: '#008000' },
  { label: '4★',  min: 1800, max: 2000, color: '#03a89e' },
  { label: '5★',  min: 2000, max: 2200, color: '#0000ff' },
  { label: '6★',  min: 2200, max: 2500, color: '#aa00aa' },
  { label: '7★',  min: 2500, max: 3000, color: '#ff2020' },
]

function ratingColor(r: number | null, tiers: typeof CF_TIERS): string {
  if (!r) return 'var(--mut)'
  for (let i = tiers.length - 1; i >= 0; i--) {
    if (r >= tiers[i].min) return tiers[i].color
  }
  return 'var(--txt)'
}

function filterByDays(history: CpSnapshot[], days: number | null): CpSnapshot[] {
  if (!days) return history
  const cutoff = Date.now() - days * 86400_000
  return history.filter(s => s.ts >= cutoff)
}

function ago(ts: number): string {
  const d = Math.floor((Date.now() - ts) / 86400_000)
  if (d === 0) return 'today'
  if (d === 1) return '1d ago'
  return d + 'd ago'
}

function fmtDate(ts: number): string {
  return new Date(ts).toLocaleDateString('en', { month: 'short', day: 'numeric' })
}

// ─── sub-components ───────────────────────────────────────────────────────────

function StatBox({ label, value, accent, sub }: {
  label: string; value: string | number; accent?: boolean; sub?: string
}) {
  return (
    <div style={{ background: 'var(--bg0)', borderRadius: 8, padding: '10px 12px' }}>
      <div style={{ font: "400 7px 'Roboto Mono'", letterSpacing: '.08em', color: 'var(--mut)', marginBottom: 4 }}>{label}</div>
      <div style={{ font: "600 17px/1 'Roboto Mono'", color: accent ? 'var(--a)' : 'var(--a2)' }}>{value ?? '—'}</div>
      {sub && <div style={{ font: "400 7px 'Roboto Mono'", color: 'var(--dim2)', marginTop: 4, lineHeight: 1.4 }}>{sub}</div>}
    </div>
  )
}

function SyncBar({ draft, onDraftChange, onSync, pulling, placeholder = 'handle' }: {
  draft: string; onDraftChange: (v: string) => void
  onSync: () => void; pulling: boolean; placeholder?: string
}) {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <input
        value={draft} onChange={e => onDraftChange(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && !pulling && onSync()}
        placeholder={placeholder}
        style={{ flex: 1, minWidth: 0, background: 'var(--bg0)', border: 'none', borderRadius: 8, color: 'var(--ink)', font: "400 12px 'Roboto Mono'", padding: '9px 12px', outline: 'none' }}
      />
      <button onClick={onSync} disabled={pulling} style={{
        cursor: pulling ? 'default' : 'pointer', border: 'none', background: 'var(--a)',
        color: '#111', font: "500 12px 'Roboto Mono'", padding: '0 18px', borderRadius: 8, opacity: pulling ? .6 : 1, whiteSpace: 'nowrap',
      }}>{pulling ? '…' : 'sync'}</button>
    </div>
  )
}

function TierBar({ tiers, current }: { tiers: typeof CF_TIERS; current: number | null }) {
  const r = current || 0
  return (
    <div>
      {tiers.map(tier => {
        const fill = Math.max(0, Math.min(100, ((r - tier.min) / (tier.max - tier.min)) * 100))
        const active = r >= tier.min && r < tier.max
        return (
          <div key={tier.label} style={{ marginBottom: 7 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
              <span style={{ font: "400 8px 'Roboto Mono'", color: active ? tier.color : 'var(--dim)' }}>{tier.label}</span>
              <span style={{ font: "400 7px 'Roboto Mono'", color: 'var(--dim2)' }}>{tier.min}–{tier.max}</span>
            </div>
            <div style={{ height: active ? 5 : 3, background: 'rgba(255,255,255,.06)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: fill + '%', background: tier.color, borderRadius: 3, opacity: active ? 1 : 0.3, transition: 'width .4s' }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

type TF = 7 | 30 | 90 | null
function TimeFilter({ value, onChange }: { value: TF; onChange: (v: TF) => void }) {
  return (
    <div style={{ display: 'flex', gap: 5 }}>
      {([7, 30, 90, null] as TF[]).map(d => (
        <button key={String(d)} onClick={() => onChange(d)} style={{
          cursor: 'pointer', border: `1px solid ${value === d ? 'var(--a)' : 'rgba(255,255,255,.1)'}`,
          background: value === d ? 'rgba(var(--rgb),.18)' : 'transparent',
          color: value === d ? 'var(--a)' : 'var(--dim2)',
          font: "400 8px 'Roboto Mono'", padding: '3px 8px', borderRadius: 4,
        }}>{d ? d + 'D' : 'ALL'}</button>
      ))}
    </div>
  )
}

function LineChart({ points, color = 'var(--a)', height = 110, emptyMsg = 'sync to start tracking' }: {
  points: { ts: number; value: number }[]
  color?: string; height?: number; emptyMsg?: string
}) {
  if (points.length < 2) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center',
        font: "400 8px 'Roboto Mono'", color: 'var(--dim2)', textAlign: 'center', lineHeight: 1.6 }}>
        {emptyMsg}
      </div>
    )
  }
  const W = 400; const H = 100
  const minT = Math.min(...points.map(p => p.ts))
  const maxT = Math.max(...points.map(p => p.ts))
  const minV = Math.min(...points.map(p => p.value))
  const maxV = Math.max(...points.map(p => p.value))
  const tRange = maxT - minT || 1
  const vRange = maxV - minV || 1

  const toX = (ts: number) => ((ts - minT) / tRange) * (W - 12) + 6
  const toY = (v: number)  => H - 8 - ((v - minV) / vRange) * (H - 16)

  const pts   = points.map(p => ({ x: toX(p.ts), y: toY(p.value), ...p }))
  const dLine = pts.map((p, i) => (i === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`)).join(' ')
  const dArea = dLine + ` L${pts[pts.length - 1].x},${H} L${pts[0].x},${H} Z`

  const first = points[0]; const last = points[points.length - 1]
  const delta = last.value - first.value
  const deltaColor = delta > 0 ? 'var(--a)' : delta < 0 ? '#ff5a5a' : 'var(--mut)'

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
        <div style={{ font: "500 20px/1 'Roboto Mono'", color }}>
          {last.value}
          {delta !== 0 && (
            <span style={{ font: "400 9px 'Roboto Mono'", color: deltaColor, marginLeft: 8 }}>
              {delta > 0 ? '+' : ''}{delta}
            </span>
          )}
        </div>
        <div style={{ font: "400 7px 'Roboto Mono'", color: 'var(--dim2)' }}>
          {fmtDate(first.ts)} → {fmtDate(last.ts)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height }} preserveAspectRatio="none">
        <defs>
          <linearGradient id={`grad_${color.replace(/[^a-z0-9]/gi, '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity=".2" />
            <stop offset="100%" stopColor={color} stopOpacity=".01" />
          </linearGradient>
        </defs>
        <path d={dArea} fill={`url(#grad_${color.replace(/[^a-z0-9]/gi, '')})`} />
        <path d={dLine} fill="none" stroke={color} strokeWidth="1.8" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
        {pts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3" fill={color} vectorEffect="non-scaling-stroke" opacity=".8" />
        ))}
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, font: "400 7px 'Roboto Mono'", color: 'var(--dim2)' }}>
        <span>{fmtDate(first.ts)}</span>
        <span style={{ color: 'var(--dim)' }}>{points.length} pts</span>
        <span>{fmtDate(last.ts)}</span>
      </div>
    </div>
  )
}

function A2ojGroup({ title, defs, a2oj }: {
  title: string
  defs: readonly { id: string; name: string; total: number }[]
  a2oj: { id: string; solved: number }[]
}) {
  const groupTotal = defs.reduce((s, d) => s + (a2oj.find(x => x.id === d.id)?.solved ?? 0), 0)
  return (
    <div style={{ background: 'var(--card0)', borderRadius: 11, padding: '16px 18px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
        <div style={{ font: "500 8px 'Roboto Mono'", letterSpacing: '.12em', color: 'var(--mut)' }}>{title}</div>
        <div style={{ font: "400 9px 'Roboto Mono'", color: 'var(--a2)' }}>{groupTotal} solved</div>
      </div>
      {defs.map(def => {
        const solved = a2oj.find(x => x.id === def.id)?.solved ?? 0
        const pct    = Math.min(100, Math.round(solved / def.total * 100))
        return (
          <div key={def.id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 9 }}>
            <span style={{ font: "400 9px 'Roboto Mono'", color: solved > 0 ? 'var(--txt)' : 'var(--dim2)', width: 110, flexShrink: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{def.name}</span>
            <div style={{ flex: 1, height: 4, background: 'var(--bg0)', borderRadius: 2 }}>
              <div style={{ height: '100%', width: pct + '%', background: 'linear-gradient(90deg, var(--a), var(--a2))', borderRadius: 2, transition: 'width .3s' }} />
            </div>
            <span style={{ font: "400 8px 'Roboto Mono'", color: 'var(--dim2)', width: 46, textAlign: 'right', flexShrink: 0 }}>{solved}/{def.total}</span>
          </div>
        )
      })}
    </div>
  )
}

// ─── main ─────────────────────────────────────────────────────────────────────

type Tab = 'overview' | 'cf' | 'lc' | 'cc' | 'a2oj'
const TABS: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'OVERVIEW' },
  { id: 'cf',       label: 'CODEFORCES' },
  { id: 'lc',       label: 'LEETCODE' },
  { id: 'cc',       label: 'CODECHEF' },
  { id: 'a2oj',     label: 'A2OJ' },
]

export function Arena() {
  const data      = useStore(s => s.data)
  const syncCf    = useStore(s => s.syncCf)
  const syncLc    = useStore(s => s.syncLc)
  const syncCc    = useStore(s => s.syncCc)
  const bumpA2oj  = useStore(s => s.bumpA2oj)
  const setCfH    = useStore(s => s.setCfHandle)
  const setLcH    = useStore(s => s.setLcHandle)
  const setCcH    = useStore(s => s.setCcHandle)
  const cfPulling = useStore(s => s.cfPulling)
  const lcPulling = useStore(s => s.lcPulling)
  const ccPulling = useStore(s => s.ccPulling)

  const [tab, setTab]         = useState<Tab>('overview')
  const [tf, setTf]           = useState<TF>(null)
  const [cfDraft, setCfDraft] = useState(data.cf.handle || '')
  const [lcDraft, setLcDraft] = useState(data.lc?.handle || '')
  const [ccDraft, setCcDraft] = useState(data.cc?.handle || '')

  const cf   = data.cf
  const lc   = data.lc ?? { handle: '', solved: null, easy: null, medium: null, hard: null, ranking: null, lastSync: null, error: null }
  const cc   = data.cc ?? { handle: '', rating: null, maxRating: null, stars: null, rank: '', solved: null, lastSync: null, error: null }
  const cp   = cpScore(data)
  const a2ot = a2ojTotal(data)
  const hist = data.cpHistory ?? []

  function handleCfSync() {
    if (cfDraft.trim() !== cf.handle) setCfH(cfDraft.trim())
    setTimeout(() => syncCf(), 0)
  }
  function handleLcSync() {
    if (lcDraft.trim() !== lc.handle) setLcH(lcDraft.trim())
    setTimeout(() => syncLc(), 0)
  }
  function handleCcSync() {
    if (ccDraft.trim() !== cc.handle) setCcH(ccDraft.trim())
    setTimeout(() => syncCc(), 0)
  }

  const filtered = useMemo(() => filterByDays(hist, tf), [hist, tf])

  const cfSeries = useMemo(() => filtered.filter(s => s.cfRating  != null).map(s => ({ ts: s.ts, value: s.cfRating! })), [filtered])
  const lcSeries = useMemo(() => filtered.filter(s => s.lcSolved  != null).map(s => ({ ts: s.ts, value: s.lcSolved! })), [filtered])
  const ccSeries = useMemo(() => filtered.filter(s => s.ccRating  != null).map(s => ({ ts: s.ts, value: s.ccRating! })), [filtered])
  const a2Series = useMemo(() => filtered.map(s => ({ ts: s.ts, value: s.a2ojTotal })), [filtered])
  const cpSeries = useMemo(() => filtered.map(s => ({ ts: s.ts, value: s.score })), [filtered])

  const cfRPart = cf.rating ? Math.min(30, Math.max(0, Math.round((cf.rating - 600) / 73))) : 0
  const cfSPart = Math.min(15, Math.round((cf.solved || 0) / 13.3))
  const a2Part  = Math.min(15, Math.round(a2ot / 18.4))
  const lcPart  = Math.min(20, Math.round((lc.solved || 0) / 15))
  const ccPart  = (cc.rating ?? 0) >= 1400 ? Math.min(10, Math.round(((cc.rating ?? 0) - 1400) / 60)) : 0
  const effPart = Math.min(9, Math.round(Math.sqrt(data.skillXp.cp || 0) * 1.5))

  const scoreComponents = [
    { label: 'CF rating',    val: cfRPart, max: 30 },
    { label: 'CF solved',    val: cfSPart, max: 15 },
    { label: 'A2OJ ladders', val: a2Part,  max: 15 },
    { label: 'LC solved',    val: lcPart,  max: 20 },
    { label: 'CC rating',    val: ccPart,  max: 10 },
    { label: 'effort XP',    val: effPart, max: 9  },
  ]

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px 100px' }}>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ font: "300 24px/1 'Lexend Deca'", color: 'var(--ink)', letterSpacing: '.04em' }}>
          arena <span style={{ font: "500 9px 'Roboto Mono'", color: 'var(--mut)', letterSpacing: '.1em' }}>· cp</span>
        </div>
        <div style={{ font: "400 10px 'Roboto Mono'", color: 'var(--mut)', marginTop: 6, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          <span>cp <span style={{ color: 'var(--a)', fontWeight: 600 }}>{cp}</span>/99</span>
          <span>a2oj <span style={{ color: 'var(--a2)', fontWeight: 500 }}>{a2ot}</span></span>
          {cf.solved   != null && <span>cf <span style={{ color: 'var(--a2)', fontWeight: 500 }}>{cf.solved}</span></span>}
          {lc.solved   != null && <span>lc <span style={{ color: 'var(--a2)', fontWeight: 500 }}>{lc.solved}</span></span>}
          {cc.rating   != null && <span>cc <span style={{ color: 'var(--a2)', fontWeight: 500 }}>{cc.rating}</span></span>}
        </div>
      </div>

      {/* Tab nav — horizontal scroll on mobile */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 22, borderBottom: '1px solid rgba(255,255,255,.07)', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            cursor: 'pointer', border: 'none', borderBottom: `2px solid ${tab === t.id ? 'var(--a)' : 'transparent'}`,
            background: 'transparent', color: tab === t.id ? 'var(--a)' : 'var(--dim2)',
            font: `${tab === t.id ? 500 : 400} 8px 'Roboto Mono'`, letterSpacing: '.1em',
            padding: '10px 12px', marginBottom: -1, whiteSpace: 'nowrap', flexShrink: 0,
          }}>{t.label}</button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {tab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
            <StatBox label="CF RATING"  value={cf.rating  ?? '—'} accent sub={cf.rank || undefined} />
            <StatBox label="A2OJ TOTAL" value={a2ot} accent />
            <StatBox label="LC SOLVED"  value={lc.solved  ?? '—'} sub={lc.solved ? `${lc.easy ?? 0}E · ${lc.medium ?? 0}M · ${lc.hard ?? 0}H` : undefined} />
            <StatBox label="CC RATING"  value={cc.rating  ?? '—'} sub={cc.stars != null ? cc.stars + '★' : undefined} />
          </div>

          {/* Score breakdown */}
          <div style={{ background: 'var(--card0)', borderRadius: 11, padding: '18px 18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16 }}>
              <div style={{ font: "500 9px 'Roboto Mono'", letterSpacing: '.12em', color: 'var(--mut)' }}>LOGIC SCORE</div>
              <div style={{ font: "500 22px/1 'Roboto Mono'", color: 'var(--a)' }}>
                {cp}<span style={{ font: "400 9px 'Roboto Mono'", color: 'var(--mut)', marginLeft: 4 }}>/99</span>
              </div>
            </div>
            {scoreComponents.map(({ label, val, max }) => (
              <div key={label} style={{ marginBottom: 9 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', font: "400 8px 'Roboto Mono'", color: 'var(--txt)', marginBottom: 4 }}>
                  <span>{label}</span>
                  <span style={{ color: 'var(--a)' }}>{val}<span style={{ color: 'var(--dim2)' }}>/{max}</span></span>
                </div>
                <div style={{ height: 4, background: 'rgba(255,255,255,.06)', borderRadius: 2 }}>
                  <div style={{ height: '100%', width: Math.min(100, val / max * 100) + '%', background: 'var(--a)', borderRadius: 2, transition: 'width .4s' }} />
                </div>
              </div>
            ))}
          </div>

          {/* LOGIC history */}
          <div style={{ background: 'var(--card0)', borderRadius: 11, padding: '18px 18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
              <div style={{ font: "500 9px 'Roboto Mono'", letterSpacing: '.12em', color: 'var(--mut)' }}>LOGIC HISTORY</div>
              <TimeFilter value={tf} onChange={setTf} />
            </div>
            <LineChart points={cpSeries} color="var(--a)" height={120}
              emptyMsg="sync any CP platform to start tracking your LOGIC score over time" />
          </div>

          {/* Mini charts grid */}
          {hist.length >= 2 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
              {[
                { label: 'CF RATING',    series: cfSeries, color: '#ff8c00' },
                { label: 'LC SOLVED',    series: lcSeries, color: '#ffa200' },
                { label: 'CC RATING',    series: ccSeries, color: '#7b5ea7' },
                { label: 'A2OJ SOLVED',  series: a2Series, color: 'var(--a2)' },
              ].map(({ label, series, color }) => (
                <div key={label} style={{ background: 'var(--card0)', borderRadius: 11, padding: '14px 16px' }}>
                  <div style={{ font: "500 8px 'Roboto Mono'", letterSpacing: '.1em', color: 'var(--mut)', marginBottom: 10 }}>{label}</div>
                  <LineChart points={series} color={color} height={80} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── CODEFORCES ── */}
      {tab === 'cf' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: 'var(--card0)', borderRadius: 11, padding: '18px 18px' }}>
            <div style={{ font: "500 9px 'Roboto Mono'", letterSpacing: '.12em', color: 'var(--mut)', marginBottom: 14 }}>CODEFORCES</div>
            <div style={{ marginBottom: 16 }}>
              <SyncBar draft={cfDraft} onDraftChange={setCfDraft} onSync={handleCfSync} pulling={cfPulling} placeholder="codeforces handle" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 12 }}>
              <StatBox label="RATING"   value={cf.rating   ?? '—'} accent />
              <StatBox label="MAX"      value={cf.maxRating ?? '—'} />
              <StatBox label="SOLVED"   value={cf.solved    ?? '—'} />
              <StatBox label="CONTESTS" value={cf.contests  ?? '—'} />
            </div>
            <div style={{ font: "400 9px 'Roboto Mono'", color: cf.error ? '#e06060' : 'var(--dim2)' }}>
              {cf.error ?? (cf.rank
                ? <span><span style={{ color: ratingColor(cf.rating, CF_TIERS), fontWeight: 600 }}>{cf.rank}</span>
                    <span style={{ opacity: .4, margin: '0 8px' }}>·</span>
                    {cf.lastSync ? 'synced ' + ago(cf.lastSync) : ''}</span>
                : 'enter handle and sync')}
            </div>
          </div>

          <div style={{ background: 'var(--card0)', borderRadius: 11, padding: '18px 18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
              <div style={{ font: "500 9px 'Roboto Mono'", letterSpacing: '.12em', color: 'var(--mut)' }}>RATING HISTORY</div>
              <TimeFilter value={tf} onChange={setTf} />
            </div>
            <LineChart points={cfSeries} color="#ff8c00" height={130} />
          </div>

          <div style={{ background: 'var(--card0)', borderRadius: 11, padding: '18px 18px' }}>
            <div style={{ font: "500 9px 'Roboto Mono'", letterSpacing: '.12em', color: 'var(--mut)', marginBottom: 14 }}>RANK TIERS</div>
            <TierBar tiers={CF_TIERS} current={cf.rating} />
          </div>
        </div>
      )}

      {/* ── LEETCODE ── */}
      {tab === 'lc' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: 'var(--card0)', borderRadius: 11, padding: '18px 18px' }}>
            <div style={{ font: "500 9px 'Roboto Mono'", letterSpacing: '.12em', color: 'var(--mut)', marginBottom: 14 }}>LEETCODE</div>
            <div style={{ marginBottom: 16 }}>
              <SyncBar draft={lcDraft} onDraftChange={setLcDraft} onSync={handleLcSync} pulling={lcPulling} placeholder="leetcode username" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 12 }}>
              <StatBox label="SOLVED"  value={lc.solved  ?? '—'} accent />
              <StatBox label="RANKING" value={lc.ranking ? '#' + lc.ranking.toLocaleString() : '—'} />
              <StatBox label="EASY"    value={lc.easy    ?? '—'} />
              <StatBox label="MEDIUM"  value={lc.medium  ?? '—'} />
            </div>
            <div style={{ font: "400 9px 'Roboto Mono'", color: lc.error ? '#e06060' : 'var(--dim2)' }}>
              {lc.error ?? (lc.lastSync ? 'synced ' + ago(lc.lastSync) : 'enter username and sync')}
            </div>
          </div>

          <div style={{ background: 'var(--card0)', borderRadius: 11, padding: '18px 18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
              <div style={{ font: "500 9px 'Roboto Mono'", letterSpacing: '.12em', color: 'var(--mut)' }}>SOLVED HISTORY</div>
              <TimeFilter value={tf} onChange={setTf} />
            </div>
            <LineChart points={lcSeries} color="#ffa200" height={130} />
          </div>

          {lc.solved != null && (
            <div style={{ background: 'var(--card0)', borderRadius: 11, padding: '18px 18px' }}>
              <div style={{ font: "500 9px 'Roboto Mono'", letterSpacing: '.12em', color: 'var(--mut)', marginBottom: 14 }}>DIFFICULTY BREAKDOWN</div>
              {[
                { label: 'Easy',   val: lc.easy   ?? 0, total: 800,  color: '#39ff88' },
                { label: 'Medium', val: lc.medium ?? 0, total: 1700, color: '#ffa200' },
                { label: 'Hard',   val: lc.hard   ?? 0, total: 700,  color: '#ff5a5a' },
              ].map(({ label, val, total, color }) => (
                <div key={label} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', font: "400 9px 'Roboto Mono'", marginBottom: 5 }}>
                    <span style={{ color }}>{label}</span>
                    <span style={{ color: 'var(--txt)' }}>{val}<span style={{ color: 'var(--dim2)' }}>/{total}</span></span>
                  </div>
                  <div style={{ height: 5, background: 'rgba(255,255,255,.07)', borderRadius: 3 }}>
                    <div style={{ height: '100%', width: Math.min(100, val / total * 100) + '%', background: color, borderRadius: 3 }} />
                  </div>
                </div>
              ))}
              <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,.06)', display: 'flex', justifyContent: 'space-between', font: "400 9px 'Roboto Mono'" }}>
                <span style={{ color: 'var(--mut)' }}>LC → LOGIC</span>
                <span><span style={{ color: 'var(--a)' }}>{lcPart}</span><span style={{ color: 'var(--dim2)' }}>/20</span></span>
              </div>
              <div style={{ font: "400 7px 'Roboto Mono'", color: 'var(--dim2)', marginTop: 4 }}>
                max at 300 solved · {Math.max(0, 300 - (lc.solved ?? 0))} to go
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── CODECHEF ── */}
      {tab === 'cc' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: 'var(--card0)', borderRadius: 11, padding: '18px 18px' }}>
            <div style={{ font: "500 9px 'Roboto Mono'", letterSpacing: '.12em', color: 'var(--mut)', marginBottom: 14 }}>CODECHEF</div>
            <div style={{ marginBottom: 16 }}>
              <SyncBar draft={ccDraft} onDraftChange={setCcDraft} onSync={handleCcSync} pulling={ccPulling} placeholder="codechef username" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
              <StatBox label="RATING"     value={cc.rating    ?? '—'} accent />
              <StatBox label="MAX RATING" value={cc.maxRating ?? '—'} />
              <StatBox label="STARS"      value={cc.stars != null ? cc.stars + '★' : '—'} />
            </div>
            {cc.rank && (
              <div style={{ font: "400 9px 'Roboto Mono'", color: ratingColor(cc.rating, CC_TIERS), marginBottom: 6 }}>{cc.rank}</div>
            )}
            <div style={{ font: "400 9px 'Roboto Mono'", color: cc.error ? '#e06060' : 'var(--dim2)' }}>
              {cc.error ?? (cc.lastSync ? 'synced ' + ago(cc.lastSync) : 'enter username and sync')}
            </div>
          </div>

          <div style={{ background: 'var(--card0)', borderRadius: 11, padding: '18px 18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
              <div style={{ font: "500 9px 'Roboto Mono'", letterSpacing: '.12em', color: 'var(--mut)' }}>RATING HISTORY</div>
              <TimeFilter value={tf} onChange={setTf} />
            </div>
            <LineChart points={ccSeries} color="#7b5ea7" height={130} />
          </div>

          <div style={{ background: 'var(--card0)', borderRadius: 11, padding: '18px 18px' }}>
            <div style={{ font: "500 9px 'Roboto Mono'", letterSpacing: '.12em', color: 'var(--mut)', marginBottom: 14 }}>STAR TIERS</div>
            <TierBar tiers={CC_TIERS} current={cc.rating} />
            <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,.06)', display: 'flex', justifyContent: 'space-between', font: "400 9px 'Roboto Mono'" }}>
              <span style={{ color: 'var(--mut)' }}>CC → LOGIC</span>
              <span><span style={{ color: 'var(--a)' }}>{ccPart}</span><span style={{ color: 'var(--dim2)' }}>/10</span></span>
            </div>
            <div style={{ font: "400 7px 'Roboto Mono'", color: 'var(--dim2)', marginTop: 4 }}>
              starts at 1400 (2★) · max at 2000 (5★){cc.rating && cc.rating < 2000 ? ` · ${2000 - cc.rating} to max` : ''}
            </div>
          </div>
        </div>
      )}

      {/* ── A2OJ ── */}
      {tab === 'a2oj' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Overview stat row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            <StatBox label="TOTAL SOLVED" value={a2ot} accent />
            <StatBox label="LOGIC PTS"    value={`${a2Part}/15`} />
            <StatBox label="LADDERS"      value={`${A2OJ_DEFS.filter(d => (data.a2oj.find(x => x.id === d.id)?.solved ?? 0) > 0).length}/${A2OJ_DEFS.length}`} />
          </div>

          {/* Solved history chart */}
          <div style={{ background: 'var(--card0)', borderRadius: 11, padding: '18px 18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
              <div style={{ font: "500 9px 'Roboto Mono'", letterSpacing: '.12em', color: 'var(--mut)' }}>SOLVED HISTORY</div>
              <TimeFilter value={tf} onChange={setTf} />
            </div>
            <LineChart points={a2Series} color="var(--a2)" height={130}
              emptyMsg="sync CF to auto-populate A2OJ progress" />
          </div>

          {/* By problem type */}
          <A2ojGroup
            title="BY PROBLEM TYPE"
            defs={A2OJ_DEFS.filter(d => ['l4','l5','l6','l7','l8','l9','l10'].includes(d.id))}
            a2oj={data.a2oj}
          />

          {/* By rating — standard */}
          <A2ojGroup
            title="BY RATING · STANDARD (100)"
            defs={A2OJ_DEFS.filter(d => ['l11','l12','l13','l14','l15','l16','l17','l18','l19','l20','l21'].includes(d.id))}
            a2oj={data.a2oj}
          />

          {/* By rating — extra */}
          <A2ojGroup
            title="BY RATING · EXTRA (200)"
            defs={A2OJ_DEFS.filter(d => ['l22','l23','l24','l25','l26','l27','l28','l29','l30','l31','l32'].includes(d.id))}
            a2oj={data.a2oj}
          />

          <div style={{ paddingTop: 4, font: "400 8px 'Roboto Mono'", color: 'var(--dim2)', textAlign: 'center' }}>
            29 ladders · auto-tracked from CF submissions · sync CF to update
          </div>
        </div>
      )}
    </div>
  )
}
