import { useStore } from '../store/useStore'
import { AVATAR_COLORS } from '../data/palettes'
import { gradeColor } from '../lib/grades'
import type { PublicOperative } from '../types'

export function Ladder() {
  const operatives  = useStore(s => s.operatives)
  const fbMode      = useStore(s => s.fbMode)
  const fbUser      = useStore(s => s.fbUser)
  const setSelected = useStore(s => s.setSelectedPlayer)
  const setModal    = useStore(s => s.setModal)

  const sorted = [...operatives].sort((a, b) => b.momentum - a.momentum)

  return (
    <div className="screen-pad" style={{ maxWidth: 860, margin: '0 auto', padding: '24px 16px 80px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <div style={{ font: "500 9px 'Roboto Mono'", letterSpacing: '.12em', color: 'var(--mut)' }}>GLOBAL</div>
          <div style={{ font: "500 30px 'Lexend Deca'", color: 'var(--ink)' }}>LADDER</div>
          <div style={{ font: "400 9px 'Roboto Mono'", color: 'var(--dim2)', marginTop: 4 }}>
            {sorted.length} operative{sorted.length !== 1 ? 's' : ''} · click any card for full profile
          </div>
        </div>

        {!fbUser && (
          <button
            onClick={() => setModal('connect')}
            style={{
              cursor: 'pointer',
              border: '1px solid rgba(var(--a2rgb),.35)',
              background: 'rgba(var(--a2rgb),.08)', color: 'var(--a2)',
              font: "500 11px 'Lexend Deca'", letterSpacing: '.1em',
              padding: '12px 20px', borderRadius: 5,
            }}
          >SIGN IN TO PARTICIPATE →</button>
        )}
      </div>

      {fbMode === 'offline' && (
        <div style={{ font: "400 10px 'Roboto Mono'", color: 'var(--mut)', textAlign: 'center', padding: '30px 0', borderBottom: '1px solid rgba(var(--rgb),.08)', marginBottom: 24 }}>
          Connecting to Firebase…
        </div>
      )}

      {/* Column headers */}
      <div className="ladder-header" style={{ display: 'flex', gap: 12, padding: '0 16px', marginBottom: 8, font: "500 8px 'Roboto Mono'", letterSpacing: '.18em', color: 'var(--dim2)' }}>
        <span style={{ width: 28 }}>#</span>
        <span style={{ width: 48 }} />
        <span style={{ flex: 1 }}>OPERATIVE</span>
        <span style={{ width: 52, textAlign: 'center' }}>RANK</span>
        <span style={{ width: 70, textAlign: 'center' }}>MOMENTUM</span>
        <span style={{ width: 55, textAlign: 'center' }}>SCORE</span>
        <span className="ladder-col-streak" style={{ width: 50, textAlign: 'center' }}>STREAK</span>
        <span className="ladder-col-nodes"  style={{ width: 55, textAlign: 'center' }}>NODES</span>
        <span className="ladder-col-clan"   style={{ width: 55, textAlign: 'center' }}>CLAN</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {sorted.map((op, i) => (
          <PlayerRow key={op.uid} op={op} pos={i + 1} isYou={fbUser?.uid === op.uid} onClick={() => setSelected(op)} />
        ))}
      </div>

      {sorted.length === 0 && fbMode === 'online' && (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ font: "500 14px 'Lexend Deca'", color: 'var(--mut)' }}>NO OPERATIVES YET</div>
          <div style={{ font: "400 9px 'Roboto Mono'", color: 'var(--dim2)', marginTop: 8 }}>Be the first — sign in and start logging progress.</div>
        </div>
      )}

      <div style={{ marginTop: 24, font: "400 9px 'Roboto Mono'", color: 'var(--dim2)', textAlign: 'center', lineHeight: 1.8 }}>
        Ranked by total momentum · Click any row to view full operative profile
      </div>
    </div>
  )
}

function PlayerRow({ op, pos, isYou, onClick }: { op: PublicOperative; pos: number; isYou: boolean; onClick: () => void }) {
  const color    = AVATAR_COLORS[Math.abs(op.uid.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % AVATAR_COLORS.length]
  const initials = (op.name || 'OP').replace(/[^A-Za-z0-9]/g, '').slice(0, 2).toUpperCase()
  const nodes    = Object.keys(op.village).filter(k => op.village[k]?.cleared).length

  return (
    <div
      onClick={onClick}
      style={{
        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 6,
        border: isYou ? '1px solid rgba(var(--a2rgb),.3)' : '1px solid rgba(var(--rgb),.09)',
        background: isYou ? 'rgba(var(--a2rgb),.05)' : pos % 2 === 0 ? 'rgba(var(--rgb),.02)' : 'transparent',
        transition: 'border-color .15s, background .15s',
      }}
    >
      <span style={{ width: 28, font: "500 11px 'Lexend Deca'", color: pos <= 3 ? 'var(--a2)' : 'var(--mut)', flexShrink: 0 }}>
        {pos === 1 ? '①' : pos === 2 ? '②' : pos === 3 ? '③' : '#' + pos}
      </span>

      <div style={{
        width: 38, height: 38, borderRadius: 6, flexShrink: 0,
        background: color + '18', border: `1px solid ${color}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        font: "500 14px 'Lexend Deca'", color,
      }}>{initials}</div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ font: "500 13px 'Lexend Deca'", color: isYou ? 'var(--a2)' : 'var(--ink)', letterSpacing: '.03em', display: 'flex', alignItems: 'center', gap: 6 }}>
          {op.name}
          {isYou && <span style={{ font: "400 8px 'Roboto Mono'", color: 'var(--mut)' }}>you</span>}
          {op.isShowcase && <span style={{ font: "400 8px 'Roboto Mono'", color: '#caa24a' }}>★</span>}
        </div>
        {op.handle && <div style={{ font: "400 8px 'Roboto Mono'", color: 'var(--dim2)' }}>{op.handle}</div>}
      </div>

      <span style={{ width: 52, textAlign: 'center', font: "500 12px 'Lexend Deca'", color: gradeColor(op.rank), flexShrink: 0 }}>{op.rank}</span>
      <span style={{ width: 70, textAlign: 'center', font: "500 13px 'Lexend Deca'", color: 'var(--txt)', flexShrink: 0 }}>{op.momentum.toLocaleString()}</span>
      <span style={{ width: 55, textAlign: 'center', font: "500 13px 'Lexend Deca'", color: 'var(--a2)', flexShrink: 0 }}>{op.overallScore}</span>
      <span className="ladder-col-streak" style={{ width: 50, textAlign: 'center', font: "400 9px 'Roboto Mono'", color: 'var(--mut)', flexShrink: 0 }}>{op.streak}d</span>
      <span className="ladder-col-nodes"  style={{ width: 55, textAlign: 'center', font: "400 9px 'Roboto Mono'", color: 'var(--dim2)', flexShrink: 0 }}>{nodes}/16</span>
      <span className="ladder-col-clan"   style={{ width: 55, textAlign: 'center', font: "400 8px 'Roboto Mono'", color: 'var(--dim2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexShrink: 0 }}>
        {op.clanId || '—'}
      </span>
    </div>
  )
}
