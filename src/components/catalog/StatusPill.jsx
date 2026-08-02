import { PRODUCT_STATUS } from '../../data/defaultState.js'
import { cx } from '../../lib/utils.js'

const TONES = {
  emerald: 'border-emerald-400/25 bg-emerald-400/10 text-emerald-300',
  rose: 'border-rose-400/25 bg-rose-400/10 text-rose-300',
  amber: 'border-amber-400/25 bg-amber-400/10 text-amber-300',
}

/** Píldora de estado compartida por productos y planes. */
export default function StatusPill({ status, className = '' }) {
  const meta = PRODUCT_STATUS[status] || PRODUCT_STATUS.available
  return (
    <span
      className={cx(
        'inline-flex items-center rounded-full border px-2 py-px text-[10px] font-semibold',
        TONES[meta.tone],
        className,
      )}
    >
      {meta.label}
    </span>
  )
}
