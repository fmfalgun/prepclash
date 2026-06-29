import type { SchedExercise, WorkoutSession } from '../types'

export function loadKg(weight: number, mode: string): number {
  if (mode === 'bodyweight' || mode === 'cardio') return 0
  let w = weight || 0
  if (mode === 'lb/hand' || mode === 'lb total') w *= 0.4536
  return w
}

export function exVolume(e: SchedExercise): number {
  const l = loadKg(e.weight, e.mode)
  const ph = e.mode === 'kg/hand' || e.mode === 'lb/hand'
  return (e.sets || 0) * (e.reps || 0) * l * (ph ? 2 : 1)
}

export function est1rm(e: SchedExercise): number {
  const l = loadKg(e.weight, e.mode)
  if (!l) return 0
  return l * (1 + (e.reps || 0) / 30)
}

export function computeSession(exs: SchedExercise[]): { volume: number; totalReps: number; totalSets: number } {
  let v = 0, r = 0, s = 0
  exs.forEach(e => { v += exVolume(e); r += (e.sets || 0) * (e.reps || 0); s += (e.sets || 0) })
  return { volume: Math.round(v), totalReps: r, totalSets: s }
}

export interface PBMap {
  [name: string]: { orm: number; weight: number; reps: number; mode: string; ts: number }
}
export interface PRSessions { [sessionId: string]: string[] }

export function computePBs(sessions: WorkoutSession[]): { best: PBMap; prSessions: PRSessions } {
  const sorted = [...sessions].sort((a, b) => a.ts - b.ts)
  const best: PBMap = {}
  const prSessions: PRSessions = {}
  sorted.forEach(s => s.exercises.forEach(e => {
    const orm = est1rm(e)
    if (!orm) return
    if (!best[e.name] || orm > best[e.name].orm + 0.01) {
      best[e.name] = { orm, weight: loadKg(e.weight, e.mode), reps: e.reps, mode: e.mode, ts: s.ts }
      prSessions[s.id] = prSessions[s.id] || []
      prSessions[s.id].push(e.name)
    }
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
