import { useSite, useBillingCycle, useMoney } from '../../store/useSite.js'
import { cycleTotal, usableCycles } from '../../lib/billing.js'
import { cx } from '../../lib/utils.js'

/**
 * Selector del ciclo de facturación, para el visitante.
 *
 * Sólo aparece si el admin lo ha encendido y ha puesto algún descuento: sin
 * descuentos serían cuatro botones que dejan el precio donde estaba. Por eso la
 * lista sale de `usableCycles` y no de la constante entera.
 *
 * Lo que se ve al pulsar es el equivalente mensual rebajado — la explicación larga
 * de por qué, en src/lib/billing.js.
 */
export default function BillingCyclePicker() {
  const enabled = useSite((s) => s.site.catalog.showCycles === true)
  const discounts = useSite((s) => s.site.catalog.cycleDiscounts)
  const setViewerCycle = useSite((s) => s.setViewerCycle)
  const active = useBillingCycle()

  const cycles = usableCycles(discounts)
  if (!enabled || cycles.length < 2) return null

  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <span className="text-micro font-semibold tracking-wider text-slate-500 uppercase">
        Pago por
      </span>

      <div
        role="group"
        aria-label="Ciclo de facturación"
        className="glass-soft flex flex-wrap items-center gap-1 p-1"
      >
        {cycles.map((cycle) => {
          const discount = Number(discounts?.[cycle.id]) || 0
          return (
            <button
              key={cycle.id}
              onClick={() => setViewerCycle(cycle.id)}
              aria-pressed={active.id === cycle.id}
              className={cx(
                'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition',
                active.id === cycle.id
                  ? 'bg-hex-500/20 text-white ring-1 ring-hex-500/40'
                  : 'text-slate-500 hover:bg-surface-2 hover:text-white',
              )}
            >
              {cycle.short}
              {discount > 0 && (
                <span
                  className={cx(
                    'rounded px-1 py-0.5 text-micro font-bold tabular-nums',
                    active.id === cycle.id
                      ? 'bg-emerald-400/20 text-emerald-300'
                      : 'bg-surface-2 text-emerald-400/70',
                  )}
                >
                  -{discount}%
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/**
 * Aviso de lo que se cobra de verdad y cada cuánto.
 *
 * El precio grande de las tarjetas es el equivalente mensual, así que en el ciclo
 * anual hay un número —el del cargo— que el cliente no ha visto por ninguna parte.
 * Esta línea lo dice, y no aparece en el ciclo mensual porque ahí no hay nada que
 * aclarar: el precio grande ya es el cargo.
 */
export function CycleNote({ price, className = '' }) {
  const cycle = useBillingCycle()
  const money = useMoney()

  if (cycle.months <= 1) return null

  return (
    <p className={cx('text-micro leading-snug text-slate-500', className)}>
      {money(cycleTotal(price, cycle))} cada {cycle.months} meses
    </p>
  )
}
