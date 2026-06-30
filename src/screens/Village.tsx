import { useState, useEffect } from 'react'
import { useStore } from '../store/useStore'
import { PALETTES } from '../data/palettes'

// ── data types ─────────────────────────────────────────────────────────────
interface Fight    { id: string; title: string; kind: 'problem' | 'project' }
interface ChBoss   { title: string; questions: string[] }
interface ChContent {
  title: string; summary: string; topics: string[]
  fights: Fight[]; boss: ChBoss
  reading?: { label: string; url: string }[]
  links?:   { label: string; url: string }[]
}
interface Chapter  { code: string; title: string; content: ChContent | null }
interface ActData  {
  id: string; act: string; name: string; villain: string; ep: string; stack: string
  chapters: Chapter[]; heavyProblems: string[]
}

// ── static per-act side lanes (from design session) ────────────────────────
const SIDE: Record<string, { id: string; tag: string; title: string; units: number; lane: 1|2|3 }[]> = {
  course1: [
    { lane: 1, id: 'rtfm',       tag: 'BOOK', title: 'Red Team Field Manual',         units: 9   },
    { lane: 1, id: 'linux-ess',  tag: 'BOOK', title: 'Linux Essentials for Cybersec', units: 15  },
    { lane: 2, id: 'a2oj-b',     tag: 'A2OJ', title: 'A2OJ Div2 B',                   units: 76  },
    { lane: 3, id: 'phys1',      tag: 'BODY', title: 'Physique Checkpoint',            units: 6   },
  ],
  course2: [
    { lane: 1, id: 'osint',      tag: 'BOOK', title: 'OSINT Methods & Tools',          units: 9   },
    { lane: 2, id: 'a2oj-1300',  tag: 'A2OJ', title: 'A2OJ ≤1300',                    units: 100 },
    { lane: 3, id: 'phys2',      tag: 'BODY', title: 'Physique Checkpoint',            units: 6   },
  ],
  course3: [
    { lane: 1, id: 'silence',    tag: 'BOOK', title: 'Silence on the Wire',            units: 10  },
    { lane: 2, id: 'a2oj-1400',  tag: 'A2OJ', title: 'A2OJ ≤1400',                    units: 100 },
    { lane: 3, id: 'phys3',      tag: 'BODY', title: 'Physique Checkpoint',            units: 6   },
  ],
  course4: [
    { lane: 1, id: 'whbh',       tag: 'BOOK', title: "Web App Hacker's Handbook",      units: 20  },
    { lane: 2, id: 'cf4',        tag: 'CF',   title: 'Codeforces Set',                 units: 50  },
    { lane: 3, id: 'phys4',      tag: 'BODY', title: 'Physique Checkpoint',            units: 6   },
  ],
  course5: [
    { lane: 1, id: 'wh101',      tag: 'BOOK', title: 'Web Hacking 101',                units: 12  },
    { lane: 2, id: 'cf5',        tag: 'CF',   title: 'Codeforces Set',                 units: 50  },
    { lane: 3, id: 'phys5',      tag: 'BODY', title: 'Final Form Checkpoint',          units: 6   },
  ],
}
const LANE_COLOR: Record<number, string> = { 1: '#ff9f43', 2: '#2da0ff', 3: '#caa24a' }
const LANE_NAME:  Record<number, string> = { 1: 'FOREST',  2: 'GRIND',   3: 'PHYSIQUE' }

type Panel =
  | { kind: 'chapter'; actIdx: number; chIdx: number }
  | { kind: 'lane';    actIdx: number; laneId: string }
  | { kind: 'boss';    actIdx: number }
  | null

