import { useStore } from '../../store/useStore'
import { nodeById } from '../../data/village'
import { isNodeCleared, isNodeUnlocked } from '../../store/selectors'
import { ModalShell, ModalLabel, inputStyle, SubmitBtn } from './ModalShell'

export function NodeModal() {
  const data       = useStore(s => s.data)
  const activeNode = useStore(s => s.activeNode)
  const proofDraft = useStore(s => s.proofDraft)
  const setProof   = useStore(s => s.setProofDraft)
  const clearNode  = useStore(s => s.clearNode)
  const unclearNode = useStore(s => s.unclearNode)

  if (!activeNode) return null
  const n = nodeById(activeNode)
  if (!n) return null

  const cleared  = isNodeCleared(data, n.id)
  const unlocked = isNodeUnlocked(data, n.req)
  const prereqNames = n.req.map(r => nodeById(r)?.name || r).join(', ')

  return (
    <ModalShell kicker="VILLAGE NODE" title={n.name}>
      <div style={{ font: "400 11px 'Inter'", color: 'var(--txt)', lineHeight: 1.5, marginBottom: 14 }}>
        {n.desc}
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        {[
          { label: 'AXIS',   value: n.axis.toUpperCase() },
          { label: 'REWARD', value: '+' + n.xp + ' XP', accent: true },
          { label: 'PREREQS', value: n.req.length ? String(n.req.length) : 'none' },
        ].map(({ label, value, accent }) => (
          <div key={label} style={{ flex: 1, background: 'rgba(var(--rgb),.05)', borderRadius: 4, padding: 10, textAlign: 'center' }}>
            <div style={{ font: "700 9px 'Share Tech Mono'", color: 'var(--mut)' }}>{label}</div>
            <div style={{ font: "700 13px 'Rajdhani'", color: accent ? 'var(--a2)' : 'var(--ink)', marginTop: 3 }}>{value}</div>
          </div>
        ))}
      </div>

      {cleared && (
        <div style={{ background: 'rgba(var(--a2rgb),.08)', border: '1px solid rgba(var(--a2rgb),.25)', borderRadius: 5, padding: 14, textAlign: 'center' }}>
          <div style={{ font: "700 14px 'Rajdhani'", color: 'var(--a2)', letterSpacing: '.05em' }}>✓ NODE CLEARED</div>
          <div style={{ font: "400 10px 'Share Tech Mono'", color: 'var(--mut)', marginTop: 6, wordBreak: 'break-all' }}>
            PROOF: <a href={data.village[n.id].proof} target="_blank" rel="noopener" style={{ color: 'var(--a)' }}>{data.village[n.id].proof}</a>
          </div>
          <button
            onClick={unclearNode}
            style={{ cursor: 'pointer', marginTop: 12, border: '1px solid rgba(255,90,90,.3)', background: 'transparent', color: '#c0746f', font: "400 10px 'Share Tech Mono'", letterSpacing: '.1em', padding: '8px 14px', borderRadius: 4 }}
          >MARK INCOMPLETE</button>
        </div>
      )}

      {!cleared && unlocked && (
        <div>
          <ModalLabel>PROOF LINK (REQUIRED)</ModalLabel>
          <input
            value={proofDraft}
            onChange={e => setProof(e.target.value)}
            placeholder="https://github.com/... or writeup / lab URL"
            style={inputStyle}
          />
          <div style={{ font: "400 9px 'Share Tech Mono'", color: 'var(--dim2)', marginTop: 7, lineHeight: 1.5 }}>
            No proof, no clear. Paste a link to the writeup, PR, lab completion, or submission.
          </div>
          <SubmitBtn onClick={clearNode}>CLEAR NODE → +{n.xp} XP</SubmitBtn>
        </div>
      )}

      {!cleared && !unlocked && (
        <div style={{ background: 'rgba(255,90,90,.06)', border: '1px solid rgba(255,90,90,.2)', borderRadius: 5, padding: 16, textAlign: 'center' }}>
          <div style={{ font: "700 13px 'Rajdhani'", color: '#c0746f', letterSpacing: '.05em' }}>🔒 LOCKED</div>
          <div style={{ font: "400 10px 'Share Tech Mono'", color: 'var(--mut)', marginTop: 6, lineHeight: 1.5 }}>
            Clear the prerequisites first: <span style={{ color: 'var(--txt)' }}>{prereqNames}</span>
          </div>
        </div>
      )}
    </ModalShell>
  )
}
