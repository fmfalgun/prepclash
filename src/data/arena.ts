export interface ArenaQuestion {
  id: string
  title: string
  diff: 'EASY' | 'MED' | 'HARD'
  xp: number
  url: string
  live?: boolean
}

export interface ArenaTopic {
  name: string
  questions: ArenaQuestion[]
}

export const ARENA: Record<string, ArenaTopic> = {
  webexp: { name: 'Web Exploitation', questions: [
    { id: 'we1', title: 'Find & exploit a reflected XSS (DOM sink)',   diff: 'EASY', xp: 8,  url: 'https://portswigger.net/web-security/cross-site-scripting' },
    { id: 'we2', title: 'Blind SQLi → full DB dump (time-based)',      diff: 'MED',  xp: 14, url: 'https://portswigger.net/web-security/sql-injection' },
    { id: 'we3', title: 'SSRF to internal metadata endpoint',          diff: 'MED',  xp: 16, url: 'https://portswigger.net/web-security/ssrf' },
    { id: 'we4', title: 'JWT alg-confusion auth bypass',               diff: 'HARD', xp: 22, url: 'https://portswigger.net/web-security/jwt' },
  ]},
  privesc: { name: 'Privilege Escalation', questions: [
    { id: 'pe1', title: 'SUID binary → root (GTFOBins)',       diff: 'EASY', xp: 10, url: 'https://gtfobins.github.io/' },
    { id: 'pe2', title: 'Sudo misconfig exploitation',         diff: 'MED',  xp: 14, url: 'https://gtfobins.github.io/' },
    { id: 'pe3', title: 'Linux capabilities abuse',            diff: 'MED',  xp: 16, url: 'https://book.hacktricks.xyz/' },
  ]},
  dsa: { name: 'DSA / Algorithms', questions: [
    { id: 'd1', title: 'Two Sum / hashing warm-up',                      diff: 'EASY', xp: 6,  url: 'https://leetcode.com/problems/two-sum/' },
    { id: 'd2', title: 'Longest substring w/o repeats (sliding window)', diff: 'MED',  xp: 12, url: 'https://leetcode.com/problems/longest-substring-without-repeating-characters/' },
    { id: 'd3', title: 'Course schedule (topological sort)',              diff: 'MED',  xp: 14, url: 'https://leetcode.com/problems/course-schedule/' },
    { id: 'd4', title: 'Word ladder (BFS on implicit graph)',             diff: 'HARD', xp: 20, url: 'https://leetcode.com/problems/word-ladder/' },
  ]},
  netatk: { name: 'Network Attacks', questions: [
    { id: 'n1', title: 'ARP spoof + capture creds on LAN',                diff: 'MED',  xp: 14, url: 'https://book.hacktricks.xyz/' },
    { id: 'n2', title: 'Pivot through compromised host (proxychains)',     diff: 'HARD', xp: 20, url: 'https://book.hacktricks.xyz/' },
  ]},
  recon: { name: 'Recon & OSINT', questions: [
    { id: 'r1', title: 'Full subdomain enumeration of a target',          diff: 'EASY', xp: 8,  url: 'https://book.hacktricks.xyz/' },
    { id: 'r2', title: 'Build an automated asset-discovery pipeline',      diff: 'MED',  xp: 16, url: 'https://book.hacktricks.xyz/' },
  ]},
}

export const ARENA_AXIS_MAP: Record<string, string> = {
  dsa: 'cp', webexp: 'web', privesc: 'exploit', netatk: 'network', recon: 'network',
}
