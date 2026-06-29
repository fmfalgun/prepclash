import { useState } from 'react'
import { useStore } from '../store/useStore'
import { AVATAR_COLORS } from '../data/palettes'
import { gradeColor } from '../lib/grades'
import { joinClan, leaveClan, createClan } from '../lib/firebase'
import { clanEligibility } from '../store/selectors'
import type { ClanDoc, PublicOperative } from '../types'

export function Clan() {
  const clans       = useStore(s => s.clans)
  const operatives  = useStore(s => s.operatives)
  const fbUser      = useStore(s => s.fbUser)
  const data        = useStore(s => s.data)
  const fbMode      = useStore(s => s.fbMode)
  const setSelectedClan   = useStore(s => s.setSelectedClan)
  const setSelectedPlayer = useStore(s => s.setSelectedPlayer)
  const setModal    = useStore(s => s.setModal)
  const showToast   = useStore(s => s.showToast)
  const setClanId   = useStore(s => s.setClanId)
  const deleteClan  = useStore(s => s.deleteClan)
  const transferClanAdmin = useStore(s => s.transferClanAdmin)
  const selectedClan = useStore(s => s.selectedClan)

  const [creating, setCreating]     = useState(false)
  const [clanName, setClanName]     = useState('')
  const [clanTag, setClanTag]       = useState('')
  const [clanDesc, setClanDesc]     = useState('')
  const [submitting, setSubmitting] = useState(false)

  const myClanId = data.clanId || null
  const { eligible, score, needed } = clanEligibility(data)

  async function handleJoin(clanId: string) {
    if (!fbUser) { setModal('connect'); showToast('SIGN IN TO JOIN A CLAN'); return }
    if (myClanId) { showToast('LEAVE YOUR CURRENT CLAN FIRST'); return }
    try {
      await joinClan(fbUser.uid, clanId, myClanId)
      setClanId(clanId)
      showToast('JOINED · WELCOME TO THE CLAN')
    } catch (e) { showToast(String(e).includes('Already') ? 'LEAVE YOUR CURRENT CLAN FIRST' : 'JOIN FAILED') }
  }

  async function handleLeave(clan: ClanDoc, members: PublicOperative[]) {
    if (!fbUser || !myClanId) return
    const isFounder = clan.founderUid === fbUser.uid
    const otherMembers = members.filter(m => m.uid !== fbUser.uid)
    if (isFounder && otherMembers.length > 0) {
      showToast('TRANSFER ADMIN FIRST OR DISBAND CLAN')
      return
    }
    if (isFounder && otherMembers.length === 0) {
      // last member + founder — just delete
      deleteClan(myClanId)
      return
    }
    try {
      await leaveClan(fbUser.uid, myClanId)
      setClanId(null)
      showToast('LEFT CLAN')
    } catch { showToast('FAILED') }
  }

  async function handleCreate() {
    if (!fbUser) { setModal('connect'); return }
    if (!eligible) { showToast(`EFFORT SCORE ${score}/${needed} — KEEP GRINDING`); return }
    if (myClanId) { showToast('LEAVE YOUR CURRENT CLAN FIRST'); return }
    const name = clanName.trim()
    if (!name) { showToast('ENTER A CLAN NAME'); return }
    setSubmitting(true)
    try {
      const newId = await createClan(fbUser.uid, name, clanTag.trim() || `[${name.slice(0,3).toUpperCase()}]`, clanDesc.trim())
      setClanId(newId)
      showToast('CLAN CREATED · ' + name.toUpperCase())
      setCreating(false); setClanName(''); setClanTag(''); setClanDesc('')
    } catch { showToast('CREATE FAILED · CHECK CONNECTION') }
    finally { setSubmitting(false) }
  }

  const activeClan = selectedClan || (myClanId ? clans.find(c => c.id === myClanId) : null)
  const clanMembers = activeClan ? operatives.filter(op => op.clanId === activeClan.id) : []
  const isMyActiveClan = activeClan?.id === myClanId
  const iAmFounder = !!(activeClan && fbUser && activeClan.founderUid === fbUser.uid)

  return (
    <div style={{ maxWidth: 1060, margin: '0 auto', padding: '28px 26px 80px', display: 'flex', gap: 24, alignItems: 'flex-start' }}>
      {/* LEFT — Clan list */}
      <div style={{ width: 280, flexShrink: 0 }}>
        <div style={{ font: "500 9px 'Roboto Mono'", letterSpacing: '.22em', color: 'var(--mut)', marginBottom: 14 }}>CLANS</div>

        {fbMode === 'offline' && (
          <div style={{ font: "400 9px 'Roboto Mono'", color: 'var(--dim2)', padding: '20px 0' }}>Connecting…</div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {clans.map(clan => {
            const isActive = activeClan?.id === clan.id
            const isMine   = clan.id === myClanId
            return (
              <div
                key={clan.id}
                onClick={() => setSelectedClan(isActive ? null : clan)}
                style={{
                  cursor: 'pointer', padding: '13px 15px', borderRadius: 6,
                  border: isActive ? '1px solid rgba(var(--a2rgb),.35)' : '1px solid rgba(var(--rgb),.1)',
                  background: isActive ? 'rgba(var(--a2rgb),.07)' : 'rgba(var(--rgb),.03)',
                  transition: 'border-color .15s',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span style={{ font: "500 10px 'Roboto Mono'", color: 'var(--a2)', letterSpacing: '.06em' }}>{clan.tag} </span>
                    <span style={{ font: "500 15px 'Lexend Deca'", color: 'var(--ink)' }}>{clan.name}</span>
                  </div>
                  {isMine && <span style={{ font: "500 7px 'Roboto Mono'", color: 'var(--a)', border: '1px solid rgba(var(--rgb),.3)', padding: '2px 6px', borderRadius: 3 }}>YOURS</span>}
                </div>
                <div style={{ font: "400 9px 'Roboto Mono'", color: 'var(--mut)', marginTop: 5, lineHeight: 1.4 }}>{clan.description}</div>
                <div style={{ font: "400 8px 'Roboto Mono'", color: 'var(--dim2)', marginTop: 6 }}>{clan.memberCount} member{clan.memberCount !== 1 ? 's' : ''}</div>
              </div>
            )
          })}
        </div>

        {clans.length === 0 && fbMode === 'online' && (
          <div style={{ font: "400 9px 'Roboto Mono'", color: 'var(--dim2)', padding: '20px 0', lineHeight: 1.6 }}>No clans yet. More coming when operatives join.</div>
        )}

        {!fbUser && (
          <button
            onClick={() => setModal('connect')}
            style={{
              cursor: 'pointer', marginTop: 18, width: '100%',
              border: '1px solid rgba(var(--a2rgb),.25)',
              background: 'rgba(var(--a2rgb),.07)', color: 'var(--a2)',
              font: "500 10px 'Lexend Deca'", letterSpacing: '.1em', padding: '12px', borderRadius: 5,
            }}
          >SIGN IN TO JOIN →</button>
        )}

        {fbUser && !myClanId && (
          <div style={{ marginTop: 18 }}>
            {!creating ? (
              <div>
                <button
                  onClick={() => { if (eligible) setCreating(true); else showToast(`EFFORT SCORE ${score}/${needed} — KEEP GRINDING`) }}
                  style={{
                    cursor: eligible ? 'pointer' : 'not-allowed', width: '100%',
                    border: '1px solid rgba(var(--rgb),.2)',
                    background: 'transparent', color: eligible ? 'var(--mut)' : 'var(--dim2)',
                    font: "500 10px 'Roboto Mono'", letterSpacing: '.1em', padding: '11px', borderRadius: 5,
                    opacity: eligible ? 1 : 0.7,
                  }}
                >+ CREATE NEW CLAN</button>
                {!eligible && (
                  <div style={{ marginTop: 8, font: "400 9px 'Roboto Mono'", color: 'var(--dim2)', lineHeight: 1.5 }}>
                    effort score: <span style={{ color: 'var(--a)' }}>{score}</span>/{needed}<br />
                    <span style={{ opacity: .7 }}>momentum · sessions · active days</span>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ border: '1px solid rgba(var(--rgb),.15)', borderRadius: 6, padding: 14 }}>
                <div style={{ font: "500 9px 'Roboto Mono'", letterSpacing: '.08em', color: 'var(--mut)', marginBottom: 12 }}>NEW CLAN</div>
                {([
                  { label: 'NAME *', val: clanName, set: setClanName, placeholder: 'Clan name' },
                  { label: 'TAG',    val: clanTag,  set: setClanTag,  placeholder: '[ABC] — auto if blank' },
                  { label: 'BIO',    val: clanDesc, set: setClanDesc, placeholder: 'Short description' },
                ] as const).map(f => (
                  <div key={f.label} style={{ marginBottom: 8 }}>
                    <div style={{ font: "500 8px 'Roboto Mono'", color: 'var(--dim2)', marginBottom: 4 }}>{f.label}</div>
                    <input
                      value={f.val}
                      onChange={e => f.set(e.target.value)}
                      placeholder={f.placeholder}
                      style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.09)', borderRadius: 4, padding: '8px 10px', color: 'var(--ink)', font: "400 11px 'Roboto Mono'", outline: 'none' }}
                    />
                  </div>
                ))}
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button onClick={() => setCreating(false)} style={{ cursor: 'pointer', flex: 1, border: '1px solid rgba(255,255,255,.08)', background: 'transparent', color: 'var(--mut)', font: "500 9px 'Roboto Mono'", padding: '9px', borderRadius: 4 }}>CANCEL</button>
                  <button onClick={handleCreate} disabled={submitting} style={{ cursor: 'pointer', flex: 2, border: '1px solid rgba(var(--rgb),.3)', background: 'rgba(var(--rgb),.08)', color: 'var(--a)', font: "500 10px 'Lexend Deca'", letterSpacing: '.1em', padding: '9px', borderRadius: 4 }}>
                    {submitting ? 'CREATING…' : 'FOUND CLAN'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* RIGHT — Clan detail */}
      <div style={{ flex: 1 }}>
        {activeClan ? (
          <ClanDetail
            clan={activeClan}
            members={clanMembers}
            isMine={isMyActiveClan}
            iAmFounder={iAmFounder}
            fbUser={fbUser}
            onJoin={() => handleJoin(activeClan.id)}
            onLeave={() => handleLeave(activeClan, clanMembers)}
            onDelete={() => deleteClan(activeClan.id)}
            onTransfer={(toUid) => transferClanAdmin(activeClan.id, toUid)}
            onPlayerClick={setSelectedPlayer}
          />
        ) : (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <div style={{ font: "500 14px 'Lexend Deca'", color: 'var(--mut)', letterSpacing: '.06em' }}>SELECT A CLAN</div>
            <div style={{ font: "400 9px 'Roboto Mono'", color: 'var(--dim2)', marginTop: 8 }}>Click any clan from the list to view its members and stats.</div>
          </div>
        )}
      </div>
    </div>
  )
}

function ClanDetail({
  clan, members, isMine, iAmFounder, fbUser, onJoin, onLeave, onDelete, onTransfer, onPlayerClick,
}: {
  clan: ClanDoc
  members: PublicOperative[]
  isMine: boolean
  iAmFounder: boolean
  fbUser: { uid: string } | null
  onJoin: () => void
  onLeave: () => void
  onDelete: () => void
  onTransfer: (uid: string) => void
  onPlayerClick: (op: PublicOperative) => void
}) {
  const [showTransfer, setShowTransfer] = useState(false)
  const totalMomentum = members.reduce((a, m) => a + m.momentum, 0)
  const avgScore      = members.length ? Math.round(members.reduce((a, m) => a + m.overallScore, 0) / members.length) : 0
  const sorted        = [...members].sort((a, b) => b.momentum - a.momentum)
  const otherMembers  = members.filter(m => m.uid !== fbUser?.uid)

  return (
    <div>
      {/* Clan header */}
      <div style={{ marginBottom: 22 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <span style={{ font: "500 11px 'Roboto Mono'", color: 'var(--a2)', letterSpacing: '.1em' }}>{clan.tag} </span>
            <span style={{ font: "500 28px 'Lexend Deca'", color: 'var(--ink)' }}>{clan.name}</span>
            {iAmFounder && (
              <span style={{ marginLeft: 12, font: "500 8px 'Roboto Mono'", color: 'var(--a)', border: '1px solid rgba(var(--rgb),.3)', padding: '2px 8px', borderRadius: 3, verticalAlign: 'middle' }}>ADMIN</span>
            )}
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            {!isMine && (
              <button onClick={onJoin} style={{
                cursor: 'pointer', border: '1px solid rgba(var(--a2rgb),.3)',
                background: 'rgba(var(--a2rgb),.08)', color: 'var(--a2)',
                font: "500 11px 'Lexend Deca'", letterSpacing: '.08em', padding: '10px 20px', borderRadius: 5,
              }}>{fbUser ? 'JOIN CLAN' : 'SIGN IN TO JOIN'}</button>
            )}
            {isMine && iAmFounder && (
              <>
                {otherMembers.length > 0 && (
                  <button onClick={() => setShowTransfer(!showTransfer)} style={{
                    cursor: 'pointer', border: '1px solid rgba(var(--a2rgb),.25)',
                    background: 'transparent', color: 'var(--a2)',
                    font: "500 10px 'Roboto Mono'", padding: '9px 14px', borderRadius: 5,
                  }}>TRANSFER ADMIN</button>
                )}
                <button onClick={onDelete} style={{
                  cursor: 'pointer', border: '1px solid rgba(255,90,90,.25)',
                  background: 'transparent', color: '#c0746f',
                  font: "500 10px 'Roboto Mono'", padding: '9px 14px', borderRadius: 5,
                }}>DISBAND CLAN</button>
              </>
            )}
            {isMine && !iAmFounder && (
              <button onClick={onLeave} style={{
                cursor: 'pointer', border: '1px solid rgba(255,90,90,.25)',
                background: 'transparent', color: '#c0746f',
                font: "500 10px 'Roboto Mono'", letterSpacing: '.08em', padding: '9px 16px', borderRadius: 5,
              }}>LEAVE CLAN</button>
            )}
          </div>
        </div>
        <div style={{ font: "400 10px 'Lexend Deca'", color: 'var(--mut)', marginTop: 6 }}>{clan.description}</div>

        {/* Founder transfer warning for own clan */}
        {isMine && iAmFounder && otherMembers.length > 0 && (
          <div style={{ marginTop: 10, font: "400 9px 'Roboto Mono'", color: 'var(--dim2)', lineHeight: 1.5 }}>
            as admin: transfer leadership to a member before leaving, or disband the clan
          </div>
        )}
      </div>

      {/* Transfer admin panel */}
      {showTransfer && (
        <div style={{ background: 'rgba(var(--rgb),.04)', border: '1px solid rgba(var(--rgb),.12)', borderRadius: 8, padding: '14px 16px', marginBottom: 20 }}>
          <div style={{ font: "500 9px 'Roboto Mono'", color: 'var(--mut)', letterSpacing: '.08em', marginBottom: 12 }}>TRANSFER ADMIN TO</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {otherMembers.map(m => (
              <div key={m.uid} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', borderRadius: 6, background: 'var(--card0)' }}>
                <span style={{ font: "400 13px 'Lexend Deca'", color: 'var(--ink)' }}>{m.name}</span>
                <button onClick={() => { onTransfer(m.uid); setShowTransfer(false) }} style={{
                  cursor: 'pointer', border: 'none',
                  background: 'rgba(var(--a2rgb),.15)', color: 'var(--a2)',
                  font: "500 9px 'Roboto Mono'", padding: '6px 12px', borderRadius: 4,
                }}>MAKE ADMIN</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Clan stats */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 22 }}>
        {[
          { n: members.length, l: 'MEMBERS' },
          { n: totalMomentum.toLocaleString(), l: 'TOTAL MOMENTUM' },
          { n: avgScore, l: 'AVG SCORE' },
          { n: sorted[0]?.name || '—', l: 'TOP OPERATIVE' },
        ].map(({ n, l }) => (
          <div key={l} style={{ flex: 1, background: 'rgba(var(--rgb),.04)', border: '1px solid rgba(var(--rgb),.1)', borderRadius: 5, padding: '12px 10px', textAlign: 'center' }}>
            <div style={{ font: "500 8px 'Roboto Mono'", color: 'var(--mut)' }}>{l}</div>
            <div style={{ font: "500 18px 'Lexend Deca'", color: 'var(--a2)', marginTop: 4 }}>{String(n)}</div>
          </div>
        ))}
      </div>

      {/* Member list */}
      <div style={{ font: "500 9px 'Roboto Mono'", letterSpacing: '.08em', color: 'var(--mut)', marginBottom: 10 }}>ROSTER</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {sorted.map((op, i) => {
          const color = AVATAR_COLORS[Math.abs(op.uid.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % AVATAR_COLORS.length]
          const initials = (op.name || 'OP').replace(/[^A-Za-z0-9]/g, '').slice(0, 2).toUpperCase()
          const nodes = Object.keys(op.village).filter(k => op.village[k]?.cleared).length
          const isFounder = op.uid === clan.founderUid
          return (
            <div
              key={op.uid}
              onClick={() => onPlayerClick(op)}
              style={{
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px', borderRadius: 6,
                border: '1px solid rgba(var(--rgb),.1)', background: i % 2 === 0 ? 'rgba(var(--rgb),.03)' : 'transparent',
                transition: 'border-color .15s',
              }}
            >
              <span style={{ font: "500 10px 'Lexend Deca'", color: 'var(--mut)', width: 22 }}>#{i + 1}</span>
              <div style={{ width: 36, height: 36, borderRadius: 5, background: color + '18', border: `1px solid ${color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', font: "500 13px 'Lexend Deca'", color, flexShrink: 0 }}>{initials}</div>
              <div style={{ flex: 1 }}>
                <div style={{ font: "500 13px 'Lexend Deca'", color: 'var(--ink)' }}>
                  {op.name}
                  {isFounder && <span style={{ marginLeft: 8, font: "500 7px 'Roboto Mono'", color: 'var(--a)', border: '1px solid rgba(var(--rgb),.3)', padding: '1px 5px', borderRadius: 3, verticalAlign: 'middle' }}>ADMIN</span>}
                </div>
                {op.handle && <div style={{ font: "400 8px 'Roboto Mono'", color: 'var(--dim2)' }}>{op.handle}</div>}
              </div>
              <span style={{ font: "500 10px 'Lexend Deca'", color: gradeColor(op.rank) }}>{op.rank}</span>
              <span style={{ font: "500 12px 'Lexend Deca'", color: 'var(--txt)', width: 70, textAlign: 'right' }}>{op.momentum.toLocaleString()}</span>
              <span style={{ font: "400 8px 'Roboto Mono'", color: 'var(--dim2)', width: 40, textAlign: 'right' }}>{nodes}/16</span>
            </div>
          )
        })}
      </div>

      {members.length === 0 && (
        <div style={{ font: "400 9px 'Roboto Mono'", color: 'var(--dim2)', textAlign: 'center', padding: 40 }}>No members have synced their data yet.</div>
      )}
    </div>
  )
}
