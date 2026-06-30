import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Data, Draft, ModalType, Palette, PublicOperative, ClanDoc, FbUser, SessionExercise, ScheduleDay, WorkoutSession } from '../types'
import { syncGithubProfile } from '../lib/github'
import { SKILL_DEFS, DEFAULT_KEYWORDS, COURSE_DEFS, BOOK_DEFS } from '../data/skills'
import { todayKey, addWeekXp, bumpActivity } from '../lib/dates'
import { studyGain, studySkillXp, readGain } from '../lib/momentum'
import { flatNodes, nodeById } from '../data/village'
import { ARENA, ARENA_AXIS_MAP } from '../data/arena'
import { pushToFirebase, deleteAccount as fbDeleteAccount, disbandClan as fbDisbandClan, transferClanAdmin as fbTransferAdmin, saveUserHandles, loadUserHandles, saveCloudBackup, loadCloudBackup } from '../lib/firebase'
import { TOJI_BOOK_DEFS } from '../data/toji'
import { syncMonkeytype } from '../lib/monkeytype'
import { syncLeetCode } from '../lib/leetcode'
import { syncCodeChef } from '../lib/codechef'
import { seedWorkoutData, TOJI } from '../data/workoutTemplate'
import { computeSession, computePBs, est1rm } from '../lib/workoutStats'
import { syncCfProfile } from '../lib/codeforces'
import { A2OJ_DEFS, A2OJ_PROBLEMS } from '../data/a2oj'
import type { ArenaQuestion } from '../data/arena'

function freshDraft(): Draft {
  return {
    title: '', mins: 30, logDate: todayKey(), selected: [],
    newKwLabel: '', newKwSkill: 'python', newCatName: '',
    book: 'wahh', readAmount: 10, nbTitle: '', nbUnit: 'pages', nbTotal: '', nbSkill: 'web',
  }
}

// Convert YYYY-MM-DD string to a timestamp at noon local time
function dateToTs(d: string): number {
  const t = new Date(d + 'T12:00:00').getTime()
  return isNaN(t) ? Date.now() : t
}

// Module-level cloud save debounce
let _cloudSaveTimer: ReturnType<typeof setTimeout> | null = null
let _onCloudSaveFail: ((msg: string) => void) | null = null
function scheduleCloudSave(uid: string, getData: () => Data) {
  if (_cloudSaveTimer) clearTimeout(_cloudSaveTimer)
  _cloudSaveTimer = setTimeout(() => {
    _cloudSaveTimer = null
    saveCloudBackup(uid, getData()).catch((e) => {
      _onCloudSaveFail?.('cloud sync failed: ' + String(e).replace('Error: ', '').slice(0, 60))
    })
  }, 60 * 1000)  // 60s debounce — saves within 1 minute of any change
}

function seedData(): Data {
  const skillXp: Record<string, number> = {}
  SKILL_DEFS.forEach(s => { skillXp[s.id] = 0 })
  return {
    profile: { name: 'operative', handle: '', uid: null },
    skillXp,
    keywords: DEFAULT_KEYWORDS.map(([label, skill]) => ({ label, skill })),
    extraSkills: [],
    courses: COURSE_DEFS.map(c => ({ id: c.id, done: c.done.map(() => 0) })),
    books: BOOK_DEFS.map(b => ({ id: b.id, done: 0 })),
    customDefs: [],
    logs: [],
    momentum: 0,
    cf: { handle: '', rating: null, maxRating: null, rank: '', solved: null, contests: null, lastSync: null, error: null },
    a2oj: [],
    village: {},
    campaign: {},
    campaignDefeated: {},
    arena: {},
    weekly: {},
    palette: 'toxic',
    activity: {},
    kwCounts: {},
    clanId: null,
    myClan: null,
    workoutLab: seedWorkoutData(),
    mt: { handle: '', pb60: null, pb30: null, pb15: null, completed: null, lastSync: null, error: null },
    lc: { handle: '', solved: null, easy: null, medium: null, hard: null, ranking: null, lastSync: null, error: null },
    gh: { handle: '', public_repos: null, followers: null, lastSync: null, error: null },
    cc: { handle: '', rating: null, maxRating: null, stars: null, rank: '', solved: null, lastSync: null, error: null },
    cpHistory: [],
  }
}

function snapshotCp(d: Data) {
  const cfRating = d.cf.rating
  const cfSolved = d.cf.solved
  const lcSolved = d.lc?.solved ?? null
  const ccRating = d.cc?.rating ?? null
  const a2ojTot  = d.a2oj.reduce((s, x) => s + (x.solved || 0), 0)
  // Inline cpScore formula to avoid circular import
  const cfPart   = cfRating ? Math.min(30, Math.max(0, (cfRating - 600) / 73)) : 0
  const cfSolP   = Math.min(15, (cfSolved || 0) / 13.3)
  const a2p      = Math.min(15, a2ojTot / 18.4)
  const lcP      = Math.min(20, (lcSolved || 0) / 15)
  const ccP      = ccRating && ccRating >= 1400 ? Math.min(10, (ccRating - 1400) / 60) : 0
  const effP     = Math.min(9, Math.round(Math.sqrt(d.skillXp.cp || 0) * 1.5))
  const score    = Math.min(99, Math.round(cfPart + cfSolP + a2p + lcP + ccP + effP))
  const snap = { ts: Date.now(), cfRating, cfSolved, lcSolved, ccRating, a2ojTotal: a2ojTot, score }
  if (!d.cpHistory) d.cpHistory = []
  const last = d.cpHistory[d.cpHistory.length - 1]
  // Skip if identical to last (avoids noise from no-change syncs)
  if (!last || last.cfRating !== cfRating || last.cfSolved !== cfSolved ||
      last.lcSolved !== lcSolved || last.ccRating !== ccRating || last.a2ojTotal !== a2ojTot) {
    d.cpHistory.push(snap)
    if (d.cpHistory.length > 200) d.cpHistory = d.cpHistory.slice(-200)
  }
}

type LogDraft = { dayId: string; exercises: SessionExercise[]; durationMin: number; logDate?: string }

