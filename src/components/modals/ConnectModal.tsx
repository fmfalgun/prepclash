import { useState } from 'react'
import { useStore } from '../../store/useStore'
import { PALETTES } from '../../data/palettes'
import { initFirebase, signInWithGoogle, saveFbConfigRaw } from '../../lib/firebase'
import { ModalShell, ModalLabel, inputStyle, SubmitBtn } from './ModalShell'
import type { ClanMember } from '../../types'

export function ConnectModal() {
  const data         = useStore(s => s.data)
  const nameDraft    = useStore(s => s.nameDraft)
  const setName      = useStore(s => s.setNameDraft)
  const saveName     = useStore(s => s.saveName)
  const setPalette   = useStore(s => s.setPalette)
  const resetData    = useStore(s => s.resetData)
  const fbConfigDraft = useStore(s => s.fbConfigDraft)
  const setFbConfig  = useStore(s => s.setFbConfigDraft)
  const fbMode       = useStore(s => s.fbMode)
  const fbError      = useStore(s => s.fbError)
  const setFbMode    = useStore(s => s.setFbMode)
  const updateFromFb = useStore(s => s.updateFromFirebase)
  const setLiveClan  = useStore(s => s.setLiveClan)
  const showToast    = useStore(s => s.showToast)

  const [signingIn, setSigningIn] = useState(false)

  async function handleGoogleAuth() {
    setSigningIn(true)
    try {
      if (fbConfigDraft.trim()) {
        saveFbConfigRaw(fbConfigDraft.trim())
      }
      await initFirebase(
        (mode, err) => setFbMode(mode, err),
        (uid, name) => { if (uid) updateFromFb(uid, name) },
        (members: ClanMember[]) => setLiveClan(members),
      )
      await signInWithGoogle()
      showToast('GOOGLE SIGN-IN TRIGGERED · WAIT FOR AUTH')
    } catch (err: unknown) {
      setFbMode('error', String(err))
      showToast('AUTH FAILED · CHECK CONSOLE')
    } finally {
      setSigningIn(false)
    }
  }

  const modeMap = {
    offline: { dot: '#caa24a', text: 'OFFLINE MODE  ·  Data stored locally. Firebase not connected.' },
    online:  { dot: '#39ff88', text: 'LIVE MODE  ·  Syncing with Firebase as ' + (data.profile.uid || '…') },
    error:   { dot: '#ff5a5a', text: 'ERROR  ·  ' + (fbError || 'Could not connect to Firebase.') },
  }
  const m = modeMap[fbMode] || modeMap.offline

  return (
    <ModalShell kicker="CONTROL // SYNC" title="Connect & Settings">
      {/* Status banner */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(var(--rgb),.05)', borderRadius: 5, padding: '11px 14px', marginBottom: 20, border: '1px solid rgba(var(--rgb),.1)' }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: m.dot, boxShadow: `0 0 6px ${m.dot}`, flexShrink: 0 }} />
        <span style={{ font: "400 10px 'Share Tech Mono'", color: 'var(--txt)' }}>{m.text}</span>
      </div>

      {/* Identity */}
      <ModalLabel>OPERATIVE NAME</ModalLabel>
      <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
        <input
          value={nameDraft}
          onChange={e => setName(e.target.value)}
          placeholder="TOJI"
          style={{ ...inputStyle, flex: 1 }}
          onKeyDown={e => e.key === 'Enter' && saveName()}
        />
        <button
          onClick={saveName}
          style={{ cursor: 'pointer', border: '1px solid var(--a2)', background: 'rgba(var(--a2rgb),.1)', color: 'var(--a2)', font: "700 11px 'Rajdhani'", letterSpacing: '.1em', padding: '0 16px', borderRadius: 4 }}
        >SAVE</button>
      </div>

      {/* Palette */}
      <ModalLabel>COLOR PALETTE</ModalLabel>
      <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
        {(Object.entries(PALETTES) as [string, typeof PALETTES.toxic][]).map(([id, P]) => (
          <button
            key={id}
            onClick={() => setPalette(id as any)}
            style={{
              cursor: 'pointer', flex: 1, border: `1.5px solid ${data.palette === id ? P.a2 : 'rgba(255,255,255,.08)'}`,
              background: `rgba(${P.rgb},.1)`, borderRadius: 4, padding: '8px 4px',
              color: P.a, font: "700 8px 'Share Tech Mono'", letterSpacing: '.1em',
            }}
          >{P.name}</button>
        ))}
      </div>

      {/* Firebase auth */}
      <ModalLabel>FIREBASE / GOOGLE SYNC</ModalLabel>
      <div style={{ font: "400 9px 'Share Tech Mono'", color: 'var(--dim2)', lineHeight: 1.6, marginBottom: 10 }}>
        Optional: paste a custom Firebase config JSON below, then click Google Sign-In to sync data across devices and join the live leaderboard.
      </div>
      <textarea
        value={fbConfigDraft}
        onChange={e => setFbConfig(e.target.value)}
        placeholder={'{\n  "apiKey": "...",\n  "projectId": "..."\n}'}
        rows={4}
        style={{ ...inputStyle, resize: 'vertical', fontSize: 10, lineHeight: 1.5, marginBottom: 10 }}
      />
      <SubmitBtn onClick={handleGoogleAuth}>
        {signingIn ? 'CONNECTING…' : '⟳ GOOGLE SIGN-IN'}
      </SubmitBtn>

      {/* Danger zone */}
      <div style={{ marginTop: 22, borderTop: '1px solid rgba(255,90,90,.15)', paddingTop: 16 }}>
        <ModalLabel>DANGER ZONE</ModalLabel>
        <button
          onClick={resetData}
          style={{ cursor: 'pointer', border: '1px solid rgba(255,90,90,.3)', background: 'rgba(255,90,90,.06)', color: '#c0746f', font: "700 10px 'Share Tech Mono'", letterSpacing: '.12em', padding: '10px', width: '100%', borderRadius: 4 }}
        >RESET ALL PROGRESS</button>
      </div>
    </ModalShell>
  )
}
