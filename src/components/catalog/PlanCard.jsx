import { ArrowRight, Check, Settings2, Sliders, Star } from 'lucide-react'
import { useMoney } from '../../store/useSite.js'
import { cx } from '../../lib/utils.js'
import StatusPill from './StatusPill.jsx'

/**
 * Tarjeta de plan de la lista. No lleva a WHMCS: lleva al detalle, donde el cliente
 * ve todo lo que incluye antes de pagar.
 */
export default function PlanCard({ plan, onChoose, editMode, onEdit }) {
  const money = useMoney()
  const buyable = plan.status === 'available'
  const configurable = plan.hasConfigurableOptions && plan.configurableOptions?.length > 0

  return (
    <article
      className={cx(
        'glass flex flex-col p-5 transition duration-300',
        buyable && 'hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.07]',
        plan.featured && 'border-hex-500/35 bg-hex-500/[0.055]',
        !buyable && 'opacity-70',
      )}
    >
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="display truncate text-base font-bold text-white">{plan.name}</h3>
          {plan.status !== 'available' && <StatusPill status={plan.status} className="mt-1.5" />}
        </div>
        {plan.featured && (
          <span className="chip pixel shrink-0 border-hex-400/30 bg-hex-500/15 !text-[8px] !text-hex-200">
            <Star size={9} className="fill-current" />
            POPULAR
          </span>
        )}
      </header>

      {plan.description && (
        <p className="mt-2.5 text-sm leading-relaxed text-slate-400">{plan.description}</p>
      )}

      {/* Especificaciones */}
      <ul className="mt-4 space-y-2 border-t border-white/8 pt-4 text-sm">
        {plan.specs?.map((spec) => (
          <li key={spec.id} className="flex items-baseline justify-between gap-3">
            <span className="shrink-0 text-slate-500">{spec.label}</span>
            <span className="min-w-0 truncate text-right font-medium text-slate-200">
              {spec.value || '—'}
            </span>
          </li>
        ))}
      </ul>

      {/* Adelanto de lo que incluye: la lista completa está en el detalle */}
      {plan.includes?.length > 0 && (
        <ul className="mt-4 space-y-1.5 border-t border-white/8 pt-4">
          {plan.includes.slice(0, 3).map((item) => (
            <li key={item.id} className="flex items-start gap-2 text-[13px] text-slate-400">
              <Check size={13} className="mt-0.5 shrink-0 text-hex-400" />
              {item.text}
            </li>
          ))}
          {plan.includes.length > 3 && (
            <li className="pl-5 text-[11px] text-slate-600">
              y {plan.includes.length - 3} más en el detalle del plan
            </li>
          )}
        </ul>
      )}

      {/* Empuja el precio al pie para que las tarjetas cuadren entre sí */}
      <div className="min-h-5 grow" aria-hidden="true" />

      {/* Precio + acceso al detalle */}
      <div className="flex items-end justify-between gap-3 border-t border-white/8 pt-4">
        <div>
          {configurable && (
            <div className="mb-0.5 text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
              Desde
            </div>
          )}
          <div className="flex items-baseline gap-1">
            <span className="pixel text-lg text-white">
              {money(plan.price)}
            </span>
            <span className="text-xs font-medium text-slate-500">{plan.period}</span>
          </div>
        </div>

        <button
          onClick={() => onChoose(plan)}
          disabled={!buyable}
          className={cx('btn-sm shrink-0 px-4 py-2.5', buyable ? 'btn-primary' : 'btn-ghost')}
        >
          {buyable ? (
            <>
              Elegir plan
              <ArrowRight size={14} />
            </>
          ) : (
            'No disponible'
          )}
        </button>
      </div>

      {configurable && !editMode && (
        <p className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-500">
          <Sliders size={12} className="text-hex-400" />
          {plan.configurableOptions.length} opciones personalizables
        </p>
      )}

      {editMode && (
        <button
          onClick={() => onEdit(plan.id)}
          className="btn-ghost btn-sm mt-3 w-full border-hex-500/30 bg-hex-500/10 text-hex-200"
        >
          <Settings2 size={13} />
          Editar plan
        </button>
      )}
    </article>
  )
}
