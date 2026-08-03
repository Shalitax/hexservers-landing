import { useMemo, useState } from 'react'
import { ArrowUpRight, Check, Info, Settings2, ShieldCheck } from 'lucide-react'
import { useSite, useCurrency, useMoney, featuresOfPlan } from '../../store/useSite.js'
import { buildOrderUrl, computePrice, defaultSelection } from '../../lib/whmcs.js'
import { cx } from '../../lib/utils.js'
import { Icon, Glyph, glyphBox } from '../ui/icons.jsx'
import Flag from '../ui/Flag.jsx'
import StatusPill from './StatusPill.jsx'

/**
 * Último paso: el cliente ya eligió plan y aquí ve todo lo que incluye, ajusta las
 * opciones configurables y sale hacia el carrito de WHMCS.
 */
export default function PlanDetail({ product, plan, location, cpu, editMode, onEditPlan }) {
  const whmcs = useSite((s) => s.site.whmcs)
  const catalog = useSite((s) => s.site.catalog)
  const currency = useCurrency()
  const money = useMoney()
  const [selection, setSelection] = useState(() => defaultSelection(plan))

  const features = featuresOfPlan(product, plan)
  const total = useMemo(() => computePrice(plan, selection), [plan, selection])
  // El carrito se abre en la misma divisa que el visitante estaba viendo.
  const orderUrl = useMemo(
    () => buildOrderUrl(plan, selection, whmcs, currency),
    [plan, selection, whmcs, currency],
  )
  const urlConfigured = orderUrl !== '#'
  const buyable = plan.status === 'available'

  return (
    <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr] lg:items-start">
      {/* ------------------------------ Contenido ------------------------------ */}
      <div className="space-y-6">
        <div className="glass p-6 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="eyebrow mb-2">{product.name}</div>
              <h2 className="display text-2xl font-bold text-white sm:text-3xl">{plan.name}</h2>
              {plan.description && (
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{plan.description}</p>
              )}

              {/* Grupo de WHMCS al que pertenece este plan */}
              {(location || cpu) && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {location && (
                    <span className="chip !text-[11px]">
                      <Flag flag={location.flag} size={14} />
                      {location.city}
                    </span>
                  )}
                  {cpu && (
                    <span className="chip !text-[11px]">
                      <Icon name={cpu.icon} size={11} className="text-hex-400" />
                      {cpu.name}
                    </span>
                  )}
                </div>
              )}
            </div>
            {!buyable && <StatusPill status={plan.status} />}
          </div>

          {/* Especificaciones del plan */}
          {plan.specs?.length > 0 && (
            <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-white/8 pt-6 sm:grid-cols-3">
              {plan.specs.map((spec) => (
                <div key={spec.id} className="min-w-0">
                  <dt className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
                    {spec.label}
                  </dt>
                  <dd className="mt-1 truncate text-sm font-semibold text-slate-100">
                    {spec.value || '—'}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </div>

        {/* Checklist de lo incluido */}
        {plan.includes?.length > 0 && (
          <section className="glass p-6 sm:p-7">
            <h3 className="display text-lg font-bold text-white">{catalog.detailTitle}</h3>
            <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
              {plan.includes.map((item) => (
                <li key={item.id} className="flex items-start gap-2.5 text-sm text-slate-300">
                  <span className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full border border-emerald-400/40 bg-emerald-400/15">
                    <Check size={10} className="text-emerald-300" strokeWidth={3.5} />
                  </span>
                  {item.text}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Funciones (propias del plan o heredadas del producto) */}
        {features.length > 0 && (
          <section className="glass p-6 sm:p-7">
            <h3 className="display text-lg font-bold text-white">Funciones incluidas</h3>
            <p className="mt-1 text-sm text-slate-500">
              Todo esto viene de serie, sin coste adicional.
            </p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {features.map((item) => (
                <article key={item.id} className="glass-soft flex gap-3 p-4">
                  <span
                    className={cx(
                      'grid size-9 shrink-0 place-items-center rounded-lg border border-white/10',
                      glyphBox(item.image),
                    )}
                  >
                    <Glyph name={item.icon} image={item.image} size={item.image ? 24 : 17} />
                  </span>
                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold text-white">{item.title}</h4>
                    <p className="mt-1 text-xs leading-relaxed text-slate-500">{item.description}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {editMode && (
          <button
            onClick={() => onEditPlan(plan.id)}
            className="btn-ghost btn-sm w-full border-hex-500/30 bg-hex-500/10 py-2.5 text-hex-200"
          >
            <Settings2 size={14} />
            Editar este plan (specs, incluye, funciones y WHMCS)
          </button>
        )}
      </div>

      {/* ------------------------------- Resumen ------------------------------- */}
      <aside className="glass p-6 lg:sticky lg:top-24">
        {/* Opciones configurables */}
        {plan.hasConfigurableOptions && plan.configurableOptions?.length > 0 && (
          <div className="space-y-5 border-b border-white/8 pb-6">
            <h3 className="display text-base font-bold text-white">Configura tu plan</h3>
            {plan.configurableOptions.map((option) => (
              <fieldset key={option.id}>
                <legend className="mb-2 text-xs font-semibold tracking-wide text-slate-400 uppercase">
                  {option.name}
                </legend>
                <div className="space-y-2">
                  {option.values?.map((value) => {
                    const active = selection[option.id] === value.id
                    return (
                      <button
                        key={value.id}
                        type="button"
                        onClick={() => setSelection((prev) => ({ ...prev, [option.id]: value.id }))}
                        aria-pressed={active}
                        className={cx(
                          'flex w-full items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 text-left transition',
                          active
                            ? 'border-hex-500/60 bg-hex-500/12'
                            : 'border-white/10 bg-white/[0.03] hover:border-white/25 hover:bg-white/[0.06]',
                        )}
                      >
                        <span className="flex min-w-0 items-center gap-2.5">
                          <span
                            className={cx(
                              'grid size-4 shrink-0 place-items-center rounded-full border transition',
                              active ? 'border-hex-400 bg-hex-500' : 'border-white/25',
                            )}
                          >
                            {active && <Check size={10} className="text-white" strokeWidth={3.5} />}
                          </span>
                          <span className="truncate text-sm font-medium text-slate-200">
                            {value.label}
                          </span>
                        </span>
                        <span
                          className={cx(
                            'shrink-0 text-xs font-semibold',
                            Number(value.priceDelta) > 0 ? 'text-hex-300' : 'text-slate-500',
                          )}
                        >
                          {Number(value.priceDelta) > 0
                            ? `+${money(value.priceDelta)}`
                            : 'Incluido'}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </fieldset>
            ))}
          </div>
        )}

        {/* Total */}
        <div className="pt-6 first:pt-0">
          <div className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
            Total {plan.period?.replace('/', 'al ') || 'al mes'}
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="pixel text-2xl text-white">{money(total)}</span>
            {total !== Number(plan.price) && (
              <span className="text-xs text-slate-600 line-through">
                {money(plan.price)}
              </span>
            )}
          </div>

          <a
            href={orderUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(event) => {
              if (!urlConfigured || !buyable) event.preventDefault()
            }}
            aria-disabled={!urlConfigured || !buyable}
            className={cx(
              'btn-primary mt-4 w-full py-3',
              (!urlConfigured || !buyable) && 'pointer-events-none opacity-45',
            )}
          >
            {buyable ? catalog.checkoutLabel : 'No disponible'}
            <ArrowUpRight size={16} />
          </a>

          <p className="mt-3 flex items-start gap-2 text-[11px] leading-relaxed text-slate-500">
            <ShieldCheck size={13} className="mt-px shrink-0 text-emerald-400/80" />
            {catalog.checkoutHint}
          </p>
        </div>

        {!urlConfigured && (
          <p className="mt-4 flex items-start gap-2 rounded-xl border border-amber-400/25 bg-amber-400/[0.07] p-3 text-[11px] leading-relaxed text-amber-200">
            <Info size={13} className="mt-px shrink-0" />
            Este plan aún no tiene URL de WHMCS. Defínela en el panel → Catálogo → {plan.name}.
          </p>
        )}
      </aside>
    </div>
  )
}
