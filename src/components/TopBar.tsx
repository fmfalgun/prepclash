import { useStore } from '../store/useStore'
import { rank, streak } from '../store/selectors'

const TABS = ['HOME', 'VILLAGE', 'ARENA', 'CLAN', 'LADDER'] as const

export function TopBar() {
  const data    = useStore(s => s.data)
  const tab     = useStore(s => s.tab)
  const setTab  = useStore(s => s.setTab)
  const setModal = useStore(s => s.setModal)

  const r = rank(data)
  const st = streak(data)
  const initials = (data.profile.name || 'TT').slice(0, 2).toUpperCase()
  const fbMode = useStore(s => s.fbMode)

  const connMap = {
    offline: { color: '#caa24a', label: 'OFFLINE' },
    online:  { color: '#39ff88', label: 'LIVE' },
    error:   { color: '#ff5a5a', label: 'ERROR' },
  }
  const conn = connMap[fbMode] || connMap.offline

  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 30,
      background: 'rgba(5,8,6,.92)', backdropFilter: 'blur(8px)',
      borderBottom: '1px solid rgba(var(--rgb),.14)', padding: '13px 26px',
    }}>
      <div style={{ maxWidth: 1360, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 18 }}>
        {/* Identity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
          <div style={{
            width: 42, height: 42, border: '1px solid var(--a)', borderRadius: 6,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            font: "700 18px 'Rajdhani'", color: 'var(--a)',
            background: 'rgba(var(--rgb),.06)', boxShadow: '0 0 14px rgba(var(--rgb),.25)',
          }}>{initials}</div>
          <div>
            <div style={{ font: "700 17px/1 'Rajdhani'", letterSpacing: '.06em', color: 'var(--ink)' }}>
              PREPCLASH <span style={{ color: 'var(--a2)', fontSize: 11 }}>v2</span>
            </div>
            <div style={{ font: "400 9px 'Share Tech Mono'", letterSpacing: '.18em', color: 'var(--mut)', marginTop: 2 }}>
              {data.profile.name.toUpperCase()} · RANK {r}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ flex: 1, display: 'flex', gap: 4, justifyContent: 'center' }}>
          {TABS.map(t => {
            const id = t.toLowerCase()
            const on = tab === id
            return (
              <button
                key={t}
                onClick={() => setTab(id)}
                style={{
                  cursor: 'pointer',
                  border: on ? '1px solid var(--a2)' : '1px solid rgba(var(--rgb),.12)',
                  background: on ? 'rgba(var(--a2rgb),.12)' : 'transparent',
                  color: on ? 'var(--a2)' : 'var(--mut)',
                  font: "700 11px 'Rajdhani'", letterSpacing: '.16em',
                  padding: '9px 16px', borderRadius: 5,
                }}
              >{t}</button>
            )
          })}
        </div>

        {/* Status cluster */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ font: "700 19px/1 'Rajdhani'", color: 'var(--a2)', textShadow: '0 0 14px rgba(var(--a2rgb),.4)' }}>
              {data.momentum.toLocaleString()}
            </div>
            <div style={{ font: "400 8px 'Share Tech Mono'", letterSpacing: '.15em', color: 'var(--mut)' }}>
              MOMENTUM · ▲{st}d
            </div>
          </div>
          <div style={{
            width: 48, height: 48, border: '2px solid var(--a2)', borderRadius: 7,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(var(--a2rgb),.06)', animation: 'pulseGlow 3s ease-in-out infinite',
          }}>
            <div style={{ font: "700 20px/1 'Rajdhani'", color: 'var(--a2)' }}>{r}</div>
            <div style={{ font: "400 6px 'Share Tech Mono'", letterSpacing: '.15em', color: 'var(--mut)' }}>RANK</div>
          </div>
          <button
            onClick={() => setModal('connect')}
            style={{
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
              border: `1px solid ${conn.color}`,
              background: 'rgba(var(--rgb),.05)', color: conn.color,
              font: "700 9px 'Share Tech Mono'", letterSpacing: '.12em',
              padding: '8px 11px', borderRadius: 5,
            }}
          >
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: conn.color, boxShadow: `0 0 6px ${conn.color}`, display: 'inline-block' }} />
            {conn.label}
          </button>
        </div>
      </div>
    </div>
  )
}
