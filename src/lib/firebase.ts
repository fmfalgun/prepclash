import type { Data, ClanMember, PublicOperative, ClanDoc, FbUser } from '../types'
import { rankFor } from './grades'
import { flatNodes } from '../data/village'
import { AVATAR_COLORS } from '../data/palettes'
import { SKILL_DEFS, COURSE_DEFS } from '../data/skills'

export const FB_KEY = 'prepclash_fb_config'

const DEFAULT_FB_CONFIG = {
  apiKey: 'AIzaSyC4LLupF2uFCxfqOsy0GkHzwdaO3SlWnvE',
  authDomain: 'prepclash-51f1a.firebaseapp.com',
  projectId: 'prepclash-51f1a',
  storageBucket: 'prepclash-51f1a.firebasestorage.app',
  messagingSenderId: '740326157509',
  appId: '1:740326157509:web:5d3539a5bed1cb635614ac',
  measurementId: 'G-2EVBFNKL0J',
}

let fb: {
  auth: unknown
  db: unknown
  authMod: Record<string, unknown>
  fsMod: Record<string, unknown>
} | null = null

export type FbMode = 'offline' | 'online' | 'error'

export function loadFbConfig(): Record<string, string> {
  try {
    const raw = localStorage.getItem(FB_KEY)
    return raw ? JSON.parse(raw) : DEFAULT_FB_CONFIG
  } catch { return DEFAULT_FB_CONFIG }
}

export function saveFbConfigRaw(raw: string) {
  try { localStorage.setItem(FB_KEY, raw) } catch {}
}

// --- Init ---

export async function initFirebase(
  onMode: (mode: FbMode, err?: string) => void,
  onUser: (user: FbUser | null) => void,
  onClan: (members: ClanMember[]) => void,
): Promise<void> {
  const cfg = loadFbConfig()
  try {
    const [appMod, authMod, fsMod] = await Promise.all([
      import('https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js' as string),
      import('https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js' as string),
      import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js' as string),
    ]) as [Record<string, unknown>, Record<string, unknown>, Record<string, unknown>]

    let app: unknown
    try {
      app = (appMod.initializeApp as (c: unknown) => unknown)(cfg)
    } catch {
      app = (appMod.getApp as () => unknown)()
    }

    const auth = (authMod.getAuth as (a: unknown) => unknown)(app)
    const db   = (fsMod.getFirestore as (a: unknown) => unknown)(app)
    fb = { auth, db, authMod, fsMod }
    onMode('online')

    ;(authMod.onAuthStateChanged as (auth: unknown, cb: (u: unknown) => void) => void)(auth, (u: unknown) => {
      if (u) {
        const user = u as { uid: string; displayName: string | null; email: string | null; photoURL: string | null }
        onUser({ uid: user.uid, name: user.displayName, email: user.email, photoURL: user.photoURL })
        subscribeClan(onClan)
      } else {
        onUser(null)
      }
    })
  } catch (e) {
    fb = null
    onMode('error', (e as Error)?.message || 'init failed')
  }
}

export async function signInWithGoogle(): Promise<void> {
  if (!fb) throw new Error('Firebase not initialized')
  const { signInWithPopup, GoogleAuthProvider } = fb.authMod as Record<string, unknown>
  const prov = new (GoogleAuthProvider as new () => unknown)()
  await (signInWithPopup as (auth: unknown, p: unknown) => Promise<unknown>)(fb.auth, prov)
}

export async function signOut(): Promise<void> {
  if (!fb) return
  const { signOut: so } = fb.authMod as Record<string, unknown>
  await (so as (auth: unknown) => Promise<void>)(fb.auth)
}

