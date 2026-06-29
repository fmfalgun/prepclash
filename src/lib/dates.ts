import type { Data } from '../types'

export function todayKey(d?: Date) {
  const dt = d || new Date()
  return dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0') + '-' + String(dt.getDate()).padStart(2, '0')
}

export function weekKey(d?: Date) {
  const dt = new Date(d || new Date())
  const day = (dt.getDay() + 6) % 7 // Monday = 0
  dt.setDate(dt.getDate() - day)
  return todayKey(dt)
}

export function addWeekXp(data: Data, n: number) {
  const k = weekKey()
  data.weekly = data.weekly || {}
  data.weekly[k] = (data.weekly[k] || 0) + n
}

export function bumpActivity(data: Data, amt: number) {
  const k = todayKey()
  data.activity[k] = (data.activity[k] || 0) + amt
}

export function computeStreak(data: Data): number {
  let s = 0
  const d = new Date()
  for (let i = 0; i < 400; i++) {
    const k = todayKey(d)
    if ((data.activity[k] || 0) > 0) { s++; d.setDate(d.getDate() - 1) }
    else break
  }
  return s
}

export function weekXpNow(data: Data): number {
  return (data.weekly && data.weekly[weekKey()]) || 0
}

export function ago(ts: number): string {
  if (!ts) return 'just now'
  const s = (Date.now() - ts) / 1000
  if (s < 60)    return 'just now'
  if (s < 3600)  return Math.floor(s / 60) + 'm ago'
  if (s < 86400) return Math.floor(s / 3600) + 'h ago'
  return Math.floor(s / 86400) + 'd ago'
}
