import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Data, Draft, ModalType, ClanMember, Palette } from '../types'
import { SKILL_DEFS, DEFAULT_KEYWORDS, COURSE_DEFS, BOOK_DEFS } from '../data/skills'
import { seedActivity, seedWorkouts } from '../data/mock'
import { todayKey, weekKey, addWeekXp, bumpActivity } from '../lib/dates'
import { studyGain, studySkillXp, workoutGain, readGain, fmtWeight } from '../lib/momentum'
import { UNIT_PT } from '../data/skills'
import { flatNodes, nodeById } from '../data/village'
import { ARENA, ARENA_AXIS_MAP } from '../data/arena'
import { pushToFirebase } from '../lib/firebase'
import type { ArenaQuestion } from '../data/arena'

function blankEx() {
  return { name: '', sets: '4', reps: '10', weight: '7.5', mode: 'kg/hand' }
}

function freshDraft(): Draft {
  return {
    title: '', mins: 30, selected: [], newKwLabel: '', newKwSkill: 'python', newCatName: '',
    sessionName: '', exercises: [blankEx(), blankEx(), blankEx()],
    book: 'wahh', readAmount: 10, nbTitle: '', nbUnit: 'pages', nbTotal: '', nbSkill: 'web',
  }
}

function seedData(): Data {
  const skillXp: Record<string, number> = {}
  SKILL_DEFS.forEach(s => { skillXp[s.id] = 0 })
  return {
    profile: { name: 'TOJI', handle: '@fmfalgun', uid: null },
    skillXp,
    keywords: DEFAULT_KEYWORDS.map(([label, skill]) => ({ label, skill })),
    extraSkills: [],
    courses: COURSE_DEFS.map(c => ({ id: c.id, done: [...c.done] })),
    books: BOOK_DEFS.map(b => ({ id: b.id, done: b.done })),
    customDefs: [],
    logs: [],
    momentum: 0,
    workouts: seedWorkouts(),
    cf: { handle: 'fmfalgun', rating: null, maxRating: null, rank: '', solved: null, contests: null, lastSync: null, error: null },
    a2oj: [{ id: 'r1400', solved: 23 }, { id: 'div2b', solved: 41 }, { id: 'r1300', solved: 67 }],
    village: {},
    arena: {},
    weekly: {},
    palette: 'toxic',
    activity: seedActivity(),
    kwCounts: {},
  }
}

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
  clan: ClanMember[]
  liveClan: ClanMember[] | null

  // Setters
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
  setLiveClan: (members: ClanMember[]) => void
  setDraft: (fn: (d: Draft) => Draft) => void
  setPalette: (p: Palette) => void

  // Game actions
  submitStudy: () => void
  submitWorkout: () => void
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
  resetData: () => void
  updateFromFirebase: (uid: string, name: string | null) => void
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => {
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
        const base = (ARENA[topic]?.questions) || []
        const live = get().liveQuestions[topic] || []
        return [...base, ...live]
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
        nameDraft: 'TOJI',
        clan: [],
        liveClan: null,

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
        setLiveClan: (liveClan) => set({ liveClan }),
        setDraft: (fn) => set(s => ({ draft: fn(s.draft) })),
        setPalette: (p) => persist_(d => { d.palette = p }),

        submitStudy: () => {
          const { draft, data } = get()
          const title = (draft.title || '').trim()
          if (!title) { toast_('DESCRIBE THE WORK FIRST'); return }
          const mins = Math.max(1, parseInt(String(draft.mins)) || 0)
          const sel = draft.selected
          const skillsHit = [...new Set(sel.map(l => {
            const kw = data.keywords.find(k => k.label === l)
            return kw ? kw.skill : null
          }).filter(Boolean))] as string[]
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
          toast_('+' + gain + ' MOMENTUM · EFFORT LOGGED')
          set({ modal: null, draft: freshDraft() })
        },

        submitWorkout: () => {
          const { draft } = get()
          const ex = draft.exercises.filter(e => (e.name || '').trim())
          if (!ex.length) { toast_('ADD AT LEAST ONE EXERCISE'); return }
          const name = (draft.sessionName || '').trim() || 'Session'
          const gain = workoutGain(ex.length)
          const rows = ex.map(e => ({ name: e.name.trim(), sr: (e.sets || '?') + '×' + (e.reps || '?'), weight: fmtWeight(e) }))
          persist_(d => {
            d.skillXp.physique = (d.skillXp.physique || 0) + Math.max(2, ex.length)
            d.momentum += gain
            addWeekXp(d, gain)
            bumpActivity(d, ex.length * 8 + 10)
            d.workouts.unshift({ date: todayKey(), name, exercises: rows })
            d.logs.unshift({ type: 'workout', title: 'Toji split — ' + name + ' · ' + ex.length + ' exercises', mins: 0, gain, date: todayKey(), ts: Date.now() })
          })
          toast_('+' + gain + ' MOMENTUM · TRAIN HARD')
          set({ modal: null, draft: freshDraft() })
        },

        submitReading: () => {
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
            d.logs.unshift({ type: 'reading', title: 'Read ' + amt + ' ' + def.unit + ' · ' + def.title, mins: 0, gain, date: todayKey(), ts: Date.now() })
          })
          toast_('+' + gain + ' MOMENTUM · INTEL ABSORBED')
          set({ modal: null, draft: freshDraft() })
        },

        addBook: () => {
          const { draft } = get()
          const title = (draft.nbTitle || '').trim()
          if (!title) { toast_('ENTER A TITLE'); return }
          const total = Math.max(1, parseInt(draft.nbTotal) || 0) || 100
          const id = 'book_' + title.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 24) + '_' + Math.floor(Math.random() * 999)
          persist_(d => {
            d.customDefs = d.customDefs || []
            d.customDefs.push({ id, title, unit: draft.nbUnit, total, skill: draft.nbSkill })
            d.books.push({ id, done: 0 })
          })
          set(s => ({ draft: { ...s.draft, book: id, nbTitle: '', nbTotal: '' } }))
          toast_('BOOK ADDED')
        },

        togglePhase: (cid, idx) => {
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
          if (completed) toast_('PHASE CLEARED · +15')
        },

        addKeyword: () => {
          const { draft, data } = get()
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
          set(s => ({ draft: { ...s.draft, selected: [...s.draft.selected, label], newKwLabel: '', newCatName: '', newKwSkill: draft.newKwSkill === '__new__' ? 'python' : draft.newKwSkill } }))
          toast_('KEYWORD ADDED')
          void data // suppress unused warning
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
          const proof = cleared ? data.village[id].proof : ''
          set({ modal: 'node', activeNode: id, proofDraft: proof || '' })
        },

        clearNode: () => {
          const { activeNode, proofDraft } = get()
          if (!activeNode) return
          const n = nodeById(activeNode)
          if (!n) return
          const proof = (proofDraft || '').trim()
          if (!proof || !/^https?:\/\//i.test(proof)) { toast_('VALID PROOF URL REQUIRED'); return }
          persist_(d => {
            d.village[activeNode] = { cleared: true, proof, ts: Date.now() }
            d.skillXp[n.axis] = (d.skillXp[n.axis] || 0) + n.xp
            d.momentum += n.xp
            addWeekXp(d, n.xp)
            bumpActivity(d, n.xp)
            d.logs.unshift({ type: 'node', title: 'VILLAGE · ' + n.name + ' cleared', mins: 0, gain: n.xp, date: todayKey(), ts: Date.now(), proof })
          })
          toast_('NODE CLEARED · +' + n.xp + ' XP')
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
          const solved = data.arena[qid]
          if (solved) {
            persist_(d => { delete d.arena[qid] })
            toast_('UNMARKED')
            return
          }
          set({ modal: 'question', activeQ: { topic, qid }, proofDraft: '' })
        },

        solveQuestion: () => {
          const { activeQ, proofDraft } = get()
          if (!activeQ) return
          const q = topicQuestions(activeQ.topic).find(x => x.id === activeQ.qid)
          if (!q) return
          const proof = (proofDraft || '').trim()
          if (!proof || !/^https?:\/\//i.test(proof)) { toast_('VALID PROOF URL REQUIRED'); return }
          const axis = ARENA_AXIS_MAP[activeQ.topic] || 'web'
          persist_(d => {
            d.arena[activeQ.qid] = { proof, ts: Date.now() }
            d.skillXp[axis] = (d.skillXp[axis] || 0) + Math.max(1, Math.round(q.xp / 6))
            d.momentum += q.xp
            addWeekXp(d, q.xp)
            bumpActivity(d, q.xp)
            d.logs.unshift({ type: 'arena', title: 'ARENA · ' + q.title, mins: 0, gain: q.xp, date: todayKey(), ts: Date.now(), proof })
          })
          toast_('SOLVED · +' + q.xp + ' XP')
          set({ modal: null, activeQ: null, proofDraft: '' })
        },

        saveName: () => {
          const { nameDraft } = get()
          const n = (nameDraft || '').trim()
          if (!n) return
          persist_(d => { d.profile.name = n })
          toast_('NAME SAVED')
        },

        resetData: () => {
          if (!confirm('Reset all progress to seeded state?')) return
          const fresh = seedData()
          set({ data: fresh, draft: freshDraft(), modal: null, nameDraft: fresh.profile.name })
          toast_('RESET')
        },

        updateFromFirebase: (uid, name) => {
          persist_(d => {
            d.profile.uid = uid
            if (name) d.profile.name = name
          })
          set(s => ({ nameDraft: name || s.data.profile.name }))
        },
      }
    },
    {
      name: 'prepclash_v2',
      partialize: (state) => ({ data: state.data }),
    }
  )
)
