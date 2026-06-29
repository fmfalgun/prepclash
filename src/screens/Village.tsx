import { useStore } from '../store/useStore'
import { VILLAGE } from '../data/village'
import { isNodeCleared, isNodeUnlocked } from '../store/selectors'
import type { VillageNode } from '../data/village'

const TIER_LABELS = ['TIER 1 — FOUNDATIONS', 'TIER 2 — RECON & WEB', 'TIER 3 — EXPLOITATION', 'TIER 4 — POST-EXPLOIT', 'TIER 5 — ADVANCED OPS']
const AXIS_COLORS: Record<string, string> = {
  linux: '#39ff88', net: '#2da0ff', python: '#caa24a', web: '#ff9f43',
  privesc: '#a855f7', ad: '#22d3ee', crypto: '#ff5a5a', cp: '#9bff39', evasion: '#ff5a5a',
}

export function Village() {
  const data     = useStore(s => s.data)
  const openNode = useStore(s => s.openNode)

  const clearedCount = Object.values(data.village).filter(n => n?.cleared).length
  const total = VILLAGE.reduce((a, t) => a + t.nodes.length, 0)

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 26px 80px' }}>
      {/* Progress bar */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', font: "700 9px 'Share Tech Mono'", letterSpacing: '.2em', color: 'var(--mut)', marginBottom: 8 }}>
          <span>VILLAGE PROGRESS</span>
          <span style={{ color: 'var(--a2)' }}>{clearedCount} / {total} NODES</span>
        </div>
        <div style={{ height: 4, background: 'rgba(var(--rgb),.12)', borderRadius: 2 }}>
          <div style={{ width: (clearedCount / total * 100) + '%', height: '100%', background: 'linear-gradient(90deg,var(--a),var(--a2))', borderRadius: 2, boxShadow: '0 0 12px rgba(var(--a2rgb),.4)', transition: 'width .5s' }} />
        </div>
      </div>

      {VILLAGE.map((tier, ti) => (
        <div key={ti} style={{ marginBottom: 40 }}>
          <div style={{ font: "700 10px 'Share Tech Mono'", letterSpacing: '.25em', color: 'var(--mut)', marginBottom: 16 }}>
            {TIER_LABELS[ti] || 'TIER ' + (ti + 1)}
          </div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {tier.nodes.map(n => <NodeCard key={n.id} n={n} data={data} onClick={() => openNode(n.id)} />)}
          </div>
        </div>
      ))}
    </div>
  )
}

function NodeCard({ n, data, onClick }: { n: VillageNode; data: any; onClick: () => void }) {
  const cleared  = isNodeCleared(data, n.id)
  const unlocked = isNodeUnlocked(data, n.req)
  const locked   = !cleared && !unlocked

  const axisColor = AXIS_COLORS[n.axis] || 'var(--a2)'

  return (
    <div
      onClick={onClick}
      style={{
        cursor: 'pointer', width: 200, minHeight: 120, borderRadius: 7, padding: 16,
        border: cleared
          ? `1.5px solid ${axisColor}`
          : unlocked
          ? '1px solid rgba(var(--a2rgb),.3)'
          : '1px solid rgba(var(--rgb),.1)',
        background: cleared
          ? `rgba(${cssRgb(axisColor)},.07)`
          : unlocked
          ? 'rgba(var(--rgb),.05)'
          : 'rgba(var(--rgb),.02)',
        boxShadow: cleared ? `0 0 20px ${axisColor}28` : 'none',
        opacity: locked ? 0.45 : 1,
        transition: 'box-shadow .2s,opacity .2s',
        position: 'relative',
      }}
    >
      {cleared && (
        <div style={{ position: 'absolute', top: 10, right: 12, font: "700 12px 'Share Tech Mono'", color: axisColor }}>✓</div>
      )}
      {locked && (
        <div style={{ position: 'absolute', top: 10, right: 12, fontSize: 13 }}>🔒</div>
      )}

      <div style={{ font: "700 9px 'Share Tech Mono'", letterSpacing: '.18em', color: axisColor, marginBottom: 6 }}>
        {n.axis.toUpperCase()}
      </div>
      <div style={{ font: "700 15px/1.2 'Rajdhani'", color: cleared ? 'var(--ink)' : unlocked ? 'var(--ink)' : 'var(--txt)', letterSpacing: '.03em', marginBottom: 8 }}>
        {n.name}
      </div>
      <div style={{ font: "400 9.5px 'Inter'", color: 'var(--mut)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {n.desc}
      </div>
      <div style={{ marginTop: 12, font: "700 10px 'Rajdhani'", color: cleared ? axisColor : 'var(--dim2)' }}>
        +{n.xp} XP
      </div>
    </div>
  )
}

function cssRgb(hex: string): string {
  const m = hex.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i)
  if (!m) return '57,255,136'
  return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)].join(',')
}
