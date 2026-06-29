import { useStore } from '../../store/useStore'
import { readGain } from '../../lib/momentum'
import { allBookDefs } from '../../store/selectors'
import { SKILL_DEFS } from '../../data/skills'
import { ModalShell, ModalLabel, inputStyle, SubmitBtn } from './ModalShell'

const UNIT_LABELS: Record<string, string> = { pages: 'PAGES', chapters: 'CHAPTERS', sections: 'SECTIONS', questions: 'QUESTIONS' }

export function ReadingModal() {
  const data          = useStore(s => s.data)
  const draft         = useStore(s => s.draft)
  const setDraft      = useStore(s => s.setDraft)
  const submitReading = useStore(s => s.submitReading)
  const addBook       = useStore(s => s.addBook)

  const defs   = allBookDefs(data)
  const curDef = defs.find(b => b.id === draft.book) || defs[0]
  const gain   = curDef ? readGain(curDef.unit, draft.readAmount) : 0
  const allSkills = [...SKILL_DEFS, ...data.extraSkills]

  return (
    <ModalShell kicker="INTEL // READING" title="Log Reading">
      <ModalLabel>WHICH BOOK?</ModalLabel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {defs.map(def => {
          const st = data.books.find(x => x.id === def.id)
          const done = st ? st.done : 0
          const on = draft.book === def.id
          return (
            <span
              key={def.id}
              onClick={() => setDraft(d => ({ ...d, book: def.id }))}
              style={{
                cursor: 'pointer', font: "500 11px 'Share Tech Mono'", padding: '9px 12px', borderRadius: 4,
                background: on ? 'rgba(var(--a2rgb),.12)' : 'rgba(var(--rgb),.04)',
                border: on ? '1px solid var(--a2)' : '1px solid rgba(var(--rgb),.14)',
                color: on ? 'var(--a2)' : 'var(--txt)',
                display: 'flex', justifyContent: 'space-between',
              }}
            >
              <span>{def.title}</span>
              <span style={{ color: 'var(--mut)' }}>{done}/{def.total} {def.unit}</span>
            </span>
          )
        })}
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
          <ModalLabel>MOMENTUM</ModalLabel>
          <div style={{ backgroundColor: 'var(--bg0)', border: '1px solid rgba(var(--a2rgb),.25)', borderRadius: 4, padding: '9px 10px', font: "700 15px 'Rajdhani'", color: 'var(--a2)' }}>
            +{gain}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 16, borderTop: '1px solid rgba(var(--rgb),.1)', paddingTop: 14 }}>
        <ModalLabel>+ ADD YOUR OWN BOOK / DOC</ModalLabel>
        <input
          value={draft.nbTitle}
          onChange={e => setDraft(d => ({ ...d, nbTitle: e.target.value }))}
          placeholder="title (e.g. Gray Hat Hacking 4e)"
          style={{ ...inputStyle, marginBottom: 8 }}
        />
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <select value={draft.nbUnit} onChange={e => setDraft(d => ({ ...d, nbUnit: e.target.value }))}
            style={{ ...inputStyle, flex: 1, minWidth: 110, color: 'var(--txt)', fontSize: 11, padding: '8px 6px' }}>
            <option value="pages">pages</option>
            <option value="chapters">chapters</option>
            <option value="sections">sections</option>
            <option value="questions">questions</option>
          </select>
          <input type="number" value={draft.nbTotal} onChange={e => setDraft(d => ({ ...d, nbTotal: e.target.value }))}
            placeholder="total" min={1}
            style={{ ...inputStyle, width: 80, fontSize: 11, padding: '8px 6px' }}
          />
          <select value={draft.nbSkill} onChange={e => setDraft(d => ({ ...d, nbSkill: e.target.value }))}
            style={{ ...inputStyle, flex: '1.2', minWidth: 140, color: 'var(--txt)', fontSize: 11, padding: '8px 6px' }}>
            {allSkills.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <button
            onClick={addBook}
            style={{ cursor: 'pointer', border: '1px solid var(--a2)', background: 'rgba(var(--a2rgb),.1)', color: 'var(--a2)', font: "700 11px 'Rajdhani'", letterSpacing: '.08em', padding: '0 16px', borderRadius: 4 }}
          >ADD BOOK</button>
        </div>
      </div>

      <SubmitBtn onClick={submitReading}>LOG READING → +{gain}</SubmitBtn>
    </ModalShell>
  )
}
