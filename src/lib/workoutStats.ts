import type { SessionExercise, WorkoutSession } from '../types'

export function loadKg(weight: number, mode: string): number {
  if (mode === 'bodyweight' || mode === 'cardio') return 0
  let w = weight || 0
  if (mode === 'lb/hand' || mode === 'lb total') w *= 0.4536
  return w
}

export function exVolume(e: SessionExercise): number {
  const ph = e.mode === 'kg/hand' || e.mode === 'lb/hand'
  return e.sets.reduce((sum, s) => {
    const l = loadKg(s.weight, e.mode)
    return sum + (s.reps || 0) * l * (ph ? 2 : 1)
  }, 0)
}

export function est1rm(e: SessionExercise): number {
  return e.sets.reduce((max, s) => {
    const l = loadKg(s.weight, e.mode)
    if (!l) return max
    return Math.max(max, l * (1 + (s.reps || 0) / 30))
  }, 0)
}

export function computeSession(exs: SessionExercise[]): { volume: number; totalReps: number; totalSets: number } {
  let v = 0, r = 0, s = 0
  exs.forEach(e => {
    v += exVolume(e)
    r += e.sets.reduce((sum, st) => sum + (st.reps || 0), 0)
    s += e.sets.length
  })
  return { volume: Math.round(v), totalReps: r, totalSets: s }
}

export function fmtSets(e: SessionExercise): string {
  const allSameReps   = e.sets.every(s => s.reps   === e.sets[0].reps)
  const allSameWeight = e.sets.every(s => s.weight === e.sets[0].weight)
  const n = e.sets.length
  if (allSameReps && allSameWeight) {
    const s0 = e.sets[0]
    const wLabel = e.mode === 'bodyweight' ? 'bw' : e.mode === 'cardio' ? '' : ` ${s0.weight} ${e.mode}`
    return `${n}×${s0.reps}${wLabel}`
  }
  const repsStr = e.sets.map(s => s.reps).join('/')
  const wUniq = [...new Set(e.sets.map(s => s.weight))]
  const wStr = wUniq.length === 1 ? ` @ ${wUniq[0]} ${e.mode}` : ` @ ${e.sets.map(s => s.weight).join('/')} ${e.mode}`
  return `${n} sets (${repsStr} reps${wStr})`
}

export interface PBMap {
  [name: string]: { orm: number; weight: number; reps: number; mode: string; ts: number }
}
export interface PRSessions { [sessionId: string]: string[] }

export function computePBs(sessions: WorkoutSession[]): { best: PBMap; prSessions: PRSessions } {
  const sorted = [...sessions].sort((a, b) => a.ts - b.ts)
  const best: PBMap = {}
  const prSessions: PRSessions = {}
  sorted.forEach(sess => sess.exercises.forEach(e => {
    e.sets.forEach(s => {
      const l = loadKg(s.weight, e.mode)
      if (!l) return
      const orm = l * (1 + (s.reps || 0) / 30)
      if (!best[e.name] || orm > best[e.name].orm + 0.01) {
        best[e.name] = { orm, weight: l, reps: s.reps, mode: e.mode, ts: sess.ts }
        prSessions[sess.id] = prSessions[sess.id] || []
        if (!prSessions[sess.id].includes(e.name)) prSessions[sess.id].push(e.name)
      }
    })
  }))
  return { best, prSessions }
}

export function weekKey(d?: Date | number): string {
  const dt = new Date(d || new Date())
  const off = (dt.getDay() + 6) % 7
  dt.setDate(dt.getDate() - off)
  dt.setHours(0, 0, 0, 0)
  return dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0') + '-' + String(dt.getDate()).padStart(2, '0')
}

export function computeStreaks(sessions: WorkoutSession[]): { cur: number; longest: number } {
  const wkMs = 7 * 86400000
  const weeks = [...new Set(sessions.map(s => weekKey(s.ts)))].sort()
  let longest = 0, run = 0, prevT: number | null = null
  weeks.forEach(wk => {
    const t = new Date(wk).getTime()
    if (prevT !== null && Math.round((t - prevT) / wkMs) === 1) run++
    else run = 1
    longest = Math.max(longest, run)
    prevT = t
  })
  const thisWk = new Date(weekKey()).getTime()
  const set = new Set(weeks.map(w => new Date(w).getTime()))
  let cur = 0
  let w = set.has(thisWk) ? thisWk : thisWk - wkMs
  while (set.has(w)) { cur++; w -= wkMs }
  return { cur, longest }
}

export function fmtK(n: number): string {
  n = Math.round(n)
  if (n >= 10000) return (n / 1000).toFixed(0) + 'k'
  if (n >= 1000)  return (n / 1000).toFixed(1) + 'k'
  return String(n)
}
