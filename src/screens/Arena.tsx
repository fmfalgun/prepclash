import { useStore } from '../store/useStore'
import { ARENA, ARENA_AXIS_MAP } from '../data/arena'
import { pullCfProblems } from '../lib/codeforces'

const DIFF_PILL_STYLE: Record<string, React.CSSProperties> = {
  E: { background: 'rgba(57,255,136,.1)', border: '1px solid rgba(57,255,136,.3)', color: '#39ff88' },
  M: { background: 'rgba(202,162,74,.1)', border: '1px solid rgba(202,162,74,.3)', color: '#caa24a' },
  H: { background: 'rgba(255,90,90,.1)', border: '1px solid rgba(255,90,90,.3)', color: '#ff5a5a' },
}

export function Arena() {
  const data       = useStore(s => s.data)
  const activeTopic = useStore(s => s.activeTopic)
  const liveQs     = useStore(s => s.liveQuestions)
  const cfTagDraft  = useStore(s => s.cfTagDraft)
  const cfPulling   = useStore(s => s.cfPulling)
  const setActiveTopic = useStore(s => s.setActiveTopic)
  const setCfTag    = useStore(s => s.setCfTagDraft)
  const setCfPulling = useStore(s => s.setCfPulling)
  const addLiveQs   = useStore(s => s.addLiveQuestions)
  const openQ       = useStore(s => s.openQuestion)
  const showToast   = useStore(s => s.showToast)

  const topics = Object.keys(ARENA)
  const topicDef = ARENA[activeTopic]
  const base = topicDef?.questions || []
  const live = liveQs[activeTopic] || []
  const questions = [...base, ...live]

  const solved = questions.filter(q => !!data.arena[q.id])
  const topicXp = solved.reduce((a, q) => a + q.xp, 0)

  async function pullCf() {
    const tag = (cfTagDraft || '').trim() || (ARENA_AXIS_MAP[activeTopic] ? undefined : undefined)
    const cfTag = tag || (activeTopic === 'dsa' ? 'dp' : activeTopic === 'webexp' ? 'implementation' : activeTopic)
    setCfPulling(true)
    try {
      const qs = await pullCfProblems(cfTag)
      if (!qs.length) { showToast('NO PROBLEMS FOUND FOR TAG'); return }
      addLiveQs(activeTopic, qs)
      showToast(qs.length + ' CF PROBLEMS LOADED')
    } catch {
      showToast('CF FETCH FAILED · CHECK NETWORK')
    } finally {
      setCfPulling(false)
    }
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 26px 80px', display: 'flex', gap: 24, alignItems: 'flex-start' }}>
      {/* Topic rail */}
      <div style={{ width: 200, flexShrink: 0 }}>
        <div style={{ font: "700 9px 'Share Tech Mono'", letterSpacing: '.22em', color: 'var(--mut)', marginBottom: 12 }}>TOPICS</div>
        {topics.map(t => {
          const on = activeTopic === t
          const def = ARENA[t]
          const tot = [...(def.questions || []), ...(liveQs[t] || [])].length
          const solv = [...(def.questions || []), ...(liveQs[t] || [])].filter(q => !!data.arena[q.id]).length
          return (
            <div
              key={t}
              onClick={() => setActiveTopic(t)}
              style={{
                cursor: 'pointer', padding: '11px 14px', borderRadius: 5, marginBottom: 6,
                border: on ? '1px solid var(--a2)' : '1px solid rgba(var(--rgb),.1)',
                background: on ? 'rgba(var(--a2rgb),.1)' : 'transparent',
              }}
            >
              <div style={{ font: "700 11px 'Rajdhani'", color: on ? 'var(--a2)' : 'var(--ink)', letterSpacing: '.06em' }}>{def?.name || t.toUpperCase()}</div>
              <div style={{ font: "400 8px 'Share Tech Mono'", color: 'var(--mut)', marginTop: 4 }}>{solv}/{tot} solved</div>
            </div>
          )
        })}

        {/* CF pull */}
        <div style={{ marginTop: 18, border: '1px solid rgba(var(--rgb),.12)', borderRadius: 6, padding: 14 }}>
          <div style={{ font: "700 9px 'Share Tech Mono'", letterSpacing: '.2em', color: 'var(--mut)', marginBottom: 8 }}>CF PULL</div>
          <input
            value={cfTagDraft}
            onChange={e => setCfTag(e.target.value)}
            placeholder="tag (e.g. dp, graphs)"
            style={{ width: '100%', background: 'var(--bg0)', border: '1px solid rgba(var(--rgb),.18)', borderRadius: 4, color: 'var(--ink)', fontSize: 10, padding: '8px', outline: 'none', marginBottom: 8 }}
          />
          <button
            onClick={pullCf}
            disabled={cfPulling}
            style={{ cursor: 'pointer', width: '100%', border: '1px solid rgba(var(--a2rgb),.25)', background: 'rgba(var(--a2rgb),.08)', color: 'var(--a2)', font: "700 9px 'Share Tech Mono'", letterSpacing: '.1em', padding: 9, borderRadius: 4 }}
          >{cfPulling ? 'LOADING…' : 'PULL FROM CF'}</button>
        </div>
      </div>

      {/* Questions list */}
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <div style={{ font: "700 20px 'Rajdhani'", color: 'var(--ink)', letterSpacing: '.04em' }}>{topicDef?.name || activeTopic.toUpperCase()}</div>
            <div style={{ font: "400 9px 'Share Tech Mono'", color: 'var(--mut)', marginTop: 3 }}>
              {solved.length}/{questions.length} solved · +{topicXp} XP earned
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {questions.map(q => {
            const isSolved = !!data.arena[q.id]
            const ps = DIFF_PILL_STYLE[q.diff] || DIFF_PILL_STYLE.M
            return (
              <div
                key={q.id}
                onClick={() => openQ(activeTopic, q.id)}
                style={{
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '13px 16px', borderRadius: 6,
                  border: isSolved ? '1px solid rgba(var(--a2rgb),.22)' : '1px solid rgba(var(--rgb),.1)',
                  background: isSolved ? 'rgba(var(--a2rgb),.05)' : 'rgba(var(--rgb),.03)',
                  transition: 'border-color .15s',
                }}
              >
                <span style={{ fontSize: 14, width: 20, textAlign: 'center', opacity: isSolved ? 1 : 0.3 }}>
                  {isSolved ? '✓' : '○'}
                </span>
                <span style={{ flex: 1, font: "500 12px 'Inter'", color: isSolved ? 'var(--txt)' : 'var(--ink)', textDecoration: isSolved ? 'line-through' : 'none', textDecorationColor: 'var(--mut)' }}>
                  {q.title}
                </span>
                <span style={{ font: "700 9px 'Share Tech Mono'", ...ps, padding: '3px 8px', borderRadius: 3 }}>{q.diff}</span>
                <span style={{ font: "700 10px 'Rajdhani'", color: 'var(--a2)' }}>+{q.xp}</span>
                {q.live && <span style={{ font: "400 8px 'Share Tech Mono'", color: 'var(--dim2)' }}>CF</span>}
              </div>
            )
          })}
        </div>

        {questions.length === 0 && (
          <div style={{ font: "400 10px 'Share Tech Mono'", color: 'var(--dim2)', textAlign: 'center', padding: 40 }}>
            No questions for this topic yet. Pull from Codeforces.
          </div>
        )}
      </div>
    </div>
  )
}
