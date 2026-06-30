import type { LeetCodeState } from '../types'

// LeetCode's own GraphQL endpoint blocks browser CORS requests.
// Use alfa-leetcode-api (community proxy) as the primary path.
const PROXY = 'https://alfa-leetcode-api.onrender.com'

export async function syncLeetCode(username: string): Promise<Omit<LeetCodeState, 'error'>> {
  let json: Record<string, unknown>
  try {
    const res = await fetch(`${PROXY}/userProfile/${username}`)
    if (!res.ok) throw new Error(`api error ${res.status}`)
    json = await res.json()
  } catch (e) {
    throw new Error('LC sync failed — ' + String(e).replace('Error: ', ''))
  }

  if ((json as any).errors || (json as any).status === 'error') {
    throw new Error('user not found on LeetCode')
  }

  return {
    handle:   username,
    solved:   (json.totalSolved  as number) ?? null,
    easy:     (json.easySolved   as number) ?? null,
    medium:   (json.mediumSolved as number) ?? null,
    hard:     (json.hardSolved   as number) ?? null,
    ranking:  (json.ranking      as number) ?? null,
    lastSync: Date.now(),
  }
}
