import { useStore } from '../../store/useStore'
import { studyGain } from '../../lib/momentum'
import { SKILL_DEFS } from '../../data/skills'
import { todayKey } from '../../lib/dates'
import { ModalShell, ModalLabel, inputStyle, SubmitBtn } from './ModalShell'

export function StudyModal() {
  const data          = useStore(s => s.data)
  const draft         = useStore(s => s.draft)
  const setDraft      = useStore(s => s.setDraft)
  const addKeyword    = useStore(s => s.addKeyword)
  const submitStudy   = useStore(s => s.submitStudy)

  const allSkills = [...SKILL_DEFS, ...data.extraSkills]
  const gain = studyGain(draft.mins, draft.selected.length)
  const creating = draft.newKwSkill === '__new__'

  const selSkillHint = [...new Set(draft.selected.map(l => {
    const kw = data.keywords.find(k => k.label === l)
    return kw ? allSkills.find(s => s.id === kw.skill)?.name : null
  }).filter(Boolean))].join(', ')

  return (
    <ModalShell kicker="STUDY SESSION" title="Log Study Session">
      <ModalLabel>WHAT DID YOU WORK ON?</ModalLabel>
      <textarea
        value={draft.title}
        onChange={e => setDraft(d => ({ ...d, title: e.target.value }))}
        placeholder="e.g. Debugged async race condition; read CT-log RFC..."
        rows={3}
        style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
      />

      <div style={{ display: 'flex', gap: 12, marginTop: 14, alignItems: 'flex-end' }}>
        <div style={{ flex: 1 }}>
          <ModalLabel>TIME (MIN)</ModalLabel>
          <input
            type="number" value={draft.mins} min={1}
            onChange={e => setDraft(d => ({ ...d, mins: parseInt(e.target.value) || 0 }))}
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
          <ModalLabel>MOMENTUM</ModalLabel>
          <div style={{ backgroundColor: 'var(--bg0)', border: '1px solid rgba(var(--a2rgb),.25)', borderRadius: 4, padding: '9px 10px', font: "500 15px 'Lexend Deca'", color: 'var(--a2)' }}>
            +{gain}
          </div>
        </div>
      </div>

      <ModalLabel style={{ marginTop: 16 }}>TAG CATEGORIES</ModalLabel>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
        {data.keywords.map(k => {
          const on = draft.selected.includes(k.label)
          return (
            <button
              key={k.label}
              type="button"
              onClick={() => {
                const next = draft.selected.includes(k.label)
                  ? draft.selected.filter(l => l !== k.label)
                  : [...draft.selected, k.label]
                setDraft(d => ({ ...d, selected: next }))
              }}
              style={{
                cursor: 'pointer', font: "500 11px 'Roboto Mono'", padding: '6px 11px', borderRadius: 4,
                background: on ? 'rgba(var(--a2rgb),.16)' : 'rgba(var(--rgb),.05)',
                border: on ? '1px solid var(--a2)' : '1px solid rgba(var(--rgb),.16)',
                color: on ? 'var(--a2)' : 'var(--txt)',
                boxShadow: on ? '0 0 8px rgba(var(--a2rgb),.25)' : 'none',
              }}
            >{k.label}</button>
          )
        })}
      </div>
      {selSkillHint && (
        <div style={{ font: "400 9px 'Roboto Mono'", color: 'var(--dim2)', marginTop: 8 }}>
          axes: {selSkillHint}
        </div>
      )}

      <div style={{ marginTop: 16, borderTop: '1px solid rgba(var(--rgb),.1)', paddingTop: 14 }}>
        <ModalLabel>+ ADD CUSTOM KEYWORD</ModalLabel>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input
            value={draft.newKwLabel}
            onChange={e => setDraft(d => ({ ...d, newKwLabel: e.target.value }))}
            placeholder="keyword (e.g. Kerberos)"
            style={{ ...inputStyle, flex: '2', minWidth: 140 }}
          />
          <select
            value={draft.newKwSkill}
            onChange={e => setDraft(d => ({ ...d, newKwSkill: e.target.value }))}
            style={{ ...inputStyle, flex: '1.4', minWidth: 150, color: 'var(--txt)' }}
          >
            {allSkills.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            <option value="__new__">+ New category…</option>
          </select>
          <button
            type="button"
            onClick={addKeyword}
            style={{ cursor: 'pointer', border: '1px solid var(--a2)', background: 'rgba(var(--a2rgb),.1)', color: 'var(--a2)', font: "500 12px 'Lexend Deca'", letterSpacing: '.08em', padding: '0 16px', borderRadius: 4 }}
          >ADD</button>
        </div>
        {creating && (
          <input
            value={draft.newCatName}
            onChange={e => setDraft(d => ({ ...d, newCatName: e.target.value }))}
            placeholder="new category name"
            style={{ ...inputStyle, marginTop: 8, border: '1px solid rgba(var(--a2rgb),.3)' }}
          />
        )}
      </div>

      <SubmitBtn onClick={submitStudy}>LOG EFFORT → +{gain}</SubmitBtn>
    </ModalShell>
  )
}
