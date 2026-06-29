import { useStore } from '../../store/useStore'
import { ARENA } from '../../data/arena'
import { ModalShell, ModalLabel, inputStyle, SubmitBtn } from './ModalShell'

export function QuestionModal() {
  const activeQ     = useStore(s => s.activeQ)
  const liveQs      = useStore(s => s.liveQuestions)
  const proofDraft  = useStore(s => s.proofDraft)
  const setProof    = useStore(s => s.setProofDraft)
  const solveQ      = useStore(s => s.solveQuestion)

  if (!activeQ) return null
  const { topic, qid } = activeQ
  const base = (ARENA[topic]?.questions) || []
  const live = liveQs[topic] || []
  const q = [...base, ...live].find(x => x.id === qid)
  if (!q) return null

  const DIFF_COLOR: Record<string, string> = { E: '#39ff88', M: '#caa24a', H: '#ff5a5a' }

  return (
    <ModalShell kicker="ARENA // CHALLENGE" title={q.title}>
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        {[
          { label: 'DIFFICULTY', value: q.diff, style: { color: DIFF_COLOR[q.diff] || 'var(--a2)' } },
          { label: 'REWARD', value: '+' + q.xp + ' XP', style: { color: 'var(--a2)' } },
          { label: 'TOPIC', value: topic.toUpperCase(), style: { color: 'var(--txt)' } },
        ].map(({ label, value, style }) => (
          <div key={label} style={{ flex: 1, background: 'rgba(var(--rgb),.05)', borderRadius: 4, padding: 10, textAlign: 'center' }}>
            <div style={{ font: "500 9px 'Roboto Mono'", color: 'var(--mut)' }}>{label}</div>
            <div style={{ font: "500 14px 'Lexend Deca'", marginTop: 3, ...style }}>{value}</div>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: 16 }}>
        <a
          href={q.url}
          target="_blank" rel="noopener"
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            border: '1px solid rgba(var(--a2rgb),.25)', borderRadius: 5,
            background: 'rgba(var(--a2rgb),.05)', padding: '11px 14px',
            color: 'var(--a2)', font: "500 12px 'Lexend Deca'", letterSpacing: '.05em',
            textDecoration: 'none',
          }}
        >
          <span>↗</span> OPEN CHALLENGE
        </a>
      </div>

      <ModalLabel>PROOF / SUBMISSION LINK (REQUIRED)</ModalLabel>
      <input
        value={proofDraft}
        onChange={e => setProof(e.target.value)}
        placeholder="https://github.com/... writeup or CTFtime URL"
        style={inputStyle}
      />
      <div style={{ font: "400 9px 'Roboto Mono'", color: 'var(--dim2)', marginTop: 7, lineHeight: 1.5 }}>
        Paste a public link to your writeup or solution. No URL = no mark.
      </div>

      <SubmitBtn onClick={solveQ}>MARK SOLVED → +{q.xp} XP</SubmitBtn>
    </ModalShell>
  )
}
