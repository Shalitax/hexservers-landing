import { useEffect, useMemo } from 'react'
import { ArrowLeft, ArrowRight, ChevronRight, EyeOff, Layers, PackageOpen, Settings2 } from 'lucide-react'
import { useSite, useMoney, plansOfProduct, findProductBySlug, groupOfProduct } from '../store/useSite.js'
import { buildFlow, fromPrice, findLocation, findCpu } from '../lib/catalog.js'
import { href, groupHref, navigate, productPath } from '../lib/router.js'
import Editable from '../components/ui/Editable.jsx'
import { Icon } from '../components/ui/icons.jsx'
import StatusPill from '../components/catalog/StatusPill.jsx'
import Configurator from '../components/catalog/Configurator.jsx'
import PlanDetail from '../components/catalog/PlanDetail.jsx'

/**
 * Producto: ficha y configurador en la misma página (ubicación → CPU → planes,
 * ver src/lib/catalog.js), y el detalle del plan elegido como pantalla aparte,
 * que es la que lleva al carrito de WHMCS.
 *
 * Lo elegido vive en la URL, no en estado local: el botón atrás deshace la última
 * elección y cualquier pantalla se puede compartir por enlace.
 */
export default function ProductPage({ route, onEditProduct, onEditPlan }) {
  const site = useSite((s) => s.site)
  const editMode = useSite((s) => s.editMode)
  const addPlan = useSite((s) => s.addPlan)

  const product = findProductBySlug(site, route.productSlug)
  const allPlans = useMemo(() => (product ? plansOfProduct(site, product.id) : []), [site, product])
  const selectedPlan = allPlans.find((plan) => plan.id === route.planId) || null

  /* En el detalle, la ubicación y la CPU salen del propio plan: así el enlace de
     volver lleva al configurador tal y como estaba. */
  const locationId = selectedPlan ? selectedPlan.locationId : route.locationId
  const cpuId = selectedPlan ? selectedPlan.cpuId : route.cpuId

  const flow = useMemo(
    () => buildFlow(site, allPlans, { locationId, cpuId }),
    [site, allPlans, locationId, cpuId],
  )

  /* Saneado de la URL: enlaces del recorrido antiguo por pasos y planes que ya no
     existen (borrados, enlaces viejos) caen en el configurador. */
  const stale = route.legacy || (route.stage === 'detail' && !selectedPlan)
  const redirectPath =
    product && stale
      ? productPath(product, 'config', { locationId: flow.locationId, cpuId: flow.cpuId })
      : ''

  useEffect(() => {
    if (redirectPath) navigate(redirectPath, { replace: true })
  }, [redirectPath])

  if (!product) return <NotFound />
  if (redirectPath) return null

  const group = groupOfProduct(site, product)
  const productIndex = site.products.indexOf(product)
  const location = findLocation(site, flow.locationId)
  const cpu = findCpu(site, flow.cpuId)
  const detail = route.stage === 'detail' && selectedPlan

  return (
    <main className="pt-28 pb-20 sm:pt-32 sm:pb-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Migas */}
        <nav aria-label="Ruta" className="flex flex-wrap items-center gap-1 text-xs text-slate-500">
          <a href={href('/')} className="transition hover:text-white">
            Inicio
          </a>
          <ChevronRight size={12} className="text-slate-700" />
          <a href={href('/productos')} className="transition hover:text-white">
            {site.catalog.title}
          </a>
          {group && (
            <>
              <ChevronRight size={12} className="text-slate-700" />
              <a href={groupHref(group)} className="transition hover:text-white">
                {group.name}
              </a>
            </>
          )}
          <ChevronRight size={12} className="text-slate-700" />
          {detail ? (
            <>
              <a
                href={href(
                  productPath(product, 'config', {
                    locationId: flow.locationId,
                    cpuId: flow.cpuId,
                  }),
                )}
                className="transition hover:text-white"
              >
                {product.name}
              </a>
              <ChevronRight size={12} className="text-slate-700" />
              <span className="font-semibold text-slate-300">{selectedPlan.name}</span>
            </>
          ) : (
            <span className="font-semibold text-slate-300">{product.name}</span>
          )}
        </nav>

        {editMode && product.hidden && (
          <p className="mt-4 flex items-center gap-2 rounded-xl border border-amber-400/25 bg-amber-400/[0.07] p-3 text-[11px] text-amber-200">
            <EyeOff size={13} className="shrink-0" />
            Este producto está oculto: no aparece en el catálogo ni en la portada, sólo se llega
            por enlace directo.
          </p>
        )}

        {detail ? (
          <div className="mt-6 space-y-6">
            <a
              href={href(
                productPath(product, 'config', {
                  locationId: flow.locationId,
                  cpuId: flow.cpuId,
                }),
              )}
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 transition hover:text-white"
            >
              <ArrowLeft size={15} />
              Volver a los planes
            </a>

            {/* `key`: cambiar de plan reinicia la selección de opciones configurables. */}
            <PlanDetail
              key={selectedPlan.id}
              product={product}
              plan={selectedPlan}
              location={location}
              cpu={cpu}
              editMode={editMode}
              onEditPlan={onEditPlan}
            />
          </div>
        ) : (
          <div className="mt-6 space-y-12">
            <ProductIntro
              product={product}
              productIndex={productIndex}
              group={group}
              plans={allPlans}
              flow={flow}
            />

            <Configurator
              product={product}
              plans={allPlans}
              flow={flow}
              editMode={editMode}
              /* Cada elección es una entrada de historial: «atrás» la deshace. */
              onSelect={(selection) => navigate(productPath(product, 'config', selection))}
              onChoosePlan={(plan) => navigate(productPath(product, 'detail', { planId: plan.id }))}
              onAddPlan={() => onEditPlan(addPlan(product.id))}
              onEditPlan={onEditPlan}
            />

            {product.features?.length > 0 && (
              <section className="glass p-6 sm:p-7">
                <h2 className="display text-lg font-bold text-white">
                  Incluido en todos los planes de {product.name}
                </h2>
                <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {product.features.map((item) => (
                    <article key={item.id} className="flex gap-3">
                      <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-hex-300">
                        <Icon name={item.icon} size={15} />
                      </span>
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-white">{item.title}</h3>
                        <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
                          {item.description}
                        </p>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}

            {editMode && (
              <button
                onClick={() => onEditProduct(product.id)}
                className="btn-ghost btn-sm w-full border-hex-500/30 bg-hex-500/10 py-2.5 text-hex-200"
              >
                <Settings2 size={14} />
                Editar producto (subcategoría, imagen, argumentos y funciones)
              </button>
            )}
          </div>
        )}
      </div>
    </main>
  )
}

/* ---------------------------- Cabecera del producto --------------------------- */

function ProductIntro({ product, productIndex, group, plans, flow }) {
  const money = useMoney()
  const price = fromPrice(plans)
  const reference = plans.find((plan) => plan.status === 'available') || plans[0]

  return (
    <div className="space-y-8">
      <section className="glass relative overflow-hidden p-6 sm:p-9">
        <div
          className="glow-blue pointer-events-none absolute -top-32 -right-24 size-96 opacity-50"
          aria-hidden="true"
        />

        <div className="relative flex flex-col gap-7 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              {group && (
                <span className="chip !text-[11px]">
                  <Icon name={group.icon} size={12} className="text-hex-400" />
                  {group.name}
                </span>
              )}
              {product.badge && (
                <span className="chip pixel border-hex-400/30 bg-hex-500/15 !text-[8px] !text-hex-200">
                  {product.badge}
                </span>
              )}
              {product.status !== 'available' && <StatusPill status={product.status} />}
            </div>

            <div className="mt-5 flex items-start gap-4">
              {product.image ? (
                <img
                  src={product.image}
                  alt=""
                  className="size-16 shrink-0 rounded-xl border border-white/10 object-cover"
                />
              ) : (
                <span className="grid size-16 shrink-0 place-items-center rounded-xl border border-white/10 bg-gradient-to-br from-hex-500/20 to-plasma-500/15 text-hex-300">
                  <Icon name={product.icon} size={30} />
                </span>
              )}
              <div className="min-w-0">
                <Editable
                  path={`products.${productIndex}.name`}
                  as="h1"
                  className="display text-3xl font-bold text-white sm:text-4xl"
                />
                <Editable
                  path={`products.${productIndex}.tagline`}
                  as="p"
                  placeholder="Frase corta del producto"
                  className="mt-1.5 block text-sm font-medium text-hex-200"
                />
              </div>
            </div>

            <Editable
              path={`products.${productIndex}.description`}
              as="p"
              multiline
              placeholder="Descripción del producto"
              className="mt-5 text-base leading-relaxed text-pretty text-slate-400"
            />
          </div>

          {/* Resumen: qué hay disponible y desde cuánto */}
          <div className="glass-soft w-full shrink-0 p-5 lg:w-72">
            <div className="flex items-center gap-2 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
              <Layers size={12} className="text-hex-400" />
              {plans.length === 1 ? '1 plan disponible' : `${plans.length} planes disponibles`}
            </div>

            {price !== null ? (
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-xs text-slate-500">desde</span>
                <span className="pixel text-xl text-white">{money(price)}</span>
                <span className="text-xs text-slate-500">{reference?.period}</span>
              </div>
            ) : (
              <p className="mt-2 text-sm text-slate-500">Todavía sin planes publicados.</p>
            )}

            {(flow.hasLocationChoice || flow.hasCpuChoice) && (
              <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
                {flow.hasLocationChoice && `${flow.locations.length} ubicaciones`}
                {flow.hasLocationChoice && flow.hasCpuChoice && ' · '}
                {flow.hasCpuChoice && `${flow.cpus.length} CPUs`} a elegir aquí abajo.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Argumentos del producto */}
      {product.highlights?.length > 0 && (
        <section className="grid gap-4 sm:grid-cols-3">
          {product.highlights.map((item) => (
            <article key={item.id} className="glass glass-hover p-5">
              <span className="mb-3.5 grid size-11 place-items-center rounded-xl border border-white/10 bg-gradient-to-br from-hex-500/20 to-plasma-500/15 text-hex-300">
                <Icon name={item.icon} size={19} />
              </span>
              <h3 className="display text-base font-bold text-white">{item.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{item.description}</p>
            </article>
          ))}
        </section>
      )}
    </div>
  )
}

/* --------------------------------- 404 interno -------------------------------- */

function NotFound() {
  return (
    <main className="grid min-h-[70vh] place-items-center px-4 pt-28">
      <div className="glass max-w-md p-10 text-center">
        <PackageOpen size={32} className="mx-auto text-slate-600" />
        <h1 className="display mt-4 text-xl font-bold text-white">Producto no encontrado</h1>
        <p className="mt-2 text-sm text-slate-500">
          El enlace apunta a un producto que ya no existe o cambió de nombre.
        </p>
        <a href={href('/productos')} className="btn-primary mt-6 px-5 py-2.5">
          Ver el catálogo
          <ArrowRight size={15} />
        </a>
      </div>
    </main>
  )
}

export { NotFound }
