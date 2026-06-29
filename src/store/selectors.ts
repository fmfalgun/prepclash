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

export function cpScore(data: Data): number {
  const cf = data.cf
  let cfPart = 0
  if (cf.rating) cfPart = Math.max(0, Math.min(55, (cf.rating - 700) / 15))
  const ladderPart = Math.min(25, a2ojTotal(data) * 0.12)
  return Math.min(99, Math.round(35 + cfPart + ladderPart + (data.skillXp.cp || 0)))
}

export function skillScore(data: Data, id: string): number {
  if (id === 'cp') return cpScore(data)
  const all = [...SKILL_DEFS, ...data.extraSkills]
  const def = all.find(s => s.id === id)
  const base = def ? def.base : 30
  return Math.min(99, Math.round(base + (data.skillXp[id] || 0)))
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

export function isNodeCleared(data: Data, id: string): boolean {
  return !!(data.village[id]?.cleared)
}

export function isNodeUnlocked(data: Data, req: string[]): boolean {
  return req.every(r => isNodeCleared(data, r))
}

export function currentNodeName(data: Data): string {
  // imported inline to avoid circular dep
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
        // find name from VILLAGE would cause circular; inline short names
        const names: Record<string, string> = { linux:'Linux Fundamentals',net101:'Networking 101',pyscript:'Python Scripting',recon:'Recon & OSINT',webbasic:'Web Fundamentals',tooling:'Bash & Tooling',webexp:'Web Exploitation',netatk:'Network Attacks',crypto:'Crypto & PKI',dsa:'DSA / Algorithms',privesc:'Privilege Escalation',adatk:'Active Directory',expdev:'Exploit Development',c2:'C2 Infrastructure',evasion:'Evasion & AV/EDR',redops:'Full Red Team Op' }
        return names[n.id] || n.id
      }
    }
  }
  return 'Red Team Op'
}
