import { useStore } from '../../store/useStore'
import { ModalShell, ModalLabel, inputStyle, SubmitBtn } from './ModalShell'

const PRESET_CATS = [
  { value: 'hacking',  label: 'hacking'   },
  { value: 'manga',    label: 'manga'      },
  { value: 'manhwa',   label: 'manhwa'     },
  { value: 'manhua',   label: 'manhua'     },
  { value: 'webnovel', label: 'web novel'  },
  { value: 'novel',    label: 'novel'      },
  { value: 'fiction',  label: 'fiction'    },
  { value: 'other',    label: 'other'      },
  { value: '__custom__', label: '+ new category…' },
]

export function AddBookModal() {
  const draft   = useStore(s => s.draft)
  const setDraft = useStore(s => s.setDraft)
  const addBook  = useStore(s => s.addBook)

  const isCustom = draft.nbCategory === '__custom__'

  return (
    <ModalShell kicker="READING LAB" title="Add Book / Doc">
      <ModalLabel>TITLE</ModalLabel>
      <input
        value={draft.nbTitle}
        onChange={e => setDraft(d => ({ ...d, nbTitle: e.target.value }))}
        placeholder="e.g. Gray Hat Hacking 4e"
        style={inputStyle}
      />

      <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 120 }}>
          <ModalLabel>CATEGORY</ModalLabel>
          <select
            value={draft.nbCategory}
            onChange={e => setDraft(d => ({ ...d, nbCategory: e.target.value }))}
            style={{ ...inputStyle, color: 'var(--txt)', fontSize: 11, padding: '8px 6px' }}
          >
            {PRESET_CATS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
        <div style={{ flex: 1, minWidth: 100 }}>
          <ModalLabel>STATUS</ModalLabel>
          <select
            value={draft.nbStatus}
            onChange={e => setDraft(d => ({ ...d, nbStatus: e.target.value }))}
            style={{ ...inputStyle, color: 'var(--txt)', fontSize: 11, padding: '8px 6px' }}
          >
            <option value="ongoing">ongoing</option>
            <option value="completed">completed</option>
          </select>
        </div>
      </div>

      {isCustom && (
        <div style={{ marginTop: 8 }}>
          <ModalLabel>CATEGORY NAME</ModalLabel>
          <input
            value={draft.nbCustomCat}
            onChange={e => setDraft(d => ({ ...d, nbCustomCat: e.target.value }))}
            placeholder="e.g. philosophy, biography, devops…"
            style={{ ...inputStyle, border: '1px solid rgba(var(--a2rgb),.35)' }}
            autoFocus
          />
        </div>
      )}

      <div style={{ marginTop: 10 }}>
        <ModalLabel>AUTHOR <span style={{ color: 'var(--dim2)', fontWeight: 400 }}>(optional)</span></ModalLabel>
        <input
          value={draft.nbAuthor}
          onChange={e => setDraft(d => ({ ...d, nbAuthor: e.target.value }))}
          placeholder="e.g. Harper Lee"
          style={{ ...inputStyle, fontSize: 11 }}
        />
      </div>

      <div style={{ marginTop: 10 }}>
        <ModalLabel>PUBLISHER / SOURCE <span style={{ color: 'var(--dim2)', fontWeight: 400 }}>(optional)</span></ModalLabel>
        <input
          value={draft.nbPublisher}
          onChange={e => setDraft(d => ({ ...d, nbPublisher: e.target.value }))}
          placeholder="e.g. No Starch Press"
          style={{ ...inputStyle, fontSize: 11 }}
        />
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <div style={{ flex: 1 }}>
          <ModalLabel>UNIT</ModalLabel>
          <select
            value={draft.nbUnit}
            onChange={e => setDraft(d => ({ ...d, nbUnit: e.target.value }))}
            style={{ ...inputStyle, color: 'var(--txt)', fontSize: 11, padding: '8px 6px' }}
          >
            <option value="pages">pages</option>
            <option value="chapters">chapters</option>
            <option value="sections">sections</option>
            <option value="questions">questions</option>
          </select>
        </div>
        <div style={{ flex: '0 0 90px' }}>
          <ModalLabel>TOTAL</ModalLabel>
          <input
            type="number" value={draft.nbTotal}
            onChange={e => setDraft(d => ({ ...d, nbTotal: e.target.value }))}
            placeholder="e.g. 400" min={1}
            style={{ ...inputStyle, fontSize: 11, padding: '8px 6px' }}
          />
        </div>
      </div>

      <div style={{ marginTop: 12, font: "400 9px 'Roboto Mono'", color: 'var(--dim2)', lineHeight: 1.5 }}>
        hacking / technical → full XP · manga / fiction / novels → lower XP
      </div>

      <SubmitBtn onClick={addBook}>ADD TO LIBRARY</SubmitBtn>
    </ModalShell>
  )
}
