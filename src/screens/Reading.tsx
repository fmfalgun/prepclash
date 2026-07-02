import { useState } from 'react'
import { useStore } from '../store/useStore'
import { PALETTES } from '../data/palettes'
import { Heatmap } from '../components/Heatmap'
import { AreaLine } from '../components/charts/AreaLine'
import { allBookDefs } from '../store/selectors'

const card: React.CSSProperties = { background: 'var(--card0)', borderRadius: 11, padding: '22px 24px' }

const CAT_LABELS: Record<string, string> = {
  hacking: 'hacking', manga: 'manga', manhwa: 'manhwa', manhua: 'manhua',
  webnovel: 'web novel', novel: 'novel', fiction: 'fiction', other: 'other',
}
const UNIT_NAMES: Record<string, string> = { pages: 'Pages', chapters: 'Chapters', sections: 'Sections', questions: 'Questions' }

function Label({ children }: { children: React.ReactNode }) {
  return <div style={{ font: "400 11px 'Roboto Mono'", color: 'var(--mut)', letterSpacing: '.02em', marginBottom: 6 }}>{children}</div>
}

function StatTile({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: boolean }) {
  return (
    <div style={{ ...card, padding: '16px 18px' }}>
      <div style={{ font: "400 11px 'Roboto Mono'", color: 'var(--mut)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</div>
      <div style={{ font: "500 26px/1.1 'Roboto Mono'", color: accent ? 'var(--a)' : 'var(--ink)', marginTop: 8 }}>{value}</div>
      {sub && <div style={{ font: "400 10px 'Roboto Mono'", color: 'var(--mut)', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub}</div>}
    </div>
  )
}

export function Reading() {
  const data     = useStore(s => s.data)
  const setModal = useStore(s => s.setModal)
  const palette  = useStore(s => s.data.palette)
  const P = PALETTES[palette] || PALETTES.toxic

  const [showAllBooks, setShowAllBooks]   = useState(false)
  const [filterCat, setFilterCat]         = useState('all')
  const [filterStatus, setFilterStatus]   = useState('all')

  const defs  = allBookDefs(data)
  const books = data.books

  // All categories present in library
  const catsPresent = ['all', ...new Set(defs.map(d => d.category || 'hacking'))]

  const booksTotal  = defs.length
  const booksDone   = defs.filter(def => { const b = books.find(x => x.id === def.id); return b && b.done >= def.total }).length
  const overallPct  = Math.round(defs.reduce((a, def) => {
    const b = books.find(x => x.id === def.id); return a + Math.min(1, (b?.done || 0) / def.total)
  }, 0) / Math.max(1, booksTotal) * 100)

  // reading logs
  const readLogs = data.logs.filter(l => l.type === 'reading' && l.bookId)

  // daily progress % for last 30 days
  const dailyPct: Record<string, number> = {}
  const dailyActive: Record<string, number> = {}
  readLogs.forEach(l => {
    const def = defs.find(d => d.id === l.bookId)
    if (!def || !l.amount) return
    const pct = l.amount / def.total * 100
    dailyPct[l.date] = (dailyPct[l.date] || 0) + pct
    dailyActive[l.date] = (dailyActive[l.date] || 0) + l.amount
  })
  const progressSeries: number[] = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i)
    const k = d.toISOString().slice(0, 10)
    progressSeries.push(Math.round(dailyPct[k] || 0))
  }

  // streak
  let dayStreak = 0, longestStreak = 0
  {
    const probe = new Date()
    if (!dailyActive[probe.toISOString().slice(0, 10)]) probe.setDate(probe.getDate() - 1)
    while (dailyActive[probe.toISOString().slice(0, 10)]) { dayStreak++; probe.setDate(probe.getDate() - 1) }
    const days = Object.keys(dailyActive).sort(); let run = 0; let prev: number | null = null
    days.forEach(k => {
      const t = new Date(k).getTime()
      if (prev !== null && Math.round((t - prev) / 86400000) === 1) run++
      else run = 1
      longestStreak = Math.max(longestStreak, run)
      prev = t
    })
  }

  const activeDays = Object.keys(dailyActive).length
  const totalSessions = data.logs.filter(l => l.type === 'reading').length
  const inProgress = defs.filter(def => { const b = books.find(x => x.id === def.id); return b && b.done > 0 && b.done < def.total }).length

  // By unit
  const unitTot: Record<string, number> = {}
  readLogs.forEach(l => { if (l.unit && l.amount) unitTot[l.unit] = (unitTot[l.unit] || 0) + l.amount })
  const unitArr = Object.entries(unitTot).sort((a, b) => b[1] - a[1])
  const uMax = Math.max(1, ...unitArr.map(u => u[1]))
  const favUnit = unitArr[0] ? (UNIT_NAMES[unitArr[0][0]] || unitArr[0][0]).toLowerCase() : '—'

  // By category breakdown
  const catProgress: Record<string, { done: number; total: number; finished: number }> = {}
  defs.forEach(def => {
    const cat = def.category || 'hacking'
    if (!catProgress[cat]) catProgress[cat] = { done: 0, total: 0, finished: 0 }
    const b = books.find(x => x.id === def.id)
    const d = b?.done ?? 0
    catProgress[cat].total += def.total
    catProgress[cat].done += d
    if (d >= def.total) catProgress[cat].finished++
  })
  const catArr = Object.entries(catProgress).sort((a, b) => b[1].total - a[1].total)
  const catMax = Math.max(1, ...catArr.map(([, v]) => v.total))

  // Library filter
  const filteredDefs = defs.filter(def => {
    if (filterCat !== 'all' && (def.category || 'hacking') !== filterCat) return false
    if (filterStatus !== 'all') {
      const b = books.find(x => x.id === def.id)
      const done = b?.done ?? 0
      if (filterStatus === 'completed' && done < def.total) return false
      if (filterStatus === 'in progress' && (done === 0 || done >= def.total)) return false
      if (filterStatus === 'unstarted' && done > 0) return false
    }
    return true
  })

  const tiles = [
    { label: 'sessions',     value: totalSessions, sub: 'logged',           accent: false },
    { label: 'in progress',  value: inProgress,    sub: 'books open',       accent: true  },
    { label: 'finished',     value: booksDone,     sub: 'completed',        accent: false },
    { label: 'pages read',   value: unitTot.pages || 0,     sub: 'all books', accent: false },
    { label: 'questions',    value: unitTot.questions || 0, sub: 'solved in books', accent: false },
    { label: 'favorite unit',value: favUnit,       sub: 'most logged',      accent: true  },
  ]

  return (
    <div className="screen-pad" style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 20px 80px', display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Header */}
      <div className="screen-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ font: "300 26px/1 'Lexend Deca'", color: 'var(--ink)', letterSpacing: '.01em' }}>reading lab</div>
          <div style={{ font: "400 11px 'Roboto Mono'", color: 'var(--mut)', marginTop: 5 }}>
            intel · {booksDone}/{booksTotal} books complete
          </div>
        </div>
        <div className="screen-header-btns" style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => setModal('add-book')} style={{
            cursor: 'pointer', border: 'none', background: 'var(--cardHi)', color: 'var(--txt)',
            font: "400 12px 'Roboto Mono'", padding: '11px 16px', borderRadius: 8,
          }}>+ add book</button>
          <button onClick={() => setModal('reading')} style={{
            cursor: 'pointer', border: 'none', background: 'var(--a)', color: '#1b1c1e',
            font: "500 12px 'Roboto Mono'", padding: '11px 20px', borderRadius: 8,
          }}>+ log reading</button>
        </div>
      </div>

      {/* Hero */}
      <div className="hero-grid" style={{ display: 'grid', gridTemplateColumns: '190px 1fr', gap: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 22, padding: '6px 0' }}>
          {[
            { label: 'overall',   val: overallPct + '%', sub: 'library complete',     accent: true  },
            { label: 'day streak',val: dayStreak,        sub: 'longest ' + longestStreak, accent: false },
            { label: 'finished',  val: booksDone,        sub: 'of ' + booksTotal + ' books', accent: false },
          ].map(({ label, val, sub, accent }) => (
            <div key={label}>
              <Label>{label}</Label>
              <div style={{ font: "500 44px/1 'Roboto Mono'", color: accent ? 'var(--a)' : 'var(--ink)', marginTop: 4 }}>{val}</div>
              <div style={{ font: "400 10px 'Roboto Mono'", color: 'var(--mut)', marginTop: 2 }}>{sub}</div>
            </div>
          ))}
        </div>
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
            <span style={{ font: "400 11px 'Roboto Mono'", color: 'var(--txt)' }}>progress logged per day</span>
            <span style={{ font: "400 10px 'Roboto Mono'", color: 'var(--mut)' }}>% of a book · last 30 days</span>
          </div>
          <AreaLine values={progressSeries} accent={P.a} strong={P.a2} rgb={P.rgb} />
        </div>
      </div>

      {/* Stat tiles */}
      <div className="stat-tiles-6" style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12 }}>
        {tiles.map(t => <StatTile key={t.label} label={t.label} value={t.value} sub={t.sub} accent={t.accent} />)}
      </div>

      {/* Library */}
      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
          <Label>library</Label>
          <span style={{ font: "400 10px 'Roboto Mono'", color: 'var(--mut)' }}>click a book to log progress</span>
        </div>

        {/* Category filter */}
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 10 }}>
          {catsPresent.map(cat => (
            <button key={cat} onClick={() => setFilterCat(cat)} style={{
              cursor: 'pointer', border: 'none',
              background: filterCat === cat ? 'var(--a)' : 'var(--cardHi)',
              color: filterCat === cat ? '#111' : 'var(--mut)',
              font: "400 9px 'Roboto Mono'", padding: '4px 10px', borderRadius: 5,
            }}>{cat === 'all' ? 'all' : CAT_LABELS[cat] || cat}</button>
          ))}
          <div style={{ width: 1, background: 'rgba(255,255,255,.08)', margin: '0 4px' }} />
          {['all', 'in progress', 'completed', 'unstarted'].map(st => (
            <button key={st} onClick={() => setFilterStatus(st)} style={{
              cursor: 'pointer', border: 'none',
              background: filterStatus === st ? 'rgba(var(--a2rgb),.2)' : 'var(--cardHi)',
              color: filterStatus === st ? 'var(--a2)' : 'var(--mut)',
              font: "400 9px 'Roboto Mono'", padding: '4px 10px', borderRadius: 5,
            }}>{st}</button>
          ))}
        </div>

        <div className="lib-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 20px' }}>
          {filteredDefs.filter(def => {
            if (showAllBooks) return true
            const b = books.find(x => x.id === def.id)
            return b && b.done > 0
          }).map(def => {
            const b      = books.find(x => x.id === def.id)
            const done   = b?.done ?? 0
            const pct    = Math.round(done / def.total * 100)
            const finished = done >= def.total
            const cat    = def.category || 'hacking'
            return (
              <div key={def.id} onClick={() => setModal('reading')} style={{ cursor: 'pointer' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10, marginBottom: 4 }}>
                  <span style={{ font: "400 14px 'Lexend Deca'", color: finished ? 'var(--a)' : 'var(--ink)', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {finished ? '✓ ' : ''}{def.title}
                  </span>
                  <span style={{ font: "400 11px 'Roboto Mono'", color: 'var(--mut)', flexShrink: 0 }}>{done}/{def.total}</span>
                </div>
                <div style={{ height: 7, background: 'var(--cardHi)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 4, background: finished ? 'var(--a2)' : 'var(--a)', width: pct + '%', transition: 'width .25s' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
                  <span style={{ font: "400 9px 'Roboto Mono'", color: 'var(--dim2)' }}>
                    {CAT_LABELS[cat] || cat} · {def.unit}
                    {def.author ? ' · ' + def.author : ''}
                  </span>
                  <span style={{ font: "400 10px 'Roboto Mono'", color: 'var(--a)' }}>{pct}%</span>
                </div>
              </div>
            )
          })}
        </div>

        {(() => {
          const inFilter = filteredDefs.filter(def => {
            const b = books.find(x => x.id === def.id)
            return !b || b.done === 0
          })
          const hiddenCount = inFilter.length
          if (hiddenCount === 0 && !showAllBooks) return null
          return (
            <button
              onClick={() => setShowAllBooks(v => !v)}
              style={{
                marginTop: 16, cursor: 'pointer', border: '1px dashed rgba(255,255,255,.12)',
                background: 'transparent', color: 'var(--mut)', borderRadius: 7,
                font: "400 11px 'Roboto Mono'", padding: '8px 16px', width: '100%',
              }}
            >
              {showAllBooks ? `hide ${hiddenCount} unstarted` : `+ show ${hiddenCount} more book${hiddenCount > 1 ? 's' : ''}`}
            </button>
          )
        })()}
      </div>

      {/* By category + by unit + Heatmap */}
      <div className="two-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Category breakdown */}
        <div style={card}>
          <Label>by category</Label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 10 }}>
            {catArr.length === 0
              ? <div style={{ font: "400 11px 'Roboto Mono'", color: 'var(--mut)' }}>no books yet</div>
              : catArr.map(([cat, v]) => {
                  const pct = Math.round(v.done / v.total * 100)
                  return (
                    <div key={cat}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                        <span style={{ font: "400 12px 'Lexend Deca'", color: 'var(--ink)' }}>{CAT_LABELS[cat] || cat}</span>
                        <span style={{ font: "400 10px 'Roboto Mono'", color: 'var(--mut)' }}>{pct}% · {v.done}/{v.total}</span>
                      </div>
                      <div style={{ height: 6, background: 'var(--cardHi)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ height: '100%', borderRadius: 3, background: 'var(--a)', width: Math.round(v.done / catMax * 100) + '%', transition: 'width .3s' }} />
                      </div>
                    </div>
                  )
                })
            }
          </div>
        </div>

        {/* By unit type */}
        <div style={card}>
          <Label>read by unit type</Label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 12 }}>
            {unitArr.length === 0
              ? <div style={{ font: "400 11px 'Roboto Mono'", color: 'var(--mut)' }}>no reading logged yet</div>
              : unitArr.map(([u, tot]) => (
                  <div key={u}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ font: "400 13px 'Lexend Deca'", color: 'var(--ink)' }}>{UNIT_NAMES[u] || u}</span>
                      <span style={{ font: "400 10px 'Roboto Mono'", color: 'var(--mut)' }}>{tot}</span>
                    </div>
                    <div style={{ height: 6, background: 'var(--cardHi)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: 3, background: 'rgba(var(--rgb),.5)', width: Math.round(tot / uMax * 100) + '%' }} />
                    </div>
                  </div>
                ))
            }
          </div>
        </div>
      </div>

      {/* Heatmap */}
      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16 }}>
          <Label>reading activity</Label>
          <span style={{ font: "400 10px 'Roboto Mono'", color: 'var(--mut)' }}>{activeDays} active days · 26 weeks</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <Heatmap data={data} />
        </div>
      </div>

      {/* Recent log */}
      <div style={card}>
        <Label>recent reading log</Label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 10 }}>
          {data.logs.filter(l => l.type === 'reading').length === 0
            ? <div style={{ font: "400 11px 'Roboto Mono'", color: 'var(--mut)', textAlign: 'center', padding: '20px 0' }}>no reading logged yet · tap <span style={{ color: 'var(--a)' }}>+ log reading</span></div>
            : data.logs.filter(l => l.type === 'reading').slice(0, 10).map((l, i) => {
                const d = new Date(l.ts)
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '13px 4px', borderBottom: i < 9 ? '1px solid rgba(255,255,255,.06)' : 'none' }}>
                    <div style={{ width: 44, flexShrink: 0, textAlign: 'center' }}>
                      <div style={{ font: "400 16px/1 'Roboto Mono'", color: 'var(--ink)' }}>{d.getDate()}</div>
                      <div style={{ font: "400 9px 'Roboto Mono'", color: 'var(--mut)' }}>{d.toLocaleDateString('en-US', { month: 'short' }).toLowerCase()}</div>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ font: "400 14px 'Lexend Deca'", color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.title}</div>
                      {l.unit && <div style={{ font: "400 10px 'Roboto Mono'", color: 'var(--mut)', marginTop: 3 }}>read {l.amount} {l.unit}</div>}
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ font: "400 15px 'Roboto Mono'", color: 'var(--a)' }}>+{l.gain}</div>
                      <div style={{ font: "400 9px 'Roboto Mono'", color: 'var(--mut)' }}>xp</div>
                    </div>
                  </div>
                )
              })
          }
        </div>
      </div>

    </div>
  )
}
