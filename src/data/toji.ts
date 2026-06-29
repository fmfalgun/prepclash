// Toji's curated reading list — offered to new users on onboarding
// Does not duplicate BOOK_DEFS (wahh, weidman, thp2, rwbh, rtfm, ctci)
export interface TojiBookDef {
  id: string
  title: string
  unit: 'pages' | 'chapters' | 'sections' | 'questions'
  total: number
  skill: string
  cat: string
}

export const TOJI_BOOK_DEFS: TojiBookDef[] = [
  // ── Web Application Security ──────────────────────────────────
  { id:'mwpt',  title:'Mastering Modern Web Penetration Testing',        unit:'pages', total:298,  skill:'web',     cat:'web' },
  { id:'pwpt',  title:'Practical Web Penetration Testing',               unit:'pages', total:350,  skill:'web',     cat:'web' },
  { id:'csad',  title:'Client-Side Attacks and Defense',                 unit:'pages', total:300,  skill:'web',     cat:'web' },
  { id:'hwsrv', title:'Hacking Web Servers',                             unit:'pages', total:27,   skill:'web',     cat:'web' },
  { id:'hwapp', title:'Hacking Web Applications',                        unit:'pages', total:34,   skill:'web',     cat:'web' },
  { id:'sqlinj',title:'SQL Injection',                                   unit:'pages', total:22,   skill:'web',     cat:'web' },
  { id:'hewapp',title:'Hacking Exposed Web Applications 3rd Ed',         unit:'pages', total:400,  skill:'web',     cat:'web' },
  { id:'wast',  title:'Web Application Security Testing',                unit:'pages', total:350,  skill:'web',     cat:'web' },
  { id:'xssatk',title:'XSS Attacks — Cross Site Scripting',             unit:'pages', total:300,  skill:'web',     cat:'web' },
  { id:'lpwpt', title:'Learning Python Web Penetration Testing',         unit:'pages', total:300,  skill:'web',     cat:'web' },
  { id:'ehwads',title:'Ethical Hacking and Countermeasures — Web Apps',  unit:'pages', total:500,  skill:'web',     cat:'web' },
  { id:'tbhh',  title:"The Browser Hacker's Handbook",                   unit:'pages', total:600,  skill:'web',     cat:'web' },
  { id:'tangle',title:'The Tangled Web',                                 unit:'pages', total:300,  skill:'web',     cat:'web' },
  { id:'wh101', title:'Web Hacking 101',                                 unit:'pages', total:200,  skill:'web',     cat:'web' },
  { id:'wstcb', title:'Web Security Testing Cookbook',                   unit:'pages', total:400,  skill:'web',     cat:'web' },
  { id:'scsqlsv',title:'Securing SQL Server',                            unit:'pages', total:300,  skill:'web',     cat:'web' },

  // ── Core Penetration Testing ──────────────────────────────────
  { id:'ptsg',  title:'Penetration Testing — Survival Guide Learning Path',   unit:'pages', total:400,  skill:'exploit', cat:'pentest' },
  { id:'cyatk', title:'Cybersecurity Attack and Defense Strategies',          unit:'pages', total:350,  skill:'exploit', cat:'pentest' },
  { id:'cnpe',  title:'Conducting Network Penetration and Espionage',         unit:'pages', total:350,  skill:'exploit', cat:'pentest' },
  { id:'cyops', title:'Cyber Operations — Building, Defending, Attacking',    unit:'pages', total:400,  skill:'exploit', cat:'pentest' },
  { id:'sePT',  title:'Social Engineering Penetration Testing',               unit:'pages', total:350,  skill:'exploit', cat:'pentest' },
  { id:'mlpt',  title:'Mastering Machine Learning for Penetration Testing',   unit:'pages', total:300,  skill:'exploit', cat:'pentest' },
  { id:'ccsch', title:'The Complete Cyber Security Course — Hacking Exposed', unit:'pages', total:400,  skill:'exploit', cat:'pentest' },
  { id:'ieh',   title:'Introduction to Ethical Hacking',                      unit:'pages', total:67,   skill:'exploit', cat:'pentest' },
  { id:'aptse', title:'Advanced Penetration Testing for Highly-Secured Envs', unit:'pages', total:350,  skill:'exploit', cat:'pentest' },
  { id:'hackitp',title:'Hack IT Security Through Penetration Testing',        unit:'pages', total:350,  skill:'exploit', cat:'pentest' },
  { id:'h2rw',  title:'From Hacking to Report Writing',                       unit:'pages', total:300,  skill:'exploit', cat:'pentest' },
  { id:'hfd6',  title:'Hacking For Dummies 6th Ed',                          unit:'pages', total:400,  skill:'exploit', cat:'pentest' },
  { id:'sesh',  title:'Social Engineering — The Science of Human Hacking',   unit:'pages', total:300,  skill:'exploit', cat:'pentest' },
  { id:'syshk', title:'System Hacking',                                       unit:'pages', total:50,   skill:'exploit', cat:'pentest' },
  { id:'seshij',title:'Session Hijacking',                                    unit:'pages', total:30,   skill:'exploit', cat:'pentest' },
  { id:'eidsfh',title:'Evading IDS, Firewalls and Honeypots',                unit:'pages', total:37,   skill:'exploit', cat:'pentest' },
  { id:'soceng',title:'Social Engineering',                                   unit:'pages', total:27,   skill:'exploit', cat:'pentest' },
  { id:'ghh4',  title:'Gray Hat Hacking 4th Ed',                             unit:'pages', total:600,  skill:'exploit', cat:'pentest' },
  { id:'thp1',  title:'The Hacker Playbook 1',                               unit:'pages', total:300,  skill:'exploit', cat:'pentest' },
  { id:'hakatt',title:'Hack Attacks Revealed',                               unit:'pages', total:400,  skill:'exploit', cat:'pentest' },
  { id:'haktst',title:'Hack Attacks Testing — Security Audit',               unit:'pages', total:300,  skill:'exploit', cat:'pentest' },
  { id:'behkl', title:'Beginning Ethical Hacking with Kali Linux',           unit:'pages', total:350,  skill:'exploit', cat:'pentest' },
  { id:'ninja', title:'Ninja Hacking — Unconventional Penetration Testing',  unit:'pages', total:300,  skill:'exploit', cat:'pentest' },
  { id:'toh_rt',title:'Tribe of Hackers — Red Team',                         unit:'pages', total:300,  skill:'exploit', cat:'pentest' },
  { id:'c4pt',  title:'Coding for Penetration Testers',                      unit:'pages', total:300,  skill:'exploit', cat:'pentest' },
  { id:'apth',  title:'Advanced Penetration Testing Hacking',                unit:'pages', total:300,  skill:'exploit', cat:'pentest' },
  { id:'pypes', title:'Python Penetration Testing Essentials',               unit:'pages', total:200,  skill:'exploit', cat:'pentest' },
  { id:'artint',title:'The Art of Intrusion',                               unit:'pages', total:300,  skill:'exploit', cat:'pentest' },
  { id:'vulanal',title:'Vulnerability Analysis',                             unit:'pages', total:18,   skill:'exploit', cat:'pentest' },

  // ── Network Security ──────────────────────────────────────────
  { id:'ansmon',title:'Applied Network Security Monitoring',                 unit:'pages', total:600,  skill:'network', cat:'network' },
  { id:'anprot',title:'Attacking Network Protocols',                         unit:'pages', total:350,  skill:'network', cat:'network' },
  { id:'nmapck',title:'Nmap Network Exploration and Security Auditing Cookbook 2nd Ed', unit:'pages', total:400, skill:'network', cat:'network' },
  { id:'nstda', title:'Network Security Through Data Analysis 2nd Ed',       unit:'pages', total:350,  skill:'network', cat:'network' },
  { id:'cptnd', title:'Cisco Press — Penetration Testing and Network Defense', unit:'pages', total:700, skill:'network', cat:'network' },
  { id:'footrn',title:'Footprinting and Reconnaissance',                     unit:'pages', total:26,   skill:'network', cat:'network' },
  { id:'scannw',title:'Scanning Networks',                                   unit:'pages', total:25,   skill:'network', cat:'network' },
  { id:'enumer',title:'Enumeration',                                         unit:'pages', total:28,   skill:'network', cat:'network' },
  { id:'sotwire',title:'SILENCE ON THE WIRE — Passive Reconnaissance',       unit:'pages', total:300,  skill:'network', cat:'network' },

  // ── Wireless ──────────────────────────────────────────────────
  { id:'klwptbg',title:'Kali Linux Wireless Penetration Testing Beginners Guide 3rd Ed', unit:'pages', total:300, skill:'network', cat:'wireless' },
  { id:'hewl2', title:'Hacking Exposed Wireless 2nd Ed',                     unit:'pages', total:400,  skill:'network', cat:'wireless' },
  { id:'wifihk',title:'WiFi Hacking',                                        unit:'pages', total:26,   skill:'network', cat:'wireless' },
  { id:'wrrpt', title:'Wireless Reconnaissance in Penetration Testing',      unit:'pages', total:250,  skill:'network', cat:'wireless' },
  { id:'mklwpt',title:'Mastering Kali Linux Wireless Pentesting',            unit:'pages', total:350,  skill:'network', cat:'wireless' },

  // ── Malware Analysis & Reverse Engineering ────────────────────
  { id:'made',  title:'Malware Analysis and Detection Engineering',          unit:'pages', total:600,  skill:'exploit', cat:'malware' },
  { id:'prevran',title:'Preventing Ransomware',                              unit:'pages', total:250,  skill:'exploit', cat:'malware' },
  { id:'rnbk',  title:'Rootkits and Bootkits',                              unit:'pages', total:440,  skill:'exploit', cat:'malware' },
  { id:'hemrk', title:'Hacking Exposed Malware and Rootkits',               unit:'pages', total:350,  skill:'exploit', cat:'malware' },
  { id:'mobmal',title:'Mobile Malware Attacks and Defense',                  unit:'pages', total:400,  skill:'exploit', cat:'malware' },
  { id:'maldsc',title:'Malware Data Science',                               unit:'pages', total:300,  skill:'exploit', cat:'malware' },
  { id:'rebgn', title:'Reverse Engineering for Beginners',                   unit:'pages', total:700,  skill:'exploit', cat:'malware' },
  { id:'bofatk',title:'Buffer Overflow Attacks — Detect, Exploit, Prevent', unit:'pages', total:250,  skill:'exploit', cat:'malware' },
  { id:'shellhb',title:"The Shellcoder's Handbook",                         unit:'pages', total:750,  skill:'exploit', cat:'malware' },
  { id:'malthr',title:'Malware Threats',                                    unit:'pages', total:32,   skill:'exploit', cat:'malware' },

  // ── Digital Forensics ─────────────────────────────────────────
  { id:'cfhd',  title:'Computer Forensics — Investigating Hard Disks',       unit:'pages', total:240,  skill:'systems', cat:'forensics' },
  { id:'cirftm',title:'Computer Incident Response and Forensics Team Management', unit:'pages', total:400, skill:'systems', cat:'forensics' },
  { id:'fsfa',  title:'File System Forensic Analysis — Brian Carrier',       unit:'pages', total:382,  skill:'systems', cat:'forensics' },
  { id:'memfrs',title:'Memory Forensics',                                    unit:'pages', total:45,   skill:'systems', cat:'forensics' },
  { id:'dbfrs', title:'Database Forensics',                                  unit:'pages', total:220,  skill:'systems', cat:'forensics' },
  { id:'dcfsc', title:'Digital Crime and Forensic Science in Cyberspace',    unit:'pages', total:379,  skill:'systems', cat:'forensics' },
  { id:'dfdrqa',title:'Digital Forensic Data Reduction and Quick Analysis',  unit:'pages', total:312,  skill:'systems', cat:'forensics' },
  { id:'hdfai', title:'Handbook of Digital Forensics and Investigation',     unit:'pages', total:600,  skill:'systems', cat:'forensics' },
  { id:'idirsec',title:'Intelligence-Driven Incident Response',              unit:'pages', total:300,  skill:'systems', cat:'forensics' },
  { id:'chfi',  title:'CHFI — Computer Hacking Forensic Investigator',       unit:'pages', total:500,  skill:'systems', cat:'forensics' },
  { id:'cffftk',title:'Computer Forensics with FTK',                        unit:'pages', total:300,  skill:'systems', cat:'forensics' },

  // ── Mobile Security ───────────────────────────────────────────
  { id:'androsc',title:'Android Security Cookbook',                          unit:'pages', total:400,  skill:'web',     cat:'mobile' },
  { id:'iospt', title:'iOS Penetration Testing',                             unit:'pages', total:300,  skill:'web',     cat:'mobile' },
  { id:'androhb',title:"Android Hacker's Handbook",                         unit:'pages', total:580,  skill:'web',     cat:'mobile' },
  { id:'androsi',title:'Android Security Internals',                         unit:'pages', total:400,  skill:'web',     cat:'mobile' },
  { id:'iosas', title:'iOS Application Security',                            unit:'pages', total:380,  skill:'web',     cat:'mobile' },
  { id:'mdecb', title:'Mobile Device Exploitation Cookbook',                 unit:'pages', total:350,  skill:'web',     cat:'mobile' },
  { id:'tmahb', title:"The Mobile Application Hacker's Handbook",           unit:'pages', total:450,  skill:'web',     cat:'mobile' },
  { id:'hackmp',title:'Hacking Mobile Platforms',                            unit:'pages', total:38,   skill:'web',     cat:'mobile' },

  // ── IoT, ICS & Hardware ───────────────────────────────────────
  { id:'thwhkr',title:'The Hardware Hacker',                                 unit:'pages', total:280,  skill:'systems', cat:'hardware' },
  { id:'hxbox', title:'Hacking The Xbox',                                   unit:'pages', total:280,  skill:'systems', cat:'hardware' },
  { id:'spiot', title:'Security and Privacy in Internet of Things',          unit:'pages', total:350,  skill:'systems', cat:'hardware' },
  { id:'tpm20', title:'A Practical Guide to TPM 2.0',                       unit:'pages', total:375,  skill:'systems', cat:'hardware' },
  { id:'ptrpi', title:'Penetration Testing with Raspberry Pi',              unit:'pages', total:300,  skill:'systems', cat:'hardware' },
  { id:'iotck', title:'IoT Hacking',                                         unit:'pages', total:16,   skill:'systems', cat:'hardware' },

  // ── Threat Intelligence & OSINT ───────────────────────────────
  { id:'osintmt',title:'Open Source Intelligence Methods and Tools',         unit:'pages', total:400,  skill:'network', cat:'osint' },
  { id:'practic',title:'Practical Cyber Intelligence',                       unit:'pages', total:300,  skill:'network', cat:'osint' },

  // ── SIEM / SOC ────────────────────────────────────────────────
  { id:'msplunk',title:'Mastering Splunk',                                   unit:'pages', total:260,  skill:'systems', cat:'soc' },

  // ── Windows & PowerShell ─────────────────────────────────────
  { id:'hoptwin',title:'Hands-On Penetration Testing on Windows',            unit:'pages', total:320,  skill:'systems', cat:'windows' },

  // ── Certification (SANS / CEH) ────────────────────────────────
  { id:'s542d2',title:'SANS SEC542 — Web App Pentest Day 2',                unit:'pages', total:200,  skill:'web',     cat:'cert' },
  { id:'s542d3',title:'SANS SEC542 — Web App Pentest Day 3',                unit:'pages', total:200,  skill:'web',     cat:'cert' },
  { id:'s542d4',title:'SANS SEC542 — Web App Pentest Day 4',                unit:'pages', total:200,  skill:'web',     cat:'cert' },
  { id:'s542d5',title:'SANS SEC542 — Web App Pentest Day 5',                unit:'pages', total:200,  skill:'web',     cat:'cert' },
  { id:'cehv13',title:'CEH v13 — Certified Ethical Hacker',                 unit:'pages', total:900,  skill:'web',     cat:'cert' },
  { id:'ceheg', title:'CEH Certified Ethical Hacker Exam Guide 2nd Ed',     unit:'pages', total:600,  skill:'web',     cat:'cert' },
  { id:'cehq',  title:'CEH Model Questions',                                 unit:'questions', total:200, skill:'web', cat:'cert' },

  // ── Cryptography & Foundations ────────────────────────────────
  { id:'cnsstal',title:'Cryptography and Network Security — Stallings 5th Ed', unit:'pages', total:800, skill:'network', cat:'crypto' },
  { id:'elcrypt',title:'Elementary Cryptanalysis',                           unit:'pages', total:227,  skill:'network', cat:'crypto' },
  { id:'ossecj', title:'Operating System Security — Jaeger',                 unit:'pages', total:236,  skill:'systems', cat:'crypto' },
  { id:'crypt31',title:'Cryptography',                                       unit:'pages', total:31,   skill:'network', cat:'crypto' },

  // ── Linux & Kali ─────────────────────────────────────────────
  { id:'klrvld', title:'Kali Linux Revealed — OffSec Official',             unit:'pages', total:300,  skill:'systems', cat:'linux' },
  { id:'lexcyb', title:'Linux Essentials for Cybersecurity',                unit:'pages', total:350,  skill:'systems', cat:'linux' },
  { id:'ptbash',title:'Penetration Testing with the Bash Shell',            unit:'pages', total:230,  skill:'systems', cat:'linux' },
  { id:'mklap', title:'Mastering Kali Linux for Advanced Penetration Testing', unit:'pages', total:400, skill:'systems', cat:'linux' },
  { id:'cloud25',title:'Cloud Computing',                                    unit:'pages', total:25,   skill:'systems', cat:'linux' },
]
