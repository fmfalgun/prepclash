import { useStore } from '../../store/useStore'
import { ModalShell, ModalLabel, inputStyle, SubmitBtn } from './ModalShell'
import { computeSession, fmtK } from '../../lib/workoutStats'
import { todayKey } from '../../lib/dates'
import type { WeightMode } from '../../types'

const MODE_OPTS: WeightMode[] = ['kg/hand', 'kg total', 'lb/hand', 'bodyweight', 'cardio', 'time']

export function LogSessionModal() {
  const logDraft       = useStore(s => s.logDraft)
  const editingId      = useStore(s => s.editingSessionId)
  const pickDay        = useStore(s => s.pickDay)
  const addLogEx       = useStore(s => s.addLogEx)
  const removeLogEx    = useStore(s => s.removeLogEx)
  const updateLogEx    = useStore(s => s.updateLogEx)
  const addLogSet      = useStore(s => s.addLogSet)
  const removeLogSet   = useStore(s => s.removeLogSet)
  const updateLogSet   = useStore(s => s.updateLogSet)
  const setLogDuration = useStore(s => s.setLogDuration)
  const setLogDate     = useStore(s => s.setLogDate)
  const submitSession  = useStore(s => s.submitSession)
  const wl  = useStore(s => s.data.workoutLab)
  const days = wl?.schedule.days || []

  if (!logDraft) return null

  const exs  = logDraft.exercises
  const live = computeSession(exs.filter(e => (e.name || '').trim()))
  const day  = days.find(d => d.id === logDraft.dayId) || days[0]

  return (
    <ModalShell kicker="workout lab" title={editingId ? 'edit session' : 'log session'} maxWidth={700}>

      {/* Day picker */}
      <div style={{ marginBottom: 18 }}>
        <ModalLabel>day</ModalLabel>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {days.map(d => (
            <button key={d.id} onClick={() => pickDay(d.id)} style={{
              cursor: 'pointer', border: 'none',
              background: d.id === logDraft.dayId ? 'var(--a)' : 'var(--cardHi)',
              color: d.id === logDraft.dayId ? '#111' : 'var(--txt)',
              font: "400 11px 'Roboto Mono'",
              padding: '7px 13px', borderRadius: 6,
            }}>{d.name}</button>
          ))}
        </div>
        {day && <div style={{ font: "400 9px 'Roboto Mono'", color: 'var(--mut)', marginTop: 6 }}>{day.muscle}</div>}
      </div>

      {/* Exercises */}
      <div style={{ marginBottom: 10 }}>
        <ModalLabel>exercises</ModalLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {exs.map((e, ei) => (
            <div key={ei} style={{ background: 'var(--cardHi)', borderRadius: 8, padding: '10px 12px' }}>

              {/* Exercise header row */}
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 8 }}>
                <input
                  value={e.name as string}
                  onChange={ev => updateLogEx(ei, 'name', ev.target.value)}
                  placeholder="exercise name"
                  list="ex-names"
                  style={{ ...inputStyle, flex: 1, padding: '7px 9px' }}
                />
                <select
                  value={e.mode}
                  onChange={ev => updateLogEx(ei, 'mode', ev.target.value as WeightMode)}
                  style={{ ...inputStyle, padding: '7px 6px', cursor: 'pointer', width: 110 }}
                >
                  {MODE_OPTS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <button onClick={() => removeLogEx(ei)} style={{
                  cursor: 'pointer', border: 'none', background: 'transparent',
                  color: 'var(--mut)', fontSize: 14, lineHeight: 1, padding: '0 4px',
                }}>✕</button>
              </div>

              {/* Set column headers */}
              <div style={{ display: 'grid', gridTemplateColumns: '28px 1fr 1fr 28px', gap: 4, marginBottom: 4 }}>
                <div style={{ font: "400 9px 'Roboto Mono'", color: 'var(--mut)', textAlign: 'center' }}>#</div>
                <div style={{ font: "400 9px 'Roboto Mono'", color: 'var(--mut)', textAlign: 'center' }}>
                  {e.mode === 'time' ? 'sec' : 'reps'}
                </div>
                <div style={{ font: "400 9px 'Roboto Mono'", color: 'var(--mut)', textAlign: 'center' }}>
                  {e.mode === 'time' ? '—' : e.mode === 'bodyweight' ? '—' : e.mode === 'cardio' ? 'dist/time' : e.mode}
                </div>
                <div />
              </div>

              {/* Per-set rows */}
              {e.sets.map((s, si) => (
                <div key={si} style={{ display: 'grid', gridTemplateColumns: '28px 1fr 1fr 28px', gap: 4, marginBottom: 3 }}>
                  <div style={{ font: "400 10px 'Roboto Mono'", color: 'var(--mut)', textAlign: 'center', paddingTop: 8 }}>
                    {si + 1}
                  </div>
                  <input
                    type="number" min={0} max={e.mode === 'time' ? 3600 : 999}
                    value={s.reps || ''}
                    onChange={ev => updateLogSet(ei, si, 'reps', parseInt(ev.target.value) || 0)}
                    placeholder={e.mode === 'time' ? 'sec' : '0'}
                    style={{ ...inputStyle, padding: '6px', textAlign: 'center' }}
                  />
                  <input
                    type="number" min={0} step={0.5}
                    value={s.weight || ''}
                    onChange={ev => updateLogSet(ei, si, 'weight', parseFloat(ev.target.value) || 0)}
                    placeholder="0"
                    disabled={e.mode === 'bodyweight' || e.mode === 'time'}
                    style={{ ...inputStyle, padding: '6px', textAlign: 'center', opacity: (e.mode === 'bodyweight' || e.mode === 'time') ? 0.4 : 1 }}
                  />
                  <button onClick={() => removeLogSet(ei, si)} style={{
                    cursor: 'pointer', border: 'none', background: 'transparent',
                    color: 'var(--mut)', fontSize: 12, lineHeight: 1,
                  }}>−</button>
                </div>
              ))}

              <button onClick={() => addLogSet(ei)} style={{
                cursor: 'pointer', border: '1px dashed rgba(255,255,255,.12)',
                background: 'transparent', color: 'var(--mut)',
                font: "400 10px 'Roboto Mono'",
                width: '100%', padding: '5px', borderRadius: 5, marginTop: 4,
              }}>+ add set</button>
            </div>
          ))}
        </div>
        <datalist id="ex-names">
          {day?.exercises.map(e => <option key={e.name} value={e.name} />)}
        </datalist>
        <button onClick={addLogEx} style={{
          cursor: 'pointer', border: '1px dashed rgba(255,255,255,.15)',
          background: 'transparent', color: 'var(--mut)',
          font: "400 11px 'Roboto Mono'",
          width: '100%', padding: '8px', borderRadius: 6, marginTop: 8,
        }}>+ add exercise</button>
      </div>

      {/* Duration + date + live preview */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 6 }}>
        <div style={{ flex: 1 }}>
          <ModalLabel>duration (min)</ModalLabel>
          <input
            type="number" min={10} max={240} value={logDraft.durationMin}
            onChange={e => setLogDuration(parseInt(e.target.value) || 55)}
            style={{ ...inputStyle }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <ModalLabel>date</ModalLabel>
          <input
            type="date"
            value={logDraft.logDate || todayKey()}
            max={todayKey()}
            onChange={e => setLogDate(e.target.value)}
            style={{ ...inputStyle, colorScheme: 'dark' }}
          />
        </div>
        <div style={{ background: 'var(--cardHi)', borderRadius: 8, padding: '10px 14px', minWidth: 120, textAlign: 'center' }}>
          <div style={{ font: "500 18px/1 'Roboto Mono'", color: 'var(--a)' }}>{fmtK(live.volume)} kg</div>
          <div style={{ font: "400 9px 'Roboto Mono'", color: 'var(--mut)', marginTop: 4 }}>
            {live.totalSets} sets · {live.totalReps} reps
          </div>
        </div>
      </div>

      <SubmitBtn onClick={submitSession}>{editingId ? 'save changes' : 'submit session'}</SubmitBtn>
    </ModalShell>
  )
}
