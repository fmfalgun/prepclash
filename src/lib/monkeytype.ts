import type { MonkeytypeState } from '../types'

export async function syncMonkeytype(username: string): Promise<Omit<MonkeytypeState, 'error'>> {
  const res = await fetch(`https://api.monkeytype.com/users/${encodeURIComponent(username)}/profile`, {
    headers: { 'Accept': 'application/json' },
  })
  if (!res.ok) {
    const msg = res.status === 404 ? 'user not found' : `api error ${res.status}`
    throw new Error(msg)
  }
  const json = await res.json()
  const d = json.data
  if (!d) throw new Error('empty response')

  const pb = d.personalBests || {}
  const t = pb.time || {}
  const best = (key: string) => {
    const arr = t[key]
    return Array.isArray(arr) && arr[0]?.wpm ? Math.round(arr[0].wpm) : null
  }

  return {
    handle: d.name || username,
    pb60: best('60'),
    pb30: best('30'),
    pb15: best('15'),
    completed: d.typingStats?.completedTests ?? null,
    lastSync: Date.now(),
  }
}
