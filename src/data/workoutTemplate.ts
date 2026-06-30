import type { ScheduleDay, WorkoutData, WorkoutSession, SchedExercise, SessionExercise } from '../types'

export const TOJI: ScheduleDay[] = [
  { id: 'd1', name: 'Chest + Shoulders', muscle: 'Chest', exercises: [
    { name: 'Incline Bench Press',  sets: 4, reps: 10, weight: 7.5, mode: 'kg/hand' },
    { name: 'Flat Bench Press',     sets: 3, reps: 10, weight: 7.5, mode: 'kg/hand' },
    { name: 'DB Shoulder Press',    sets: 3, reps: 12, weight: 7.5, mode: 'kg/hand' },
    { name: 'Lateral Raises',       sets: 4, reps: 12, weight: 2.5, mode: 'kg/hand' },
    { name: 'Bench Dips',           sets: 4, reps: 12, weight: 0,   mode: 'bodyweight' },
  ]},
  { id: 'd2', name: 'Back Thickness + Traps', muscle: 'Back', exercises: [
    { name: 'Dumbbell Rows',        sets: 4, reps: 10, weight: 10,  mode: 'kg/hand' },
    { name: 'Chest-Supported Rows', sets: 4, reps: 12, weight: 7.5, mode: 'kg/hand' },
    { name: 'Shrugs',               sets: 4, reps: 12, weight: 10,  mode: 'kg/hand' },
    { name: 'Face Pulls',           sets: 3, reps: 20, weight: 22,  mode: 'kg total' },
    { name: 'Dead Hang',            sets: 2, reps: 1,  weight: 0,   mode: 'bodyweight' },
  ]},
  { id: 'd3', name: 'Legs', muscle: 'Legs', exercises: [
    { name: 'Squats',               sets: 4, reps: 12, weight: 7.5, mode: 'kg/hand' },
    { name: 'Romanian Deadlifts',   sets: 4, reps: 12, weight: 7.5, mode: 'kg/hand' },
    { name: 'Walking Lunges',       sets: 3, reps: 10, weight: 7.5, mode: 'kg/hand' },
    { name: 'Calf Raises',          sets: 4, reps: 20, weight: 7.5, mode: 'kg/hand' },
    { name: 'Leg Press',            sets: 3, reps: 12, weight: 80,  mode: 'kg total' },
  ]},
  { id: 'd4', name: 'Shoulders + Arms', muscle: 'Shoulders', exercises: [
    { name: 'DB Shoulder Press',    sets: 3, reps: 12, weight: 7.5, mode: 'kg/hand' },
    { name: 'Lateral Raises',       sets: 5, reps: 12, weight: 3,   mode: 'kg/hand' },
    { name: 'Rear Delt Flyes',      sets: 4, reps: 10, weight: 4,   mode: 'kg/hand' },
    { name: 'Hammer Curls',         sets: 3, reps: 8,  weight: 7.5, mode: 'kg/hand' },
    { name: 'Skull Crushers',       sets: 3, reps: 10, weight: 6,   mode: 'kg total' },
    { name: 'Barbell Curls',        sets: 3, reps: 15, weight: 5,   mode: 'kg total' },
  ]},
  { id: 'd5', name: 'Back Width + Forearms', muscle: 'Back', exercises: [
    { name: 'Dead Hangs',           sets: 4, reps: 1,  weight: 0,   mode: 'bodyweight' },
    { name: 'Lat Pulldowns',        sets: 4, reps: 12, weight: 20,  mode: 'kg total' },
    { name: 'Single-Arm Rows',      sets: 4, reps: 12, weight: 13,  mode: 'kg/hand' },
    { name: "Farmer's Carries",     sets: 3, reps: 30, weight: 11,  mode: 'kg/hand' },
    { name: 'Wrist Curls',          sets: 3, reps: 20, weight: 3.75,mode: 'kg/hand' },
    { name: 'Reverse Curls',        sets: 3, reps: 20, weight: 5,   mode: 'kg/hand' },
  ]},
  { id: 'd6', name: 'Conditioning', muscle: 'Cardio', exercises: [
    { name: 'Treadmill Sprints',    sets: 10, reps: 1, weight: 0,   mode: 'cardio' },
  ]},
]

function dateKey(d?: Date): string {
  const dt = d || new Date()
  return dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0') + '-' + String(dt.getDate()).padStart(2, '0')
}

function loadKg(weight: number, mode: string): number {
  if (mode === 'bodyweight' || mode === 'cardio') return 0
  let w = weight || 0
  if (mode === 'lb/hand' || mode === 'lb total') w *= 0.4536
  return w
}

function exVolume(e: SessionExercise): number {
  const ph = e.mode === 'kg/hand' || e.mode === 'lb/hand'
  return e.sets.reduce((sum, s) => {
    const l = loadKg(s.weight, e.mode)
    return sum + s.reps * l * (ph ? 2 : 1)
  }, 0)
}

function computeSession(exs: SessionExercise[]) {
  let v = 0, r = 0, s = 0
  exs.forEach(e => { v += exVolume(e); r += e.sets.reduce((a, st) => a + st.reps, 0); s += e.sets.length })
  return { volume: Math.round(v), totalReps: r, totalSets: s }
}

export function genSeed(): WorkoutSession[] {
  const out: WorkoutSession[] = []
  const today = new Date()
  let cyc = 0
  for (let d = 45; d >= 1; d--) {
    const date = new Date(today)
    date.setDate(today.getDate() - d)
    const dow = (date.getDay() + 6) % 7
    if (![0, 2, 4, 5].includes(dow)) continue
    const tmpl = TOJI[cyc % 5]; cyc++
    const weeksAgo = Math.floor(d / 7)
    const scale = 1 - weeksAgo * 0.035
    const exs: SessionExercise[] = tmpl.exercises.map((e, i) => {
      let w = e.weight
      if (e.mode !== 'bodyweight' && e.mode !== 'cardio')
        w = Math.max(1, Math.round(e.weight * scale * 2) / 2)
      const j = (Math.abs(Math.sin((d + i) * 7.3)) % 1) < 0.25 ? -1 : 0
      const reps = Math.max(1, e.reps + j)
      return { name: e.name, mode: e.mode, sets: Array.from({ length: e.sets }, () => ({ reps, weight: w })) }
    })
    const m = computeSession(exs)
    out.push({
      id: 'seed' + d, ts: date.getTime(), date: dateKey(date),
      dayId: tmpl.id, dayName: tmpl.name, muscle: tmpl.muscle,
      exercises: exs, durationMin: 48 + (cyc % 5) * 6,
      volume: m.volume, totalReps: m.totalReps, totalSets: m.totalSets,
    })
  }
  return out
}

export function seedWorkoutData(): WorkoutData {
  const now = Date.now()
  return {
    schedule: { version: 1, updatedAt: now - 46 * 86400000, days: JSON.parse(JSON.stringify(TOJI)) },
    history: [{ version: 1, note: 'Initial split — Toji programme', ts: now - 46 * 86400000 }],
    sessions: genSeed(),
  }
}
