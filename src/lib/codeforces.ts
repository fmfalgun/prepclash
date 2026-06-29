import type { ArenaQuestion } from '../data/arena'
import type { CfState } from '../types'

export async function syncCfProfile(handle: string): Promise<Omit<CfState, 'error'>> {
  const h = encodeURIComponent(handle)
  const [infoR, ratingR, statusR] = await Promise.all([
    fetch('https://codeforces.com/api/user.info?handles=' + h),
    fetch('https://codeforces.com/api/user.rating?handle=' + h),
    fetch('https://codeforces.com/api/user.status?handle=' + h),
  ])
  const info = await infoR.json()
  if (info.status !== 'OK') throw new Error('bad handle')
  const u = info.result[0]
  const rating = await ratingR.json()
  const status = await statusR.json()
  const contests = rating.status === 'OK' ? rating.result.length : 0
  let solved = 0
  if (status.status === 'OK') {
    const seen = new Set<string>()
    for (const s of status.result)
      if (s.verdict === 'OK') seen.add(s.problem.contestId + '-' + s.problem.index)
    solved = seen.size
  }
  return {
    handle,
    rating: u.rating ?? null,
    maxRating: u.maxRating ?? null,
    rank: u.rank ?? '',
    solved,
    contests,
    lastSync: Date.now(),
  }
}

export async function pullCfProblems(tag: string): Promise<ArenaQuestion[]> {
  const res = await fetch('https://codeforces.com/api/problemset.problems?tags=' + encodeURIComponent(tag))
  const j = await res.json()
  if (j.status !== 'OK') throw new Error('bad tag')
  return j.result.problems
    .filter((p: { rating?: number }) => p.rating)
    .sort((a: { rating: number }, b: { rating: number }) => a.rating - b.rating)
    .slice(0, 12)
    .map((p: { contestId: number; index: string; name: string; rating: number }) => ({
      id: 'cf-' + p.contestId + p.index,
      title: p.name,
      diff: String(p.rating),
      xp: Math.max(6, Math.round(p.rating / 120)),
      url: 'https://codeforces.com/problemset/problem/' + p.contestId + '/' + p.index,
      live: true,
    }))
}
