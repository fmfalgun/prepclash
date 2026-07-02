import { UNIT_PT } from '../data/skills'

export function studyGain(mins: number, tagCount: number): number {
  return 5 + Math.round((Math.max(0, mins)) / 5) + tagCount * 2
}

export function studySkillXp(mins: number): number {
  return Math.max(2, Math.round(mins / 10))
}

export function workoutGain(exerciseCount: number): number {
  return 8 + exerciseCount * 3
}

const LIGHT_CATS = new Set(['manga', 'manhwa', 'manhua', 'webnovel', 'novel', 'fiction'])

export function readGain(unitType: string, amount: number, category?: string): number {
  const w = UNIT_PT[unitType] ?? 1
  const catW = category && LIGHT_CATS.has(category) ? 0.2 : 1
  return 4 + Math.round(Math.max(0, amount) * w * catW)
}

export function fmtWeight(ex: { mode: string; weight: string }): string {
  if (ex.mode === 'bodyweight') return 'Bodyweight'
  const w = (ex.weight || '').trim()
  return w ? w + ' ' + ex.mode : ex.mode
}