// ── component ──────────────────────────────────────────────────────────────
export function Village() {
  const palette          = useStore(s => s.data.palette)
  const campaign         = useStore(s => s.data.campaign)
  const defeated         = useStore(s => s.data.campaignDefeated)
  const setCampaign      = useStore(s => s.setCampaign)
  const bumpLane         = useStore(s => s.bumpCampaignLane)
  const defeatAct        = useStore(s => s.defeatAct)

  const P   = PALETTES[palette] || PALETTES.toxic
  const rgb = P.rgb

  const [acts, setActs]     = useState<ActData[]>([])
  const [loading, setLoad]  = useState(true)
  const [panel, setPanel]   = useState<Panel>(null)
  const [proofDraft, setProof] = useState('')

  // ── fetch data ─────────────────────────────────────────────────────────
  useEffect(() => {
    const base = import.meta.env.BASE_URL + 'data/courses/'
    async function load() {
      try {
        const manifest = await fetch(base + 'manifest.json').then(r => r.json())
        const loaded: ActData[] = await Promise.all(
          manifest.acts.map(async (a: any) => {
            let cm: any = { chapters: [] }
            try { cm = await fetch(base + a.chapters).then(r => r.json()) } catch {}
            const chapters: Chapter[] = await Promise.all(
              (cm.chapters || []).map(async (ch: any) => {
                try {
                  const r = await fetch(base + a.id + '/ch' + ch.code + '.json')
                  if (!r.ok) throw 0
                  return { ...ch, content: await r.json() }
                } catch { return { ...ch, content: null } }
              })
            )
            return { ...a, chapters }
          })
        )
        setActs(loaded)
      } catch { setActs([]) }
      setLoad(false)
    }
    load()
  }, [])

  // ── progress helpers ───────────────────────────────────────────────────
  function fightKey(actId: string, code: string, fid: string) { return `${actId}/ch${code}#${fid}` }
  function bossKey(actId: string, code: string)               { return `${actId}/ch${code}#__boss` }
  function laneKey(actId: string, lid: string)                { return `${actId}/lane#${lid}` }
  function heavyKey(actId: string, idx: number)               { return `${actId}/heavy#${idx}` }

  function chFightsDone(act: ActData, ch: Chapter) {
    return (ch.content?.fights || []).filter(f => campaign[fightKey(act.id, ch.code, f.id)] === 1).length
  }
  function chBossDone(act: ActData, ch: Chapter) { return !!campaign[bossKey(act.id, ch.code)] }
  function chCleared(act: ActData, ch: Chapter) {
    if (!ch.content) return false
    return chFightsDone(act, ch) === ch.content.fights.length && chBossDone(act, ch)
  }
  function laneDone(act: ActData, lid: string, units: number) {
    return (campaign[laneKey(act.id, lid)] || 0) >= units
  }
  function actChReady(act: ActData) {
    return act.chapters.length > 0 && act.chapters.every(ch => ch.content && chCleared(act, ch))
  }
  function actLanesReady(act: ActData) {
    return (SIDE[act.id] || []).every(n => laneDone(act, n.id, n.units))
  }
  function actReady(act: ActData)    { return actChReady(act) && actLanesReady(act) }
  function actUnlocked(i: number)    { return i === 0 || !!defeated[acts[i - 1].id] }
  function actDefeated(act: ActData) { return !!defeated[act.id] }

  // ── total progress ─────────────────────────────────────────────────────
  let doneUnits = 0, totalUnits = 0
  acts.forEach(a => {
    a.chapters.forEach(ch => {
      if (ch.content) {
        totalUnits += ch.content.fights.length + 1
        doneUnits  += chFightsDone(a, ch) + (chBossDone(a, ch) ? 1 : 0)
      }
    });
    (SIDE[a.id] || []).forEach(n => {
      totalUnits += n.units
      doneUnits  += Math.min(n.units, campaign[laneKey(a.id, n.id)] || 0)
    })
  })

  // ── panel helpers ──────────────────────────────────────────────────────
  const panelAct = panel ? acts[panel.actIdx] : null
  const panelCh  = panel?.kind === 'chapter' ? panelAct?.chapters[panel.chIdx] : null

  function closePanel() { setPanel(null); setProof('') }

  // ── colours ────────────────────────────────────────────────────────────
  const ACT_COLORS = ['#46d98a', '#4aa6f0', '#ff9f43', '#a06bf0', '#f0764e']

  return (
    <div style={{ maxWidth: 1180, margin: '0 auto', padding: '24px 26px 90px' }}>

      {/* ── header ─────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, marginBottom: 26, flexWrap: 'wrap' }}>
        <div>
          <div style={{ font: "500 9px 'Roboto Mono'", letterSpacing: '.22em', color: 'var(--mut)' }}>CAMPAIGN · REPLACES VILLAGE</div>
          <div style={{ font: "500 30px 'Lexend Deca'", color: 'var(--ink)', marginTop: 2 }}>SHADOW CRACKER</div>
          <div style={{ font: "400 10px 'Roboto Mono'", color: 'var(--dim2)', marginTop: 5 }}>
            5 acts · {acts.reduce((s, a) => s + a.chapters.length, 0)} chapters · defeat every villain
          </div>
        </div>
        <div style={{ width: 200 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', font: "500 9px 'Roboto Mono'", letterSpacing: '.08em', color: 'var(--mut)', marginBottom: 8 }}>
            <span>FIGHTS LOGGED</span>
            <span style={{ color: P.a2 }}>{doneUnits} / {totalUnits}</span>
          </div>
          <div style={{ height: 4, background: `rgba(${rgb},.12)`, borderRadius: 2 }}>
            <div style={{ width: totalUnits ? (doneUnits / totalUnits * 100) + '%' : '0%', height: '100%', background: `linear-gradient(90deg,${P.a},${P.a2})`, borderRadius: 2, transition: 'width .5s' }} />
          </div>
        </div>
      </div>

      {/* ── loading ────────────────────────────────────────────────── */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '80px 0', color: 'var(--mut)' }}>
          <div style={{ width: 28, height: 28, border: '2px solid rgba(255,255,255,.12)', borderTopColor: P.a, borderRadius: '50%', animation: 'scSpin .8s linear infinite' }} />
          <div style={{ font: "500 10px 'Roboto Mono'", letterSpacing: '.16em' }}>FETCHING COURSE DATA…</div>
        </div>
      )}

      {/* ── acts ───────────────────────────────────────────────────── */}
      {acts.map((act, ai) => {
        const unlocked = actUnlocked(ai)
        const defeated_ = actDefeated(act)
        const ready   = actReady(act)
        const aColor  = ACT_COLORS[ai] || P.a
        const chDone  = act.chapters.filter(ch => chCleared(act, ch)).length
        const pendingN = act.chapters.filter(ch => !ch.content).length

        return (
          <div key={act.id} style={{ display: 'flex', gap: 18, marginBottom: 8 }}>

            {/* left rail */}
            <div style={{ position: 'relative', flexShrink: 0, width: 46, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{
                width: 38, height: 38, borderRadius: '50%', flexShrink: 0, zIndex: 1,
                background: defeated_ ? aColor : unlocked ? `rgba(${rgb},.1)` : 'rgba(255,255,255,.04)',
                border: `2px solid ${unlocked ? aColor : 'rgba(255,255,255,.12)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                font: "700 12px 'Roboto Mono'", color: defeated_ ? '#0b110c' : aColor,
                boxShadow: unlocked ? `0 0 18px ${aColor}44` : 'none',
              }}>{defeated_ ? '✓' : act.act}</div>
              {ai < acts.length - 1 && (
                <div style={{ position: 'absolute', top: 44, bottom: 0, width: 2, background: `rgba(${rgb},.1)`, left: '50%', transform: 'translateX(-50%)' }} />
              )}
            </div>

            {/* content */}
            <div style={{ flex: 1, minWidth: 0, paddingBottom: 40 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
                <span style={{ font: "500 10px 'Roboto Mono'", letterSpacing: '.2em', color: 'var(--mut)' }}>ACT {act.act}</span>
                <span style={{ font: "500 18px 'Lexend Deca'", color: unlocked ? 'var(--ink)' : 'var(--mut)', letterSpacing: '.02em', whiteSpace: 'nowrap' }}>{act.name}</span>
                <span style={{ font: "400 9px 'Roboto Mono'", color: 'var(--dim2)' }}>{act.stack}</span>
                {defeated_ && <span style={{ font: "700 7px 'Roboto Mono'", letterSpacing: '.14em', color: '#0b110c', background: aColor, padding: '2px 8px', borderRadius: 3 }}>CLEARED</span>}
                {ready && !defeated_ && <span style={{ font: "700 7px 'Roboto Mono'", letterSpacing: '.14em', color: '#ff5a5a', border: '1px solid #ff5a5a44', padding: '2px 8px', borderRadius: 3 }}>BOSS READY</span>}
              </div>
              <div style={{ font: "400 10px 'Roboto Mono'", color: 'var(--dim)', marginBottom: 14 }}>
                {defeated_ ? 'defeated' : unlocked ? `${chDone} / ${act.chapters.length} chapters cleared${pendingN ? ` · ${pendingN} pending` : ''}` : 'complete previous act to unlock'}
              </div>

              {unlocked ? (
                <>
                  {/* chapters */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ font: "500 9px 'Roboto Mono'", letterSpacing: '.16em', color: aColor, marginBottom: 9 }}>
                      CHAPTERS · {chDone} / {act.chapters.length}
                    </div>
                    <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}>
                      {act.chapters.map((ch, ci) => {
                        const pending = !ch.content
                        const done    = chCleared(act, ch)
                        const fd = chFightsDone(act, ch)
                        const ft = ch.content?.fights.length || 0
                        const total = ft + 1
                        const doneCnt = fd + (chBossDone(act, ch) ? 1 : 0)
                        const fillW = pending ? 0 : done ? 100 : total ? Math.round(doneCnt / total * 100) : 0

                        return (
                          <div
                            key={ch.code}
                            onClick={() => pending ? null : setPanel({ kind: 'chapter', actIdx: ai, chIdx: ci })}
                            style={{
                              display: 'flex', flexDirection: 'column', width: 176, minHeight: 108,
                              padding: '10px 11px', borderRadius: 8, cursor: pending ? 'not-allowed' : 'pointer',
                              border: done ? `1.5px solid ${aColor}` : pending ? '1px dashed rgba(255,255,255,.12)' : '1px solid rgba(255,255,255,.1)',
                              background: done ? `rgba(${rgb},.07)` : pending ? 'rgba(255,255,255,.012)' : 'rgba(255,255,255,.02)',
                              opacity: pending ? 0.6 : 1, transition: 'transform .14s, border-color .2s',
                            }}
                            onMouseEnter={e => { if (!pending) (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)' }}
                            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = '' }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                              <span style={{ font: "500 9px 'Roboto Mono'", color: pending ? 'var(--dim)' : done ? aColor : P.a2 }}>CH {ch.code}</span>
                              {done && <span style={{ font: "500 11px 'Roboto Mono'", color: aColor }}>✓</span>}
                              {pending && <span style={{ fontSize: 11 }}>🔒</span>}
                            </div>
                            <div style={{ font: "500 11.5px/1.25 'Lexend Deca'", color: pending ? 'var(--dim)' : 'var(--ink)', margin: '7px 0 10px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' } as any}>{ch.title}</div>
                            <div style={{ marginTop: 'auto' }}>
                              <div style={{ font: "500 8px 'Roboto Mono'", color: pending ? 'var(--dim2)' : done ? aColor : 'var(--mut)', marginBottom: 5 }}>
                                {pending ? 'CONTENT PENDING' : done ? 'cleared' : `${doneCnt} / ${total} fights`}
                              </div>
                              <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,.07)', overflow: 'hidden' }}>
                                <div style={{ width: fillW + '%', height: '100%', background: done ? aColor : P.a2, transition: 'width .25s' }} />
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* side lanes */}
                  {[1, 2, 3].map(laneNum => {
                    const items = (SIDE[act.id] || []).filter(n => n.lane === laneNum)
                    if (!items.length) return null
                    const lColor = LANE_COLOR[laneNum]
                    return (
                      <div key={laneNum} style={{ display: 'flex', gap: 14, marginTop: 10, alignItems: 'flex-start' }}>
                        <div style={{ flexShrink: 0, width: 66, paddingTop: 6 }}>
                          <div style={{ font: "500 9px 'Roboto Mono'", letterSpacing: '.14em', color: lColor }}>{LANE_NAME[laneNum]}</div>
                        </div>
                        <div style={{ flex: 1, display: 'flex', gap: 9, flexWrap: 'wrap' }}>
                          {items.map(n => {
                            const cnt  = Math.min(n.units, campaign[laneKey(act.id, n.id)] || 0)
                            const full = cnt >= n.units
                            return (
                              <div
                                key={n.id}
                                onClick={() => setPanel({ kind: 'lane', actIdx: ai, laneId: n.id })}
                                style={{
                                  width: 176, padding: '10px 11px', borderRadius: 8, cursor: 'pointer',
                                  border: full ? `1.5px solid ${lColor}` : '1px solid rgba(255,255,255,.1)',
                                  background: full ? `rgba(${hexA(lColor, .08)})` : 'rgba(255,255,255,.02)',
                                  transition: 'transform .14s',
                                }}
                                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)' }}
                                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = '' }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                                  <span style={{ font: "500 8px 'Roboto Mono'", letterSpacing: '.1em', color: full ? lColor : 'var(--mut)' }}>{n.tag}</span>
                                  <span style={{ font: "500 9px 'Roboto Mono'", color: full ? lColor : 'var(--mut)' }}>{cnt} / {n.units}</span>
                                </div>
                                <div style={{ font: "500 11.5px/1.25 'Lexend Deca'", color: full ? 'var(--ink)' : 'var(--txt)', margin: '7px 0 8px' }}>{n.title}</div>
                                <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,.07)', overflow: 'hidden' }}>
                                  <div style={{ width: (cnt / n.units * 100) + '%', height: '100%', background: lColor, transition: 'width .25s' }} />
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}

                  {/* act boss */}
                  <div
                    style={{
                      marginTop: 18, padding: '14px 18px', borderRadius: 10,
                      border: defeated_ ? `1.5px solid ${aColor}` : ready ? `1px solid ${aColor}88` : '1px solid rgba(255,255,255,.08)',
                      background: defeated_ ? `rgba(${rgb},.07)` : ready ? `rgba(${rgb},.04)` : 'rgba(255,255,255,.015)',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, minWidth: 0 }}>
                      <div style={{
                        width: 48, height: 48, borderRadius: 10, flexShrink: 0,
                        background: `rgba(${rgb},.1)`, border: `1.5px solid ${aColor}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        font: '18px serif', boxShadow: `0 0 20px ${aColor}44`,
                      }}>
                        <span style={{ filter: defeated_ ? 'none' : ready ? 'none' : 'grayscale(1)', opacity: ready || defeated_ ? 1 : .4 }}>
                          {defeated_ ? '💀' : ready ? '⚔️' : '🔒'}
                        </span>
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ font: "500 9px 'Roboto Mono'", letterSpacing: '.2em', color: defeated_ ? aColor : ready ? '#ff5a5a' : 'var(--mut)' }}>
                          {defeated_ ? 'DEFEATED' : 'ACT BOSS'}
                        </div>
                        <div style={{ font: "500 19px 'Lexend Deca'", color: unlocked ? 'var(--ink)' : 'var(--mut)', marginTop: 3 }}>{act.villain}</div>
                        <div style={{ font: "400 10px 'Roboto Mono'", color: 'var(--dim2)', marginTop: 3 }}>{act.ep}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexShrink: 0 }}>
                      <div style={{ minWidth: 120 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14 }}>
                          <span style={{ font: "500 8px 'Roboto Mono'", letterSpacing: '.16em', color: 'var(--mut)' }}>GATE</span>
                          <span style={{ font: "500 12px 'Roboto Mono'", color: defeated_ ? aColor : ready ? '#ff5a5a' : 'var(--dim)' }}>
                            {defeated_ ? 'OPEN' : ready ? 'READY' : `${act.chapters.filter(c => c.content && chCleared(act, c)).length}/${act.chapters.length} ch`}
                          </span>
                        </div>
                        <div style={{ font: "400 8px 'Roboto Mono'", color: 'var(--dim2)', marginTop: 6, lineHeight: 1.4 }}>
                          {defeated_ ? 'Act cleared · next unlocked' : 'All chapters + side lanes required'}
                        </div>
                      </div>
                      <button
                        onClick={() => ready && !defeated_ && setPanel({ kind: 'boss', actIdx: ai })}
                        disabled={!ready || defeated_}
                        style={{
                          padding: '10px 20px', border: 'none', borderRadius: 6, cursor: ready && !defeated_ ? 'pointer' : 'not-allowed',
                          background: defeated_ ? `rgba(${rgb},.15)` : ready ? '#ff5a5a' : 'rgba(255,255,255,.05)',
                          color: defeated_ ? aColor : ready ? '#fff' : 'var(--dim)',
                          font: "700 10px 'Roboto Mono'", letterSpacing: '.14em',
                          opacity: ready || defeated_ ? 1 : .4,
                        }}
                      >{defeated_ ? 'DEFEATED' : 'FIGHT'}</button>
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ padding: '14px 16px', border: '1px dashed rgba(255,255,255,.1)', borderRadius: 8, background: 'rgba(255,255,255,.012)', font: "400 10px 'Roboto Mono'", letterSpacing: '.06em', color: 'var(--dim)', textAlign: 'center' }}>
                  ⛓ SEALED — complete Act {acts[ai - 1]?.act} to unlock
                </div>
              )}
            </div>
          </div>
        )
      })}

      {/* ── panel ──────────────────────────────────────────────────── */}
      {panel && (
        <div
          onClick={closePanel}
          style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(20,21,23,.66)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ position: 'relative', width: 520, maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto', background: '#151917', border: `1px solid rgba(${rgb},.2)`, borderRadius: 11, padding: 24, boxShadow: '0 24px 70px rgba(0,0,0,.5)' }}
          >
            <button onClick={closePanel} style={{ position: 'absolute', top: 15, right: 15, width: 28, height: 28, borderRadius: 6, border: '1px solid rgba(255,255,255,.1)', background: 'rgba(255,255,255,.05)', color: 'var(--mut)', fontSize: 14, cursor: 'pointer' }}>✕</button>

            {panel.kind === 'chapter' && panelAct && panelCh && panelCh.content && (() => {
              const act  = panelAct
              const ch   = panelCh
              const con  = ch.content!
              const aColor = ACT_COLORS[panel.actIdx] || P.a
              const fd   = chFightsDone(act, ch)
              const ft   = con.fights.length
              const bd   = chBossDone(act, ch)
              const allFightsDone = fd === ft
              const refs = [...(con.reading || []).map(r => ({ ...r, icon: '📖' })), ...(con.links || []).map(r => ({ ...r, icon: '🔗' }))]

              return (
                <>
                  <div style={{ font: "500 9px 'Roboto Mono'", letterSpacing: '.18em', color: aColor }}>ACT {act.act} · CH {ch.code}</div>
                  <div style={{ font: "500 22px 'Lexend Deca'", color: 'var(--ink)', marginTop: 5 }}>{con.title}</div>
                  <p style={{ font: "400 12px/1.55 'Lexend Deca'", color: 'var(--txt)', margin: '10px 0 14px' }}>{con.summary}</p>

                  {con.topics.length > 0 && (
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
                      {con.topics.map(t => (
                        <span key={t} style={{ font: "400 9px 'Roboto Mono'", color: 'var(--mut)', padding: '3px 8px', border: '1px solid rgba(255,255,255,.1)', borderRadius: 4, background: 'rgba(255,255,255,.04)' }}>{t}</span>
                      ))}
                    </div>
                  )}

                  <div style={{ font: "500 9px 'Roboto Mono'", letterSpacing: '.14em', color: aColor, marginBottom: 9 }}>FIGHTS · {fd} / {ft}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
                    {con.fights.map(f => {
                      const done = campaign[fightKey(act.id, ch.code, f.id)] === 1
                      return (
                        <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 7, background: done ? `rgba(${rgb},.07)` : 'rgba(255,255,255,.03)', border: done ? `1px solid rgba(${rgb},.25)` : '1px solid rgba(255,255,255,.07)' }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                              <span style={{ font: "500 7px 'Roboto Mono'", letterSpacing: '.1em', color: f.kind === 'project' ? '#caa24a' : P.a2, border: `1px solid ${f.kind === 'project' ? '#caa24a44' : `rgba(${rgb},.3)`}`, padding: '1px 6px', borderRadius: 3 }}>{f.kind.toUpperCase()}</span>
                              <span style={{ font: "500 11.5px 'Lexend Deca'", color: done ? 'var(--ink)' : 'var(--txt)' }}>{f.title}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => setCampaign(fightKey(act.id, ch.code, f.id), done ? 0 : 1)}
                            style={{ flexShrink: 0, padding: '5px 12px', border: `1px solid ${done ? `rgba(${rgb},.4)` : 'rgba(255,255,255,.15)'}`, borderRadius: 5, background: done ? `rgba(${rgb},.15)` : 'rgba(255,255,255,.05)', color: done ? P.a : 'var(--mut)', font: "500 9px 'Roboto Mono'", cursor: 'pointer', letterSpacing: '.08em' }}
                          >{done ? 'CLEAR ✓' : 'MARK DONE'}</button>
                        </div>
                      )
                    })}
                  </div>

                  {/* chapter boss */}
                  <div style={{ padding: '14px 16px', borderRadius: 8, border: `1px solid ${bd ? `rgba(${rgb},.35)` : allFightsDone ? '#ff5a5a55' : 'rgba(255,255,255,.08)'}`, background: bd ? `rgba(${rgb},.06)` : 'rgba(255,255,255,.02)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
                      <div>
                        <div style={{ font: "500 9px 'Roboto Mono'", letterSpacing: '.16em', color: bd ? aColor : allFightsDone ? '#ff5a5a' : 'var(--dim)' }}>CHAPTER BOSS</div>
                        <div style={{ font: "500 14px 'Lexend Deca'", color: 'var(--ink)', marginTop: 3 }}>{con.boss.title}</div>
                      </div>
                      <span style={{ font: "700 8px 'Roboto Mono'", letterSpacing: '.1em', padding: '3px 9px', borderRadius: 4, background: bd ? aColor : 'rgba(255,255,255,.08)', color: bd ? '#0b110c' : 'var(--dim)' }}>
                        {bd ? 'DEFEATED' : 'LOCKED'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
                      {con.boss.questions.map((q, qi) => (
                        <div key={qi} style={{ font: "400 11px/1.45 'Lexend Deca'", color: 'var(--txt)', paddingLeft: 14, position: 'relative' }}>
                          <span style={{ position: 'absolute', left: 0, color: aColor }}>▸</span>{q}
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => { if (allFightsDone) setCampaign(bossKey(act.id, ch.code), bd ? 0 : 1) }}
                      disabled={!allFightsDone}
                      style={{ padding: '8px 18px', border: 'none', borderRadius: 6, cursor: allFightsDone ? 'pointer' : 'not-allowed', background: bd ? `rgba(${rgb},.2)` : allFightsDone ? '#ff5a5a' : 'rgba(255,255,255,.05)', color: bd ? P.a : allFightsDone ? '#fff' : 'var(--dim)', font: "700 9px 'Roboto Mono'", letterSpacing: '.12em', opacity: allFightsDone ? 1 : .45 }}
                    >{bd ? 'MARK UNDONE' : allFightsDone ? 'DEFEAT BOSS' : 'CLEAR ALL FIGHTS FIRST'}</button>
                  </div>

                  {refs.length > 0 && (
                    <div style={{ borderTop: '1px solid rgba(255,255,255,.08)', paddingTop: 12, marginTop: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {refs.map((r, i) => (
                        <a key={i} href={r.url} target="_blank" rel="noopener" style={{ font: "400 10px 'Roboto Mono'", color: P.a2, textDecoration: 'none' }}>{r.icon} {r.label} ↗</a>
                      ))}
                    </div>
                  )}
                </>
              )
            })()}

            {panel.kind === 'lane' && panelAct && (() => {
              const act  = panelAct
              const n    = (SIDE[act.id] || []).find(x => x.id === panel.laneId)!
              if (!n) return null
              const cnt  = Math.min(n.units, campaign[laneKey(act.id, n.id)] || 0)
              const full = cnt >= n.units
              const lColor = LANE_COLOR[n.lane]
              return (
                <>
                  <div style={{ font: "500 9px 'Roboto Mono'", letterSpacing: '.18em', color: lColor }}>{LANE_NAME[n.lane]} LANE</div>
                  <div style={{ font: "500 22px 'Lexend Deca'", color: 'var(--ink)', marginTop: 5 }}>{n.title}</div>
                  <div style={{ font: "400 10px 'Roboto Mono'", color: 'var(--dim2)', marginTop: 5, marginBottom: 18 }}>{n.tag} · {cnt} / {n.units} units</div>
                  <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,.07)', overflow: 'hidden', marginBottom: 20 }}>
                    <div style={{ width: (cnt / n.units * 100) + '%', height: '100%', background: lColor, transition: 'width .25s' }} />
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={() => bumpLane(laneKey(act.id, n.id), -1, n.units)} disabled={cnt === 0} style={laneBtn(cnt === 0)}>− 1</button>
                    <button onClick={() => bumpLane(laneKey(act.id, n.id), 1, n.units)}  disabled={full}    style={laneBtn(full)}>+ 1</button>
                    <button onClick={() => bumpLane(laneKey(act.id, n.id), 5, n.units)}  disabled={full}    style={laneBtn(full)}>+ 5</button>
                    {!full && <button onClick={() => setCampaign(laneKey(act.id, n.id), n.units)} style={laneBtn(false)}>COMPLETE</button>}
                  </div>
                  {full && <div style={{ marginTop: 14, font: "500 10px 'Roboto Mono'", color: lColor, letterSpacing: '.1em' }}>✓ LANE COMPLETE</div>}
                </>
              )
            })()}

            {panel.kind === 'boss' && panelAct && (() => {
              const act   = panelAct
              const aColor = ACT_COLORS[panel.actIdx] || P.a
              const hp    = act.heavyProblems
              const doneCnt = hp.filter((_, i) => campaign[heavyKey(act.id, i)] === 1).length
              return (
                <>
                  <div style={{ font: "500 9px 'Roboto Mono'", letterSpacing: '.18em', color: '#ff5a5a' }}>ACT BOSS · {act.act}</div>
                  <div style={{ font: "500 22px 'Lexend Deca'", color: 'var(--ink)', marginTop: 5 }}>{act.villain}</div>
                  <div style={{ font: "400 10px 'Roboto Mono'", color: 'var(--dim2)', marginTop: 4, marginBottom: 14 }}>{act.ep}</div>
                  <p style={{ font: "400 12px/1.55 'Lexend Deca'", color: 'var(--txt)', margin: '0 0 18px' }}>
                    Defeat {act.villain} by completing all heavy CSE problems — the final gauntlet of Act {act.act}.
                  </p>
                  <div style={{ font: "500 9px 'Roboto Mono'", letterSpacing: '.14em', color: '#ff8a8a', marginBottom: 9 }}>HEAVY CSE PROBLEMS · {doneCnt} / {hp.length}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                    {hp.map((title, i) => {
                      const done = campaign[heavyKey(act.id, i)] === 1
                      return (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 7, background: done ? 'rgba(255,90,90,.08)' : 'rgba(255,255,255,.03)', border: done ? '1px solid rgba(255,90,90,.25)' : '1px solid rgba(255,255,255,.07)' }}>
                          <span style={{ flex: 1, font: "500 11.5px 'Lexend Deca'", color: done ? 'var(--ink)' : 'var(--txt)' }}>{title}</span>
                          <button onClick={() => setCampaign(heavyKey(act.id, i), done ? 0 : 1)} style={{ flexShrink: 0, padding: '5px 12px', border: `1px solid ${done ? 'rgba(255,90,90,.4)' : 'rgba(255,255,255,.15)'}`, borderRadius: 5, background: done ? 'rgba(255,90,90,.15)' : 'rgba(255,255,255,.05)', color: done ? '#ff8a8a' : 'var(--mut)', font: "500 9px 'Roboto Mono'", cursor: 'pointer' }}>{done ? 'DONE ✓' : 'MARK DONE'}</button>
                        </div>
                      )
                    })}
                  </div>
                  {doneCnt === hp.length && (
                    <button
                      onClick={() => { defeatAct(act.id); closePanel() }}
                      style={{ width: '100%', padding: '12px 0', border: 'none', borderRadius: 8, background: aColor, color: '#0b110c', font: "700 11px 'Roboto Mono'", letterSpacing: '.14em', cursor: 'pointer' }}
                    >DEFEAT {act.villain.toUpperCase()} · CLEAR ACT {act.act}</button>
                  )}
                </>
              )
            })()}

          </div>
        </div>
      )}

      <style>{`@keyframes scSpin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

function laneBtn(disabled: boolean) {
  return {
    padding: '8px 16px', border: '1px solid rgba(255,255,255,.15)', borderRadius: 6,
    background: disabled ? 'rgba(255,255,255,.03)' : 'rgba(255,255,255,.07)',
    color: disabled ? 'var(--dim)' : 'var(--txt)', font: "500 11px 'Roboto Mono'",
    cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? .45 : 1,
  }
}

function hexA(hex: string, a: number): string {
  const m = hex.replace('#', '').match(/.{2}/g)
  if (!m) return `0,0,0,${a}`
  return `${parseInt(m[0], 16)},${parseInt(m[1], 16)},${parseInt(m[2], 16)},${a}`
}
