import { TARGET_AREAS, type TargetArea } from '../lib/exercises'

/** A row of chips to narrow exercises to one body area. */
export function AreaChips({ value, onChange }: { value: TargetArea | null; onChange: (a: TargetArea | null) => void }) {
  return (
    <div className="chips" role="tablist" aria-label="Target area">
      <button role="tab" aria-selected={!value} className={`chip ${!value ? 'active' : ''}`} onClick={() => onChange(null)}>
        Any area
      </button>
      {TARGET_AREAS.map((a) => (
        <button key={a} role="tab" aria-selected={value === a} className={`chip ${value === a ? 'active' : ''}`} onClick={() => onChange(value === a ? null : a)}>
          {a}
        </button>
      ))}
    </div>
  )
}
