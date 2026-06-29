import { useStore } from '../../store/useStore'
import { ModalShell, ModalLabel, inputStyle, SubmitBtn } from './ModalShell'
import { computeSession, fmtK } from '../../lib/workoutStats'
import type { WeightMode } from '../../types'

const MODE_OPTS: WeightMode[] = ['kg/hand', 'kg total', 'lb/hand', 'bodyweight', 'cardio']

export function LogSessionModal() {
  const logDraft  = useStore(s => s.logDraft)
  const pickDay   = useStore(s => s.pickDay)
  const addLogEx  = useStore(s => s.addLogEx)
  const removeLogEx   = useStore(s => s.removeLogEx)
  const updateLogEx   = useStore(s => s.updateLogEx)
  const setLogDuration = useStore(s => s.setLogDuration)
  const submitSession  = useStore(s => s.submitSession)
  const wl  = useStore(s => s.data.workoutLab)
  const days = wl?.schedule.days || []

  if (!logDraft) return null

  const exs  = logDraft.exercises
  const live = computeSession(exs.filter(e => (e.name || '').trim()))
  const day  = days.find(d => d.id === logDraft.dayId) || days[0]

  const rowStyle: React.CSSProperties = {
    display: 'grid', gridTemplateColumns: '1fr 52px 52px 80px 100px 28px',
    gap: 6, alignItems: 'center',
  }

  return (
    <ModalShell kicker="workout lab" title="log session" maxWidth={700}>

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

      {/* Exercise table header */}
      <div style={{ marginBottom: 10 }}>
        <ModalLabel>exercises</ModalLabel>
        <div style={{ ...rowStyle, marginBottom: 4 }}>
          <div style={{ font: "400 9px 'Roboto Mono'", color: 'var(--mut)' }}>name</div>
          <div style={{ font: "400 9px 'Roboto Mono'", color: 'var(--mut)', textAlign: 'center' }}>sets</div>
          <div style={{ font: "400 9px 'Roboto Mono'", color: 'var(--mut)', textAlign: 'center' }}>reps</div>
          <div style={{ font: "400 9px 'Roboto Mono'", color: 'var(--mut)', textAlign: 'center' }}>weight</div>
          <div style={{ font: "400 9px 'Roboto Mono'", color: 'var(--mut)', textAlign: 'center' }}>mode</div>
          <div />
        </div>
        {exs.map((e, i) => (
          <div key={i} style={{ ...rowStyle, marginBottom: 5 }}>
            <input
              value={e.name as string}
              onChange={ev => updateLogEx(i, 'name', ev.target.value)}
              placeholder="exercise name"
              list="ex-names"
              style={{ ...inputStyle, padding: '7px 9px' }}
            />
            <input
              type="number" min={1} max={20}
              value={e.sets}
              onChange={ev => updateLogEx(i, 'sets', parseInt(ev.target.value) || 0)}
              style={{ ...inputStyle, padding: '7px 6px', textAlign: 'center' }}
            />
            <input
              type="number" min={1} max={100}
              value={e.reps}
              onChange={ev => updateLogEx(i, 'reps', parseInt(ev.target.value) || 0)}
              style={{ ...inputStyle, padding: '7px 6px', textAlign: 'center' }}
            />
            <input
              type="number" min={0} step={0.5}
              value={e.weight}
              onChange={ev => updateLogEx(i, 'weight', parseFloat(ev.target.value) || 0)}
              style={{ ...inputStyle, padding: '7px 6px', textAlign: 'center' }}
            />
            <select
              value={e.mode}
              onChange={ev => updateLogEx(i, 'mode', ev.target.value)}
              style={{ ...inputStyle, padding: '7px 6px', cursor: 'pointer' }}
            >
              {MODE_OPTS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <button onClick={() => removeLogEx(i)} style={{
              cursor: 'pointer', border: 'none', background: 'transparent',
              color: 'var(--mut)', fontSize: 14, lineHeight: '1',
            }}>✕</button>
          </div>
        ))}
        <datalist id="ex-names">
          {day?.exercises.map(e => <option key={e.name} value={e.name} />)}
        </datalist>
        <button onClick={addLogEx} style={{
          cursor: 'pointer', border: '1px dashed rgba(255,255,255,.15)',
          background: 'transparent', color: 'var(--mut)',
          font: "400 11px 'Roboto Mono'",
          width: '100%', padding: '8px', borderRadius: 6, marginTop: 4,
        }}>+ add exercise</button>
      </div>

      {/* Duration */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 6 }}>
        <div style={{ flex: 1 }}>
          <ModalLabel>duration (min)</ModalLabel>
          <input
            type="number" min={10} max={240} value={logDraft.durationMin}
            onChange={e => setLogDuration(parseInt(e.target.value) || 55)}
            style={{ ...inputStyle }}
          />
        </div>
        {/* Live preview */}
        <div style={{ background: 'var(--cardHi)', borderRadius: 8, padding: '10px 14px', minWidth: 120, textAlign: 'center' }}>
          <div style={{ font: "500 18px/1 'Roboto Mono'", color: 'var(--a)' }}>{fmtK(live.volume)} kg</div>
          <div style={{ font: "400 9px 'Roboto Mono'", color: 'var(--mut)', marginTop: 4 }}>
            {live.totalSets} sets · {live.totalReps} reps
          </div>
        </div>
      </div>

      <SubmitBtn onClick={submitSession}>submit session</SubmitBtn>
    </ModalShell>
  )
}
