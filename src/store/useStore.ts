import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Data, Draft, ModalType, Palette, PublicOperative, ClanDoc, FbUser, SchedExercise, ScheduleDay, WorkoutSession } from '../types'
import { SKILL_DEFS, DEFAULT_KEYWORDS, COURSE_DEFS, BOOK_DEFS } from '../data/skills'
import { todayKey, addWeekXp, bumpActivity } from '../lib/dates'
import { studyGain, studySkillXp, readGain } from '../lib/momentum'
import { flatNodes, nodeById } from '../data/village'
import { ARENA, ARENA_AXIS_MAP } from '../data/arena'
import { pushToFirebase } from '../lib/firebase'
import { seedWorkoutData, TOJI } from '../data/workoutTemplate'
import { computeSession, computePBs, est1rm } from '../lib/workoutStats'
import type { ArenaQuestion } from '../data/arena'

function freshDraft(): Draft {
  return {
    title: '', mins: 30, selected: [], newKwLabel: '', newKwSkill: 'python', newCatName: '',
    book: 'wahh', readAmount: 10, nbTitle: '', nbUnit: 'pages', nbTotal: '', nbSkill: 'web',
  }
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
    arena: {},
    weekly: {},
    palette: 'toxic',
    activity: {},
    kwCounts: {},
    clanId: null,
    workoutLab: seedWorkoutData(),
  }
}

