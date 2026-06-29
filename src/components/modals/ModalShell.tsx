import type { ReactNode } from 'react'
import { useStore } from '../../store/useStore'

interface Props {
  kicker: string
  title: string
  children: ReactNode
}

export function ModalShell({ kicker, title, children }: Props) {
  const closeModal = useStore(s => s.closeModal)
  const palette    = useStore(s => s.data.palette)

  return (
    <div
      onClick={closeModal}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(3,6,4,.82)', backdropFilter: 'blur(3px)',
        zIndex: 50, display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        padding: '40px 20px', overflowY: 'auto',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className={'rtt pal-' + palette}
        style={{
          width: '100%', maxWidth: 580,
          background: 'linear-gradient(180deg,#0c130d,#080d09)',
          border: '1px solid rgba(var(--a2rgb),.28)', borderRadius: 7,
          boxShadow: '0 30px 80px rgba(0,0,0,.7),0 0 40px rgba(var(--rgb),.08)',
          padding: 24, color: 'var(--ink)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
          <div>
            <div style={{ font: "700 9px 'Share Tech Mono'", letterSpacing: '.3em', color: 'var(--dim)' }}>{kicker}</div>
            <div style={{ font: "700 24px/1.1 'Rajdhani'", color: 'var(--ink)', marginTop: 3 }}>{title}</div>
          </div>
          <button
            onClick={closeModal}
            style={{
              cursor: 'pointer', background: 'transparent',
              border: '1px solid rgba(var(--rgb),.2)', color: 'var(--mut)',
              width: 30, height: 30, borderRadius: 4, fontSize: 16, lineHeight: '1',
            }}
          >✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function ModalLabel({ children, style }: { children: ReactNode; style?: React.CSSProperties }) {
  return (
    <label style={{ display: 'block', font: "700 9px 'Share Tech Mono'", letterSpacing: '.2em', color: 'var(--mut)', marginBottom: 7, ...style }}>
      {children}
    </label>
  )
}

export const inputStyle: React.CSSProperties = {
  width: '100%', backgroundColor: 'var(--bg0)',
  border: '1px solid rgba(var(--rgb),.2)', borderRadius: 4,
  color: 'var(--ink)', fontSize: 12, padding: '10px', outline: 'none',
}

export function SubmitBtn({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        cursor: 'pointer', width: '100%', marginTop: 20,
        border: '1px solid var(--a2)',
        background: 'linear-gradient(90deg,rgba(var(--rgb),.15),rgba(var(--a2rgb),.15))',
        color: 'var(--ink)', font: "700 14px 'Rajdhani'", letterSpacing: '.12em',
        padding: 13, borderRadius: 5, boxShadow: '0 0 18px rgba(var(--a2rgb),.2)',
      }}
    >{children}</button>
  )
}
