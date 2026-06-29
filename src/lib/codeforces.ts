import type { ArenaQuestion } from '../data/arena'

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