type LogDraft = { dayId: string; exercises: SchedExercise[]; durationMin: number }

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
  openNode: (id: string) => void
  clearNode: () => void
  unclearNode: () => void
  openQuestion: (topic: string, qid: string) => void
  solveQuestion: () => void
  saveName: () => void
  setCfHandle: (handle: string) => void
  setClanId: (clanId: string | null) => void
  resetData: () => void
  onSignedIn: (user: FbUser) => void
  onSignedOut: () => void

  // Workout Lab actions
  openLog: () => void
  openEdit: () => void
  pickDay: (dayId: string) => void
  addLogEx: () => void
  removeLogEx: (idx: number) => void
  updateLogEx: (idx: number, field: string, value: string | number) => void
  setLogDuration: (v: number) => void
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
      }

      function toast_(msg: string) {
        set({ toast: msg })
        setTimeout(() => set({ toast: null }), 2600)
      }

      function topicQuestions(topic: string): ArenaQuestion[] {
        return [...(ARENA[topic]?.questions || []), ...(get().liveQuestions[topic] || [])]
      }

      function draftForDay(dayId: string): LogDraft {
        const days = get().data.workoutLab?.schedule.days || TOJI
        const day = days.find(d => d.id === dayId) || days[0]
        return { dayId: day.id, exercises: day.exercises.map(e => ({ ...e })), durationMin: 55 }
      }

      return {
        data: seedData(),
        tab: 'home',
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
        logDraft: null,
        editDraft: null,
        editNote: '',
        selEx: '',
        openSession: null,

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
        setClans: (clans) => set({ clans }),
        setSelectedPlayer: (selectedPlayer) => set({ selectedPlayer }),
        setSelectedClan: (selectedClan) => set({ selectedClan }),

        submitStudy: () => {
          if (!requireAuth()) return
          const { draft, data } = get()
          const title = (draft.title || '').trim()
          if (!title) { toast_('describe the work first'); return }
          const mins = Math.max(1, parseInt(String(draft.mins)) || 0)
          const sel = draft.selected
          const skillsHit = [...new Set(sel.map(l => data.keywords.find(k => k.label === l)?.skill).filter(Boolean))] as string[]
          const gain = studyGain(mins, sel.length)
          persist_(d => {
            const per = studySkillXp(mins)
            skillsHit.forEach(s => { d.skillXp[s] = (d.skillXp[s] || 0) + per })
            sel.forEach(l => { d.kwCounts[l] = (d.kwCounts[l] || 0) + 1 })
            d.momentum += gain
            addWeekXp(d, gain)
            bumpActivity(d, mins)
            d.logs.unshift({ type: 'study', title, mins, keywords: sel, gain, date: todayKey(), ts: Date.now() })
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
          const gain = readGain(def.unit, amt)
          persist_(d => {
            const b = d.books.find(x => x.id === draft.book)
            if (b) b.done = Math.min(def.total, b.done + amt)
            d.skillXp[def.skill] = (d.skillXp[def.skill] || 0) + 1
            d.momentum += gain
            addWeekXp(d, gain)
            bumpActivity(d, Math.round(gain * 1.4))
            d.logs.unshift({ type: 'reading', title: 'read ' + amt + ' ' + def.unit + ' · ' + def.title, mins: 0, gain, date: todayKey(), ts: Date.now() })
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
              d.logs.unshift({ type: 'course', title: course.name + ' · ' + course.phases[idx] + ' cleared', mins: 0, gain: 15, date: todayKey(), ts: Date.now() })
            } else {
              d.skillXp[course.skill] = Math.max(0, (d.skillXp[course.skill] || 0) - 4)
              d.momentum = Math.max(0, d.momentum - 15)
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

        onSignedIn: (user: FbUser) => {
          set({ fbUser: user, fbMode: 'online', nameDraft: user.name || get().data.profile.name })
          persist_(d => {
            d.profile.uid = user.uid
            if (user.name && d.profile.name === 'operative') d.profile.name = user.name
          })
        },

        onSignedOut: () => {
          set({ fbUser: null, fbMode: 'offline' })
        },

        // --- Workout Lab ---

        openLog: () => {
          const wl = get().data.workoutLab
          const days = wl?.schedule.days || TOJI
          const sessions = wl?.sessions || []
          const suggestedId = days[sessions.length % days.length].id
          set({ modal: 'log', logDraft: draftForDay(suggestedId), openSession: null })
        },

        openEdit: () => {
          const days = get().data.workoutLab?.schedule.days || TOJI
          set({ modal: 'edit', editDraft: JSON.parse(JSON.stringify(days)), editNote: '' })
        },

        pickDay: (dayId) => {
          set({ logDraft: draftForDay(dayId) })
        },

        addLogEx: () => {
          set(s => {
            if (!s.logDraft) return {}
            return { logDraft: { ...s.logDraft, exercises: [...s.logDraft.exercises, { name: '', sets: 3, reps: 10, weight: 0, mode: 'kg/hand' as const }] } }
          })
        },

        removeLogEx: (idx) => {
          set(s => {
            if (!s.logDraft) return {}
            const exercises = s.logDraft.exercises.filter((_, i) => i !== idx)
            return { logDraft: { ...s.logDraft, exercises: exercises.length ? exercises : [{ name: '', sets: 3, reps: 10, weight: 0, mode: 'kg/hand' as const }] } }
          })
        },

        updateLogEx: (idx, field, value) => {
          set(s => {
            if (!s.logDraft) return {}
            const exercises = s.logDraft.exercises.map((e, i) => i === idx ? { ...e, [field]: value } : e)
            return { logDraft: { ...s.logDraft, exercises } }
          })
        },

        setLogDuration: (v) => {
          set(s => s.logDraft ? { logDraft: { ...s.logDraft, durationMin: v } } : {})
        },

        submitSession: () => {
          const { logDraft, data } = get()
          if (!logDraft) return
          const exs: SchedExercise[] = logDraft.exercises
            .filter(e => (e.name || '').trim())
            .map(e => ({
              name: (e.name as string).trim(),
              sets: parseInt(String(e.sets)) || 0,
              reps: parseInt(String(e.reps)) || 0,
              weight: parseFloat(String(e.weight)) || 0,
              mode: e.mode,
            }))
          if (!exs.length) { get().showToast('add at least one exercise'); return }

          const days = data.workoutLab?.schedule.days || TOJI
          const day = days.find(d => d.id === logDraft.dayId) || days[0]
          const m = computeSession(exs)
          const before = computePBs(data.workoutLab?.sessions || []).best
          let prCount = 0
          exs.forEach(e => {
            const orm = est1rm(e)
            if (orm && (!before[e.name] || orm > before[e.name].orm + 0.01)) prCount++
          })

          const sess: WorkoutSession = {
            id: 's' + Date.now(), ts: Date.now(), date: todayKey(),
            dayId: logDraft.dayId, dayName: day.name, muscle: day.muscle,
            exercises: exs, durationMin: logDraft.durationMin,
            volume: m.volume, totalReps: m.totalReps, totalSets: m.totalSets,
          }
          const gain = 8 + exs.length * 3
          persist_(d => {
            if (!d.workoutLab) d.workoutLab = seedWorkoutData()
            d.workoutLab.sessions.push(sess)
            d.momentum += gain
            addWeekXp(d, gain)
            bumpActivity(d, gain * 2)
            d.logs.unshift({ type: 'workout', title: 'workout · ' + day.name, mins: logDraft.durationMin, gain, date: todayKey(), ts: Date.now() })
          })
          const msg = prCount ? `session logged · ★ ${prCount} new pr${prCount > 1 ? 's' : ''}!` : `session logged · ${m.volume}kg moved`
          get().showToast(msg)
          set({ modal: null, logDraft: null, selEx: exs[0]?.name || get().selEx })
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
    }
  )
)