interface AppState {
  data: Data
  tab: string
  modal: ModalType
  draft: Draft
  toast: string | null
  activeTopic: string
  cfTagDraft: string
  cfPulling: boolean
  liveQuestions: Record<string, ArenaQuestion[]>
  proofDraft: string
  activeNode: string | null
  activeQ: { topic: string; qid: string } | null
  fbConfigDraft: string
  fbMode: 'offline' | 'online' | 'error'
  fbError: string | null
  nameDraft: string
  fbReady: boolean
  fbUser: FbUser | null
  operatives: PublicOperative[]
  clans: ClanDoc[]
  selectedPlayer: PublicOperative | null
  selectedClan: ClanDoc | null
  // Workout Lab state
  logDraft: LogDraft | null
  editDraft: ScheduleDay[] | null
  editNote: string
  selEx: string
  openSession: string | null
  editingSessionId: string | null

  setTab: (tab: string) => void
  setModal: (modal: ModalType) => void
  closeModal: () => void
  showToast: (msg: string) => void
  setActiveTopic: (topic: string) => void
  setCfTagDraft: (v: string) => void
  setCfPulling: (v: boolean) => void
  addLiveQuestions: (topic: string, qs: ArenaQuestion[]) => void
  setProofDraft: (v: string) => void
  setActiveNode: (id: string | null) => void
  setActiveQ: (q: { topic: string; qid: string } | null) => void
  setFbConfigDraft: (v: string) => void
  setFbMode: (mode: 'offline' | 'online' | 'error', err?: string) => void
  setNameDraft: (v: string) => void
  setDraft: (fn: (d: Draft) => Draft) => void
  setPalette: (p: Palette) => void
  setFbReady: (v: boolean) => void
  setFbUser: (user: FbUser | null) => void
  setOperatives: (ops: PublicOperative[]) => void
  setClans: (clans: ClanDoc[]) => void
  setSelectedPlayer: (p: PublicOperative | null) => void
  setSelectedClan: (c: ClanDoc | null) => void

  submitStudy: () => void
  submitReading: () => void
  addBook: () => void
  togglePhase: (cid: string, idx: number) => void
  addKeyword: () => void
  toggleKeyword: (label: string) => void
  setCampaign: (key: string, val: number) => void
  bumpCampaignLane: (key: string, delta: number, max: number) => void
  defeatAct: (actId: string) => void
  openNode: (id: string) => void
  clearNode: () => void
  unclearNode: () => void
  openQuestion: (topic: string, qid: string) => void
  solveQuestion: () => void
  saveName: () => void
  setCfHandle: (handle: string) => void
  syncCf: () => void
  bumpA2oj: (id: string, delta: number) => void
  setClanId: (clanId: string | null) => void
  deleteClan: (clanId: string) => void
  transferClanAdmin: (clanId: string, toUid: string) => void
  adoptToji: (choice: 'toji' | 'own' | 'both') => void
  closeOnboarding: () => void
  syncMt: () => void
  syncLc: () => void
  syncCc: () => void
  syncGh: () => void
  setMtHandle: (h: string) => void
  setLcHandle: (h: string) => void
  setCcHandle: (h: string) => void
  setGhHandle: (h: string) => void
  mtPulling: boolean
  lcPulling: boolean
  ccPulling: boolean
  ghPulling: boolean
  resetData: () => void
  applyImport: (raw: unknown) => void
  onSignedIn: (user: FbUser) => void
  onSignedOut: () => void
  deleteAccount: () => void
  cloudRestorePrompt: { data: Data; savedAt: number } | null
  acceptCloudRestore: () => void
  rejectCloudRestore: () => void
  triggerCloudSave: () => void

