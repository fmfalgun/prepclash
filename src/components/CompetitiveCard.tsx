import { useState } from 'react'
import { useStore } from '../store/useStore'
import { cpScore } from '../store/selectors'
import { A2OJ_DEFS } from '../data/a2oj'
import { ago } from '../lib/dates'

const A2OJ_GROUPS = [
  { label: 'By Problem Type', ids: ['l4','l5','l6','l7','l8','l9','l10'], total: 700 },
  { label: 'By Rating Std',   ids: ['l11','l12','l13','l14','l15','l16','l17','l18','l19','l20','l21'], total: 1100 },
  { label: 'By Rating Extra', ids: ['l22','l23','l24','l25','l26','l27','l28','l29','l30','l31','l32'], total: 2200 },
]

export function CompetitiveCard() {
  const data        = useStore(s => s.data)
  const syncCf      = useStore(s => s.syncCf)
  const setCfHandle = useStore(s => s.setCfHandle)
  const cfPulling   = useStore(s => s.cfPulling)
  const [handleDraft, setHandleDraft] = useState(data.cf.handle || '')

  const cf = data.cf
  const cp = cpScore(data)

  function handleSync() {
    if (handleDraft.trim() !== cf.handle) setCfHandle(handleDraft)
    setTimeout(() => syncCf(), 0)
  }

  const tile = (label: string, value: string | number) => (
    <div key={label} style={{ background: 'var(--bg0)', borderRadius: 8, padding: '9px 10px' }}>
      <div style={{ font: "400 9px 'Roboto Mono'", color: 'var(--mut)', marginBottom: 3 }}>{label}</div>
      <div style={{ font: "500 18px/1 'Roboto Mono'", color: 'var(--a)' }}>{value ?? '—'}</div>
    </div>
  )

  const totalSolved = data.a2oj.reduce((s, x) => s + (x.solved || 0), 0)
  const totalProbs  = A2OJ_DEFS.reduce((s, d) => s + d.total, 0)

  return (
    <div style={{ background: 'var(--card0)', borderRadius: 11, padding: '22px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 18 }}>
        <span style={{ font: "400 11px 'Roboto Mono'", color: 'var(--txt)' }}>competitive programming · codeforces + a2oj</span>
        <span style={{ font: "500 13px 'Roboto Mono'", color: 'var(--a)' }}>cp {cp}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 30 }}>
        {/* CF side */}
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            <input
              value={handleDraft}
              onChange={e => setHandleDraft(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSync()}
              placeholder="codeforces handle"
              style={{
                flex: 1, minWidth: 0, background: 'var(--bg0)', border: 'none', borderRadius: 8,
                color: 'var(--ink)', font: "400 12px 'Roboto Mono'", padding: '9px 11px', outline: 'none',
              }}
            />
            <button onClick={handleSync} disabled={cfPulling} style={{
              cursor: cfPulling ? 'default' : 'pointer', border: 'none',
              background: 'var(--a)', color: '#111',
              font: "500 12px 'Roboto Mono'", padding: '0 18px', borderRadius: 8, opacity: cfPulling ? .6 : 1,
            }}>{cfPulling ? '…' : 'sync'}</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8, marginBottom: 11 }}>
            {tile('rating',   cf.rating   ?? '—')}
            {tile('max',      cf.maxRating ?? '—')}
            {tile('solved',   cf.solved   ?? '—')}
            {tile('contests', cf.contests  ?? '—')}
          </div>

          <div style={{ font: "400 10px 'Roboto Mono'", color: 'var(--mut)' }}>
            {cf.error
              ? <span style={{ color: '#e06060' }}>{cf.error}</span>
              : cf.rank
                ? <>{cf.rank} · {cf.lastSync ? 'synced ' + ago(cf.lastSync) : 'not synced'}</>
                : <span style={{ color: 'var(--mut)' }}>enter handle and sync to fetch stats</span>
            }
          </div>
        </div>

        {/* A2OJ summary */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
            <span style={{ font: "400 10px 'Roboto Mono'", color: 'var(--mut)' }}>a2oj ladders · 29 sets</span>
            <span style={{ font: "500 13px 'Roboto Mono'", color: 'var(--a)' }}>{totalSolved} <span style={{ color: 'var(--dim2)', fontWeight: 400 }}>/ {totalProbs}</span></span>
          </div>

          {/* overall bar */}
          <div style={{ height: 5, background: 'var(--cardHi)', borderRadius: 3, overflow: 'hidden', marginBottom: 14 }}>
            <div style={{ height: '100%', borderRadius: 3, background: 'var(--a)', width: (totalSolved / totalProbs * 100) + '%', transition: 'width .3s' }} />
          </div>

          {/* group breakdown */}
          {A2OJ_GROUPS.map(g => {
            const solved = g.ids.reduce((s, id) => s + (data.a2oj.find(x => x.id === id)?.solved || 0), 0)
            const pct    = Math.round(solved / g.total * 100)
            return (
              <div key={g.label} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ font: "400 9px 'Roboto Mono'", color: 'var(--dim2)' }}>{g.label}</span>
                  <span style={{ font: "400 9px 'Roboto Mono'", color: 'var(--mut)' }}>{solved}/{g.total}</span>
                </div>
                <div style={{ height: 4, background: 'var(--cardHi)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 2, background: 'rgba(var(--rgb),.5)', width: pct + '%', transition: 'width .3s' }} />
                </div>
              </div>
            )
          })}

          <div style={{ font: "400 9px 'Roboto Mono'", color: 'var(--dim2)', marginTop: 10 }}>
            auto-tracked from CF submissions · sync CF to update
          </div>
        </div>
      </div>
    </div>
  )
}
