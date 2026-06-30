import type { LeetCodeState } from '../types'

// LeetCode's own GraphQL endpoint blocks browser CORS requests.
// Primary proxy: alfa-leetcode-api (community proxy on Render)
// Fallback: leetcode-stats-api on Heroku
const PROXIES = [
  { url: (u: string) => `https://alfa-leetcode-api.onrender.com/userProfile/${u}`, parse: parseAlfa },
  { url: (u: string) => `https://leetcode-stats-api.herokuapp.com/${u}`,           parse: parseStats },
]

function parseAlfa(json: Record<string, unknown>) {
  if ((json as any).status === 'error' || (json as any).errors) throw new Error('user not found')
  return {
    solved:   (json.totalSolved  as number) ?? null,
    easy:     (json.easySolved   as number) ?? null,
    medium:   (json.mediumSolved as number) ?? null,
    hard:     (json.hardSolved   as number) ?? null,
    ranking:  (json.ranking      as number) ?? null,
  }
}

function parseStats(json: Record<string, unknown>) {
  if ((json as any).status === 'error') throw new Error('user not found')
  return {
    solved:   (json.totalSolved  as number) ?? null,
    easy:     (json.easySolved   as number) ?? null,
    medium:   (json.mediumSolved as number) ?? null,
    hard:     (json.hardSolved   as number) ?? null,
    ranking:  (json.ranking      as number) ?? null,
  }
}

async function fetchWithTimeout(url: string, ms = 12000): Promise<Response> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), ms)
  try {
    return await fetch(url, { signal: ctrl.signal })
  } finally {
    clearTimeout(timer)
  }
}

export async function syncLeetCode(username: string): Promise<Omit<LeetCodeState, 'error'>> {
  let lastErr = 'all proxies failed'

  for (const proxy of PROXIES) {
    try {
      const res = await fetchWithTimeout(proxy.url(username))
      if (!res.ok) { lastErr = `api error ${res.status}`; continue }
      const json = await res.json() as Record<string, unknown>
      const parsed = proxy.parse(json)
      return { handle: username, ...parsed, lastSync: Date.now() }
    } catch (e) {
      lastErr = String(e).replace('Error: ', '')
    }
  }

  throw new Error(lastErr)
}
