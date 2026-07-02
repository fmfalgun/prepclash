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
  amount?: number
  unit?: string
  bookId?: string
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

export interface MonkeytypeState {
  handle: string
  pb60: number | null
  pb30: number | null
  pb15: number | null
  completed: number | null
  lastSync: number | null
  error: string | null
}

export interface GhState {
  handle: string
  public_repos: number | null
  followers: number | null
  lastSync: number | null
  error: string | null
}

export interface LeetCodeState {
  handle: string
  solved: number | null
  easy: number | null
  medium: number | null
  hard: number | null
  ranking: number | null
  lastSync: number | null
  error: string | null
}

export interface CpSnapshot {
  ts: number
  cfRating: number | null
  cfSolved: number | null
  lcSolved: number | null
  ccRating: number | null
  a2ojTotal: number
  score: number               // cpScore at that moment
}

export interface CcState {
  handle: string
  rating: number | null
  maxRating: number | null
  stars: number | null          // 1-7
  rank: string                  // e.g. '3 Star Coder'
  solved: number | null         // problems solved on practice
  lastSync: number | null
  error: string | null
}

export type WeightMode = 'kg/hand' | 'kg total' | 'lb/hand' | 'bodyweight' | 'cardio' | 'time'

export type BookCategory = 'manga' | 'manhwa' | 'manhua' | 'webnovel' | 'novel' | 'fiction' | 'hacking' | 'other'

export interface SchedExercise {
  name: string
  sets: number
  reps: number
  weight: number
  mode: WeightMode
}

export interface SessionExercise {
  name: string
  mode: WeightMode
  sets: { reps: number; weight: number }[]
}

export interface ScheduleDay {
  id: string
  name: string
  muscle: string
  exercises: SchedExercise[]
}

export interface ScheduleTemplate {
  version: number
  updatedAt: number
  days: ScheduleDay[]
}

export interface ScheduleHistoryEntry {
  version: number
  note: string
  ts: number
}

export interface WorkoutSession {
  id: string
  ts: number
  date: string
  dayId: string
  dayName: string
  muscle: string
  exercises: SessionExercise[]
  durationMin: number
  volume: number
  totalReps: number
  totalSets: number
}

export interface WorkoutData {
  schedule: ScheduleTemplate
  history: ScheduleHistoryEntry[]
  sessions: WorkoutSession[]
}

export interface Data {
  profile: { name: string; handle: string; uid: string | null }
  skillXp: Record<string, number>
  keywords: { label: string; skill: string }[]
  extraSkills: { id: string; name: string; base: number }[]
  courses: { id: string; done: number[] }[]
  books: { id: string; done: number }[]
  customDefs: { id: string; title: string; unit: string; total: number; skill: string; category?: string; author?: string; publisher?: string; edition?: string; status?: 'ongoing' | 'completed' }[]
  logs: LogEntry[]
  momentum: number
  workoutLab?: WorkoutData
  cf: CfState
  a2oj: { id: string; solved: number }[]
  village: Record<string, { cleared: true; proof: string; ts: number }>
  campaign: Record<string, number>
  campaignDefeated: Record<string, boolean>
  arena: Record<string, { proof: string; ts: number }>
  weekly: Record<string, number>
  palette: Palette
  activity: Record<string, number>
  kwCounts: Record<string, number>
  clanId?: string | null
  myClan?: ClanDoc | null
  onboarded?: boolean
  mt: MonkeytypeState
  lc: LeetCodeState
  gh: GhState
  cc: CcState
  cpHistory: CpSnapshot[]
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

export type ModalType = 'study' | 'reading' | 'add-book' | 'node' | 'question' | 'connect' | 'log' | 'edit' | 'editSession' | 'onboarding' | null

export interface Draft {
  title: string
  mins: number
  logDate: string     // YYYY-MM-DD, defaults to today — allows backdating logs
  selected: string[]
  newKwLabel: string
  newKwSkill: string
  newCatName: string
  book: string
  readAmount: number
  nbTitle: string
  nbUnit: string
  nbTotal: string
  nbCategory: string
  nbCustomCat: string
  nbAuthor: string
  nbPublisher: string
  nbStatus: string
}

// Public profile stored in Firestore — readable by everyone
export interface PublicOperative {
  uid: string
  name: string
  handle: string
  palette: Palette
  momentum: number
  rank: string
  overallScore: number
  streak: number
  weekXp: number
  clanId: string | null
  skillXp: Record<string, number>
  // village: node id → cleared ts (proof hidden from public)
  village: Record<string, { cleared: boolean; ts: number }>
  // arena: question id → solved ts (proof hidden)
  arena: Record<string, { ts: number }>
  cf: { handle: string; rating: number | null; rank: string; solved: number | null }
  mt?: { handle: string; pb60?: number | null } | null
  gh?: { handle: string; public_repos?: number | null } | null
  cc?: { handle: string; rating?: number | null; stars?: number | null } | null
  lastSeen: number
  createdAt?: number
  isShowcase?: boolean
  currentTarget?: string | null
  weekWorkout?: { sessions: number; volume: number } | null
  recentActivity?: { type: string; title: string; ts: number }[]
}

export interface ClanDoc {
  id: string
  name: string
  tag: string
  description: string
  founderUid: string
  memberCount: number
  createdAt: number
}

export interface FbUser {
  uid: string
  name: string | null
  email: string | null
  photoURL: string | null
}
