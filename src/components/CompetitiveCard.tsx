import { useState } from 'react'
import { useStore } from '../store/useStore'
import { cpScore } from '../store/selectors'
import { A2OJ_DEFS } from '../data/a2oj'
import { ago } from '../lib/dates'

export function CompetitiveCard() {
  const data       = useStore(s => s.data)
  const syncCf     = useStore(s => s.syncCf)
  const bumpA2oj   = useStore(s => s.bumpA2oj)
  const setCfHandle = useStore(s => s.setCfHandle)
  const cfPulling  = useStore(s => s.cfPulling)
  const [handleDraft, setHandleDraft] = useState(data.cf.handle || '')

  const cf  = data.cf
  const cp  = cpScore(data)

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

        {/* A2OJ side */}
        <div>
          <div style={{ font: "400 10px 'Roboto Mono'", color: 'var(--mut)', marginBottom: 14 }}>a2oj ladders</div>
          {A2OJ_DEFS.map(def => {
            const entry = data.a2oj.find(x => x.id === def.id)
            const solved = entry?.solved ?? 0
            const pct = Math.round(solved / def.total * 100)
            return (
              <div key={def.id} style={{ marginBottom: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                  <span style={{ font: "400 13px 'Lexend Deca'", color: 'var(--ink)' }}>{def.name}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ font: "400 11px 'Roboto Mono'", color: 'var(--mut)' }}>{solved}/{def.total}</span>
                    <button onClick={() => bumpA2oj(def.id, -1)} style={{
                      cursor: 'pointer', width: 22, height: 22, borderRadius: 5, border: 'none',
                      background: 'var(--cardHi)', color: 'var(--mut)',
                      font: "400 14px 'Roboto Mono'", lineHeight: '1', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>−</button>
                    <button onClick={() => bumpA2oj(def.id, 1)} style={{
                      cursor: 'pointer', width: 22, height: 22, borderRadius: 5, border: 'none',
                      background: `rgba(var(--rgb),.16)`, color: 'var(--a)',
                      font: "400 14px 'Roboto Mono'", lineHeight: '1', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>+</button>
                  </div>
                </div>
                <div style={{ height: 6, background: 'var(--cardHi)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 3, background: 'var(--a)', width: pct + '%', transition: 'width .25s' }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
