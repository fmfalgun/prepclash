import { useStore } from '../store/useStore'
import { PALETTES } from '../data/palettes'
import { rank, streak } from '../store/selectors'

const TABS = ['PROFILE', 'VILLAGE', 'ARENA', 'STUDY', 'READING', 'WORKOUT', 'CLAN', 'LADDER'] as const

export function TopBar() {
  const data       = useStore(s => s.data)
  const tab        = useStore(s => s.tab)
  const setTab     = useStore(s => s.setTab)
  const setModal   = useStore(s => s.setModal)
  const setPalette = useStore(s => s.setPalette)
  const fbMode     = useStore(s => s.fbMode)

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
    }}>
      <div style={{ maxWidth: 1360, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px' }}>

        {/* Brand / identity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 7, flexShrink: 0,
            background: 'var(--cardHi)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            font: "500 13px 'Lexend Deca'", color: 'var(--a)',
          }}>{initials}</div>
          <div className="hide-xs">
            <div style={{ font: "300 14px/1 'Lexend Deca'", color: 'var(--ink)' }}>
              prepclash <span style={{ font: "500 10px 'Roboto Mono'", color: 'var(--mut)' }}>v2</span>
            </div>
            <div style={{ font: "400 9px 'Roboto Mono'", color: 'var(--mut)', marginTop: 1 }}>
              {data.profile.name} · rank {r}
            </div>
          </div>
        </div>

        {/* Tab strip — horizontally scrollable on mobile */}
        <div className="tab-strip" style={{ flex: 1, overflowX: 'auto', display: 'flex', gap: 1, scrollbarWidth: 'none' }}>
          {TABS.map(t => {
            const id = t.toLowerCase()
            const on = tab === id
            return (
              <button key={t} onClick={() => setTab(id)} style={{
                cursor: 'pointer', border: 'none', flexShrink: 0,
                background: on ? 'var(--cardHi)' : 'transparent',
                color: on ? 'var(--a)' : 'var(--mut)',
                font: "400 11px 'Roboto Mono'",
                padding: '8px 11px', borderRadius: 6,
                transition: 'color .12s, background .12s',
              }}>{t.toLowerCase()}</button>
            )
          })}
        </div>

        {/* Palette dots */}
        <div style={{ display: 'flex', gap: 5, alignItems: 'center', flexShrink: 0 }}>
          {(Object.entries(PALETTES) as [string, typeof PALETTES.toxic][]).map(([id, Pal]) => (
            <button
              key={id}
              onClick={() => setPalette(id as Parameters<typeof setPalette>[0])}
              title={Pal.name}
              style={{
                cursor: 'pointer',
                border: `2px solid ${data.palette === id ? Pal.a : 'transparent'}`,
                background: Pal.a,
                width: 16, height: 16, borderRadius: '50%',
                padding: 0, flexShrink: 0,
                transition: 'border-color .15s',
              }}
            />
          ))}
        </div>

        {/* Momentum + connect */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <div style={{ textAlign: 'right' }} className="hide-sm">
            <div style={{ font: "500 16px/1 'Roboto Mono'", color: 'var(--a2)' }}>
              {data.momentum.toLocaleString()}
            </div>
            <div style={{ font: "400 8px 'Roboto Mono'", color: 'var(--mut)', marginTop: 2 }}>
              {st}d streak
            </div>
          </div>
          <div style={{
            width: 36, height: 36, borderRadius: 7,
            border: '1.5px solid var(--a)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(var(--rgb),.06)',
          }}>
            <div style={{ font: "600 15px/1 'Roboto Mono'", color: 'var(--a)' }}>{r}</div>
            <div style={{ font: "400 7px 'Roboto Mono'", color: 'var(--mut)' }}>rank</div>
          </div>
          <button onClick={() => setModal('connect')} style={{
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
            border: '1px solid rgba(255,255,255,.1)',
            background: 'var(--cardHi)', color: 'var(--txt)',
            font: "400 10px 'Roboto Mono'",
            padding: '7px 10px', borderRadius: 7,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: connDot, flexShrink: 0, display: 'inline-block' }} />
            <span className="hide-sm">{connLabel}</span>
          </button>
        </div>

      </div>
    </div>
  )
}
