import { useStore } from '../store/useStore'
import { buildMockClan } from '../data/mock'
import { overallScore, rank } from '../store/selectors'
import { AVATAR_COLORS } from '../data/palettes'
import { gradeColor } from '../lib/grades'

export function Ladder() {
  const data    = useStore(s => s.data)

  const mockClan = buildMockClan(data)
  const entries  = useStore(s => s.liveClan) || mockClan

  const myScore = Math.round(overallScore(data))
  const myRank  = rank(data)

  return (
    <div style={{ maxWidth: 780, margin: '0 auto', padding: '28px 26px 80px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <div style={{ font: "700 9px 'Share Tech Mono'", letterSpacing: '.3em', color: 'var(--mut)' }}>GLOBAL</div>
          <div style={{ font: "700 28px 'Rajdhani'", color: 'var(--ink)' }}>LADDER</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ font: "700 9px 'Share Tech Mono'", color: 'var(--mut)', marginBottom: 4 }}>YOUR POSITION</div>
          <div style={{ font: "700 28px/1 'Rajdhani'", color: 'var(--a2)' }}>{myRank}</div>
          <div style={{ font: "400 9px 'Share Tech Mono'", color: 'var(--dim2)', marginTop: 3 }}>score {myScore}</div>
        </div>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', gap: 12, padding: '0 14px', marginBottom: 8, font: "700 8px 'Share Tech Mono'", letterSpacing: '.18em', color: 'var(--dim2)' }}>
        <span style={{ width: 28 }}>#</span>
        <span style={{ flex: 1 }}>OPERATIVE</span>
        <span style={{ width: 52, textAlign: 'center' }}>RANK</span>
        <span style={{ width: 60, textAlign: 'center' }}>MOMENTUM</span>
        <span style={{ width: 60, textAlign: 'center' }}>NODE</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {entries.map((m, i) => (
          <div
            key={i}
            style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px', borderRadius: 6,
              border: m.you ? '1px solid rgba(var(--a2rgb),.3)' : '1px solid rgba(var(--rgb),.08)',
              background: m.you ? 'rgba(var(--a2rgb),.06)' : i % 2 === 0 ? 'rgba(var(--rgb),.02)' : 'transparent',
            }}
          >
            {/* Rank number */}
            <span style={{ width: 28, font: "700 11px 'Rajdhani'", color: i < 3 ? 'var(--a2)' : 'var(--mut)' }}>
              {i === 0 ? '①' : i === 1 ? '②' : i === 2 ? '③' : '#' + (i + 1)}
            </span>

            {/* Avatar */}
            <div style={{
              width: 34, height: 34, borderRadius: 5, flexShrink: 0,
              background: m.color + '18',
              border: `1px solid ${m.color}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              font: "700 13px 'Rajdhani'", color: m.color,
            }}>{m.initials}</div>

            {/* Name */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ font: "700 13px 'Rajdhani'", color: m.you ? 'var(--a2)' : 'var(--ink)', letterSpacing: '.03em' }}>
                {m.name}{m.you && <span style={{ font: "400 8px 'Share Tech Mono'", color: 'var(--mut)', marginLeft: 6 }}>you</span>}
              </div>
            </div>

            {/* Rank badge */}
            <span style={{ width: 52, textAlign: 'center', font: "700 10px 'Rajdhani'", color: gradeColor(m.rank), letterSpacing: '.04em' }}>
              {m.rank}
            </span>

            {/* Momentum */}
            <span style={{ width: 60, textAlign: 'center', font: "700 12px 'Rajdhani'", color: 'var(--txt)' }}>
              {m.momentum.toLocaleString()}
            </span>

            {/* Node */}
            <span style={{ width: 60, textAlign: 'center', font: "400 8px 'Share Tech Mono'", color: 'var(--dim2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {m.node}
            </span>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 24, font: "400 9px 'Share Tech Mono'", color: 'var(--dim2)', textAlign: 'center', lineHeight: 1.7 }}>
        Live leaderboard requires Firebase sign-in via Connect.<br/>
        Showing mock clan data — your score is live.
      </div>
    </div>
  )
}
