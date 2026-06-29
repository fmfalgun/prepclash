import { useStore } from '../store/useStore'
import { SKILL_DEFS } from '../data/skills'
import { VILLAGE } from '../data/village'
import { ARENA } from '../data/arena'
import { AVATAR_COLORS, PALETTES } from '../data/palettes'
import { gradeColor } from '../lib/grades'
import { joinClan } from '../lib/firebase'

const AXIS_COLORS: Record<string, string> = {
  systems: '#39ff88', network: '#2da0ff', python: '#caa24a',
  web: '#ff9f43', exploit: '#a855f7', cp: '#9bff39', physique: '#ff5a5a',
}

export function PlayerDetailModal() {
  const o           = useStore(s => s.selectedPlayer)
  const setSelected = useStore(s => s.setSelectedPlayer)
  const fbUser      = useStore(s => s.fbUser)
  const clans       = useStore(s => s.clans)
  const data        = useStore(s => s.data)
  const showToast   = useStore(s => s.showToast)
  const setModal    = useStore(s => s.setModal)

  if (!o) return null
  const op = o // non-null alias for use inside closures

  const initials   = (o.name || 'OP').replace(/[^A-Za-z0-9]/g, '').slice(0, 2).toUpperCase()
  const colorHash  = Math.abs(o.uid.split('').reduce((a, c) => a + c.charCodeAt(0), 0))
  const color      = AVATAR_COLORS[colorHash % AVATAR_COLORS.length]
  const P          = PALETTES[o.palette] || PALETTES.toxic
  const isYou      = fbUser?.uid === o.uid
  const clanDoc    = o.clanId ? clans.find(c => c.id === o.clanId) : null
  const nodesCleared = Object.keys(o.village).filter(k => o.village[k]?.cleared).length
  const arenaCount   = Object.keys(o.arena).length

  async function handleJoinClan() {
    if (!fbUser) { setSelected(null); setModal('connect'); return }
    if (!op.clanId) return
    try {
      await joinClan(fbUser.uid, op.clanId)
      showToast('JOINED ' + (clanDoc?.name || op.clanId).toUpperCase())
      setSelected(null)
    } catch {
      showToast('JOIN FAILED · CHECK CONNECTION')
    }
  }

  const rgb = P.rgb

  return (
    <div
      onClick={() => setSelected(null)}
      style={{ position: 'fixed', inset: 0, background: 'rgba(3,6,4,.85)', backdropFilter: 'blur(4px)', zIndex: 55, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 20px', overflowY: 'auto' }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ width: '100%', maxWidth: 700, background: 'linear-gradient(180deg,#0c130d,#080d09)', border: `1px solid rgba(${rgb},.3)`, borderRadius: 8, boxShadow: `0 30px 80px rgba(0,0,0,.7),0 0 50px rgba(${rgb},.08)`, padding: 28, color: 'var(--ink)' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 18, marginBottom: 24 }}>
          <div style={{ width: 64, height: 64, borderRadius: 8, flexShrink: 0, background: color + '18', border: `2px solid ${color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', font: "700 26px 'Rajdhani'", color, boxShadow: `0 0 20px ${color}30` }}>{initials}</div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ font: "700 26px/1 'Rajdhani'", color: 'var(--ink)' }}>{o.name}</span>
              {o.isShowcase && <span style={{ font: "700 8px 'Share Tech Mono'", letterSpacing: '.15em', color: '#caa24a', border: '1px solid rgba(202,162,74,.3)', padding: '3px 7px', borderRadius: 3 }}>SHOWCASE</span>}
              {isYou && <span style={{ font: "700 8px 'Share Tech Mono'", letterSpacing: '.15em', color: P.a, border: `1px solid rgba(${rgb},.3)`, padding: '3px 7px', borderRadius: 3 }}>YOU</span>}
            </div>
            {o.handle && <div style={{ font: "400 10px 'Share Tech Mono'", color: 'var(--mut)', marginTop: 3 }}>{o.handle}</div>}
            {clanDoc && <div style={{ marginTop: 6, font: "700 10px 'Share Tech Mono'", color: P.a }}>{clanDoc.tag} {clanDoc.name}</div>}
          </div>
          <div style={{ display: 'flex', gap: 16, textAlign: 'center', flexShrink: 0 }}>
            {[{ n: o.momentum.toLocaleString(), l: 'MOMENTUM' }, { n: o.streak + 'd', l: 'STREAK' }, { n: String(o.overallScore), l: 'SCORE' }].map(({ n, l }) => (
              <div key={l}>
                <div style={{ font: "700 22px/1 'Rajdhani'", color: P.a2 }}>{n}</div>
                <div style={{ font: "400 8px 'Share Tech Mono'", color: 'var(--mut)', marginTop: 3 }}>{l}</div>
              </div>
            ))}
          </div>
          <button onClick={() => setSelected(null)} style={{ cursor: 'pointer', background: 'transparent', border: '1px solid rgba(255,255,255,.12)', color: 'var(--mut)', width: 30, height: 30, borderRadius: 4, fontSize: 16, flexShrink: 0 }}>✕</button>
        </div>

        {/* Quick stats */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 22 }}>
          {[
            { label: 'RANK',         value: o.rank,                  color: gradeColor(o.rank) },
            { label: 'NODES',        value: nodesCleared + ' / 16',  color: 'var(--ink)' },
            { label: 'ARENA SOLVED', value: String(arenaCount),      color: 'var(--ink)' },
            { label: 'CF RATING',    value: String(o.cf?.rating || '—'), color: 'var(--ink)' },
            { label: 'WEEK XP',      value: '+' + o.weekXp,          color: P.a2 },
          ].map(({ label, value, color: c }) => (
            <div key={label} style={{ flex: 1, background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.06)', borderRadius: 5, padding: '10px 8px', textAlign: 'center' }}>
              <div style={{ font: "700 8px 'Share Tech Mono'", color: 'var(--mut)', letterSpacing: '.12em' }}>{label}</div>
              <div style={{ font: "700 16px 'Rajdhani'", marginTop: 4, color: c }}>{value}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Skill bars */}
          <div>
            <div style={{ font: "700 9px 'Share Tech Mono'", letterSpacing: '.2em', color: 'var(--mut)', marginBottom: 10 }}>SKILL AXES</div>
            {SKILL_DEFS.map(s => {
              const v  = Math.min(99, Math.round(s.base + (o.skillXp[s.id] || 0)))
              const ac = AXIS_COLORS[s.id] || P.a
              return (
                <div key={s.id} style={{ marginBottom: 9 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', font: "400 9px 'Share Tech Mono'", color: 'var(--txt)', marginBottom: 3 }}>
                    <span>{s.name}</span><span style={{ color: ac }}>{v}</span>
                  </div>
                  <div style={{ height: 3, background: 'rgba(255,255,255,.06)', borderRadius: 2 }}>
                    <div style={{ width: v + '%', height: '100%', background: ac, opacity: .85, borderRadius: 2 }} />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Village progress */}
          <div>
            <div style={{ font: "700 9px 'Share Tech Mono'", letterSpacing: '.2em', color: 'var(--mut)', marginBottom: 10 }}>VILLAGE PROGRESS</div>
            {VILLAGE.map((tier, ti) => (
              <div key={ti} style={{ marginBottom: 12 }}>
                <div style={{ font: "700 8px 'Share Tech Mono'", color: 'var(--dim2)', marginBottom: 5 }}>T{ti}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {tier.nodes.map(n => {
                    const cleared = o.village[n.id]?.cleared
                    return (
                      <span key={n.id} title={n.name} style={{ font: "400 8px 'Share Tech Mono'", padding: '4px 8px', borderRadius: 3, background: cleared ? `rgba(${rgb},.12)` : 'rgba(255,255,255,.03)', border: cleared ? `1px solid rgba(${rgb},.4)` : '1px solid rgba(255,255,255,.06)', color: cleared ? P.a : 'var(--dim2)' }}>
                        {cleared ? '✓ ' : ''}{n.name.split(' ')[0]}
                      </span>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Arena solved */}
        {arenaCount > 0 && (
          <div style={{ marginTop: 20, borderTop: '1px solid rgba(255,255,255,.06)', paddingTop: 16 }}>
            <div style={{ font: "700 9px 'Share Tech Mono'", letterSpacing: '.2em', color: 'var(--mut)', marginBottom: 10 }}>ARENA SOLVED</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {Object.keys(o.arena).map(qid => {
                const allQs = Object.values(ARENA).flatMap(t => t.questions)
                const q = allQs.find(x => x.id === qid)
                if (!q) return null
                const dc: Record<string, string> = { EASY: '#39ff88', MED: '#caa24a', HARD: '#ff5a5a' }
                return (
                  <span key={qid} style={{ font: "400 8px 'Share Tech Mono'", padding: '4px 10px', borderRadius: 3, background: 'rgba(57,255,136,.06)', border: '1px solid rgba(57,255,136,.2)', color: dc[q.diff] || 'var(--txt)' }}>
                    ✓ {q.title.slice(0, 32)}{q.title.length > 32 ? '…' : ''}
                  </span>
                )
              })}
            </div>
          </div>
        )}

        {/* Clan join CTA */}
        {clanDoc && !isYou && data.clanId !== o.clanId && (
          <div style={{ marginTop: 22, borderTop: '1px solid rgba(255,255,255,.06)', paddingTop: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <div>
              <div style={{ font: "700 13px 'Rajdhani'", color: 'var(--ink)' }}>{clanDoc.tag} {clanDoc.name}</div>
              <div style={{ font: "400 9px 'Share Tech Mono'", color: 'var(--mut)', marginTop: 3 }}>{clanDoc.memberCount} member{clanDoc.memberCount !== 1 ? 's' : ''} · {clanDoc.description}</div>
            </div>
            <button onClick={handleJoinClan} style={{ cursor: 'pointer', flexShrink: 0, padding: '11px 20px', border: `1px solid rgba(${rgb},.4)`, background: `rgba(${rgb},.1)`, color: P.a, font: "700 11px 'Rajdhani'", letterSpacing: '.1em', borderRadius: 5, boxShadow: `0 0 14px rgba(${rgb},.15)` }}>
              {fbUser ? 'JOIN CLAN' : 'SIGN IN TO JOIN'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
