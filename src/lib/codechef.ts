import type { CcState } from '../types'

// Stars based on rating
function ratingToStars(r: number): number {
  if (r >= 2500) return 7
  if (r >= 2200) return 6
  if (r >= 2000) return 5
  if (r >= 1800) return 4
  if (r >= 1600) return 3
  if (r >= 1400) return 2
  return 1
}

function ratingToRank(stars: number): string {
  const labels = ['', '1★ Newbie', '2★ Beginner', '3★ Amateur', '4★ Expert', '5★ Master', '6★ Grandmaster', '7★ Intl. GM']
  return labels[stars] || '1★ Newbie'
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

// competitive-coding-api.herokuapp.com response shape
function parseCompApi(json: Record<string, unknown>) {
  if ((json as any).status !== 'Success') throw new Error('user not found')
  const rating = parseInt(String((json as any).rating || '0'), 10)
  const maxRating = parseInt(String((json as any).highest_rating || '0'), 10)
  const stars = ratingToStars(rating)
  return { rating: rating || null, maxRating: maxRating || null, stars, rank: ratingToRank(stars), solved: null }
}

// codechef-api.vercel.app response shape
function parseVercelApi(json: Record<string, unknown>) {
  if ((json as any).success === false) throw new Error('user not found')
  const d = (json as any).profile || json
  const rating = parseInt(String(d.currentRating || d.rating || '0'), 10)
  const maxRating = parseInt(String(d.highestRating || d.max_rating || '0'), 10)
  const stars = ratingToStars(rating)
  return { rating: rating || null, maxRating: maxRating || null, stars, rank: ratingToRank(stars), solved: null }
}

const PROXIES = [
  {
    url: (u: string) => `https://competitive-coding-api.herokuapp.com/api/codechef?username=${u}`,
    parse: parseCompApi,
  },
  {
    url: (u: string) => `https://codechef-api.vercel.app/api/user?username=${u}`,
    parse: parseVercelApi,
  },
]

export async function syncCodeChef(username: string): Promise<Omit<CcState, 'error'>> {
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
