import { useStore } from '../store/useStore'
import { SKILL_DEFS } from '../data/skills'
import { AVATAR_COLORS, PALETTES } from '../data/palettes'
import { gradeColor } from '../lib/grades'
import { joinClan } from '../lib/firebase'
import { Radar } from './Radar'

const AXIS_COLORS: Record<string, string> = {
  systems: '#39ff88', network: '#2da0ff', python: '#caa24a',
  web: '#ff9f43', exploit: '#a855f7', cp: '#9bff39', physique: '#ff5a5a',
}

function squadNum(score: number): string {
  return String(Math.max(1, 300 - Math.floor(score * 2.5))).padStart(3, '0')
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
  const op = o

  const initials     = (o.name || 'OP').replace(/[^A-Za-z0-9]/g, '').slice(0, 2).toUpperCase()
  const colorHash    = Math.abs(o.uid.split('').reduce((a, c) => a + c.charCodeAt(0), 0))
  const avatarColor  = AVATAR_COLORS[colorHash % AVATAR_COLORS.length]
  const P            = PALETTES[o.palette] || PALETTES.toxic
  const rgb          = P.rgb
  const isYou        = fbUser?.uid === o.uid
  const clanDoc      = o.clanId ? clans.find(c => c.id === o.clanId) : null
  const nodesCleared = Object.keys(o.village).filter(k => o.village[k]?.cleared).length
  const arenaCount   = Object.keys(o.arena).length
  const lvl          = Math.floor(o.momentum / 150) + 1
  const sqn          = squadNum(o.overallScore)

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

  return (
    <div
      onClick={() => setSelected(null)}
      style={{ position: 'fixed', inset: 0, background: 'rgba(3,6,4,.88)', backdropFilter: 'blur(4px)', zIndex: 55, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 20px', overflowY: 'auto' }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ width: '100%', maxWidth: 560, position: 'relative', overflow: 'hidden', background: 'linear-gradient(145deg, #1a1e1b 0%, #0b110c 55%, #111813 100%)', border: `1px solid rgba(${rgb},.22)`, borderRadius: 14, boxShadow: `0 32px 80px rgba(0,0,0,.75), 0 0 60px rgba(${rgb},.06)` }}
      >
        {/* Accent stripe */}
        <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 4, background: `linear-gradient(180deg, ${P.a} 0%, ${P.a2} 100%)`, borderRadius: '14px 0 0 14px' }} />

        {/* Background squad number */}
        <div style={{ position: 'absolute', top: -14, right: -10, font: "700 130px/1 'Roboto Mono'", letterSpacing: '-.04em', color: `rgba(${rgb},.055)`, userSelect: 'none', pointerEvents: 'none' }}>#{sqn}</div>

        <div style={{ padding: '28px 28px 26px 36px' }}>

          {/* Header row */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 20 }}>
            <div style={{
              width: 60, height: 60, borderRadius: 10, flexShrink: 0,
              background: avatarColor + '1a', border: `2px solid ${avatarColor}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              font: "500 20px 'Lexend Deca'", color: avatarColor,
              boxShadow: `0 0 18px ${avatarColor}28`,
            }}>{initials}</div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ font: "500 19px/1 'Lexend Deca'", color: 'var(--ink)', letterSpacing: '.02em' }}>{o.name.toUpperCase()}</span>
                {isYou && <span style={{ font: "700 7px 'Roboto Mono'", letterSpacing: '.15em', color: P.a, border: `1px solid rgba(${rgb},.35)`, padding: '2px 7px', borderRadius: 3 }}>YOU</span>}
                {o.isShowcase && <span style={{ font: "700 7px 'Roboto Mono'", letterSpacing: '.15em', color: '#caa24a', border: '1px solid rgba(202,162,74,.3)', padding: '2px 7px', borderRadius: 3 }}>SHOWCASE</span>}
              </div>
              {o.handle && <div style={{ font: "400 9px 'Roboto Mono'", color: 'var(--mut)', marginTop: 3 }}>@{o.handle}</div>}
              {clanDoc && <div style={{ marginTop: 5, font: "500 9px 'Roboto Mono'", color: P.a, letterSpacing: '.04em' }}>{clanDoc.tag} {clanDoc.name}</div>}
              <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
                <span style={{ font: "500 9px 'Roboto Mono'", letterSpacing: '.06em', color: '#111', background: P.a, padding: '2px 9px', borderRadius: 4 }}>{o.rank}</span>
                <span style={{ font: "500 9px 'Roboto Mono'", color: gradeColor(o.rank), border: `1px solid rgba(${rgb},.3)`, padding: '2px 9px', borderRadius: 4 }}>LVL {lvl}</span>
              </div>
            </div>

            <button
              onClick={() => setSelected(null)}
              style={{ cursor: 'pointer', background: 'transparent', border: '1px solid rgba(255,255,255,.1)', color: 'var(--mut)', width: 28, height: 28, borderRadius: 4, fontSize: 14, flexShrink: 0 }}
            >✕</button>
          </div>

          {/* Stats strip */}
          <div style={{ height: 1, background: `rgba(${rgb},.1)`, marginBottom: 18 }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 22 }}>
            {[
              { val: o.momentum.toLocaleString(), label: 'MOMENTUM' },
              { val: String(o.overallScore),       label: 'SCORE'    },
              { val: o.streak + 'd',               label: 'STREAK'   },
              { val: '+' + o.weekXp,               label: 'WEEK XP'  },
            ].map(({ val, label }) => (
              <div key={label}>
                <div style={{ font: "500 18px/1 'Roboto Mono'", color: P.a2 }}>{val}</div>
                <div style={{ font: "400 7px 'Roboto Mono'", color: 'var(--mut)', marginTop: 4, letterSpacing: '.08em' }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Skill radar */}
          <div style={{ marginBottom: 22 }}>
            <div style={{ font: "500 8px 'Roboto Mono'", letterSpacing: '.18em', color: 'var(--mut)', marginBottom: 12 }}>SKILL RADAR</div>
            <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <Radar skillXp={o.skillXp} palette={o.palette} size={160} />
              <div style={{ flex: 1, minWidth: 120, display: 'flex', flexDirection: 'column', gap: 7, paddingTop: 4 }}>
                {SKILL_DEFS.map(s => {
                  const v  = Math.min(99, Math.round(o.skillXp[s.id] || 0))
                  const ac = AXIS_COLORS[s.id] || P.a
                  return (
                    <div key={s.id}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', font: "400 8px 'Roboto Mono'", color: 'var(--txt)', marginBottom: 3 }}>
                        <span>{s.name}</span>
                        <span style={{ color: ac }}>{v}</span>
                      </div>
                      <div style={{ height: 2, background: 'rgba(255,255,255,.06)', borderRadius: 2 }}>
                        <div style={{ width: v + '%', height: '100%', background: ac, opacity: .85, borderRadius: 2 }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Two columns: intel */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22 }}>

            {/* placeholder to keep right column */}
            <div style={{ display: 'none' }} />

            {/* Right: CF + village + arena */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

              {/* Codeforces */}
              {(o.cf?.rating || o.cf?.handle) && (
                <div>
                  <div style={{ font: "500 8px 'Roboto Mono'", letterSpacing: '.18em', color: 'var(--mut)', marginBottom: 8 }}>CODEFORCES</div>
                  {o.cf.rating ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
                      {[
                        { l: 'RATING', v: String(o.cf.rating) },
                        { l: 'RANK',   v: o.cf.rank || '—'    },
                        { l: 'SOLVED', v: String(o.cf.solved ?? '—') },
                        { l: 'HANDLE', v: '@' + (o.cf.handle || '—') },
                      ].map(({ l, v }) => (
                        <div key={l} style={{ background: 'rgba(255,255,255,.04)', borderRadius: 5, padding: '7px 9px' }}>
                          <div style={{ font: "400 7px 'Roboto Mono'", color: 'var(--mut)', marginBottom: 2 }}>{l}</div>
                          <div style={{ font: "500 13px/1 'Roboto Mono'", color: P.a2 }}>{v}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ font: "400 9px 'Roboto Mono'", color: 'var(--dim2)' }}>@{o.cf.handle} · not synced</div>
                  )}
                </div>
              )}

              {/* Platform handles: GitHub, Monkeytype, CodeChef */}
              {(o.gh?.handle || o.mt?.handle || o.cc?.handle) && (
                <div>
                  <div style={{ font: "500 8px 'Roboto Mono'", letterSpacing: '.18em', color: 'var(--mut)', marginBottom: 8 }}>PLATFORMS</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {o.gh?.handle && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(255,255,255,.04)', borderRadius: 5, padding: '7px 9px' }}>
                        <div>
                          <div style={{ font: "400 7px 'Roboto Mono'", color: 'var(--mut)', marginBottom: 2 }}>GITHUB</div>
                          <div style={{ font: "500 12px/1 'Roboto Mono'", color: P.a2 }}>@{o.gh.handle}</div>
                        </div>
                        {o.gh.public_repos != null && (
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ font: "400 7px 'Roboto Mono'", color: 'var(--mut)', marginBottom: 2 }}>REPOS</div>
                            <div style={{ font: "500 14px/1 'Roboto Mono'", color: P.a }}>{o.gh.public_repos}</div>
                          </div>
                        )}
                      </div>
                    )}
                    {o.mt?.handle && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(255,255,255,.04)', borderRadius: 5, padding: '7px 9px' }}>
                        <div>
                          <div style={{ font: "400 7px 'Roboto Mono'", color: 'var(--mut)', marginBottom: 2 }}>MONKEYTYPE</div>
                          <div style={{ font: "500 12px/1 'Roboto Mono'", color: P.a2 }}>@{o.mt.handle}</div>
                        </div>
                        {o.mt.pb60 != null && (
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ font: "400 7px 'Roboto Mono'", color: 'var(--mut)', marginBottom: 2 }}>PB 60s</div>
                            <div style={{ font: "500 14px/1 'Roboto Mono'", color: P.a }}>{o.mt.pb60} wpm</div>
                          </div>
                        )}
                      </div>
                    )}
                    {o.cc?.handle && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(255,255,255,.04)', borderRadius: 5, padding: '7px 9px' }}>
                        <div>
                          <div style={{ font: "400 7px 'Roboto Mono'", color: 'var(--mut)', marginBottom: 2 }}>CODECHEF</div>
                          <div style={{ font: "500 12px/1 'Roboto Mono'", color: P.a2 }}>@{o.cc.handle}</div>
                        </div>
                        {o.cc.rating && (
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ font: "400 7px 'Roboto Mono'", color: 'var(--mut)', marginBottom: 2 }}>{o.cc.stars}★ RATING</div>
                            <div style={{ font: "500 14px/1 'Roboto Mono'", color: P.a }}>{o.cc.rating}</div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Current target */}
              {o.currentTarget && (
                <div>
                  <div style={{ font: "500 8px 'Roboto Mono'", letterSpacing: '.18em', color: 'var(--mut)', marginBottom: 8 }}>CURRENT TARGET</div>
                  <div style={{ font: "500 11px 'Lexend Deca'", color: P.a, lineHeight: 1.4 }}>{o.currentTarget}</div>
                </div>
              )}

              {/* Last-week workout */}
              {o.weekWorkout && (
                <div>
                  <div style={{ font: "500 8px 'Roboto Mono'", letterSpacing: '.18em', color: 'var(--mut)', marginBottom: 8 }}>LAST 7 DAYS · WORKOUT</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                    <div style={{ background: 'rgba(255,255,255,.04)', borderRadius: 5, padding: '7px 9px' }}>
                      <div style={{ font: "400 7px 'Roboto Mono'", color: 'var(--mut)', marginBottom: 2 }}>SESSIONS</div>
                      <div style={{ font: "500 16px/1 'Roboto Mono'", color: P.a2 }}>{o.weekWorkout.sessions}</div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,.04)', borderRadius: 5, padding: '7px 9px' }}>
                      <div style={{ font: "400 7px 'Roboto Mono'", color: 'var(--mut)', marginBottom: 2 }}>VOLUME</div>
                      <div style={{ font: "500 16px/1 'Roboto Mono'", color: P.a2 }}>{o.weekWorkout.volume >= 1000 ? (o.weekWorkout.volume / 1000).toFixed(1) + 'k' : o.weekWorkout.volume}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Village progress */}
              <div>
                <div style={{ font: "500 8px 'Roboto Mono'", letterSpacing: '.18em', color: 'var(--mut)', marginBottom: 8 }}>VILLAGE</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', font: "400 9px 'Roboto Mono'", color: 'var(--txt)', marginBottom: 6 }}>
                  <span>nodes cleared</span>
                  <span style={{ color: P.a }}>{nodesCleared} / 16</span>
                </div>
                <div style={{ height: 5, background: 'rgba(255,255,255,.06)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: (nodesCleared / 16 * 100) + '%', height: '100%', background: `linear-gradient(90deg, ${P.a}, ${P.a2})`, borderRadius: 3, transition: 'width .4s' }} />
                </div>
              </div>

              {/* Arena */}
              <div>
                <div style={{ font: "500 8px 'Roboto Mono'", letterSpacing: '.18em', color: 'var(--mut)', marginBottom: 8 }}>ARENA</div>
                <div style={{ font: "500 26px/1 'Roboto Mono'", color: P.a2 }}>{arenaCount}</div>
                <div style={{ font: "400 7px 'Roboto Mono'", color: 'var(--mut)', marginTop: 4, letterSpacing: '.1em' }}>PROBLEMS SOLVED</div>
              </div>
            </div>
          </div>

          {/* Recent activity */}
          {o.recentActivity && o.recentActivity.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <div style={{ font: "500 8px 'Roboto Mono'", letterSpacing: '.18em', color: 'var(--mut)', marginBottom: 10 }}>RECENT ACTIVITY</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {o.recentActivity.map((a, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', background: 'rgba(255,255,255,.03)', borderRadius: 6 }}>
                    <span style={{ fontSize: 12, flexShrink: 0 }}>
                      {{ study: '⚡', workout: '⚔', reading: '📖', node: '◈', arena: '▶', course: '✓' }[a.type] || '·'}
                    </span>
                    <span style={{ flex: 1, font: "400 10px 'Lexend Deca'", color: 'var(--txt)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.title}</span>
                    <span style={{ font: "400 8px 'Roboto Mono'", color: 'var(--dim2)', flexShrink: 0 }}>
                      {Math.floor((Date.now() - a.ts) / 86400000) === 0 ? 'today' : Math.floor((Date.now() - a.ts) / 86400000) + 'd ago'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Clan join CTA */}
          {clanDoc && !isYou && data.clanId !== o.clanId && (
            <div style={{ marginTop: 22, borderTop: `1px solid rgba(${rgb},.1)`, paddingTop: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
              <div>
                <div style={{ font: "500 12px 'Lexend Deca'", color: 'var(--ink)' }}>{clanDoc.tag} {clanDoc.name}</div>
                <div style={{ font: "400 8px 'Roboto Mono'", color: 'var(--mut)', marginTop: 4 }}>
                  {clanDoc.memberCount} member{clanDoc.memberCount !== 1 ? 's' : ''} · {clanDoc.description}
                </div>
              </div>
              <button
                onClick={handleJoinClan}
                style={{ cursor: 'pointer', flexShrink: 0, padding: '10px 18px', border: `1px solid rgba(${rgb},.4)`, background: `rgba(${rgb},.1)`, color: P.a, font: "500 10px 'Lexend Deca'", letterSpacing: '.1em', borderRadius: 5 }}
              >
                {fbUser ? 'JOIN CLAN' : 'SIGN IN TO JOIN'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
