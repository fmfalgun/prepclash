import { useState } from 'react'
import { useStore } from '../../store/useStore'
import { PALETTES } from '../../data/palettes'
import { signInWithGoogle, signOut, saveFbConfigRaw, saveCloudBackup } from '../../lib/firebase'
import { ModalShell, ModalLabel, inputStyle, SubmitBtn } from './ModalShell'

export function ConnectModal() {
  const data          = useStore(s => s.data)
  const nameDraft     = useStore(s => s.nameDraft)
  const setName       = useStore(s => s.setNameDraft)
  const saveName      = useStore(s => s.saveName)
  const setPalette    = useStore(s => s.setPalette)
  const resetData     = useStore(s => s.resetData)
  const deleteAccount = useStore(s => s.deleteAccount)
  const fbConfigDraft = useStore(s => s.fbConfigDraft)
  const setFbConfig   = useStore(s => s.setFbConfigDraft)
  const fbMode        = useStore(s => s.fbMode)
  const fbError       = useStore(s => s.fbError)
  const fbUser        = useStore(s => s.fbUser)
  const onSignedOut   = useStore(s => s.onSignedOut)
  const showToast     = useStore(s => s.showToast)
  const setCfHandle    = useStore(s => s.setCfHandle)
  const triggerCloudSave = useStore(s => s.triggerCloudSave)

  const [signingIn, setSigningIn] = useState(false)
  const [cfDraft, setCfDraft]     = useState(data.cf.handle || '')

  async function hardRefresh() {
    try {
      if ('caches' in window) {
        const keys = await caches.keys()
        await Promise.all(keys.map(k => caches.delete(k)))
      }
    } catch {}
    try {
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations()
        await Promise.all(regs.map(r => r.unregister()))
      }
    } catch {}
    window.location.reload()
  }

  async function handleGoogleAuth() {
    setSigningIn(true)
    try {
      if (fbConfigDraft.trim()) saveFbConfigRaw(fbConfigDraft.trim())
      await signInWithGoogle()
      // Auth state change handled in App.tsx via onAuthStateChanged
    } catch (err: unknown) {
      showToast('AUTH FAILED · ' + String(err).slice(0, 40))
    } finally {
      setSigningIn(false)
    }
  }

  async function handleSignOut() {
    try {
      // Save to cloud BEFORE signing out — once auth token is revoked writes fail
      if (fbUser?.uid) {
        await saveCloudBackup(fbUser.uid, data).catch(() => {})
      }
      await signOut()
      onSignedOut()
      showToast('SIGNED OUT')
    } catch { showToast('SIGN OUT FAILED') }
  }

  const modeStyle = {
    offline: { dot: '#caa24a', text: 'OFFLINE · Data saved locally only.' },
    online:  { dot: '#39ff88', text: 'LIVE · Syncing as ' + (fbUser?.name || fbUser?.email || data.profile.uid || '…') },
    error:   { dot: '#ff5a5a', text: 'ERROR · ' + (fbError || 'Connection failed.') },
  }
  const ms = modeStyle[fbMode] || modeStyle.offline

  return (
    <ModalShell kicker="CONTROL // SYNC" title="Connect & Settings">
      {/* Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(var(--rgb),.05)', border: '1px solid rgba(var(--rgb),.1)', borderRadius: 5, padding: '11px 14px', marginBottom: 20 }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: ms.dot, flexShrink: 0 }} />
        <span style={{ font: "400 10px 'Roboto Mono'", color: 'var(--txt)' }}>{ms.text}</span>
      </div>

      {/* Name */}
      <ModalLabel>OPERATIVE NAME</ModalLabel>
      <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
        <input value={nameDraft} onChange={e => setName(e.target.value)} placeholder="OPERATIVE"
          style={{ ...inputStyle, flex: 1 }} onKeyDown={e => e.key === 'Enter' && saveName()} />
        <button onClick={saveName} style={{ cursor: 'pointer', border: '1px solid var(--a2)', background: 'rgba(var(--a2rgb),.1)', color: 'var(--a2)', font: "500 11px 'Lexend Deca'", letterSpacing: '.1em', padding: '0 16px', borderRadius: 4 }}>SAVE</button>
      </div>

      {/* Codeforces handle */}
      <ModalLabel>CODEFORCES HANDLE</ModalLabel>
      <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
        <input
          value={cfDraft}
          onChange={e => setCfDraft(e.target.value)}
          placeholder="your_cf_handle"
          style={{ ...inputStyle, flex: 1 }}
          onKeyDown={e => e.key === 'Enter' && setCfHandle(cfDraft)}
        />
        <button
          onClick={() => setCfHandle(cfDraft)}
          style={{ cursor: 'pointer', border: '1px solid var(--a2)', background: 'rgba(var(--a2rgb),.1)', color: 'var(--a2)', font: "500 11px 'Lexend Deca'", letterSpacing: '.1em', padding: '0 16px', borderRadius: 4 }}
        >SAVE</button>
      </div>
      <div style={{ font: "400 9px 'Roboto Mono'", color: 'var(--dim2)', marginBottom: 18 }}>
        {data.cf.handle
          ? <>Linked: <span style={{ color: 'var(--a)' }}>{data.cf.handle}</span>{data.cf.rating ? ` · ${data.cf.rating} (${data.cf.rank})` : ''}</>
          : 'Link your CF account to show rating on your public profile.'}
      </div>

      {/* Palette */}
      <ModalLabel>COLOR PALETTE</ModalLabel>
      <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
        {(Object.entries(PALETTES) as [string, typeof PALETTES.toxic][]).map(([id, P]) => (
          <button key={id} onClick={() => setPalette(id as any)} style={{
            cursor: 'pointer', flex: 1,
            border: `1.5px solid ${data.palette === id ? P.a2 : 'rgba(255,255,255,.08)'}`,
            background: `rgba(${P.rgb},.1)`, borderRadius: 4, padding: '8px 4px',
            color: P.a, font: "500 8px 'Roboto Mono'", letterSpacing: '.08em',
          }}>{P.name}</button>
        ))}
      </div>

      {/* Auth */}
      <ModalLabel>GOOGLE ACCOUNT</ModalLabel>
      {fbUser ? (
        <div>
          <div style={{ background: 'rgba(var(--rgb),.05)', border: '1px solid rgba(var(--rgb),.12)', borderRadius: 5, padding: '12px 14px', marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ font: "500 12px 'Lexend Deca'", color: 'var(--ink)' }}>{fbUser.name || fbUser.email}</div>
              <div style={{ font: "400 9px 'Roboto Mono'", color: 'var(--dim2)', marginTop: 3 }}>{fbUser.email}</div>
            </div>
            <span style={{ font: "500 8px 'Roboto Mono'", color: '#39ff88', border: '1px solid rgba(57,255,136,.3)', padding: '3px 8px', borderRadius: 3 }}>SIGNED IN</span>
          </div>
          <button onClick={handleSignOut} style={{ cursor: 'pointer', width: '100%', border: '1px solid rgba(var(--rgb),.2)', background: 'transparent', color: 'var(--mut)', font: "500 10px 'Roboto Mono'", letterSpacing: '.1em', padding: 11, borderRadius: 5 }}>SIGN OUT</button>
        </div>
      ) : (
        <div>
          <div style={{ font: "400 9px 'Roboto Mono'", color: 'var(--dim2)', lineHeight: 1.6, marginBottom: 10 }}>
            Sign in to log progress, appear on the leaderboard, and join a clan. All data is synced to Firebase.
          </div>
          <textarea value={fbConfigDraft} onChange={e => setFbConfig(e.target.value)}
            placeholder={'Leave blank to use default Firebase project\n(or paste your own config JSON)'}
            rows={3}
            style={{ ...inputStyle, resize: 'none', fontSize: 10, lineHeight: 1.5, marginBottom: 10 }}
          />
          <SubmitBtn onClick={handleGoogleAuth}>{signingIn ? 'CONNECTING…' : '⟳ SIGN IN WITH GOOGLE'}</SubmitBtn>
        </div>
      )}

      {/* Cloud & app actions */}
      <div style={{ marginTop: 14, borderTop: '1px solid rgba(var(--rgb),.1)', paddingTop: 16, display: 'flex', gap: 8 }}>
        {fbUser && (
          <button
            onClick={triggerCloudSave}
            style={{ cursor: 'pointer', flex: 1, border: '1px solid rgba(var(--a2rgb),.3)', background: 'rgba(var(--a2rgb),.06)', color: 'var(--a2)', font: "500 10px 'Roboto Mono'", letterSpacing: '.08em', padding: 10, borderRadius: 5 }}
          >FORCE SAVE TO CLOUD</button>
        )}
        <button
          onClick={hardRefresh}
          style={{ cursor: 'pointer', flex: 1, border: '1px solid rgba(var(--rgb),.2)', background: 'transparent', color: 'var(--mut)', font: "500 10px 'Roboto Mono'", letterSpacing: '.08em', padding: 10, borderRadius: 5 }}
        >CLEAR CACHE & RELOAD</button>
      </div>

      {/* Danger zone */}
      <div style={{ marginTop: 14, borderTop: '1px solid rgba(255,90,90,.12)', paddingTop: 16 }}>
        <ModalLabel>danger zone</ModalLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button onClick={resetData} style={{ cursor: 'pointer', border: '1px solid rgba(255,90,90,.2)', background: 'rgba(255,90,90,.04)', color: '#c0746f', font: "400 10px 'Roboto Mono'", padding: 10, width: '100%', borderRadius: 6 }}>
            reset all local progress
          </button>
          {fbUser && (
            <button onClick={deleteAccount} style={{ cursor: 'pointer', border: '1px solid rgba(255,90,90,.35)', background: 'rgba(255,90,90,.08)', color: '#e06060', font: "400 10px 'Roboto Mono'", padding: 10, width: '100%', borderRadius: 6 }}>
              delete account & all data
            </button>
          )}
        </div>
      </div>
    </ModalShell>
  )
}
