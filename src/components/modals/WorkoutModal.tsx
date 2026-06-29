import { useStore } from '../../store/useStore'
import { workoutGain } from '../../lib/momentum'
import { ModalShell, ModalLabel, inputStyle, SubmitBtn } from './ModalShell'

export function WorkoutModal() {
  const draft         = useStore(s => s.draft)
  const setDraft      = useStore(s => s.setDraft)
  const submitWorkout = useStore(s => s.submitWorkout)

  const exCount = draft.exercises.filter(e => (e.name || '').trim()).length
  const gain    = workoutGain(exCount)

  function setEx(i: number, field: string) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const v = e.target.value
      setDraft(d => ({ ...d, exercises: d.exercises.map((r, idx) => idx === i ? { ...r, [field]: v } : r) }))
    }
  }

  function removeEx(i: number) {
    setDraft(d => {
      const ex = d.exercises.filter((_, idx) => idx !== i)
      return { ...d, exercises: ex.length ? ex : [{ name: '', sets: '4', reps: '10', weight: '7.5', mode: 'kg/hand' }] }
    })
  }

  function addExRow() {
    setDraft(d => ({ ...d, exercises: [...d.exercises, { name: '', sets: '4', reps: '10', weight: '7.5', mode: 'kg/hand' }] }))
  }

  return (
    <ModalShell kicker="TOJI SPLIT" title="Log Training Session">
      <ModalLabel>SESSION NAME</ModalLabel>
      <input
        value={draft.sessionName}
        onChange={e => setDraft(d => ({ ...d, sessionName: e.target.value }))}
        placeholder="e.g. Chest + Shoulders"
        style={{ ...inputStyle, marginBottom: 14 }}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, font: "700 9px 'Share Tech Mono'", letterSpacing: '.14em', color: 'var(--mut)', marginBottom: 8 }}>
        <span style={{ flex: 1 }}>EXERCISE</span>
        <span style={{ width: 42, textAlign: 'center' }}>SETS</span>
        <span style={{ width: 54, textAlign: 'center' }}>REPS</span>
        <span style={{ width: 52, textAlign: 'center' }}>WT</span>
        <span style={{ width: 88 }}>MODE</span>
        <span style={{ width: 18 }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {draft.exercises.map((ex, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input value={ex.name}   onChange={setEx(i, 'name')}   placeholder="exercise" style={{ ...inputStyle, flex: 1, minWidth: 0, fontSize: 11, padding: '7px 8px' }} />
            <input value={ex.sets}   onChange={setEx(i, 'sets')}   style={{ ...inputStyle, width: 42, fontSize: 11, padding: '7px 4px', textAlign: 'center' }} />
            <input value={ex.reps}   onChange={setEx(i, 'reps')}   placeholder="10" style={{ ...inputStyle, width: 54, fontSize: 11, padding: '7px 4px', textAlign: 'center' }} />
            <input value={ex.weight} onChange={setEx(i, 'weight')} placeholder="7.5" style={{ ...inputStyle, width: 52, fontSize: 11, padding: '7px 4px', textAlign: 'center' }} />
            <select value={ex.mode}  onChange={setEx(i, 'mode')}   style={{ ...inputStyle, width: 88, fontSize: 10, padding: '7px 4px', color: 'var(--txt)' }}>
              <option value="kg/hand">kg/hand</option>
              <option value="kg total">kg total</option>
              <option value="lb/hand">lb/hand</option>
              <option value="bodyweight">bodywt</option>
            </select>
            <span onClick={() => removeEx(i)} style={{ cursor: 'pointer', width: 18, textAlign: 'center', color: 'var(--dim2)', fontSize: 13 }}>✕</span>
          </div>
        ))}
      </div>

      <button
        onClick={addExRow}
        style={{ cursor: 'pointer', marginTop: 10, border: '1px dashed rgba(var(--rgb),.3)', background: 'transparent', color: 'var(--mut)', font: "700 10px 'Rajdhani'", letterSpacing: '.12em', padding: 9, width: '100%', borderRadius: 4 }}
      >+ ADD EXERCISE</button>

      <SubmitBtn onClick={submitWorkout}>LOG SESSION → +{gain}</SubmitBtn>
    </ModalShell>
  )
}
