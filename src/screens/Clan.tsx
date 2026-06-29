import { useStore } from '../store/useStore'
import { buildMockClan } from '../data/mock'
import { overallScore, rank, streak } from '../store/selectors'
import { VILLAGE } from '../data/village'
import { isNodeCleared } from '../store/selectors'

const CLAN_NAME = 'RED TEAM ALPHA'
const CLAN_TAG  = '[RTA]'

export function Clan() {
  const data = useStore(s => s.data)

  const mockClan = buildMockClan(data)
  const roster = useStore(s => s.liveClan) || mockClan
  const sc   = Math.round(overallScore(data))
  const rk   = rank(data)
  const st   = streak(data)

  const clearedIds = Object.entries(data.village).filter(([, v]) => v?.cleared).map(([id]) => id)

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 26px 80px', display: 'flex', gap: 24, alignItems: 'flex-start' }}>
      {/* LEFT — Roster */}
      <div style={{ width: 260, flexShrink: 0 }}>
        <div style={{ background: 'rgba(var(--rgb),.03)', border: '1px solid rgba(var(--rgb),.12)', borderRadius: 7, padding: 18, marginBottom: 18 }}>
          <div style={{ font: "700 9px 'Share Tech Mono'", letterSpacing: '.22em', color: 'var(--mut)', marginBottom: 4 }}>{CLAN_TAG}</div>
          <div style={{ font: "700 22px 'Rajdhani'", color: 'var(--ink)', marginBottom: 6 }}>{CLAN_NAME}</div>
          <div style={{ font: "400 9px 'Share Tech Mono'", color: 'var(--dim2)' }}>{roster.length} OPERATIVES</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {roster.map((m, i) => (
            <div
              key={i}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderRadius: 6,
                border: m.you ? '1px solid rgba(var(--a2rgb),.3)' : '1px solid rgba(var(--rgb),.08)',
                background: m.you ? 'rgba(var(--a2rgb),.06)' : 'rgba(var(--rgb),.02)',
              }}
            >
              <div style={{
                width: 34, height: 34, borderRadius: 5, background: m.color + '22',
                border: `1px solid ${m.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                font: "700 13px 'Rajdhani'", color: m.color, flexShrink: 0,
              }}>{m.initials}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ font: "700 12px 'Rajdhani'", color: m.you ? 'var(--a2)' : 'var(--ink)', display: 'flex', alignItems: 'center', gap: 5 }}>
                  {m.name}{m.you && <span style={{ font: "400 8px 'Share Tech Mono'", color: 'var(--mut)' }}>you</span>}
                </div>
                <div style={{ font: "400 9px 'Share Tech Mono'", color: 'var(--mut)' }}>{m.rank} · ⚡{m.momentum}</div>
              </div>
              <div style={{ font: "700 9px 'Share Tech Mono'", color: 'var(--dim2)' }}>#{i + 1}</div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT — Shared roadmap */}
      <div style={{ flex: 1 }}>
        <div style={{ font: "700 9px 'Share Tech Mono'", letterSpacing: '.2em', color: 'var(--mut)', marginBottom: 6 }}>SHARED ROADMAP</div>
        <div style={{ font: "400 9px 'Share Tech Mono'", color: 'var(--dim2)', marginBottom: 20 }}>Your village node completions displayed here</div>

        {VILLAGE.map((tier, ti) => (
          <div key={ti} style={{ marginBottom: 28 }}>
            <div style={{ font: "700 9px 'Share Tech Mono'", letterSpacing: '.18em', color: 'var(--mut)', marginBottom: 10 }}>
              T{ti + 1}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {tier.nodes.map(n => {
                const cleared = isNodeCleared(data, n.id)
                return (
                  <div
                    key={n.id}
                    title={n.name + (cleared ? ' ✓' : ' ○')}
                    style={{
                      padding: '8px 14px', borderRadius: 5,
                      border: cleared ? '1px solid rgba(var(--a2rgb),.4)' : '1px solid rgba(var(--rgb),.1)',
                      background: cleared ? 'rgba(var(--a2rgb),.08)' : 'transparent',
                      font: "700 10px 'Rajdhani'", letterSpacing: '.06em',
                      color: cleared ? 'var(--a2)' : 'var(--dim2)',
                      display: 'flex', alignItems: 'center', gap: 6,
                    }}
                  >
                    <span style={{ fontSize: 10 }}>{cleared ? '✓' : '○'}</span>
                    {n.name}
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        <div style={{ marginTop: 28, background: 'rgba(var(--rgb),.04)', border: '1px solid rgba(var(--rgb),.12)', borderRadius: 7, padding: 20 }}>
          <div style={{ font: "700 9px 'Share Tech Mono'", letterSpacing: '.2em', color: 'var(--mut)', marginBottom: 14 }}>YOUR STATS</div>
          <div style={{ display: 'flex', gap: 24 }}>
            {[
              { n: sc, l: 'SCORE' },
              { n: rk, l: 'RANK' },
              { n: st + 'd', l: 'STREAK' },
              { n: data.momentum, l: 'MOMENTUM' },
              { n: clearedIds.length, l: 'NODES' },
            ].map(({ n, l }) => (
              <div key={l} style={{ textAlign: 'center' }}>
                <div style={{ font: "700 26px/1 'Rajdhani'", color: 'var(--a2)' }}>{n}</div>
                <div style={{ font: "400 8px 'Share Tech Mono'", color: 'var(--mut)', marginTop: 4 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
