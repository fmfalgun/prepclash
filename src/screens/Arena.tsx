import { useState } from 'react'
import { useStore } from '../store/useStore'
import { A2OJ_DEFS } from '../data/a2oj'
import { cpScore } from '../store/selectors'
import { ago } from '../lib/dates'

function StatBox({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div style={{ background: 'var(--bg0)', borderRadius: 8, padding: '10px 14px' }}>
      <div style={{ font: "400 8px 'Roboto Mono'", letterSpacing: '.08em', color: 'var(--mut)', marginBottom: 4 }}>{label}</div>
      <div style={{ font: "500 20px/1 'Roboto Mono'", color: accent ? 'var(--a)' : 'var(--a2)' }}>{value ?? '—'}</div>
    </div>
  )
}

export function Arena() {
  const data        = useStore(s => s.data)
  const syncCf      = useStore(s => s.syncCf)
  const bumpA2oj    = useStore(s => s.bumpA2oj)
  const setCfHandle = useStore(s => s.setCfHandle)
  const cfPulling   = useStore(s => s.cfPulling)

  const [handleDraft, setHandleDraft] = useState(data.cf.handle || '')

  const cf  = data.cf
  const cp  = cpScore(data)
  const a2ojTotal = data.a2oj.reduce((a, x) => a + (x.solved || 0), 0)

  function handleSync() {
    if (handleDraft.trim() !== cf.handle) setCfHandle(handleDraft)
    setTimeout(() => syncCf(), 0)
  }

  const ratingColor = (r: number | null) => {
    if (!r) return 'var(--mut)'
    if (r >= 2400) return '#ff2020'
    if (r >= 2100) return '#ff8c00'
    if (r >= 1900) return '#aa00aa'
    if (r >= 1600) return '#0000ff'
    if (r >= 1400) return '#03a89e'
    if (r >= 1200) return '#008000'
    return 'var(--txt)'
  }

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '28px 26px 80px' }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ font: "300 26px/1 'Lexend Deca'", color: 'var(--ink)', letterSpacing: '.04em' }}>
          arena <span style={{ font: "500 10px 'Roboto Mono'", color: 'var(--mut)', letterSpacing: '.1em' }}>· competitive programming</span>
        </div>
        <div style={{ font: "400 11px 'Roboto Mono'", color: 'var(--mut)', marginTop: 6 }}>
          cp score <span style={{ color: 'var(--a)', fontWeight: 500 }}>{cp}</span>
          <span style={{ margin: '0 10px', opacity: .3 }}>·</span>
          a2oj solved <span style={{ color: 'var(--a2)', fontWeight: 500 }}>{a2ojTotal}</span>
          {cf.solved && <>
            <span style={{ margin: '0 10px', opacity: .3 }}>·</span>
            cf solved <span style={{ color: 'var(--a2)', fontWeight: 500 }}>{cf.solved}</span>
          </>}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 22, alignItems: 'start' }}>

        {/* LEFT — Codeforces */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* CF sync bar */}
          <div style={{ background: 'var(--card0)', borderRadius: 11, padding: '20px 22px' }}>
            <div style={{ font: "500 9px 'Roboto Mono'", letterSpacing: '.14em', color: 'var(--mut)', marginBottom: 14 }}>CODEFORCES</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
              <input
                value={handleDraft}
                onChange={e => setHandleDraft(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSync()}
                placeholder="codeforces handle"
                style={{
                  flex: 1, minWidth: 0, background: 'var(--bg0)', border: 'none', borderRadius: 8,
                  color: 'var(--ink)', font: "400 12px 'Roboto Mono'", padding: '9px 12px', outline: 'none',
                }}
              />
              <button onClick={handleSync} disabled={cfPulling} style={{
                cursor: cfPulling ? 'default' : 'pointer', border: 'none',
                background: 'var(--a)', color: '#111',
                font: "500 12px 'Roboto Mono'", padding: '0 20px', borderRadius: 8, opacity: cfPulling ? .6 : 1,
              }}>{cfPulling ? '…' : 'sync'}</button>
            </div>

            {/* Stat grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 14 }}>
              <StatBox label="RATING"   value={cf.rating   ?? '—'} accent />
              <StatBox label="MAX"      value={cf.maxRating ?? '—'} />
              <StatBox label="SOLVED"   value={cf.solved   ?? '—'} />
              <StatBox label="CONTESTS" value={cf.contests  ?? '—'} />
            </div>

            {/* Status line */}
            <div style={{ font: "400 10px 'Roboto Mono'", display: 'flex', alignItems: 'center', gap: 8 }}>
              {cf.error
                ? <span style={{ color: '#e06060' }}>{cf.error}</span>
                : cf.rank
                  ? <>
                      <span style={{ color: ratingColor(cf.rating), fontWeight: 600 }}>{cf.rank}</span>
                      <span style={{ color: 'var(--dim2)' }}>·</span>
                      <span style={{ color: 'var(--mut)' }}>{cf.lastSync ? 'synced ' + ago(cf.lastSync) : 'not synced'}</span>
                    </>
                  : <span style={{ color: 'var(--dim2)' }}>enter handle and sync to fetch stats</span>
              }
            </div>
          </div>

          {/* Rating visual bar */}
          {cf.rating && (
            <div style={{ background: 'var(--card0)', borderRadius: 11, padding: '18px 22px' }}>
              <div style={{ font: "500 9px 'Roboto Mono'", letterSpacing: '.14em', color: 'var(--mut)', marginBottom: 14 }}>RATING PROGRESS</div>
              {[
                { label: 'Newbie',        min: 0,    max: 1200, color: '#aaa' },
                { label: 'Pupil',         min: 1200, max: 1400, color: '#008000' },
                { label: 'Specialist',    min: 1400, max: 1600, color: '#03a89e' },
                { label: 'Expert',        min: 1600, max: 1900, color: '#0000ff' },
                { label: 'Candidate M.', min: 1900, max: 2100, color: '#aa00aa' },
                { label: 'Master',        min: 2100, max: 2400, color: '#ff8c00' },
              ].map(tier => {
                const r = cf.rating || 0
                const fill = Math.max(0, Math.min(100, ((r - tier.min) / (tier.max - tier.min)) * 100))
                const active = r >= tier.min && r < tier.max
                return (
                  <div key={tier.label} style={{ marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ font: "400 9px 'Roboto Mono'", color: active ? tier.color : 'var(--dim)' }}>{tier.label}</span>
                      <span style={{ font: "400 8px 'Roboto Mono'", color: 'var(--dim2)' }}>{tier.min}–{tier.max}</span>
                    </div>
                    <div style={{ height: active ? 5 : 3, background: 'rgba(255,255,255,.06)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: fill + '%', background: tier.color, borderRadius: 3, opacity: active ? 1 : 0.35, transition: 'width .4s' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* RIGHT — A2OJ Ladders */}
        <div style={{ background: 'var(--card0)', borderRadius: 11, padding: '20px 22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 18 }}>
            <div style={{ font: "500 9px 'Roboto Mono'", letterSpacing: '.14em', color: 'var(--mut)' }}>A2OJ LADDERS</div>
            <div style={{ font: "400 9px 'Roboto Mono'", color: 'var(--a2)' }}>{a2ojTotal} total solved</div>
          </div>

          {A2OJ_DEFS.map(def => {
            const entry  = data.a2oj.find(x => x.id === def.id)
            const solved = entry?.solved ?? 0
            const pct    = Math.round(solved / def.total * 100)
            return (
              <div key={def.id} style={{ marginBottom: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ font: "500 12px 'Lexend Deca'", color: 'var(--ink)' }}>{def.name}</span>
                  <span style={{ font: "400 9px 'Roboto Mono'", color: 'var(--mut)' }}>{solved}/{def.total}</span>
                </div>
                <div style={{ height: 6, background: 'var(--bg0)', borderRadius: 3, overflow: 'hidden', marginBottom: 8 }}>
                  <div style={{ height: '100%', width: pct + '%', background: 'linear-gradient(90deg, var(--a), var(--a2))', borderRadius: 3, transition: 'width .3s' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button onClick={() => bumpA2oj(def.id, -1)} style={{
                    cursor: 'pointer', width: 28, height: 28, borderRadius: 6, border: 'none',
                    background: 'var(--cardHi)', color: 'var(--mut)',
                    font: "400 16px 'Roboto Mono'", display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>−</button>
                  <div style={{ flex: 1, font: "400 9px 'Roboto Mono'", color: 'var(--dim2)', textAlign: 'center' }}>
                    {pct}% · {def.total - solved} left
                  </div>
                  <button onClick={() => bumpA2oj(def.id, 1)} style={{
                    cursor: 'pointer', width: 28, height: 28, borderRadius: 6, border: 'none',
                    background: 'rgba(var(--rgb),.16)', color: 'var(--a)',
                    font: "400 16px 'Roboto Mono'", display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>+</button>
                </div>
              </div>
            )
          })}

          {/* CP score breakdown */}
          <div style={{ marginTop: 8, paddingTop: 16, borderTop: '1px solid rgba(var(--rgb),.08)' }}>
            <div style={{ font: "500 9px 'Roboto Mono'", letterSpacing: '.14em', color: 'var(--mut)', marginBottom: 12 }}>CP SCORE BREAKDOWN</div>
            {[
              { label: 'CF rating contribution', val: cf.rating ? Math.min(55, Math.round((cf.rating - 700) / 15)) : 0, max: 55 },
              { label: 'A2OJ ladder progress',   val: Math.min(25, Math.round(a2ojTotal * 0.12)), max: 25 },
              { label: 'problem XP feed',        val: Math.round(data.skillXp.cp || 0), max: 19 },
            ].map(({ label, val, max }) => (
              <div key={label} style={{ marginBottom: 9 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', font: "400 8px 'Roboto Mono'", color: 'var(--txt)', marginBottom: 3 }}>
                  <span>{label}</span>
                  <span style={{ color: 'var(--a)' }}>{val}/{max}</span>
                </div>
                <div style={{ height: 3, background: 'rgba(255,255,255,.06)', borderRadius: 2 }}>
                  <div style={{ height: '100%', width: Math.min(100, val / max * 100) + '%', background: 'var(--a)', borderRadius: 2 }} />
                </div>
              </div>
            ))}
            <div style={{ marginTop: 10, font: "500 13px 'Roboto Mono'", color: 'var(--a)' }}>
              total cp {cp} <span style={{ font: "400 9px 'Roboto Mono'", color: 'var(--mut)' }}>/ 99</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