export async function deleteAccount(uid: string): Promise<void> {
  if (!fb) throw new Error('Not connected')
  const { doc, deleteDoc } = fb.fsMod as Record<string, unknown>
  const docFn = doc as (db: unknown, col: string, id: string) => unknown
  const delFn = deleteDoc as (ref: unknown) => Promise<void>
  // Delete all user Firestore docs in parallel before revoking auth
  await Promise.allSettled([
    delFn(docFn(fb.db, 'operatives', uid)),
    delFn(docFn(fb.db, 'userProfiles', uid)),
  ])
  const { deleteUser, getAuth } = fb.authMod as Record<string, unknown>
  const user = (getAuth as (a?: unknown) => { currentUser: unknown })(fb.auth).currentUser
  if (user) {
    try {
      await (deleteUser as (u: unknown) => Promise<void>)(user)
    } catch {
      // if re-auth required, just sign out instead
      const { signOut: so } = fb.authMod as Record<string, unknown>
      await (so as (auth: unknown) => Promise<void>)(fb.auth)
    }
  }
}

// --- Public data queries ---

let opsUnsub: (() => void) | null = null
let clansUnsub: (() => void) | null = null

export function subscribeOperatives(onData: (ops: PublicOperative[]) => void): () => void {
  if (!fb) return () => {}
  try {
    const { collection, onSnapshot, orderBy, query } = fb.fsMod as Record<string, unknown>
    if (opsUnsub) opsUnsub()
    const q = (query as (ref: unknown, ...constraints: unknown[]) => unknown)(
      (collection as (db: unknown, name: string) => unknown)(fb.db, 'operatives'),
      (orderBy as (field: string, dir: string) => unknown)('momentum', 'desc'),
    )
    opsUnsub = (onSnapshot as (ref: unknown, cb: (snap: unknown) => void) => () => void)(q, (snap: unknown) => {
      const s = snap as { docs: { id: string; data: () => unknown }[] }
      const ops: PublicOperative[] = s.docs.map(d => {
        const raw = d.data() as Record<string, unknown>
        return { uid: d.id, ...(raw as Omit<PublicOperative, 'uid'>) }
      })
      onData(ops)
    })
    return () => { if (opsUnsub) { opsUnsub(); opsUnsub = null } }
  } catch { return () => {} }
}

export function subscribeClans(onData: (clans: ClanDoc[]) => void): () => void {
  if (!fb) return () => {}
  try {
    const { collection, onSnapshot } = fb.fsMod as Record<string, unknown>
    if (clansUnsub) clansUnsub()
    clansUnsub = (onSnapshot as (ref: unknown, cb: (snap: unknown) => void) => () => void)(
      (collection as (db: unknown, name: string) => unknown)(fb.db, 'clans'),
      (snap: unknown) => {
        const s = snap as { docs: { id: string; data: () => unknown }[] }
        const clans: ClanDoc[] = s.docs
          .map(d => ({ id: d.id, ...(d.data() as Omit<ClanDoc, 'id'>) }))
          .filter((c: ClanDoc & { disbanded?: boolean }) => !c.disbanded)
        onData(clans)
      }
    )
    return () => { if (clansUnsub) { clansUnsub(); clansUnsub = null } }
  } catch { return () => {} }
}

export async function joinClan(uid: string, clanId: string, currentClanId?: string | null): Promise<void> {
  if (!fb) throw new Error('Not connected')
  if (currentClanId) throw new Error('Already in a clan — leave first')
  const { doc, updateDoc, increment } = fb.fsMod as Record<string, unknown>
  await (updateDoc as (ref: unknown, d: unknown) => Promise<void>)(
    (doc as (db: unknown, col: string, id: string) => unknown)(fb.db, 'operatives', uid),
    { clanId }
  )
  await (updateDoc as (ref: unknown, d: unknown) => Promise<void>)(
    (doc as (db: unknown, col: string, id: string) => unknown)(fb.db, 'clans', clanId),
    { memberCount: (increment as (n: number) => unknown)(1) }
  )
}

