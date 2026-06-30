import { useStore } from '../store/useStore'

export function CloudRestoreBanner() {
  const prompt = useStore(s => s.cloudRestorePrompt)
  const accept = useStore(s => s.acceptCloudRestore)
  const reject = useStore(s => s.rejectCloudRestore)

  if (!prompt) return null

  const d = new Date(prompt.savedAt)
  const label = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) +
    ' · ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })

  return (
    <div style={{
      position: 'fixed', bottom: 70, left: '50%', transform: 'translateX(-50%)',
      zIndex: 60, background: '#1a1c1e', border: '1px solid rgba(255,255,255,.15)',
      borderRadius: 10, padding: '14px 18px', display: 'flex', alignItems: 'center',
      gap: 14, boxShadow: '0 8px 32px rgba(0,0,0,.6)', maxWidth: 420, width: 'calc(100vw - 40px)',
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ font: "400 9px 'Roboto Mono'", letterSpacing: '.14em', color: 'var(--mut)', marginBottom: 3 }}>
          CLOUD BACKUP FOUND
        </div>
        <div style={{ font: "500 12px 'Lexend Deca'", color: 'var(--ink)' }}>
          {label}
        </div>
        <div style={{ font: "400 10px 'Roboto Mono'", color: 'var(--dim2)', marginTop: 2 }}>
          Restore to sync from another device?
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={reject}
          style={{ cursor: 'pointer', background: 'transparent', border: '1px solid rgba(255,255,255,.15)', color: 'var(--mut)', font: "500 11px 'Roboto Mono'", padding: '7px 12px', borderRadius: 6 }}
        >Keep local</button>
        <button
          onClick={accept}
          style={{ cursor: 'pointer', background: 'var(--a)', border: 'none', color: '#111', font: "500 11px 'Roboto Mono'", padding: '7px 14px', borderRadius: 6 }}
        >Restore</button>
      </div>
    </div>
  )
}
