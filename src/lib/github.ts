import type { GhState } from '../types'

export async function syncGithubProfile(handle: string): Promise<Omit<GhState, 'handle' | 'error'>> {
  const res = await fetch(`https://api.github.com/users/${encodeURIComponent(handle)}`, {
    headers: { 'Accept': 'application/vnd.github+json' },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const d = await res.json()
  return {
    public_repos: d.public_repos ?? null,
    followers:    d.followers    ?? null,
    lastSync:     Date.now(),
  }
}
