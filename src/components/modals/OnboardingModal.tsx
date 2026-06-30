import { useStore } from '../../store/useStore'
import { TOJI_BOOK_DEFS } from '../../data/toji'
import { COURSE_DEFS, BOOK_DEFS } from '../../data/skills'
import { TOJI } from '../../data/workoutTemplate'

const TOTAL_TOJI_BOOKS = BOOK_DEFS.length + TOJI_BOOK_DEFS.length

export function OnboardingModal() {
  const adoptToji      = useStore(s => s.adoptToji)
  const closeOnboarding = useStore(s => s.closeOnboarding)
  const setModal       = useStore(s => s.setModal)
  const data           = useStore(s => s.data)

  function choose(c: 'toji' | 'own' | 'both') {
    adoptToji(c)
    setModal(null)
  }

  function dismiss() {
    closeOnboarding()
    setModal(null)
  }

  const overlay: React.CSSProperties = {
    position: 'fixed', inset: 0, zIndex: 100,
    background: 'rgba(0,0,0,.72)', backdropFilter: 'blur(6px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
  }
  const box: React.CSSProperties = {
    background: '#252729', border: '1px solid rgba(255,255,255,.09)',
    borderRadius: 16, padding: '42px 48px', maxWidth: 760, width: '100%',
  }
  const card: React.CSSProperties = {
    background: 'var(--card0)', border: '1px solid rgba(255,255,255,.08)',
    borderRadius: 11, padding: '22px 24px', cursor: 'pointer', transition: 'border-color .15s',
  }

  return (
    <div style={overlay}>
      <div style={{ ...box, position: 'relative' }}>
        {/* Dismiss button */}
        <button onClick={dismiss} style={{
          position: 'absolute', top: 16, right: 16,
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--mut)', fontSize: 20, lineHeight: 1, padding: '4px 8px',
          opacity: 0.6,
        }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '0.6')}
          title="skip setup"
        >×</button>
        {/* Header */}
        <div style={{ marginBottom: 32, textAlign: 'center' }}>
          <div style={{ font: "300 30px/1 'Lexend Deca'", color: 'var(--ink)', marginBottom: 8 }}>
            welcome, operative
          </div>
          <div style={{ font: "400 12px 'Roboto Mono'", color: 'var(--mut)', lineHeight: 1.6 }}>
            {data.profile.name} — choose your starting setup.<br />
            you can always add, remove, or edit anything later.
          </div>
        </div>

        {/* Options */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 32 }}>
          {/* Toji's setup */}
          <div style={card} onClick={() => choose('toji')}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(var(--rgb),.4)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,.08)')}
          >
            <div style={{ font: "500 11px 'Roboto Mono'", color: 'var(--a)', letterSpacing: '.08em', marginBottom: 10 }}>TOJI'S SETUP</div>
            <div style={{ font: "300 22px/1 'Lexend Deca'", color: 'var(--ink)', marginBottom: 12 }}>start loaded</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                `${TOTAL_TOJI_BOOKS} curated security books`,
                `${COURSE_DEFS.length} target courses`,
                `${TOJI.length}-day workout split`,
              ].map(t => (
                <div key={t} style={{ font: "400 10px 'Roboto Mono'", color: 'var(--txt)', display: 'flex', gap: 7, alignItems: 'flex-start' }}>
                  <span style={{ color: 'var(--a)', flexShrink: 0 }}>·</span> {t}
                </div>
              ))}
            </div>
            <div style={{ marginTop: 16, font: "500 10px 'Roboto Mono'", color: 'var(--mut)' }}>
              you can remove what you don't need
            </div>
          </div>

          {/* Build own */}
          <div style={card} onClick={() => choose('own')}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(var(--rgb),.4)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,.08)')}
          >
            <div style={{ font: "500 11px 'Roboto Mono'", color: 'var(--a2)', letterSpacing: '.08em', marginBottom: 10 }}>BUILD YOUR OWN</div>
            <div style={{ font: "300 22px/1 'Lexend Deca'", color: 'var(--ink)', marginBottom: 12 }}>start fresh</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                'add your own books manually',
                'set your own target courses',
                'design your own split',
              ].map(t => (
                <div key={t} style={{ font: "400 10px 'Roboto Mono'", color: 'var(--txt)', display: 'flex', gap: 7, alignItems: 'flex-start' }}>
                  <span style={{ color: 'var(--a2)', flexShrink: 0 }}>·</span> {t}
                </div>
              ))}
            </div>
            <div style={{ marginTop: 16, font: "500 10px 'Roboto Mono'", color: 'var(--mut)' }}>
              full control from day one
            </div>
          </div>

          {/* Both */}
          <div style={{ ...card, border: '1px solid rgba(var(--rgb),.25)' }}
            onClick={() => choose('both')}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(var(--rgb),.5)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(var(--rgb),.25)')}
          >
            <div style={{ font: "500 11px 'Roboto Mono'", color: 'var(--ink)', letterSpacing: '.08em', marginBottom: 10 }}>BOTH</div>
            <div style={{ font: "300 22px/1 'Lexend Deca'", color: 'var(--ink)', marginBottom: 12 }}>start loaded, grow your own</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                "toji's books + courses as base",
                'add your own on top',
                'remove anything you want',
              ].map(t => (
                <div key={t} style={{ font: "400 10px 'Roboto Mono'", color: 'var(--txt)', display: 'flex', gap: 7, alignItems: 'flex-start' }}>
                  <span style={{ color: 'var(--ink)', flexShrink: 0, opacity: .5 }}>·</span> {t}
                </div>
              ))}
            </div>
            <div style={{ marginTop: 16, font: "500 10px 'Roboto Mono'", color: 'var(--mut)' }}>
              recommended for new operatives
            </div>
          </div>
        </div>

        {/* Bottom note */}
        <div style={{ textAlign: 'center', font: "400 10px 'Roboto Mono'", color: 'var(--dim2)', lineHeight: 1.7 }}>
          Toji's books come from a curated 100+ title security reading list · courses are red-team focused<br />
          Other users' public profiles are visible on the Ladder — take inspiration from their setups
        </div>
      </div>
    </div>
  )
}