  // Workout Lab actions
  openLog: () => void
  openEdit: () => void
  openEditSession: (id: string) => void
  pickDay: (dayId: string) => void
  addLogEx: () => void
  removeLogEx: (idx: number) => void
  updateLogEx: (idx: number, field: 'name' | 'mode', value: string) => void
  addLogSet: (exIdx: number) => void
  removeLogSet: (exIdx: number, setIdx: number) => void
  updateLogSet: (exIdx: number, setIdx: number, field: 'reps' | 'weight', value: number) => void
  setLogDuration: (v: number) => void
  setLogDate: (d: string) => void
  submitSession: () => void
  saveSchedule: () => void
  setSelEx: (name: string) => void
  toggleSession: (id: string) => void
  setEditNote: (note: string) => void
  updateEditDay: (di: number, field: string, value: string) => void
  updateEditEx: (di: number, ei: number, field: string, value: string | number) => void
  addEditEx: (di: number) => void
  removeEditEx: (di: number, ei: number) => void
  removeEditDay: (di: number) => void
  addEditDay: () => void
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => {
      function requireAuth(): boolean {
        const { fbUser, fbReady } = get()
        if (!fbUser) {
          if (!fbReady) toast_('firebase not connected yet')
          else { set({ modal: 'connect' }); toast_('sign in to log progress') }
          return false
        }
        return true
      }

      function persist_(mutator: (data: Data) => void) {
        set(state => {
          const data = JSON.parse(JSON.stringify(state.data)) as Data
          mutator(data)
          pushToFirebase(data).catch(() => {})
          return { data }
        })
        // Auto-save to cloud after every data mutation when signed in
        const uid = get().fbUser?.uid
        if (uid) scheduleCloudSave(uid, () => get().data)
      }

      function toast_(msg: string) {
        set({ toast: msg })
        setTimeout(() => set({ toast: null }), 2600)
      }
      // Wire cloud-save failure callback to this store's toast
      _onCloudSaveFail = toast_

      function topicQuestions(topic: string): ArenaQuestion[] {
        return [...(ARENA[topic]?.questions || []), ...(get().liveQuestions[topic] || [])]
      }

      function draftForDay(dayId: string): LogDraft {
        const days = get().data.workoutLab?.schedule.days || TOJI
        const day = days.find(d => d.id === dayId) || days[0]
        return {
          dayId: day.id,
          exercises: day.exercises.map(e => ({
            name: e.name,
            mode: e.mode,
            sets: Array.from({ length: e.sets || 3 }, () => ({ reps: e.reps || 10, weight: e.weight || 0 })),
          })),
          durationMin: 55,
        }
      }

      return {
        data: seedData(),
        tab: 'profile',
        modal: null,
        draft: freshDraft(),
        toast: null,
        activeTopic: 'webexp',
        cfTagDraft: '',
        cfPulling: false,
        liveQuestions: {},
        proofDraft: '',
        activeNode: null,
        activeQ: null,
        fbConfigDraft: '',
        fbMode: 'offline',
        fbError: null,
        nameDraft: 'operative',
        fbReady: false,
        fbUser: null,
        operatives: [],
        clans: [],
        selectedPlayer: null,
        selectedClan: null,
        mtPulling: false,
        lcPulling: false,
        ccPulling: false,
        ghPulling: false,
        cloudRestorePrompt: null,
        logDraft: null,
        editDraft: null,
        editNote: '',
        selEx: '',
        openSession: null,
        editingSessionId: null,

        setTab: (tab) => set({ tab }),
        setModal: (modal) => set({ modal }),
        closeModal: () => set({ modal: null, activeNode: null, activeQ: null, proofDraft: '' }),
        showToast: toast_,
        setActiveTopic: (activeTopic) => set({ activeTopic }),
        setCfTagDraft: (cfTagDraft) => set({ cfTagDraft }),
        setCfPulling: (cfPulling) => set({ cfPulling }),
        addLiveQuestions: (topic, qs) => set(s => ({
          liveQuestions: { ...s.liveQuestions, [topic]: [...(s.liveQuestions[topic] || []), ...qs] },
          activeTopic: 'dsa',
        })),
        setProofDraft: (proofDraft) => set({ proofDraft }),
        setActiveNode: (activeNode) => set({ activeNode }),
        setActiveQ: (activeQ) => set({ activeQ }),
        setFbConfigDraft: (fbConfigDraft) => set({ fbConfigDraft }),
        setFbMode: (fbMode, err) => set({ fbMode, fbError: err || null }),
        setNameDraft: (nameDraft) => set({ nameDraft }),
        setDraft: (fn) => set(s => ({ draft: fn(s.draft) })),
        setPalette: (p) => persist_(d => { d.palette = p }),
        setFbReady: (fbReady) => set({ fbReady }),
        setFbUser: (fbUser) => set({ fbUser }),
        setOperatives: (operatives) => set({ operatives }),
        setClans: (clans) => {
          const { data } = get()
          const myClanId = data.clanId
          const myClan = myClanId ? (clans.find(c => c.id === myClanId) ?? data.myClan) : null
          if (myClan && myClan !== data.myClan) {
            // cache clan doc in persisted data so it survives sign-out
            set(s => ({ clans, data: { ...s.data, myClan } }))
          } else {
            set({ clans })
          }
        },
        setSelectedPlayer: (selectedPlayer) => set({ selectedPlayer }),
        setSelectedClan: (selectedClan) => set({ selectedClan }),

        submitStudy: () => {
          if (!requireAuth()) return
          const { draft, data } = get()
          const title = (draft.title || '').trim()
          if (!title) { toast_('describe the work first'); return }
          const mins = Math.max(1, parseInt(String(draft.mins)) || 0)
          const sel = draft.selected
          const logDate = draft.logDate || todayKey()
          const logTs   = dateToTs(logDate)
          const skillsHit = [...new Set(sel.map(l => data.keywords.find(k => k.label === l)?.skill).filter(Boolean))] as string[]
          const gain = studyGain(mins, sel.length)
          persist_(d => {
            const per = studySkillXp(mins)
            skillsHit.forEach(s => { d.skillXp[s] = (d.skillXp[s] || 0) + per })
            sel.forEach(l => { d.kwCounts[l] = (d.kwCounts[l] || 0) + 1 })
            d.momentum += gain
            addWeekXp(d, gain)
            bumpActivity(d, mins)
            d.logs.unshift({ type: 'study', title, mins, keywords: sel, gain, date: logDate, ts: logTs })
            d.logs.sort((a, b) => b.ts - a.ts)
          })
          toast_('+' + gain + ' momentum · effort logged')
          set({ modal: null, draft: freshDraft() })
        },

        submitReading: () => {
          if (!requireAuth()) return
          const { draft, data } = get()
          const allDefs = [...BOOK_DEFS, ...(data.customDefs || [])]
          const def = allDefs.find(b => b.id === draft.book)
          if (!def) return
          const amt = Math.max(1, parseInt(String(draft.readAmount)) || 0)
          const logDate = draft.logDate || todayKey()
          const logTs   = dateToTs(logDate)
          const gain = readGain(def.unit, amt)
          persist_(d => {
            const b = d.books.find(x => x.id === draft.book)
            if (b) b.done = Math.min(def.total, b.done + amt)
            d.skillXp[def.skill] = (d.skillXp[def.skill] || 0) + 1
            d.momentum += gain
            addWeekXp(d, gain)
            bumpActivity(d, Math.round(gain * 1.4))
            d.logs.unshift({ type: 'reading', title: 'read ' + amt + ' ' + def.unit + ' · ' + def.title, mins: 0, gain, date: logDate, ts: logTs, amount: amt, unit: def.unit, bookId: def.id })
            d.logs.sort((a, b) => b.ts - a.ts)
          })
          toast_('+' + gain + ' momentum · intel absorbed')
          set({ modal: null, draft: freshDraft() })
        },

        addBook: () => {
          const { draft } = get()
          const title = (draft.nbTitle || '').trim()
          if (!title) { toast_('enter a title'); return }
          const total = Math.max(1, parseInt(draft.nbTotal) || 0) || 100
          const id = 'book_' + title.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 24) + '_' + Math.floor(Math.random() * 999)
          persist_(d => {
            d.customDefs = d.customDefs || []
            d.customDefs.push({ id, title, unit: draft.nbUnit, total, skill: draft.nbSkill })
            d.books.push({ id, done: 0 })
          })
          set(s => ({ draft: { ...s.draft, book: id, nbTitle: '', nbTotal: '' } }))
          toast_('book added')
        },

        togglePhase: (cid, idx) => {
          if (!requireAuth()) return
          const course = COURSE_DEFS.find(c => c.id === cid)
          if (!course) return
          let completed = false
          const phaseTitle = course.name + ' · ' + course.phases[idx] + ' cleared'
          persist_(d => {
            const c = d.courses.find(x => x.id === cid)
            if (!c) return
            c.done[idx] = c.done[idx] ? 0 : 1
            completed = !!c.done[idx]
            if (completed) {
              d.skillXp[course.skill] = (d.skillXp[course.skill] || 0) + 4
              d.momentum += 15
              addWeekXp(d, 15)
              bumpActivity(d, 40)
              d.logs.unshift({ type: 'course', title: phaseTitle, mins: 0, gain: 15, date: todayKey(), ts: Date.now() })
            } else {
              d.skillXp[course.skill] = Math.max(0, (d.skillXp[course.skill] || 0) - 4)
              d.momentum = Math.max(0, d.momentum - 15)
              const i = d.logs.findIndex(l => l.type === 'course' && l.title === phaseTitle)
              if (i >= 0) d.logs.splice(i, 1)
            }
          })
          if (completed) toast_('phase cleared · +15')
        },

        addKeyword: () => {
          const { draft } = get()
          const label = (draft.newKwLabel || '').trim()
          if (!label) return
          let sk = draft.newKwSkill
          persist_(d => {
            if (sk === '__new__') {
              const nm = (draft.newCatName || '').trim()
              if (!nm) return
              const id = 'cat_' + nm.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 20) + '_' + Math.floor(Math.random() * 999)
              d.extraSkills.push({ id, name: nm.toUpperCase(), base: 30 })
              d.skillXp[id] = 0
              sk = id
            }
            if (!d.keywords.find(k => k.label.toLowerCase() === label.toLowerCase())) {
              d.keywords.push({ label, skill: sk })
            }
          })
          set(s => ({ draft: { ...s.draft, selected: [...s.draft.selected, label], newKwLabel: '', newCatName: '', newKwSkill: sk === '__new__' ? 'python' : s.draft.newKwSkill } }))
          toast_('keyword added')
        },

