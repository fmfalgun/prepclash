import type { LeetCodeState } from '../types'

const QUERY = `
  query getUserProfile($username: String!) {
    matchedUser(username: $username) {
      submitStats: submitStatsGlobal {
        acSubmissionNum { difficulty count }
      }
      profile { ranking }
    }
  }
`

export async function syncLeetCode(username: string): Promise<Omit<LeetCodeState, 'error'>> {
  let res: Response
  try {
    res = await fetch('https://leetcode.com/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: QUERY, variables: { username } }),
    })
  } catch {
    throw new Error('CORS blocked — LeetCode does not allow browser requests; add handle manually')
  }
  if (!res.ok) throw new Error(`api error ${res.status}`)
  const json = await res.json()
  const user = json.data?.matchedUser
  if (!user) throw new Error('user not found')

  const stats: { difficulty: string; count: number }[] = user.submitStats?.acSubmissionNum ?? []
  const get = (d: string) => stats.find(s => s.difficulty === d)?.count ?? null
  return {
    handle: username,
    solved: get('All'),
    easy: get('Easy'),
    medium: get('Medium'),
    hard: get('Hard'),
    ranking: user.profile?.ranking ?? null,
    lastSync: Date.now(),
  }
}