export async function createClan(uid: string, name: string, tag: string, description: string): Promise<string> {
  if (!fb) throw new Error('Not connected')
  const { doc, setDoc, updateDoc } = fb.fsMod as Record<string, unknown>
  const clanId = name.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 20) + '_' + Math.floor(Math.random() * 9999)
  await (setDoc as (ref: unknown, d: unknown) => Promise<void>)(
    (doc as (db: unknown, col: string, id: string) => unknown)(fb.db, 'clans', clanId),
    { name, tag, description, founderUid: uid, memberCount: 1, createdAt: Date.now() }
  )
  await (updateDoc as (ref: unknown, d: unknown) => Promise<void>)(
    (doc as (db: unknown, col: string, id: string) => unknown)(fb.db, 'operatives', uid),
    { clanId }
  )
  return clanId
}

export async function leaveClan(uid: string, clanId: string): Promise<void> {
  if (!fb) throw new Error('Not connected')
  const { doc, updateDoc, increment } = fb.fsMod as Record<string, unknown>
  await (updateDoc as (ref: unknown, d: unknown) => Promise<void>)(
    (doc as (db: unknown, col: string, id: string) => unknown)(fb.db, 'operatives', uid),
    { clanId: null }
  )
  await (updateDoc as (ref: unknown, d: unknown) => Promise<void>)(
    (doc as (db: unknown, col: string, id: string) => unknown)(fb.db, 'clans', clanId),
    { memberCount: (increment as (n: number) => unknown)(-1) }
  )
}

export async function deleteClan(uid: string, clanId: string): Promise<void> {
  if (!fb) throw new Error('Not connected')
  const { doc, deleteDoc, updateDoc } = fb.fsMod as Record<string, unknown>
  // delete the clan doc
  await (deleteDoc as (ref: unknown) => Promise<void>)(
    (doc as (db: unknown, col: string, id: string) => unknown)(fb.db, 'clans', clanId)
  )
  // clear founder's clanId
  await (updateDoc as (ref: unknown, d: unknown) => Promise<void>)(
    (doc as (db: unknown, col: string, id: string) => unknown)(fb.db, 'operatives', uid),
    { clanId: null }
  )
}

export async function transferClanAdmin(clanId: string, newFounderUid: string): Promise<void> {
  if (!fb) throw new Error('Not connected')
  const { doc, updateDoc } = fb.fsMod as Record<string, unknown>
  await (updateDoc as (ref: unknown, d: unknown) => Promise<void>)(
    (doc as (db: unknown, col: string, id: string) => unknown)(fb.db, 'clans', clanId),
    { founderUid: newFounderUid }
  )
}

function subscribeClan(onClan: (members: ClanMember[]) => void): void {
  if (!fb) return
  try {
    const { collection, onSnapshot } = fb.fsMod as Record<string, unknown>
    ;(onSnapshot as (ref: unknown, cb: (snap: unknown) => void) => () => void)(
      (collection as (db: unknown, name: string) => unknown)(fb.db, 'operatives'),
      (snap: unknown) => {
        const s = snap as { docs: { id: string; data: () => unknown }[] }
        const members: ClanMember[] = s.docs.map((d, i) => {
          const m = d.data() as Record<string, unknown>
          return {
            name: String(m.name || 'UNKNOWN'),
            momentum: Number(m.momentum || 0),
            rank: String(m.rank || 'E'),
            node: currentNodeNameFromVillage((m.village as Record<string, unknown>) || {}),
            color: AVATAR_COLORS[i % AVATAR_COLORS.length],
            initials: String(m.name || 'OP').replace(/[^A-Za-z0-9]/g, '').slice(0, 2).toUpperCase(),
          }
        })
        if (members.length) onClan(members)
      }
    )
  } catch {}
}

// --- Push full operative data ---

function localOverallScore(skillXp: Record<string, number>): number {
  const all = [...SKILL_DEFS]
  const sum = all.reduce((a, s) => a + Math.min(99, skillXp[s.id] || 0), 0)
  return sum / all.length
}

function localStreak(activity: Record<string, number>): number {
  let streak = 0
  const today = new Date()
  for (let i = 0; i < 365; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    const k = d.toISOString().slice(0, 10)
    if ((activity[k] || 0) > 0) streak++
    else if (i > 0) break
  }
  return streak
}

