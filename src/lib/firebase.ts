import type { Data, ClanMember } from '../types'
import { rankFor } from './grades'
import { flatNodes } from '../data/village'
import { AVATAR_COLORS } from '../data/palettes'

export const FB_KEY = 'prepclash_fb_config'

// Embedded default config from the existing Firebase project.
// Firebase web API keys are inherently public — they're rate-limited by security rules.
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

export function loadFbConfigRaw(): string {
  try {
    return localStorage.getItem(FB_KEY) || JSON.stringify(DEFAULT_FB_CONFIG)
  } catch { return JSON.stringify(DEFAULT_FB_CONFIG) }
}

export function loadFbConfig(): Record<string, string> | null {
  try {
    const raw = loadFbConfigRaw()
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

export function saveFbConfigRaw(raw: string) {
  try { localStorage.setItem(FB_KEY, raw) } catch {}
}

export type FbMode = 'offline' | 'online' | 'error'

export async function initFirebase(
  onMode: (mode: FbMode, err?: string) => void,
  onUser: (uid: string | null, name: string | null) => void,
  onClan: (members: ClanMember[]) => void,
): Promise<void> {
  const cfg = loadFbConfig()
  if (!cfg) { onMode('offline'); return }
  try {
    const [appMod, authMod, fsMod] = await Promise.all([
      import('https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js' as string),
      import('https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js' as string),
      import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js' as string),
    ]) as [Record<string, unknown>, Record<string, unknown>, Record<string, unknown>]

    // Avoid re-initializing if the app already exists
    let app: unknown
    try {
      app = (appMod.initializeApp as (cfg: unknown) => unknown)(cfg)
    } catch {
      app = (appMod.getApp as () => unknown)()
    }
    const auth = (authMod.getAuth as (app: unknown) => unknown)(app)
    const db   = (fsMod.getFirestore as (app: unknown) => unknown)(app)

    fb = { auth, db, authMod, fsMod }
    onMode('online')

    ;(authMod.onAuthStateChanged as (auth: unknown, cb: (u: unknown) => void) => void)(auth, (u: unknown) => {
      if (u) {
        const user = u as { uid: string; displayName?: string }
        onUser(user.uid, user.displayName || null)
        subscribeClan(onClan)
      } else {
        onUser(null, null)
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
  await (signInWithPopup as (auth: unknown, prov: unknown) => Promise<unknown>)(fb.auth, prov)
}

function currentNodeName(data: Data): string {
  const nodes = flatNodes()
  for (const n of nodes) {
    if (n.req.every(r => data.village[r]?.cleared) && !data.village[n.id]?.cleared) return n.name
  }
  return 'Red Team Op'
}

function overallScore(data: Data): number {
  const ids = Object.keys(data.skillXp)
  if (!ids.length) return 35
  const sum = ids.reduce((a, id) => {
    const def = [{ id:'python',base:64},{id:'systems',base:70},{id:'network',base:52},{id:'web',base:55},{id:'exploit',base:38},{id:'cp',base:35},{id:'physique',base:46}].find(s=>s.id===id)
    return a + Math.min(99, (def?.base ?? 30) + (data.skillXp[id] || 0))
  }, 0)
  return sum / ids.length
}

export async function pushToFirebase(data: Data): Promise<void> {
  if (!fb || !data.profile.uid) return
  try {
    const { doc, setDoc } = fb.fsMod as Record<string, unknown>
    await (setDoc as (ref: unknown, d: unknown, opts: unknown) => Promise<void>)(
      (doc as (db: unknown, col: string, id: string) => unknown)(fb.db, 'operatives', data.profile.uid),
      { name: data.profile.name, momentum: data.momentum, rank: rankFor(overallScore(data)), node: currentNodeName(data), updatedAt: Date.now() },
      { merge: true }
    )
  } catch {}
}

let clanUnsub: (() => void) | null = null

export function subscribeClan(onClan: (members: ClanMember[]) => void): void {
  if (!fb) return
  try {
    const { collection, onSnapshot } = fb.fsMod as Record<string, unknown>
    if (clanUnsub) clanUnsub()
    clanUnsub = (onSnapshot as (ref: unknown, cb: (snap: unknown) => void) => () => void)(
      (collection as (db: unknown, name: string) => unknown)(fb.db, 'operatives'),
      (snap: unknown) => {
        const s = snap as { forEach: (cb: (d: { data: () => ClanMember }) => void) => void }
        const live: ClanMember[] = []
        s.forEach(d => {
          const m = d.data()
          if (m && typeof m === 'object') live.push({
            name: (m as { name?: string }).name || 'UNKNOWN',
            momentum: (m as { momentum?: number }).momentum || 0,
            rank: (m as { rank?: string }).rank || 'E',
            node: (m as { node?: string }).node || '—',
            color: AVATAR_COLORS[live.length % AVATAR_COLORS.length],
            initials: ((m as { name?: string }).name || 'OP').replace(/[^A-Za-z0-9]/g, '').slice(0, 2).toUpperCase(),
          })
        })
        if (live.length) onClan(live)
      }
    )
  } catch {}
}
