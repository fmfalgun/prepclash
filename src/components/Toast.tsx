import { useStore } from '../store/useStore'

export function Toast() {
  const toast = useStore(s => s.toast)
  const data  = useStore(s => s.data)
  if (!toast) return null
  return (
    <div
      className={'rtt pal-' + data.palette}
      style={{
        position: 'fixed', bottom: 30, left: '50%', transform: 'translateX(-50%)',
        zIndex: 60,
        background: 'linear-gradient(90deg,rgba(var(--rgb),.16),rgba(var(--a2rgb),.16))',
        border: '1px solid var(--a2)', borderRadius: 6,
        padding: '13px 24px',
        font: "700 15px 'Rajdhani',sans-serif", letterSpacing: '.06em',
        color: 'var(--ink)',
        boxShadow: '0 0 30px rgba(var(--a2rgb),.35)',
        animation: 'flash 2.6s ease-out forwards',
        whiteSpace: 'nowrap',
      }}
    >
      {toast}
    </div>
  )
}