function localWeekXp(weekly: Record<string, number>): number {
  const now = new Date()
  const dayOfWeek = (now.getDay() + 6) % 7
  const monday = new Date(now)
  monday.setDate(now.getDate() - dayOfWeek)
  const key = monday.toISOString().slice(0, 10)
  return weekly[key] || 0
}

export async function pushToFirebase(data: Data): Promise<void> {
  if (!fb || !data.profile.uid) return
  try {
    const { doc, setDoc } = fb.fsMod as Record<string, unknown>
    const score = localOverallScore(data.skillXp)

    // Strip proofs from village/arena for public storage
    const village: Record<string, { cleared: boolean; ts: number }> = {}
    for (const [k, v] of Object.entries(data.village)) {
      village[k] = { cleared: v.cleared, ts: v.ts }
    }
    const arena: Record<string, { ts: number }> = {}
    for (const [k, v] of Object.entries(data.arena)) {
      arena[k] = { ts: v.ts }
    }

    const payload: Omit<PublicOperative, 'uid'> = {
      name: data.profile.name,
      handle: data.profile.handle || '',
      palette: data.palette,
      momentum: data.momentum,
      rank: rankFor(score),
      overallScore: Math.round(score),
      streak: localStreak(data.activity),
      weekXp: localWeekXp(data.weekly),
      clanId: data.clanId || null,
      skillXp: data.skillXp,
      village,
      arena,
      cf: {
        handle: data.cf.handle,
        rating: data.cf.rating,
        rank: data.cf.rank,
        solved: data.cf.solved,
      },
      mt: data.mt.handle ? { handle: data.mt.handle, pb60: data.mt.pb60 ?? null } : null,
      gh: data.gh?.handle ? { handle: data.gh.handle, public_repos: data.gh.public_repos ?? null } : null,
      cc: data.cc?.handle ? { handle: data.cc.handle, rating: data.cc.rating ?? null, stars: data.cc.stars ?? null } : null,
      currentTarget: (() => {
        const inProgress = COURSE_DEFS.find(c => {
          const st = data.courses.find(x => x.id === c.id)
          if (!st) return false
          const done = st.done.filter(Boolean).length
          return done > 0 && done < c.phases.length
        })
        return inProgress?.name || null
      })(),
      weekWorkout: (() => {
        const cutoff = Date.now() - 7 * 86400000
        const sessions = (data.workoutLab?.sessions || []).filter(s => s.ts >= cutoff)
        if (!sessions.length) return null
        return { sessions: sessions.length, volume: Math.round(sessions.reduce((a, s) => a + s.volume, 0)) }
      })(),
      recentActivity: data.logs.slice(0, 5).map(l => ({ type: l.type, title: l.title, ts: l.ts })),
      lastSeen: Date.now(),
    }

    await (setDoc as (ref: unknown, d: unknown, opts: unknown) => Promise<void>)(
      (doc as (db: unknown, col: string, id: string) => unknown)(fb.db, 'operatives', data.profile.uid),
      payload,
      { merge: true }
    )
  } catch {}
}

export async function saveUserHandles(uid: string, handles: { cf?: string; mt?: string; lc?: string; cc?: string }): Promise<void> {
  if (!fb) return
  const { doc, setDoc } = fb.fsMod as Record<string, unknown>
  await (setDoc as (ref: unknown, d: unknown, opts: unknown) => Promise<void>)(
    (doc as (db: unknown, col: string, id: string) => unknown)(fb.db, 'userProfiles', uid),
    { handles, updatedAt: Date.now() },
    { merge: true }
  )
  // No catch — caller is responsible for handling failures visibly
}

export async function loadUserHandles(uid: string): Promise<{ cf?: string; mt?: string; lc?: string; cc?: string } | null> {
  if (!fb) return null
  try {
    const { doc, getDoc } = fb.fsMod as Record<string, unknown>
    const snap = await (getDoc as (ref: unknown) => Promise<{ exists: () => boolean; data: () => unknown }>)(
      (doc as (db: unknown, col: string, id: string) => unknown)(fb.db, 'userProfiles', uid)
    )
    if (!snap.exists()) return null
    const d = snap.data() as { handles?: { cf?: string; mt?: string; lc?: string; cc?: string } }
    return d.handles || null
  } catch { return null }
}

