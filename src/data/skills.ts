export const SKILL_DEFS = [
  { id: 'physique', name: 'PHYSIQUE', base: 0 },
  { id: 'cp',       name: 'LOGIC',   base: 0 },
  { id: 'python',   name: 'CRAFT',   base: 0 },
  { id: 'systems',  name: 'BUILD',   base: 0 },
  { id: 'network',  name: 'RECON',   base: 0 },
  { id: 'web',      name: 'CONTROL', base: 0 },
  { id: 'exploit',  name: 'ATTACK',  base: 0 },
] as const

export type SkillId = typeof SKILL_DEFS[number]['id']

export const DEFAULT_KEYWORDS: [string, string][] = [
  ['asyncio','python'],['FastAPI','python'],['concurrency','python'],['API design','python'],
  ['Bash','systems'],['systemd','systems'],['packaging','systems'],['SQLite','systems'],['Linux','systems'],
  ['DNS','network'],['TCP/IP','network'],['BGP/ASN','network'],['port scanning','network'],['recon','network'],
  ['TLS/PKI','web'],['X.509','web'],['SPF/DMARC','web'],['XSS','web'],['SQLi','web'],['HTTP','web'],
  ['fuzzing','exploit'],['reverse-eng','exploit'],['exploit-dev','exploit'],['CVE research','exploit'],
  ['algorithms','cp'],['data structures','cp'],['dynamic prog','cp'],['graphs','cp'],
]

export const COURSE_DEFS = [
  { id: 'ble',  name: 'BLE MONITOR',   tag: 'SYSTEMS',   skill: 'systems', phases: ['BASH','SQLITE','BLE','SYSD','DEB'],    done: [1,1,1,1,1] },
  { id: 'web',  name: 'WEB VAPT',      tag: 'WEB / DNS', skill: 'web',     phases: ['DNS','X.509','TLS','SPF','HUB'],        done: [1,1,1,0,0] },
  { id: 'iot',  name: 'IOT RECON',     tag: 'NETWORK',   skill: 'network', phases: ['ASYNC','ASN','TUI','CACHE'],            done: [1,1,0,0] },
  { id: 'port', name: 'PORT ANALYZER', tag: 'INTEL API', skill: 'python',  phases: ['FASTAPI','CACHE','CI/CD','SRC'],        done: [1,0,0,0] },
  { id: 'folio',name: 'PORTFOLIO',     tag: 'FRONTEND',  skill: 'web',     phases: ['HTML/CSS','MVC','ASYNC','SHIP'],        done: [0,0,0,0] },
]

export const BOOK_DEFS = [
  { id: 'wahh',    title: "Web App Hacker's Handbook 2e", skill: 'web',     unit: 'pages',    total: 912, done: 180 },
  { id: 'weidman', title: 'Penetration Testing (Weidman)', skill: 'exploit', unit: 'pages',    total: 531, done: 95  },
  { id: 'thp2',    title: 'The Hacker Playbook 2',         skill: 'web',     unit: 'chapters', total: 12,  done: 4   },
  { id: 'rwbh',    title: 'Real-World Bug Hunting',        skill: 'web',     unit: 'chapters', total: 19,  done: 3   },
  { id: 'rtfm',    title: 'Red Team Field Manual',         skill: 'systems', unit: 'sections', total: 9,   done: 2   },
]

export const UNIT_PT: Record<string, number> = {
  pages: 0.4, chapters: 8, sections: 5, questions: 2.5,
}
