import { useEffect, useRef } from 'react'
import { PackageOpen, Plus } from 'lucide-react'
import { useSite, useMoney } from '../../store/useSite.js'
import { planMatches, fromPrice } from '../../lib/catalog.js'
import { cx } from '../../lib/utils.js'
import { Icon } from '../ui/icons.jsx'
import Flag from '../ui/Flag.jsx'
import OptionCard from './OptionCard.jsx'
import PlanCard from './PlanCard.jsx'

/**
 * Configurador de un producto en una sola página: ubicación → CPU → planes.
 *
 * Cada bloque aparece cuando el anterior está resuelto y la vista baja sola hasta
 * él, así que el cliente nunca cambia de pantalla ni pierde de vista lo que ya ha
 * elegido (puede tocarlo otra vez sin volver atrás).
 *
 * La selección la guarda la URL, no este componente: `onSelect` navega y el nuevo
 * estado baja por props. Así el botón atrás deshace la última elección.
 */
export default function Configurator({
  product,
  plans,
  flow,
  editMode,
  onSelect,
  onChoosePlan,
  onAddPlan,
  onEditPlan,
}) {
  const sections = useSite((s) => s.site.catalog.sections)
  const money = useMoney()

  const cpuRef = useRef(null)
  const plansRef = useRef(null)
  const firstRender = useRef(true)

  /* Al elegir algo, la vista baja al bloque que se acaba de abrir. En la primera
     pintada no: ahí la selección viene de la URL y el visitante espera ver la
     ficha desde arriba. */
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    const target = flow.ready ? plansRef.current : cpuRef.current
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [flow.locationId, flow.cpuId, flow.ready])

  // Numeración de los bloques visibles: sólo se cuentan los que existen.
  let step = 0
  const number = () => (step += 1)

  return (
    <div className="space-y-10">
      {flow.hasLocationChoice && (
        <Block
          number={number()}
          title={sections.location}
          hint={sections.locationHint}
          chosen={flow.locations.find((item) => item.id === flow.locationId)?.city}
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {flow.locations.map((location) => {
              const available = plans.filter((plan) => planMatches(plan, { locationId: location.id }))
              const price = fromPrice(available)
              const soon = location.status === 'soon' || price === null

              return (
                <OptionCard
                  key={location.id}
                  selected={flow.locationId === location.id}
                  disabled={soon}
                  onSelect={() => onSelect({ locationId: location.id, cpuId: '' })}
                  leading={<Flag flag={location.flag} size={36} />}
                  title={location.city}
                  subtitle={location.country}
                  aside={
                    location.ping && !soon ? (
                      <span className="chip shrink-0 !text-[10px]" title="Latencia de referencia">
                        {location.ping}
                      </span>
                    ) : null
                  }
                  meta={
                    soon ? (
                      'Próximamente'
                    ) : (
                      <>
                        {available.length === 1 ? '1 plan' : `${available.length} planes`} · desde{' '}
                        <span className="text-slate-300">{money(price)}</span>
                      </>
                    )
                  }
                />
              )
            })}
          </div>
        </Block>
      )}

      {flow.showCpu && (
        <Block
          blockRef={cpuRef}
          number={number()}
          title={sections.cpu}
          hint={sections.cpuHint}
          chosen={flow.cpus.find((item) => item.id === flow.cpuId)?.name}
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {flow.cpus.map((cpu) => {
              const available = plans.filter((plan) =>
                planMatches(plan, { locationId: flow.locationId, cpuId: cpu.id }),
              )
              const price = fromPrice(available)

              return (
                <OptionCard
                  key={cpu.id}
                  selected={flow.cpuId === cpu.id}
                  disabled={price === null}
                  onSelect={() => onSelect({ locationId: flow.locationId, cpuId: cpu.id })}
                  leading={
                    <span className="grid size-11 place-items-center rounded-xl border border-white/10 bg-gradient-to-br from-hex-500/20 to-plasma-500/15 text-hex-300">
                      <Icon name={cpu.icon} size={20} />
                    </span>
                  }
                  title={cpu.name}
                  subtitle={cpu.tagline}
                  badge={cpu.badge}
                  meta={
                    price === null ? (
                      'Sin planes en esta ubicación'
                    ) : (
                      <>
                        {cpu.description ? `${cpu.description} · ` : ''}desde{' '}
                        <span className="text-slate-300">{money(price)}</span>
                      </>
                    )
                  }
                />
              )
            })}
          </div>
        </Block>
      )}

      {/* El producto puede poner su propio título; si no, el general del catálogo. */}
      <Block
        blockRef={plansRef}
        number={number()}
        title={product.plansTitle || sections.plans}
        hint={product.plansSubtitle || sections.plansHint}
        muted={!flow.ready}
      >
        {!flow.ready ? (
          <p className="glass p-8 text-center text-sm text-slate-500">
            Elige {flow.hasLocationChoice && !flow.locationId ? 'la ubicación' : 'el procesador'}{' '}
            para ver los planes disponibles.
          </p>
        ) : flow.plans.length > 0 ? (
          <div
            className={cx(
              'grid gap-5 sm:grid-cols-2',
              flow.plans.length >= 3 && 'lg:grid-cols-3',
              flow.plans.length >= 4 && 'xl:grid-cols-4',
            )}
          >
            {flow.plans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                editMode={editMode}
                onEdit={onEditPlan}
                onChoose={() => onChoosePlan(plan)}
              />
            ))}

            {editMode && (
              <button
                onClick={onAddPlan}
                className="glass glass-hover flex min-h-[18rem] flex-col items-center justify-center gap-3 border-dashed text-slate-500 hover:text-white"
              >
                <Plus size={26} />
                <span className="text-sm font-semibold">Añadir plan</span>
              </button>
            )}
          </div>
        ) : (
          <div className="glass flex flex-col items-center gap-3 p-12 text-center">
            <PackageOpen size={28} className="text-slate-600" />
            <p className="text-sm text-slate-500">
              {flow.hasLocationChoice || flow.hasCpuChoice
                ? 'No hay planes para esta combinación.'
                : `${product.name} todavía no tiene planes.`}
            </p>
            {editMode && (
              <button onClick={onAddPlan} className="btn-primary btn-sm mt-1">
                <Plus size={14} />
                Añadir el primero
              </button>
            )}
          </div>
        )}
      </Block>
    </div>
  )
}

/* --------------------------- envoltorio de un bloque -------------------------- */

// React 18 no pasa `ref` a componentes de función: por eso viaja como prop normal.
function Block({ blockRef, number, title, hint, chosen, muted, children }) {
  return (
    <section ref={blockRef} className="scroll-mt-28">
      <header className="mb-5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span
          className={cx(
            'grid size-7 shrink-0 place-items-center rounded-full border text-xs font-bold',
            muted ? 'border-white/10 text-slate-600' : 'border-hex-500/40 bg-hex-500/15 text-hex-200',
          )}
        >
          {number}
        </span>
        <h2 className={cx('display text-xl font-bold', muted ? 'text-slate-500' : 'text-white')}>
          {title}
        </h2>
        {chosen && <span className="chip !text-[11px] !text-hex-200">{chosen}</span>}
        {hint && <p className="w-full text-sm text-slate-500 sm:w-auto">{hint}</p>}
      </header>
      {children}
    </section>
  )
}