function currentNodeNameFromVillage(village: Record<string, unknown>): string {
  const order = ['linux','net101','pyscript','recon','webbasic','tooling','webexp','netatk','crypto','dsa','privesc','adatk','expdev','c2','evasion','redops']
  const names: Record<string, string> = {
    linux:'Linux Fundamentals',net101:'Networking 101',pyscript:'Python Scripting',
    recon:'Recon & OSINT',webbasic:'Web Fundamentals',tooling:'Bash & Tooling',
    webexp:'Web Exploitation',netatk:'Network Attacks',crypto:'Crypto & PKI',
    dsa:'DSA / Algorithms',privesc:'Privilege Escalation',adatk:'Active Directory',
    expdev:'Exploit Development',c2:'C2 Infrastructure',evasion:'Evasion & AV/EDR',
    redops:'Full Red Team Op',
  }
  const nodes = flatNodes()
  for (const n of nodes) {
    const cleared = (village[n.id] as { cleared?: boolean } | undefined)?.cleared
    if (!cleared && n.req.every(r => (village[r] as { cleared?: boolean } | undefined)?.cleared)) {
      return names[n.id] || n.id
    }
  }
  return 'Red Team Op'
}

// Cloud backup — stored in userProfiles/{uid} (same collection as handles, confirmed writable)
export async function saveCloudBackup(uid: string, data: unknown): Promise<void> {
  if (!fb) throw new Error('Not connected')
  const payload = JSON.stringify(data)
  // Firestore document limit is 1MB; leave some headroom for field overhead
  if (payload.length > 900_000) {
    throw new Error(`backup too large (${Math.round(payload.length / 1024)}KB > 900KB) — your log history may be too long`)
  }
  const { doc, setDoc } = fb.fsMod as Record<string, unknown>
  await (setDoc as (ref: unknown, d: unknown, opts: unknown) => Promise<void>)(
    (doc as (db: unknown, col: string, id: string) => unknown)(fb.db, 'userProfiles', uid),
    { backup: payload, savedAt: Date.now() },
    { merge: true }
  )
}

export async function loadCloudBackup(uid: string): Promise<{ data: unknown; savedAt: number } | null> {
  if (!fb) return null
  try {
    const { doc, getDoc } = fb.fsMod as Record<string, unknown>
    const snap = await (getDoc as (ref: unknown) => Promise<{ exists: () => boolean; data: () => unknown }>)(
      (doc as (db: unknown, col: string, id: string) => unknown)(fb.db, 'userProfiles', uid)
    )
    if (!snap.exists()) return null
    const d = snap.data() as { backup?: string; savedAt?: number }
    if (!d.backup || !d.savedAt) return null
    return { data: JSON.parse(d.backup), savedAt: d.savedAt }
  } catch { return null }
}

// Fix clan deletion: mark as disbanded (avoids needing Firestore delete permissions)
export async function disbandClan(uid: string, clanId: string): Promise<void> {
  if (!fb) throw new Error('Not connected')
  const { doc, updateDoc, deleteDoc } = fb.fsMod as Record<string, unknown>
  try {
    // Attempt hard delete first (works if rules allow it)
    await (deleteDoc as (ref: unknown) => Promise<void>)(
      (doc as (db: unknown, col: string, id: string) => unknown)(fb.db, 'clans', clanId)
    )
  } catch {
    // Fall back to soft-delete if rules don't allow delete
    await (updateDoc as (ref: unknown, d: unknown) => Promise<void>)(
      (doc as (db: unknown, col: string, id: string) => unknown)(fb.db, 'clans', clanId),
      { disbanded: true, founderUid: '', memberCount: 0 }
    )
  }
  await (updateDoc as (ref: unknown, d: unknown) => Promise<void>)(
    (doc as (db: unknown, col: string, id: string) => unknown)(fb.db, 'operatives', uid),
    { clanId: null }
  )
}