        toggleKeyword: (label) => {
          set(s => {
            const sel = s.draft.selected.includes(label)
              ? s.draft.selected.filter(l => l !== label)
              : [...s.draft.selected, label]
            return { draft: { ...s.draft, selected: sel } }
          })
        },

        setCampaign: (key, val) => {
          persist_(d => { d.campaign[key] = val })
        },
        bumpCampaignLane: (key, delta, max) => {
          persist_(d => { d.campaign[key] = Math.max(0, Math.min(max, (d.campaign[key] || 0) + delta)) })
        },
        defeatAct: (actId) => {
          persist_(d => { d.campaignDefeated[actId] = true })
        },

        openNode: (id) => {
          const { data } = get()
          const n = nodeById(id)
          if (!n) return
          const cleared = !!(data.village[id]?.cleared)
          set({ modal: 'node', activeNode: id, proofDraft: cleared ? data.village[id].proof : '' })
        },

        clearNode: () => {
          if (!requireAuth()) return
          const { activeNode, proofDraft } = get()
          if (!activeNode) return
          const n = nodeById(activeNode)
          if (!n) return
          const proof = (proofDraft || '').trim()
          if (!proof || !/^https?:\/\//i.test(proof)) { toast_('valid proof url required'); return }
          persist_(d => {
            d.village[activeNode] = { cleared: true, proof, ts: Date.now() }
            d.skillXp[n.axis] = (d.skillXp[n.axis] || 0) + n.xp
            d.momentum += n.xp
            addWeekXp(d, n.xp)
            bumpActivity(d, n.xp)
            d.logs.unshift({ type: 'node', title: 'village · ' + n.name + ' cleared', mins: 0, gain: n.xp, date: todayKey(), ts: Date.now(), proof })
          })
          toast_('node cleared · +' + n.xp + ' xp')
          set({ modal: null, activeNode: null, proofDraft: '' })
        },

        unclearNode: () => {
          const { activeNode } = get()
          if (!activeNode) return
          const n = nodeById(activeNode)
          if (!n) return
          persist_(d => {
            delete d.village[activeNode]
            d.skillXp[n.axis] = Math.max(0, (d.skillXp[n.axis] || 0) - n.xp)
            d.momentum = Math.max(0, d.momentum - n.xp)
          })
          set({ modal: null, activeNode: null })
        },

        openQuestion: (topic, qid) => {
          const { data } = get()
          const q = topicQuestions(topic).find(x => x.id === qid)
          if (!q) return
          if (data.arena[qid]) {
            if (!requireAuth()) return
            persist_(d => { delete d.arena[qid] })
            toast_('unmarked')
            return
          }
          set({ modal: 'question', activeQ: { topic, qid }, proofDraft: '' })
        },

        solveQuestion: () => {
          if (!requireAuth()) return
          const { activeQ, proofDraft } = get()
          if (!activeQ) return
          const q = topicQuestions(activeQ.topic).find(x => x.id === activeQ.qid)
          if (!q) return
          const proof = (proofDraft || '').trim()
          if (!proof || !/^https?:\/\//i.test(proof)) { toast_('valid proof url required'); return }
          persist_(d => {
            d.arena[activeQ.qid] = { proof, ts: Date.now() }
            d.skillXp[ARENA_AXIS_MAP[activeQ.topic] || 'web'] = (d.skillXp[ARENA_AXIS_MAP[activeQ.topic] || 'web'] || 0) + Math.max(1, Math.round(q.xp / 6))
            d.momentum += q.xp
            addWeekXp(d, q.xp)
            bumpActivity(d, q.xp)
            d.logs.unshift({ type: 'arena', title: 'arena · ' + q.title, mins: 0, gain: q.xp, date: todayKey(), ts: Date.now(), proof })
          })
          toast_('solved · +' + q.xp + ' xp')
          set({ modal: null, activeQ: null, proofDraft: '' })
        },

        saveName: () => {
          const { nameDraft } = get()
          const n = (nameDraft || '').trim()
          if (!n) return
          persist_(d => { d.profile.name = n })
          toast_('name saved')
        },

        setCfHandle: (handle: string) => {
          persist_(d => { d.cf.handle = handle.trim() })
          toast_('cf handle saved')
          const uid = get().data.profile.uid
          if (uid) saveUserHandles(uid, { cf: handle.trim() }).catch(() => {})
        },

        syncCf: async () => {
          const handle = get().data.cf.handle.trim()
          if (!handle) { toast_('set a cf handle first'); return }
          set({ cfPulling: true })
          try {
            const { profile: cf, solvedIds } = await syncCfProfile(handle)
            const prevSolved = get().data.cf.solved  // null = first sync, skip XP award
            persist_(d => {
              d.cf = { ...cf, error: null }
              if (prevSolved !== null) {
                const delta = (cf.solved || 0) - prevSolved
                if (delta > 0) d.skillXp.cp = (d.skillXp.cp || 0) + delta * 0.3
              }
              // Auto-compute A2OJ counts from CF solved problem IDs
              const solvedSet = new Set(solvedIds)
              for (const def of A2OJ_DEFS) {
                const problems = A2OJ_PROBLEMS[def.id] || []
                const count = problems.filter(id => solvedSet.has(id)).length
                const existing = d.a2oj.find(x => x.id === def.id)
                if (existing) existing.solved = count
                else d.a2oj.push({ id: def.id, solved: count })
              }
              snapshotCp(d)
            })
            toast_('cf synced · ' + (cf.rating || '—') + ' rating')
          } catch (e) {
            persist_(d => { d.cf.error = 'sync failed' })
            toast_('sync failed · check handle')
          } finally {
            set({ cfPulling: false })
          }
        },

        bumpA2oj: (id: string, delta: number) => {
          const def = A2OJ_DEFS.find(d => d.id === id)
          if (!def) return
          persist_(d => {
            const entry = d.a2oj.find(x => x.id === id)
            const cur = entry ? entry.solved : 0
            const next = Math.max(0, Math.min(def.total, cur + delta))
            if (entry) entry.solved = next
            else d.a2oj.push({ id, solved: next })
            if (delta > 0) {
              d.momentum += 4
              addWeekXp(d, 4)
              bumpActivity(d, 8)
              d.skillXp.cp = (d.skillXp.cp || 0) + 0.5
              d.logs.unshift({ type: 'arena', title: 'a2oj · ' + def.name, mins: 0, gain: 4, date: todayKey(), ts: Date.now() })
              snapshotCp(d)
            }
          })
        },

        setClanId: (clanId: string | null) => {
          persist_(d => { d.clanId = clanId })
        },

        resetData: () => {
          if (!confirm('reset all progress?')) return
          const fresh = seedData()
          set({ data: fresh, draft: freshDraft(), modal: null, nameDraft: fresh.profile.name })
          toast_('reset')
        },

        applyImport: (raw: unknown) => {
          const parsed = raw as any
          if (!parsed || typeof parsed !== 'object') { toast_('INVALID FILE'); return }
          // Validate enough structure to be a real backup
          if (!parsed.profile || !Array.isArray(parsed.logs)) { toast_('NOT A VALID BACKUP'); return }
          if (!confirm('Replace ALL local data with this backup? This cannot be undone.')) return
          set({ data: parsed as Data, nameDraft: parsed.profile?.name || get().nameDraft })
          toast_('IMPORT OK')
        },

        onSignedIn: async (user: FbUser) => {
          // Only touch UI state synchronously — never touch data until after all cloud reads
          set({ fbUser: user, fbMode: 'online', nameDraft: user.name || get().data.profile.name })

          // Fetch handles + backup in parallel (both reads, no ordering dependency)
          const [remote, backup] = await Promise.all([
            loadUserHandles(user.uid),
            loadCloudBackup(user.uid),
          ])

          // Snapshot local state AFTER the awaits — rehydration from localStorage is
          // definitely complete by this point (network round-trip >> microtask)
          const local = get().data

          // Cloud restore decision — before writing anything to the store
          if (backup) {
            const cloud     = backup.data as Data
            const localLogs = local.logs?.length ?? 0
            const cloudLogs = cloud.logs?.length ?? 0
            const localMom  = local.momentum ?? 0
            const cloudMom  = cloud.momentum ?? 0
            // "Truly fresh" = no logs, no momentum, no platform handles set
            const localIsEmpty = localLogs === 0 && localMom === 0
              && !local.cf?.handle && !local.mt?.handle && !local.cc?.handle
              && !local.onboarded
            if (localIsEmpty && cloudLogs > 0) {
              set({ data: cloud })
              toast_('cloud data restored (' + cloudLogs + ' entries)')
            } else if (cloudMom > localMom + 5) {
              set({ cloudRestorePrompt: { data: cloud, savedAt: backup.savedAt } })
            }
          }

          // Update profile uid + name + merge any missing handles — single persist_ call
          // so there is one deep-clone → one write, using the final post-restore state
          persist_(d => {
            d.profile.uid = user.uid
            if (user.name && d.profile.name === 'operative') d.profile.name = user.name
            if (remote) {
              if (remote.cf && !d.cf.handle)   d.cf.handle   = remote.cf
              if (remote.mt && !d.mt.handle)   d.mt.handle   = remote.mt
              if (remote.lc && !d.lc.handle)   d.lc.handle   = remote.lc
              if (remote.cc && !d.cc.handle)     d.cc.handle   = remote.cc
            }
          })

          // Push local handles to Firestore so other devices can pick them up
          const d = get().data
          const anyHandle = d.cf.handle || d.mt.handle || d.lc.handle || d.cc.handle
          if (anyHandle) {
            saveUserHandles(user.uid, { cf: d.cf.handle, mt: d.mt.handle, lc: d.lc.handle, cc: d.cc.handle })
              .catch((e) => toast_('handle sync failed: ' + String(e).slice(0, 50)))
          }
        },

        onSignedOut: () => {
          set({ fbUser: null, fbMode: 'offline' })
          if (_cloudSaveTimer) { clearTimeout(_cloudSaveTimer); _cloudSaveTimer = null }
        },

        acceptCloudRestore: () => {
          const prompt = get().cloudRestorePrompt
          if (!prompt) return
          set({ data: prompt.data as Data, cloudRestorePrompt: null })
          toast_('data restored from cloud')
        },
        rejectCloudRestore: () => {
          const uid = get().fbUser?.uid
          set({ cloudRestorePrompt: null })
          // Overwrite cloud with current local data so this device wins
          if (uid) saveCloudBackup(uid, get().data).catch(() => {})
        },
        triggerCloudSave: () => {
          const uid = get().fbUser?.uid
          if (!uid) { toast_('sign in to save to cloud'); return }
          saveCloudBackup(uid, get().data)
            .then(() => toast_('data saved to cloud ✓'))
            .catch((e) => toast_('cloud save failed: ' + String(e).slice(0, 60)))
        },

        setMtHandle: (h) => {
          persist_(d => { d.mt.handle = h })
          const uid = get().data.profile.uid
          if (uid) saveUserHandles(uid, { mt: h }).catch(() => {})
        },
        setLcHandle: (h) => {
          persist_(d => { d.lc.handle = h })
          const uid = get().data.profile.uid
          if (uid) saveUserHandles(uid, { lc: h }).catch(() => {})
        },
        setCcHandle: (h) => {
          persist_(d => { d.cc.handle = h })
          const uid = get().data.profile.uid
          if (uid) saveUserHandles(uid, { cc: h }).catch(() => {})
        },

        syncCc: async () => {
          const handle = get().data.cc.handle.trim()
          if (!handle) { toast_('enter a codechef username'); return }
          set({ ccPulling: true })
          try {
            const result = await syncCodeChef(handle)
            persist_(d => { d.cc = { ...result, error: null }; snapshotCp(d) })
            toast_('codechef synced · ' + (result.stars ? result.stars + '★' : '—'))
          } catch (e) {
            persist_(d => { d.cc.error = String(e).replace('Error: ', '') })
            toast_('CC sync failed')
          } finally { set({ ccPulling: false }) }
        },
        setGhHandle: (h) => {
          persist_(d => { d.gh = { ...d.gh, handle: h } })
        },

        syncMt: async () => {
          const handle = get().data.mt.handle.trim()
          if (!handle) { toast_('enter a monkeytype username'); return }
          set({ mtPulling: true })
          try {
            const result = await syncMonkeytype(handle)
            const prevCompleted = get().data.mt.completed  // null = first sync
            persist_(d => {
              d.mt = { ...result, error: null }
              if (prevCompleted !== null) {
                const delta = (result.completed || 0) - prevCompleted
                if (delta > 0) {
                  const gain = Math.round(delta * 0.5)
                  d.momentum += gain
                  addWeekXp(d, gain)
                  bumpActivity(d, gain)
                  // Monkeytype feeds CRAFT (coding consistency) and LOGIC (speed)
                  d.skillXp.python = (d.skillXp.python || 0) + Math.max(1, Math.round(delta * 0.08))
                  d.skillXp.cp     = (d.skillXp.cp     || 0) + Math.max(1, Math.round(delta * 0.04))
                }
              }
            })
            toast_('mt synced · ' + (result.pb60 || '—') + ' wpm')
          } catch (e) {
            persist_(d => { d.mt.error = String(e).replace('Error: ', '') })
            toast_('MT sync failed')
          } finally { set({ mtPulling: false }) }
        },

        syncLc: async () => {
          const handle = get().data.lc.handle.trim()
          if (!handle) { toast_('enter a leetcode username'); return }
          set({ lcPulling: true })
          try {
            const result = await syncLeetCode(handle)
            persist_(d => { d.lc = { ...result, error: null }; snapshotCp(d) })
          } catch (e) {
            persist_(d => { d.lc.error = String(e).replace('Error: ', '') })
            toast_('LC sync failed')
          } finally { set({ lcPulling: false }) }
        },

        syncGh: async () => {
          const handle = get().data.gh.handle.trim()
          if (!handle) { toast_('enter a github username'); return }
          set({ ghPulling: true })
          try {
            const prevRepos = get().data.gh.public_repos  // null = first sync
            const result = await syncGithubProfile(handle)
            persist_(d => {
              d.gh = { handle, ...result, error: null }
              if (prevRepos !== null) {
                const delta = (result.public_repos || 0) - prevRepos
                if (delta > 0) d.skillXp.systems = (d.skillXp.systems || 0) + delta * 0.5
              }
            })
            toast_('github synced · ' + (result.public_repos || 0) + ' repos')
          } catch (e) {
            persist_(d => { d.gh = { ...d.gh, error: 'sync failed · check username' } })
            toast_('github sync failed')
          } finally { set({ ghPulling: false }) }
        },

        deleteClan: async (clanId: string) => {
          const { fbUser } = get()
          if (!fbUser) { toast_('not signed in'); return }
          if (!confirm('delete this clan? all members will be removed. this cannot be undone.')) return
          try {
            await fbDisbandClan(fbUser.uid, clanId)
            persist_(d => { d.clanId = null })
            toast_('clan disbanded')
          } catch (e) {
            toast_('delete failed · ' + String(e).slice(0, 50))
          }
        },

        transferClanAdmin: async (clanId: string, toUid: string) => {
          const { fbUser } = get()
          if (!fbUser) { toast_('not signed in'); return }
          try {
            await fbTransferAdmin(clanId, toUid)
            toast_('admin transferred')
          } catch (e) {
            toast_('transfer failed · ' + String(e).slice(0, 50))
          }
        },

        adoptToji: (choice: 'toji' | 'own' | 'both') => {
          persist_(d => {
            if (choice === 'toji' || choice === 'both') {
              const existingIds = new Set(d.customDefs.map(x => x.id))
              const toAdd = TOJI_BOOK_DEFS.filter(x => !existingIds.has(x.id))
              d.customDefs.push(...toAdd)
              const existingProgress = new Set(d.books.map(b => b.id))
              toAdd.forEach(x => {
                if (!existingProgress.has(x.id)) d.books.push({ id: x.id, done: 0 })
              })
            }
            d.onboarded = true
          })
          toast_(choice === 'own' ? 'building your own library' : "toji's reading list added")
        },

        closeOnboarding: () => {
          persist_(d => { d.onboarded = true })
        },

        deleteAccount: async () => {
          const { fbUser } = get()
          if (!fbUser) { toast_('not signed in'); return }
          if (!confirm('delete your account? this cannot be undone.')) return
          // Cancel any pending cloud save so it doesn't fire after auth is revoked
          if (_cloudSaveTimer) { clearTimeout(_cloudSaveTimer); _cloudSaveTimer = null }
          try {
            await fbDeleteAccount(fbUser.uid)
            const fresh = seedData()
            set({ data: fresh, fbUser: null, fbMode: 'offline', modal: null, nameDraft: fresh.profile.name })
            toast_('account deleted')
          } catch (e) {
            toast_('delete failed · ' + String(e).slice(0, 50))
          }
        },

        // --- Workout Lab ---

        openLog: () => {
          const wl = get().data.workoutLab
          const days = wl?.schedule.days || TOJI
          const sessions = wl?.sessions || []
          const suggestedId = days[sessions.length % days.length].id
          set({ modal: 'log', logDraft: draftForDay(suggestedId), openSession: null, editingSessionId: null })
        },

        openEdit: () => {
          const days = get().data.workoutLab?.schedule.days || TOJI
          set({ modal: 'edit', editDraft: JSON.parse(JSON.stringify(days)), editNote: '' })
        },

        openEditSession: (id) => {
          const s = get().data.workoutLab?.sessions.find(x => x.id === id)
          if (!s) return
          set({ modal: 'log', logDraft: { dayId: s.dayId, exercises: s.exercises.map(e => ({ ...e, sets: e.sets.map(st => ({ ...st })) })), durationMin: s.durationMin }, editingSessionId: id, openSession: null })
        },

        pickDay: (dayId) => {
          set({ logDraft: draftForDay(dayId) })
        },

        addLogEx: () => {
          set(s => {
            if (!s.logDraft) return {}
            const blank: SessionExercise = { name: '', mode: 'kg/hand', sets: [{ reps: 10, weight: 0 }] }
            return { logDraft: { ...s.logDraft, exercises: [...s.logDraft.exercises, blank] } }
          })
        },

        removeLogEx: (idx) => {
          set(s => {
            if (!s.logDraft) return {}
            const exercises = s.logDraft.exercises.filter((_, i) => i !== idx)
            const blank: SessionExercise = { name: '', mode: 'kg/hand', sets: [{ reps: 10, weight: 0 }] }
            return { logDraft: { ...s.logDraft, exercises: exercises.length ? exercises : [blank] } }
          })
        },

        updateLogEx: (idx, field, value) => {
          set(s => {
            if (!s.logDraft) return {}
            const exercises = s.logDraft.exercises.map((e, i) => i === idx ? { ...e, [field]: value } : e)
            return { logDraft: { ...s.logDraft, exercises } }
          })
        },

        addLogSet: (exIdx) => {
          set(s => {
            if (!s.logDraft) return {}
            const exercises = s.logDraft.exercises.map((e, i) => {
              if (i !== exIdx) return e
              const last = e.sets[e.sets.length - 1] || { reps: 10, weight: 0 }
              return { ...e, sets: [...e.sets, { ...last }] }
            })
            return { logDraft: { ...s.logDraft, exercises } }
          })
        },

        removeLogSet: (exIdx, setIdx) => {
          set(s => {
            if (!s.logDraft) return {}
            const exercises = s.logDraft.exercises.map((e, i) => {
              if (i !== exIdx) return e
              const sets = e.sets.filter((_, si) => si !== setIdx)
              return { ...e, sets: sets.length ? sets : [{ reps: 10, weight: 0 }] }
            })
            return { logDraft: { ...s.logDraft, exercises } }
          })
        },

        updateLogSet: (exIdx, setIdx, field, value) => {
          set(s => {
            if (!s.logDraft) return {}
            const exercises = s.logDraft.exercises.map((e, i) => {
              if (i !== exIdx) return e
              const sets = e.sets.map((st, si) => si === setIdx ? { ...st, [field]: value } : st)
              return { ...e, sets }
            })
            return { logDraft: { ...s.logDraft, exercises } }
          })
        },

        setLogDuration: (v) => {
          set(s => s.logDraft ? { logDraft: { ...s.logDraft, durationMin: v } } : {})
        },
        setLogDate: (d: string) => {
          set(s => s.logDraft ? { logDraft: { ...s.logDraft, logDate: d } } : {})
        },

        submitSession: () => {
          const { logDraft, data, editingSessionId } = get()
          if (!logDraft) return
          const exs: SessionExercise[] = logDraft.exercises
            .filter(e => (e.name || '').trim())
            .map(e => ({
              name: (e.name as string).trim(),
              mode: e.mode,
              sets: e.sets.map(s => ({ reps: s.reps || 0, weight: s.weight || 0 })).filter(s => s.reps > 0 || s.weight > 0),
            }))
            .filter(e => e.sets.length > 0)
          if (!exs.length) { get().showToast('add at least one exercise'); return }

          const days = data.workoutLab?.schedule.days || TOJI
          const day = days.find(d => d.id === logDraft.dayId) || days[0]
          const m = computeSession(exs)

          if (editingSessionId) {
            const existingSess = data.workoutLab?.sessions.find(x => x.id === editingSessionId)
            if (!existingSess) { get().showToast('session not found'); return }
            const updated: WorkoutSession = { ...existingSess, exercises: exs, durationMin: logDraft.durationMin, volume: m.volume, totalReps: m.totalReps, totalSets: m.totalSets }
            persist_(d => {
              if (!d.workoutLab) return
              const idx = d.workoutLab.sessions.findIndex(x => x.id === editingSessionId)
              if (idx >= 0) d.workoutLab.sessions[idx] = updated
            })
            get().showToast('session updated')
            set({ modal: null, logDraft: null, editingSessionId: null })
            return
          }

          const before = computePBs(data.workoutLab?.sessions || []).best
          let prCount = 0
          exs.forEach(e => {
            const orm = est1rm(e)
            if (orm && (!before[e.name] || orm > before[e.name].orm + 0.01)) prCount++
          })
          const wLogDate = logDraft.logDate || todayKey()
          const wLogTs   = dateToTs(wLogDate)
          const sess: WorkoutSession = {
            id: 's' + wLogTs, ts: wLogTs, date: wLogDate,
            dayId: logDraft.dayId, dayName: day.name, muscle: day.muscle,
            exercises: exs, durationMin: logDraft.durationMin,
            volume: m.volume, totalReps: m.totalReps, totalSets: m.totalSets,
          }
          const gain = 8 + exs.length * 3
          persist_(d => {
            if (!d.workoutLab) d.workoutLab = seedWorkoutData()
            d.workoutLab.sessions.push(sess)
            d.workoutLab.sessions.sort((a, b) => b.ts - a.ts)
            d.momentum += gain
            addWeekXp(d, gain)
            bumpActivity(d, gain * 2)
            d.skillXp.physique = (d.skillXp.physique || 0) + Math.max(1, Math.round(gain * 0.4))
            d.logs.unshift({ type: 'workout', title: 'workout · ' + day.name, mins: logDraft.durationMin, gain, date: wLogDate, ts: wLogTs })
            d.logs.sort((a, b) => b.ts - a.ts)
          })
          const msg = prCount ? `session logged · ★ ${prCount} new pr${prCount > 1 ? 's' : ''}!` : `session logged · ${m.volume}kg moved`
          get().showToast(msg)
          set({ modal: null, logDraft: null, selEx: exs[0]?.name || get().selEx, editingSessionId: null })
        },

        saveSchedule: () => {
          const { editDraft, editNote } = get()
          if (!editDraft) return
          const days = editDraft
            .map(d => ({
              id: d.id || 'd' + Math.random().toString(36).slice(2, 7),
              name: (d.name || 'Day').trim(),
              muscle: (d.muscle || '—').trim(),
              exercises: d.exercises.filter(e => (e.name || '').trim()).map(e => ({
                name: (e.name as string).trim(),
                sets: parseInt(String(e.sets)) || 0,
                reps: parseInt(String(e.reps)) || 0,
                weight: parseFloat(String(e.weight)) || 0,
                mode: e.mode,
              })),
            }))
          if (!days.length) { get().showToast('need at least one day'); return }
          const note = (editNote || '').trim() || 'updated schedule'
          persist_(d => {
            if (!d.workoutLab) d.workoutLab = seedWorkoutData()
            const v = d.workoutLab.schedule.version + 1
            d.workoutLab.schedule = { version: v, updatedAt: Date.now(), days }
            d.workoutLab.history.unshift({ version: v, note, ts: Date.now() })
          })
          const nextV = (get().data.workoutLab?.schedule.version || 1)
          get().showToast(`schedule saved · v${nextV}`)
          set({ modal: null, editDraft: null })
        },

        setSelEx: (name) => set({ selEx: name }),
        toggleSession: (id) => set(s => ({ openSession: s.openSession === id ? null : id })),
        setEditNote: (note) => set({ editNote: note }),

        updateEditDay: (di, field, value) => {
          set(s => {
            if (!s.editDraft) return {}
            return { editDraft: s.editDraft.map((d, i) => i === di ? { ...d, [field]: value } : d) }
          })
        },

        updateEditEx: (di, ei, field, value) => {
          set(s => {
            if (!s.editDraft) return {}
            return {
              editDraft: s.editDraft.map((d, i) => i !== di ? d : {
                ...d, exercises: d.exercises.map((e, j) => j === ei ? { ...e, [field]: value } : e)
              })
            }
          })
        },

        addEditEx: (di) => {
          set(s => {
            if (!s.editDraft) return {}
            return {
              editDraft: s.editDraft.map((d, i) => i === di ? {
                ...d, exercises: [...d.exercises, { name: '', sets: 3, reps: 10, weight: 0, mode: 'kg/hand' as const }]
              } : d)
            }
          })
        },

        removeEditEx: (di, ei) => {
          set(s => {
            if (!s.editDraft) return {}
            return {
              editDraft: s.editDraft.map((d, i) => i === di ? {
                ...d, exercises: d.exercises.filter((_, j) => j !== ei)
              } : d)
            }
          })
        },

        removeEditDay: (di) => {
          set(s => s.editDraft ? { editDraft: s.editDraft.filter((_, i) => i !== di) } : {})
        },

        addEditDay: () => {
          set(s => s.editDraft ? {
            editDraft: [...s.editDraft, { id: 'd' + Date.now(), name: 'new day', muscle: '—', exercises: [{ name: '', sets: 3, reps: 10, weight: 0, mode: 'kg/hand' as const }] }]
          } : {})
        },
      }
    },
    {
      name: 'prepclash_v2',
      partialize: (state) => ({ data: state.data }),
      onRehydrateStorage: () => (state) => {
        if (state?.data) {
          if (!state.data.campaign)         state.data.campaign         = {}
          if (!state.data.campaignDefeated) state.data.campaignDefeated = {}
          if (!state.data.gh)               state.data.gh = { handle: '', public_repos: null, followers: null, lastSync: null, error: null }
          // Migrate ccHandle string → cc object
          const anyState = state.data as any
          if (!state.data.cc) {
            state.data.cc = { handle: anyState.ccHandle || '', rating: null, maxRating: null, stars: null, rank: '', solved: null, lastSync: null, error: null }
          }
          delete anyState.ccHandle
          if (!state.data.cpHistory) state.data.cpHistory = []
          // Auto-mark onboarded for returning users who already have meaningful data
          // Prevents the welcome modal re-appearing after sign-out/sign-in cycles
          if (!state.data.onboarded) {
            const d = state.data
            const hasMeaningfulData = !!(d.cf.handle) || d.momentum > 0 || d.logs.length > 0 ||
              (d.a2oj || []).some((x: any) => x.solved > 0) || d.cf.rating != null ||
              d.lc?.solved != null || d.cc?.rating != null
            if (hasMeaningfulData) state.data.onboarded = true
          }
          // Seed an initial snapshot if the user has data but no history yet
          if (state.data.cpHistory.length === 0) {
            const d = state.data
            const cfRating = d.cf.rating
            const cfSolved = d.cf.solved
            const lcSolved = d.lc?.solved ?? null
            const ccRating = d.cc?.rating ?? null
            const a2ojTot  = d.a2oj.reduce((s, x) => s + (x.solved || 0), 0)
            if (cfRating || cfSolved || lcSolved || ccRating || a2ojTot > 0) {
              const cfPart = cfRating ? Math.min(30, Math.max(0, (cfRating - 600) / 73)) : 0
              const cfSolP = Math.min(15, (cfSolved || 0) / 13.3)
              const a2p    = Math.min(15, a2ojTot / 18.4)
              const lcP    = Math.min(20, (lcSolved || 0) / 15)
              const ccP    = ccRating && ccRating >= 1400 ? Math.min(10, (ccRating - 1400) / 60) : 0
              const effP   = Math.min(9, Math.round(Math.sqrt(d.skillXp.cp || 0) * 1.5))
              const score  = Math.min(99, Math.round(cfPart + cfSolP + a2p + lcP + ccP + effP))
              state.data.cpHistory = [{ ts: Date.now() - 86400_000, cfRating, cfSolved, lcSolved, ccRating, a2ojTotal: a2ojTot, score }]
            }
          }
          // Migrate old skillXp values from score-format (0-99) to XP-format
          // Old format stored display score directly; new formula uses sqrt(xp)*4
          // Multiply by 60 so old score S maps to new score ≈ S: sqrt(S*60)*4 ≈ S
          if (!(state.data as any)._skillXpV2) {
            const effort = ['python','systems','network','web','exploit'] as const
            effort.forEach(id => {
              const v = state.data.skillXp[id] || 0
              if (v > 0 && v <= 99) state.data.skillXp[id] = Math.round(v * 7)
            })
            ;(state.data as any)._skillXpV2 = true
          }
          // Remove seeded dummy sessions (generated by genSeed() — now replaced by empty list)
          if (state.data.workoutLab?.sessions) {
            state.data.workoutLab.sessions = state.data.workoutLab.sessions.filter(
              (s: WorkoutSession) => !String(s.id).startsWith('seed')
            )
          }
          // Migrate old session exercises (flat format) to per-set format
          if (state.data.workoutLab?.sessions) {
            state.data.workoutLab.sessions = state.data.workoutLab.sessions.map((sess: WorkoutSession) => ({
              ...sess,
              exercises: sess.exercises.map((e: any) => {
                if (Array.isArray(e.sets)) return e as SessionExercise
                const old = e as { name: string; mode: string; sets: number; reps: number; weight: number }
                return {
                  name: old.name,
                  mode: old.mode || 'kg/hand',
                  sets: Array.from({ length: old.sets || 1 }, () => ({ reps: old.reps || 0, weight: old.weight || 0 })),
                } as SessionExercise
              }),
            }))
          }
        }
      },
    }
  )
)
