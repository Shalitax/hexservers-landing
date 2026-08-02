import { Check, Star } from 'lucide-react'
import { cx } from '../../lib/utils.js'

/**
 * Tarjeta seleccionable del configurador. La usan tanto el bloque de ubicación
 * (bandera + ciudad) como el de CPU (icono + modelo): cambia el contenido, no el
 * comportamiento.
 */
export default function OptionCard({
  selected,
  disabled,
  onSelect,
  leading,
  title,
  subtitle,
  badge,
  aside,
  meta,
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      aria-pressed={selected}
      className={cx(
        'glass relative flex w-full flex-col p-4 text-left transition duration-200',
        disabled && 'pointer-events-none opacity-50',
        !disabled && !selected && 'glass-hover hover:-translate-y-0.5',
        selected && 'border-hex-500/60 bg-hex-500/[0.1]',
      )}
    >
      <div className="flex items-center gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center">{leading}</span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="display truncate text-base font-bold text-white">{title}</span>
            {badge && (
              <span className="chip pixel border-hex-400/30 bg-hex-500/15 !text-[8px] !text-hex-200">
                <Star size={9} className="fill-current" />
                {badge}
              </span>
            )}
          </div>
          {subtitle && <p className="mt-0.5 truncate text-xs text-slate-500">{subtitle}</p>}
        </div>

        {aside}

        {/* Marca de selección: sustituye al chevron de «ir al siguiente paso» */}
        <span
          className={cx(
            'grid size-5 shrink-0 place-items-center rounded-full border transition',
            selected ? 'border-hex-400 bg-hex-500' : 'border-white/20',
          )}
          aria-hidden="true"
        >
          {selected && <Check size={12} className="text-white" strokeWidth={3.5} />}
        </span>
      </div>

      {meta && <div className="mt-3 border-t border-white/8 pt-3 text-xs text-slate-500">{meta}</div>}
    </button>
  )
}
