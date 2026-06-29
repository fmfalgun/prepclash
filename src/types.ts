export type Palette = 'toxic' | 'ember' | 'ice' | 'violet'

export interface LogEntry {
  type: 'study' | 'workout' | 'course' | 'reading' | 'node' | 'arena'
  title: string
  mins: number
  keywords?: string[]
  gain: number
  date: string
  ts: number
  proof?: string
}

export interface CfState {
  handle: string
  rating: number | null
  maxRating: number | null
  rank: string
  solved: number | null
  contests: number | null
  lastSync: number | null
  error: string | null
}

export interface Data {
  profile: { name: string; handle: string; uid: string | null }
  skillXp: Record<string, number>
  keywords: { label: string; skill: string }[]
  extraSkills: { id: string; name: string; base: number }[]
  courses: { id: string; done: number[] }[]
  books: { id: string; done: number }[]
  customDefs: { id: string; title: string; unit: string; total: number; skill: string }[]
  logs: LogEntry[]
  momentum: number
  workouts: { date: string; name: string; exercises: { name: string; sr: string; weight: string }[] }[]
  cf: CfState
  a2oj: { id: string; solved: number }[]
  village: Record<string, { cleared: true; proof: string; ts: number }>
  arena: Record<string, { proof: string; ts: number }>
  weekly: Record<string, number>
  palette: Palette
  activity: Record<string, number>
  kwCounts: Record<string, number>
}

export interface ClanMember {
  name: string
  momentum: number
  rank: string
  node: string
  color: string
  initials: string
  you?: boolean
}

export interface LiveQuestion {
  id: string
  title: string
  diff: string
  xp: number
  url: string
  live?: boolean
}

export type ModalType = 'study' | 'workout' | 'reading' | 'node' | 'question' | 'connect' | null

export interface Draft {
  title: string
  mins: number
  selected: string[]
  newKwLabel: string
  newKwSkill: string
  newCatName: string
  sessionName: string
  exercises: { name: string; sets: string; reps: string; weight: string; mode: string }[]
  book: string
  readAmount: number
  nbTitle: string
  nbUnit: string
  nbTotal: string
  nbSkill: string
}
