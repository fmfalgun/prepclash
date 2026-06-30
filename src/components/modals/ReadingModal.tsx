import { useState } from 'react'
import { useStore } from '../../store/useStore'
import { readGain } from '../../lib/momentum'
import { allBookDefs } from '../../store/selectors'
import { SKILL_DEFS } from '../../data/skills'
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
  const addBook       = useStore(s => s.addBook)

  const [search, setSearch]   = useState('')
  const [showAdd, setShowAdd] = useState(false)

  const defs     = allBookDefs(data)
  const filtered = search.trim()
    ? defs.filter(d => d.title.toLowerCase().includes(search.toLowerCase()))
    : defs
  const curDef   = defs.find(b => b.id === draft.book) || defs[0]
  const gain     = curDef ? readGain(curDef.unit, draft.readAmount) : 0
  const allSkills = [...SKILL_DEFS, ...data.extraSkills]

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
            no match — add it below
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

      <div style={{ marginTop: 16, borderTop: '1px solid rgba(var(--rgb),.1)', paddingTop: 12 }}>
        <button
          type="button"
          onClick={() => setShowAdd(v => !v)}
          style={{
            cursor: 'pointer', background: 'transparent', border: '1px solid rgba(var(--rgb),.14)',
            color: 'var(--mut)', font: "500 10px 'Roboto Mono'", letterSpacing: '.1em',
            padding: '6px 12px', borderRadius: 5, width: '100%',
          }}
        >
          {showAdd ? '▲ HIDE' : '+ ADD NEW BOOK / DOC TO LIBRARY'}
        </button>

        {showAdd && (
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <input
              value={draft.nbTitle}
              onChange={e => setDraft(d => ({ ...d, nbTitle: e.target.value }))}
              placeholder="title (e.g. Gray Hat Hacking 4e)"
              style={inputStyle}
            />
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <select
                value={draft.nbUnit}
                onChange={e => setDraft(d => ({ ...d, nbUnit: e.target.value }))}
                style={{ ...inputStyle, flex: 1, minWidth: 110, color: 'var(--txt)', fontSize: 11, padding: '8px 6px' }}
              >
                <option value="pages">pages</option>
                <option value="chapters">chapters</option>
                <option value="sections">sections</option>
                <option value="questions">questions</option>
              </select>
              <input
                type="number" value={draft.nbTotal}
                onChange={e => setDraft(d => ({ ...d, nbTotal: e.target.value }))}
                placeholder="total" min={1}
                style={{ ...inputStyle, width: 80, fontSize: 11, padding: '8px 6px' }}
              />
              <select
                value={draft.nbSkill}
                onChange={e => setDraft(d => ({ ...d, nbSkill: e.target.value }))}
                style={{ ...inputStyle, flex: '1.2', minWidth: 140, color: 'var(--txt)', fontSize: 11, padding: '8px 6px' }}
              >
                {allSkills.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <button
              type="button"
              onClick={addBook}
              style={{ cursor: 'pointer', border: '1px solid var(--a2)', background: 'rgba(var(--a2rgb),.1)', color: 'var(--a2)', font: "500 12px 'Lexend Deca'", letterSpacing: '.08em', padding: '9px', borderRadius: 5 }}
            >ADD TO LIBRARY</button>
          </div>
        )}
      </div>
    </ModalShell>
  )
}
