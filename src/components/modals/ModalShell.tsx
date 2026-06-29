import type { ReactNode } from 'react'
import { useStore } from '../../store/useStore'

interface Props {
  kicker: string
  title: string
  children: ReactNode
  maxWidth?: number
}

export function ModalShell({ kicker, title, children, maxWidth = 580 }: Props) {
  const closeModal = useStore(s => s.closeModal)
  const palette    = useStore(s => s.data.palette)

  return (
    <div
      onClick={closeModal}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(10,11,12,.78)', backdropFilter: 'blur(4px)',
        zIndex: 50, display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        padding: '40px 20px', overflowY: 'auto',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className={'rtt pal-' + palette}
        style={{
          width: '100%', maxWidth,
          background: '#252729',
          border: '1px solid rgba(255,255,255,.08)', borderRadius: 10,
          boxShadow: '0 24px 60px rgba(0,0,0,.55)',
          padding: '24px 26px', color: 'var(--ink)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <div style={{ font: "400 9px 'Roboto Mono'", letterSpacing: '.18em', color: 'var(--mut)', marginBottom: 4 }}>{kicker}</div>
            <div style={{ font: "300 22px/1.1 'Lexend Deca'", color: 'var(--ink)' }}>{title}</div>
          </div>
          <button
            onClick={closeModal}
            style={{
              cursor: 'pointer', background: 'transparent',
              border: '1px solid rgba(255,255,255,.1)', color: 'var(--mut)',
              width: 32, height: 32, borderRadius: 6, fontSize: 14, lineHeight: '1',
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
    <label style={{ display: 'block', font: "400 10px 'Roboto Mono'", letterSpacing: '.12em', color: 'var(--mut)', marginBottom: 6, ...style }}>
      {children}
    </label>
  )
}

export const inputStyle: React.CSSProperties = {
  width: '100%', backgroundColor: 'var(--bg0)',
  border: '1px solid rgba(255,255,255,.1)', borderRadius: 6,
  color: 'var(--ink)', font: "400 13px 'Roboto Mono'",
  padding: '10px 12px', outline: 'none',
}

export function SubmitBtn({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        cursor: 'pointer', width: '100%', marginTop: 20,
        border: 'none', background: 'var(--a)',
        color: '#111', font: "500 13px 'Roboto Mono'",
        padding: '13px', borderRadius: 7,
      }}
    >{children}</button>
  )
}
