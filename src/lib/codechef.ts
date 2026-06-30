import type { CcState } from '../types'

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

type ParseFn = (json: Record<string, unknown>) => { rating: number | null; maxRating: number | null; stars: number; rank: string; solved: null }

// competeapi.vercel.app: { rating_number, max_rank, rating: "7★", ... }
const parseCompeteApi: ParseFn = (json) => {
  const d = json as any
  if (d.error || d.statusCode === 404) throw new Error('user not found')
  const rating    = parseInt(String(d.rating_number ?? d.currentRating ?? '0'), 10)
  const maxRating = parseInt(String(d.max_rank ?? d.highestRating ?? '0'), 10)
  if (!rating) throw new Error('no rating data')
  const stars = ratingToStars(rating)
  return { rating, maxRating, stars, rank: ratingToRank(stars), solved: null }
}

// codechef-api.vercel.app: { success, profile: { currentRating, highestRating } }
const parseVercelApi: ParseFn = (json) => {
  const d = json as any
  if (d.success === false) throw new Error('user not found')
  const inner  = d.profile ?? d
  const rating    = parseInt(String(inner.currentRating ?? inner.rating ?? '0'), 10)
  const maxRating = parseInt(String(inner.highestRating ?? inner.max_rating ?? '0'), 10)
  if (!rating) throw new Error('no rating data')
  const stars = ratingToStars(rating)
  return { rating, maxRating, stars, rank: ratingToRank(stars), solved: null }
}

// Ordered list — first live one wins
const PROXIES: Array<{ url: (u: string) => string; parse: ParseFn }> = [
  {
    // ✓ LIVE — returns { rating_number, max_rank, ... }
    url:   u => `https://competeapi.vercel.app/user/codechef/${u}`,
    parse: parseCompeteApi,
  },
  {
    url:   u => `https://codechef-api.vercel.app/handle/${u}`,
    parse: parseVercelApi,
  },
  {
    url:   u => `https://codechef-api.vercel.app/${u}`,
    parse: parseVercelApi,
  },
]

export async function syncCodeChef(username: string): Promise<Omit<CcState, 'error'>> {
  let lastErr = 'all proxies failed'

  for (const proxy of PROXIES) {
    try {
      const res = await fetchWithTimeout(proxy.url(username))
      if (!res.ok) { lastErr = `http ${res.status}`; continue }
      const json = await res.json() as Record<string, unknown>
      const parsed = proxy.parse(json)
      return { handle: username, ...parsed, lastSync: Date.now() }
    } catch (e) {
      lastErr = String(e).replace('Error: ', '')
    }
  }

  throw new Error(lastErr)
}
