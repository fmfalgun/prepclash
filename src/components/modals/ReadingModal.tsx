import { useState } from 'react'
import { useStore } from '../../store/useStore'
import { readGain } from '../../lib/momentum'
import { allBookDefs } from '../../store/selectors'
import { todayKey } from '../../lib/dates'
import { ModalShell, ModalLabel, inputStyle, SubmitBtn } from './ModalShell'

const UNIT_LABELS: Record<string, string> = {
  pages: 'PAGES', chapters: 'CHAPTERS', sections: 'SECTIONS', questions: 'QUESTIONS',
}

export function ReadingModal() {
  const data          = useStore(s => s.data)
  const draft         = useStore(s => s.draft)
  const setDraft      = useStore(s => s.setDraft)
  const submitReading = useStore(s => s.submitReading)
  const setModal      = useStore(s => s.setModal)

  const [search, setSearch] = useState('')

  const defs     = allBookDefs(data)
  const filtered = search.trim()
    ? defs.filter(d => d.title.toLowerCase().includes(search.toLowerCase()))
    : defs
  const curDef   = defs.find(b => b.id === draft.book) || defs[0]
  const gain     = curDef ? readGain(curDef.unit, draft.readAmount, (curDef as any).category) : 0

  return (
    <ModalShell kicker="INTEL // READING" title="Log Reading">
      <ModalLabel>WHICH BOOK / DOC?</ModalLabel>

      {defs.length > 5 && (
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="search title…"
          style={{ ...inputStyle, marginBottom: 8, fontSize: 12 }}
        />
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 220, overflowY: 'auto', paddingRight: 2 }}>
        {filtered.map(def => {
          const st   = data.books.find(x => x.id === def.id)
          const done = st ? st.done : 0
          const pct  = Math.round((done / def.total) * 100)
          const on   = draft.book === def.id
          return (
            <button
              key={def.id}
              type="button"
              onClick={() => setDraft(d => ({ ...d, book: def.id }))}
              style={{
                cursor: 'pointer', font: "500 11px 'Roboto Mono'", padding: '8px 10px', borderRadius: 5,
                background: on ? 'rgba(var(--a2rgb),.12)' : 'rgba(var(--rgb),.04)',
                border: on ? '1px solid var(--a2)' : '1px solid rgba(var(--rgb),.12)',
                color: on ? 'var(--a2)' : 'var(--txt)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8,
                textAlign: 'left',
              }}
            >
              <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {def.title}
              </span>
              <span style={{ color: 'var(--mut)', flexShrink: 0, fontSize: 10 }}>
                {pct}% · {done}/{def.total}
              </span>
            </button>
          )
        })}
        {filtered.length === 0 && (
          <div style={{ font: "400 11px 'Roboto Mono'", color: 'var(--dim2)', padding: '12px 0', textAlign: 'center' }}>
            no match —{' '}
            <button
              type="button"
              onClick={() => setModal('add-book')}
              style={{ cursor: 'pointer', background: 'transparent', border: 'none', color: 'var(--a2)', font: "500 11px 'Roboto Mono'", padding: 0 }}
            >
              add it to library
            </button>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 16, alignItems: 'flex-end' }}>
        <div style={{ flex: 1 }}>
          <ModalLabel>{curDef ? UNIT_LABELS[curDef.unit] || 'UNITS' : 'UNITS'} DONE</ModalLabel>
          <input
            type="number" value={draft.readAmount} min={1}
            onChange={e => setDraft(d => ({ ...d, readAmount: parseInt(e.target.value) || 0 }))}
            style={inputStyle}
          />
        </div>
        <div style={{ flex: 1 }}>
          <ModalLabel>DATE</ModalLabel>
          <input
            type="date"
            value={draft.logDate || todayKey()}
            max={todayKey()}
            onChange={e => setDraft(d => ({ ...d, logDate: e.target.value }))}
            style={{ ...inputStyle, colorScheme: 'dark' }}
          />
        </div>
        <div style={{ flex: '0 0 auto' }}>
          <ModalLabel>XP</ModalLabel>
          <div style={{ backgroundColor: 'var(--bg0)', border: '1px solid rgba(var(--a2rgb),.25)', borderRadius: 4, padding: '9px 10px', font: "500 15px 'Lexend Deca'", color: 'var(--a2)' }}>
            +{gain}
          </div>
        </div>
      </div>

      <SubmitBtn onClick={submitReading}>LOG READING → +{gain}</SubmitBtn>

      <div style={{ marginTop: 14, textAlign: 'center' }}>
        <button
          type="button"
          onClick={() => setModal('add-book')}
          style={{
            cursor: 'pointer', background: 'transparent', border: 'none',
            color: 'var(--mut)', font: "400 10px 'Roboto Mono'", letterSpacing: '.06em',
          }}
        >
          book not in library? → <span style={{ color: 'var(--a2)' }}>add it</span>
        </button>
      </div>
    </ModalShell>
  )
}
