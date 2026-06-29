import { useStore } from '../../store/useStore'
import { ModalShell, ModalLabel, inputStyle, SubmitBtn } from './ModalShell'
import type { WeightMode } from '../../types'

const MODE_OPTS: WeightMode[] = ['kg/hand', 'kg total', 'lb/hand', 'bodyweight', 'cardio']

export function EditScheduleModal() {
  const editDraft     = useStore(s => s.editDraft)
  const editNote      = useStore(s => s.editNote)
  const setEditNote   = useStore(s => s.setEditNote)
  const updateEditDay = useStore(s => s.updateEditDay)
  const updateEditEx  = useStore(s => s.updateEditEx)
  const addEditEx     = useStore(s => s.addEditEx)
  const removeEditEx  = useStore(s => s.removeEditEx)
  const removeEditDay = useStore(s => s.removeEditDay)
  const addEditDay    = useStore(s => s.addEditDay)
  const saveSchedule  = useStore(s => s.saveSchedule)
  const version       = useStore(s => s.data.workoutLab?.schedule.version || 1)

  if (!editDraft) return null

  const exRow: React.CSSProperties = {
    display: 'grid', gridTemplateColumns: '1fr 46px 46px 72px 88px 24px',
    gap: 5, alignItems: 'center',
  }

  return (
    <ModalShell kicker="workout lab" title="edit schedule" maxWidth={740}>
      <div style={{ font: "400 10px 'Roboto Mono'", color: 'var(--mut)', marginBottom: 16 }}>
        editing v{version} → will save as v{version + 1} · past sessions are preserved
      </div>

      {editDraft.map((day, di) => (
        <div key={day.id || di} style={{
          background: 'var(--cardHi)', borderRadius: 9, padding: '14px 16px', marginBottom: 12,
        }}>
          {/* Day header */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 28px', gap: 8, marginBottom: 12, alignItems: 'center' }}>
            <div>
              <ModalLabel>day name</ModalLabel>
              <input
                value={day.name}
                onChange={e => updateEditDay(di, 'name', e.target.value)}
                style={{ ...inputStyle, padding: '7px 9px' }}
              />
            </div>
            <div>
              <ModalLabel>muscle group</ModalLabel>
              <input
                value={day.muscle}
                onChange={e => updateEditDay(di, 'muscle', e.target.value)}
                style={{ ...inputStyle, padding: '7px 9px' }}
              />
            </div>
            <button onClick={() => removeEditDay(di)} title="remove day" style={{
              cursor: 'pointer', border: 'none', background: 'transparent',
              color: 'var(--mut)', fontSize: 16, marginTop: 18, lineHeight: '1',
            }}>✕</button>
          </div>

          {/* Exercises */}
          <div style={{ ...exRow, marginBottom: 5 }}>
            {['exercise', 'sets', 'reps', 'weight', 'mode', ''].map((h, i) => (
              <div key={i} style={{ font: "400 9px 'Roboto Mono'", color: 'var(--mut)', textAlign: i > 0 ? 'center' : 'left' }}>{h}</div>
            ))}
          </div>
          {day.exercises.map((ex, ei) => (
            <div key={ei} style={{ ...exRow, marginBottom: 5 }}>
              <input
                value={ex.name as string}
                onChange={e => updateEditEx(di, ei, 'name', e.target.value)}
                placeholder="exercise name"
                style={{ ...inputStyle, padding: '6px 8px' }}
              />
              <input
                type="number" min={1} max={20} value={ex.sets}
                onChange={e => updateEditEx(di, ei, 'sets', parseInt(e.target.value) || 0)}
                style={{ ...inputStyle, padding: '6px 4px', textAlign: 'center' }}
              />
              <input
                type="number" min={1} max={100} value={ex.reps}
                onChange={e => updateEditEx(di, ei, 'reps', parseInt(e.target.value) || 0)}
                style={{ ...inputStyle, padding: '6px 4px', textAlign: 'center' }}
              />
              <input
                type="number" min={0} step={0.5} value={ex.weight}
                onChange={e => updateEditEx(di, ei, 'weight', parseFloat(e.target.value) || 0)}
                style={{ ...inputStyle, padding: '6px 4px', textAlign: 'center' }}
              />
              <select
                value={ex.mode}
                onChange={e => updateEditEx(di, ei, 'mode', e.target.value)}
                style={{ ...inputStyle, padding: '6px 4px', cursor: 'pointer', fontSize: 10 }}
              >
                {MODE_OPTS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <button onClick={() => removeEditEx(di, ei)} style={{
                cursor: 'pointer', border: 'none', background: 'transparent',
                color: 'var(--mut)', fontSize: 13, lineHeight: '1',
              }}>✕</button>
            </div>
          ))}
          <button onClick={() => addEditEx(di)} style={{
            cursor: 'pointer', border: '1px dashed rgba(255,255,255,.12)',
            background: 'transparent', color: 'var(--mut)',
            font: "400 10px 'Roboto Mono'",
            width: '100%', padding: '6px', borderRadius: 5, marginTop: 3,
          }}>+ exercise</button>
        </div>
      ))}

      {/* Add day */}
      <button onClick={addEditDay} style={{
        cursor: 'pointer', border: '1px dashed rgba(255,255,255,.15)',
        background: 'transparent', color: 'var(--mut)',
        font: "400 11px 'Roboto Mono'",
        width: '100%', padding: '10px', borderRadius: 7, marginBottom: 16,
      }}>+ add day</button>

      {/* Version note */}
      <div style={{ marginBottom: 6 }}>
        <ModalLabel>change note (optional)</ModalLabel>
        <input
          value={editNote}
          onChange={e => setEditNote(e.target.value)}
          placeholder="e.g. swapped incline for flat bench"
          style={{ ...inputStyle }}
        />
      </div>

      <SubmitBtn onClick={saveSchedule}>save schedule (v{version + 1})</SubmitBtn>
    </ModalShell>
  )
}
