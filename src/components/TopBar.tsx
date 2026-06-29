import { useStore } from '../store/useStore'
import { rank, streak } from '../store/selectors'

const TABS = ['HOME', 'VILLAGE', 'ARENA', 'STUDY', 'READING', 'WORKOUT', 'CLAN', 'LADDER'] as const

export function TopBar() {
  const data     = useStore(s => s.data)
  const tab      = useStore(s => s.tab)
  const setTab   = useStore(s => s.setTab)
  const setModal = useStore(s => s.setModal)
  const fbMode   = useStore(s => s.fbMode)

  const r  = rank(data)
  const st = streak(data)
  const initials = (data.profile.name || 'op').slice(0, 2).toUpperCase()

  const connDot   = { offline: '#caa24a', online: '#46d98a', error: '#ff5a5a' }[fbMode] || '#caa24a'
  const connLabel = { offline: 'offline', online: 'live',    error: 'error'   }[fbMode] || 'offline'

  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 30,
      background: 'rgba(44,46,49,.97)', backdropFilter: 'blur(10px)',
      borderBottom: '1px solid rgba(255,255,255,.06)',
      padding: '12px 26px',
    }}>
      <div style={{ maxWidth: 1360, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 18 }}>

        {/* Brand / identity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, flexShrink: 0 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 8, flexShrink: 0,
            background: 'var(--cardHi)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            font: "500 15px 'Lexend Deca'", color: 'var(--a)',
          }}>{initials}</div>
          <div>
            <div style={{ font: "300 16px/1 'Lexend Deca'", color: 'var(--ink)' }}>
              prepclash <span style={{ font: "500 11px 'Roboto Mono'", color: 'var(--mut)' }}>v2</span>
            </div>
            <div style={{ font: "400 10px 'Roboto Mono'", color: 'var(--mut)', marginTop: 2 }}>
              {data.profile.name} · rank {r}
            </div>
          </div>
        </div>

        {/* Tab strip */}
        <div style={{ flex: 1, display: 'flex', gap: 2, justifyContent: 'center' }}>
          {TABS.map(t => {
            const id = t.toLowerCase()
            const on = tab === id
            return (
              <button key={t} onClick={() => setTab(id)} style={{
                cursor: 'pointer', border: 'none',
                background: on ? 'var(--cardHi)' : 'transparent',
                color: on ? 'var(--a)' : 'var(--mut)',
                font: "400 11px 'Roboto Mono'",
                padding: '8px 13px', borderRadius: 6,
                transition: 'color .12s, background .12s',
              }}>{t.toLowerCase()}</button>
            )
          })}
        </div>

        {/* Momentum + connect */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ font: "500 18px/1 'Roboto Mono'", color: 'var(--a2)' }}>
              {data.momentum.toLocaleString()}
            </div>
            <div style={{ font: "400 9px 'Roboto Mono'", color: 'var(--mut)', marginTop: 2 }}>
              momentum · {st}d streak
            </div>
          </div>
          <div style={{
            width: 44, height: 44, borderRadius: 8,
            border: '1.5px solid var(--a)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(var(--rgb),.06)',
          }}>
            <div style={{ font: "600 18px/1 'Roboto Mono'", color: 'var(--a)' }}>{r}</div>
            <div style={{ font: "400 8px 'Roboto Mono'", color: 'var(--mut)' }}>rank</div>
          </div>
          <button onClick={() => setModal('connect')} style={{
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
            border: '1px solid rgba(255,255,255,.1)',
            background: 'var(--cardHi)', color: 'var(--txt)',
            font: "400 11px 'Roboto Mono'",
            padding: '8px 12px', borderRadius: 7,
          }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: connDot, flexShrink: 0, display: 'inline-block' }} />
            {connLabel}
          </button>
        </div>

      </div>
    </div>
  )
}
