import type { Data } from '../types'
import { SKILL_DEFS, BOOK_DEFS } from '../data/skills'
import { rankFor, gradeFor } from '../lib/grades'
import { weekXpNow, computeStreak, todayKey } from '../lib/dates'
import { PALETTES } from '../data/palettes'

export function allSkills(data: Data) {
  return [...SKILL_DEFS, ...data.extraSkills]
}

export function allBookDefs(data: Data) {
  return [...BOOK_DEFS, ...(data.customDefs || [])]
}

export function a2ojTotal(data: Data) {
  return data.a2oj.reduce((x, l) => x + (l.solved || 0), 0)
}

// Dampened XP → score curve: slow to max, resistant to single-session spikes
// ~104 hrs of focused study to reach 99; each hour adds less as you grow
function xpToScore(xp: number): number {
  return Math.min(99, Math.round(Math.sqrt(Math.max(0, xp)) * 4))
}

// LOGIC (cp): composite of CF + A2OJ + LeetCode + CodeChef + small effort bonus
// Max breakdown: CF rating 30 + CF solved 15 + A2OJ 15 + LC solved 20 + CC rating 10 + effort 9 = 99
export function cpScore(data: Data): number {
  const cf = data.cf
  // CF rating — max 30 at Grandmaster (2800+), starts contributing at 600
  const cfPart     = cf.rating ? Math.min(30, Math.max(0, (cf.rating - 600) / 73)) : 0
  // CF solved — max 15 at 200+ problems
  const cfSolved   = Math.min(15, (cf.solved || 0) / 13.3)
  // A2OJ ladders — max 15 at all 276 solved
  const a2ojPart   = Math.min(15, a2ojTotal(data) / 18.4)
  // LeetCode solved — max 20 at 300+ problems
  const lcPart     = Math.min(20, (data.lc?.solved || 0) / 15)
  // CodeChef rating — max 10 at 2000+ (5★), starts at 1400
  const ccRating   = data.cc?.rating || 0
  const ccPart     = ccRating >= 1400 ? Math.min(10, (ccRating - 1400) / 60) : 0
  // Effort accumulator (XP from study/practice) — max 9
  const effortPart = Math.min(9, Math.round(Math.sqrt(data.skillXp.cp || 0) * 1.5))
  return Math.min(99, Math.round(cfPart + cfSolved + a2ojPart + lcPart + ccPart + effortPart))
}

// PHYSIQUE: based on actual workout history + streak — decays without use
export function physiqueScore(data: Data): number {
  const sessions = data.workoutLab?.sessions || []
  const now = Date.now()
  const cutoff30 = now - 30 * 86400000

  const recent = sessions.filter(s => s.ts >= cutoff30)
  const totalVol = sessions.reduce((a, s) => a + s.volume, 0)

  // Long-term volume (sqrt-dampened, max 45)
  const volPart  = Math.min(45, Math.round(Math.sqrt(totalVol / 80)))
  // Recent frequency last 30 days — max 35 at 12+ sessions/month
  const freqPart = Math.min(35, recent.length * 3)
  // Daily streak bonus — max 19
  const strPart  = Math.min(19, computeStreak(data) * 2)

  return Math.min(99, volPart + freqPart + strPart)
}

// General effort-based axes: sqrt-dampened accumulation
export function skillScore(data: Data, id: string): number {
  if (id === 'cp')       return cpScore(data)
  if (id === 'physique') return physiqueScore(data)
  return xpToScore(data.skillXp[id] || 0)
}

export function overallScore(data: Data): number {
  const skills = allSkills(data)
  return skills.reduce((a, s) => a + skillScore(data, s.id), 0) / skills.length
}

export function level(data: Data): number {
  return Math.floor(data.momentum / 150) + 1
}

export function rank(data: Data): string {
  return rankFor(overallScore(data))
}

export function overallGrade(data: Data): string {
  return gradeFor(overallScore(data))
}

export function consistencyPct(data: Data): number {
  return Math.min(100, Math.round((weekXpNow(data) / 200) * 100))
}

export function consistencyGrade(data: Data): string {
  return gradeFor(consistencyPct(data))
}

export function streak(data: Data): number {
  return computeStreak(data)
}

export function todayGain(data: Data): number {
  const today = todayKey()
  return data.logs.filter(l => l.date === today).reduce((a, l) => a + (l.gain || 0), 0)
}

export function paletteCss(data: Data) {
  return PALETTES[data.palette] || PALETTES.toxic
}

export function clanEligibility(data: Data): { eligible: boolean; score: number; needed: number } {
  const activeDays = Object.values(data.activity).filter(v => (v as number) > 0).length
  const score = Math.round(data.momentum * 0.15 + data.logs.length * 3 + activeDays * 5)
  return { eligible: score >= 100, score, needed: 100 }
}

export function isNodeCleared(data: Data, id: string): boolean {
  return !!(data.village[id]?.cleared)
}

export function isNodeUnlocked(data: Data, req: string[]): boolean {
  return req.every(r => isNodeCleared(data, r))
}

export function currentNodeName(data: Data): string {
  const tiers = [
    { nodes: [{ id:'linux',req:[] },{ id:'net101',req:[] },{ id:'pyscript',req:[] }] },
    { nodes: [{ id:'recon',req:['linux','net101'] },{ id:'webbasic',req:['net101'] },{ id:'tooling',req:['linux','pyscript'] }] },
    { nodes: [{ id:'webexp',req:['webbasic','recon'] },{ id:'netatk',req:['recon'] },{ id:'crypto',req:['net101'] },{ id:'dsa',req:['pyscript'] }] },
    { nodes: [{ id:'privesc',req:['webexp'] },{ id:'adatk',req:['netatk'] },{ id:'expdev',req:['tooling'] }] },
    { nodes: [{ id:'c2',req:['privesc'] },{ id:'evasion',req:['expdev'] },{ id:'redops',req:['adatk','c2'] }] },
  ]
  for (const t of tiers) {
    for (const n of t.nodes) {
      if (n.req.every(r => isNodeCleared(data, r)) && !isNodeCleared(data, n.id)) {
        const names: Record<string, string> = { linux:'Linux Fundamentals',net101:'Networking 101',pyscript:'Python Scripting',recon:'Recon & OSINT',webbasic:'Web Fundamentals',tooling:'Bash & Tooling',webexp:'Web Exploitation',netatk:'Network Attacks',crypto:'Crypto & PKI',dsa:'DSA / Algorithms',privesc:'Privilege Escalation',adatk:'Active Directory',expdev:'Exploit Development',c2:'C2 Infrastructure',evasion:'Evasion & AV/EDR',redops:'Full Red Team Op' }
        return names[n.id] || n.id
      }
    }
  }
  return 'Red Team Op'
}
