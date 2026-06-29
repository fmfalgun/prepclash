export interface VillageNode {
  id: string
  name: string
  desc: string
  axis: string
  xp: number
  req: string[]
}

export interface VillageTier {
  tier: string
  nodes: VillageNode[]
}

export const VILLAGE: VillageTier[] = [
  { tier: 'TIER 0 · FOUNDATIONS', nodes: [
    { id: 'linux',    name: 'Linux Fundamentals', desc: 'Shell, permissions, processes, filesystems.',          axis: 'systems', xp: 20, req: [] },
    { id: 'net101',   name: 'Networking 101',      desc: 'OSI, TCP/IP, routing, subnetting.',                   axis: 'network', xp: 20, req: [] },
    { id: 'pyscript', name: 'Python Scripting',    desc: 'Automation, sockets, requests, argparse.',            axis: 'python',  xp: 20, req: [] },
  ]},
  { tier: 'TIER 1 · RECON & BASICS', nodes: [
    { id: 'recon',    name: 'Recon & OSINT',    desc: 'Passive + active recon, enumeration, asset discovery.', axis: 'network', xp: 30, req: ['linux','net101'] },
    { id: 'webbasic', name: 'Web Fundamentals', desc: 'HTTP, cookies, sessions, same-origin, headers.',        axis: 'web',     xp: 30, req: ['net101'] },
    { id: 'tooling',  name: 'Bash & Tooling',   desc: 'Build your own recon tooling and pipelines.',           axis: 'systems', xp: 30, req: ['linux','pyscript'] },
  ]},
  { tier: 'TIER 2 · OFFENSE', nodes: [
    { id: 'webexp', name: 'Web Exploitation', desc: 'XSS, SQLi, SSRF, IDOR, auth bypass.',           axis: 'web',     xp: 45, req: ['webbasic','recon'] },
    { id: 'netatk', name: 'Network Attacks',  desc: 'MITM, pivoting, service exploitation.',         axis: 'network', xp: 45, req: ['recon'] },
    { id: 'crypto', name: 'Crypto & PKI',     desc: 'TLS, X.509, padding oracles, hashing attacks.', axis: 'web',     xp: 40, req: ['net101'] },
    { id: 'dsa',    name: 'DSA / Algorithms', desc: 'Interview-grade data structures & algorithms.', axis: 'cp',      xp: 45, req: ['pyscript'] },
  ]},
  { tier: 'TIER 3 · ESCALATION', nodes: [
    { id: 'privesc', name: 'Privilege Escalation', desc: 'Linux/Windows local priv-esc, kernel & misconfig.', axis: 'exploit', xp: 55, req: ['webexp'] },
    { id: 'adatk',   name: 'Active Directory',     desc: 'Kerberoasting, lateral movement, BloodHound.',      axis: 'network', xp: 55, req: ['netatk'] },
    { id: 'expdev',  name: 'Exploit Development',  desc: 'Stack/heap overflows, ROP, shellcode.',             axis: 'exploit', xp: 60, req: ['tooling'] },
  ]},
  { tier: 'TIER 4 · RED TEAM OPS', nodes: [
    { id: 'c2',     name: 'C2 Infrastructure', desc: 'Redirectors, beacons, OPSEC-safe infra.',                      axis: 'systems', xp: 65, req: ['privesc'] },
    { id: 'evasion',name: 'Evasion & AV/EDR',  desc: 'Obfuscation, AMSI bypass, EDR evasion.',                      axis: 'exploit', xp: 65, req: ['expdev'] },
    { id: 'redops', name: 'Full Red Team Op',  desc: 'End-to-end engagement: initial access → exfil → report.', axis: 'web',     xp: 80, req: ['adatk','c2'] },
  ]},
]

export function flatNodes() {
  const out: VillageNode[] = []
  VILLAGE.forEach(t => t.nodes.forEach(n => out.push(n)))
  return out
}

export function nodeById(id: string) {
  return flatNodes().find(n => n.id === id)
}
