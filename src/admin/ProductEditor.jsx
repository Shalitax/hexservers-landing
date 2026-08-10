import { Plus, Trash2, ExternalLink, Pencil, Copy, ChevronUp, ChevronDown } from 'lucide-react'
import Modal from '../components/ui/Modal.jsx'
import { useSite, plansOfProduct } from '../store/useSite.js'
import { findLocation, findCpu } from '../lib/catalog.js'
import { cx, formatPrice } from '../lib/utils.js'
import { productHref } from '../lib/router.js'
import { PRODUCT_STATUS } from '../data/defaultState.js'
import { TextField, SelectField, Toggle, Row, IconPicker, ImageField } from './controls.jsx'
import { IconItemList } from './CollectionFields.jsx'

const STATUS_OPTIONS = [
  { value: 'available', label: 'Disponible' },
  { value: 'soldout', label: 'Agotado' },
  { value: 'soon', label: 'Próximamente' },
]

/**
 * Editor del producto: la box grande del catálogo y los dos primeros pasos del
 * flujo de compra. Los planes se editan en `PlanEditor`, desde la lista de aquí.
 */
export default function ProductEditor({ productId, onClose, onEditPlan }) {
  const site = useSite((s) => s.site)
  const product = site.products.find((p) => p.id === productId)
  const updateProduct = useSite((s) => s.updateProduct)
  const removeProduct = useSite((s) => s.removeProduct)
  const addProductItem = useSite((s) => s.addProductItem)
  const updateProductItem = useSite((s) => s.updateProductItem)
  const removeProductItem = useSite((s) => s.removeProductItem)
  const moveProductItem = useSite((s) => s.moveProductItem)

  if (!product) return null

  const set = (patch) => updateProduct(product.id, patch)
  const plans = plansOfProduct(site, product.id)

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={`Producto: ${product.name}`}
      subtitle="La box grande del catálogo y su ficha. Los cambios se guardan al instante."
      footer={
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => {
              if (
                confirm(
                  `¿Eliminar "${product.name}" y sus ${plans.length} planes? No se puede deshacer.`,
                )
              ) {
                removeProduct(product.id)
                onClose()
              }
            }}
            className="btn btn-sm gap-1.5 px-3 py-2 text-rose-400 hover:bg-rose-500/15"
          >
            <Trash2 size={14} />
            Eliminar producto
          </button>
          <div className="flex items-center gap-2">
            <a
              href={productHref(product)}
              onClick={onClose}
              className="btn-ghost btn-sm py-2.5"
              title="Abrir la ficha pública del producto"
            >
              <ExternalLink size={13} />
              Ver en la web
            </a>
            <button onClick={onClose} className="btn-primary px-5 py-2.5">
              Listo
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-7">
        {/* ------------------------------ Identidad ------------------------------ */}
        <section className="space-y-3">
          <Row>
            <TextField
              label="Nombre del producto"
              value={product.name}
              onChange={(v) => set({ name: v })}
              placeholder="Minecraft"
              data-autofocus
            />
            <SelectField
              label="Subcategoría"
              value={product.groupId}
              onChange={(v) => set({ groupId: v })}
              options={site.groups.map((g) => ({ value: g.id, label: g.name }))}
            />
          </Row>

          <Row>
            <TextField
              label="Slug (URL)"
              value={product.slug}
              onChange={(v) => set({ slug: v })}
              placeholder="minecraft"
              hint={`Su página será #/producto/${product.slug || '…'}`}
            />
            <TextField
              label="Etiqueta destacada (opcional)"
              value={product.badge}
              onChange={(v) => set({ badge: v })}
              placeholder="Más vendido"
            />
          </Row>

          <TextField
            label="Frase corta"
            value={product.tagline}
            onChange={(v) => set({ tagline: v })}
            placeholder="Mods, plugins y modpacks sin límites de slots"
          />

          <TextField
            label="Descripción"
            textarea
            value={product.description}
            onChange={(v) => set({ description: v })}
            placeholder="Para quién es este producto y qué resuelve."
          />

          <Row>
            <SelectField
              label="Estado"
              value={product.status}
              onChange={(v) => set({ status: v })}
              options={STATUS_OPTIONS}
            />
            <div className="flex items-end">
              <Toggle
                label="Destacar en el catálogo"
                hint="Resalta la box con borde y halo de color."
                checked={product.featured}
                onChange={(v) => set({ featured: v })}
              />
            </div>
          </Row>

          <Toggle
            label="Ocultar del listado"
            hint="Desaparece del catálogo y de la portada. Su página sigue funcionando por enlace directo, así que puedes usarlo para ofertas privadas o para preparar un producto antes de publicarlo."
            checked={product.hidden}
            onChange={(v) => set({ hidden: v })}
          />

          <IconPicker label="Icono" value={product.icon} onChange={(v) => set({ icon: v })} />
        </section>

        {/* -------------------------------- Imagen ------------------------------- */}
        <section className="space-y-3">
          <h4 className="display text-sm font-bold text-white">Imagen</h4>
          <ImageField
            value={product.image}
            onChange={(v) => set({ image: v })}
            hint="Si la dejas vacía se usa el icono."
          />
        </section>

        {/* ---------------------- Ficha: argumentos del producto ------------------ */}
        <IconItemList
          title="Ficha · Argumentos del producto"
          hint="Se muestran como tarjetas en la ficha, antes de que el cliente vea los planes."
          items={product.highlights || []}
          onAdd={() =>
            addProductItem(product.id, 'highlights', {
              icon: 'sparkles',
              title: 'Nuevo argumento',
              description: '',
            })
          }
          onUpdate={(itemId, patch) => updateProductItem(product.id, 'highlights', itemId, patch)}
          onRemove={(itemId) => removeProductItem(product.id, 'highlights', itemId)}
          onMove={(itemId, dir) => moveProductItem(product.id, 'highlights', itemId, dir)}
          emptyHint="Sin argumentos: la ficha mostrará solo la descripción."
        />

        {/* --------------------- Lista de planes: su cabecera -------------------- */}
        <section className="space-y-3">
          <h4 className="display text-sm font-bold text-white">Lista de planes · Cabecera</h4>
          <TextField
            label="Título"
            value={product.plansTitle}
            onChange={(v) => set({ plansTitle: v })}
            placeholder="Planes disponibles"
          />
          <TextField
            label="Subtítulo"
            textarea
            value={product.plansSubtitle}
            onChange={(v) => set({ plansSubtitle: v })}
            placeholder="Elige el que encaje con tu proyecto."
          />
        </section>

        {/* ------------- Detalle: funciones comunes a todos los planes ---------- */}
        <IconItemList
          title="Detalle del plan · Funciones incluidas"
          hint="Se muestran en el detalle de cualquier plan que no defina sus propias funciones."
          items={product.features || []}
          onAdd={() =>
            addProductItem(product.id, 'features', {
              icon: 'shield',
              title: 'Nueva función',
              description: '',
            })
          }
          onUpdate={(itemId, patch) => updateProductItem(product.id, 'features', itemId, patch)}
          onRemove={(itemId) => removeProductItem(product.id, 'features', itemId)}
          onMove={(itemId, dir) => moveProductItem(product.id, 'features', itemId, dir)}
          emptyHint="Sin funciones comunes: define las de cada plan por separado."
        />

        {/* -------------------------------- Planes ------------------------------ */}
        <PlanList product={product} plans={plans} onEditPlan={onEditPlan} />
      </div>
    </Modal>
  )
}

/* ---------------------------- Lista de planes del producto -------------------- */

function PlanList({ product, plans, onEditPlan }) {
  const site = useSite((s) => s.site)
  const addPlan = useSite((s) => s.addPlan)
  const removePlan = useSite((s) => s.removePlan)
  const duplicatePlan = useSite((s) => s.duplicatePlan)
  const reorderPlan = useSite((s) => s.reorderPlan)

  return (
    <section className="space-y-3">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h4 className="display text-sm font-bold text-white">
            Planes
            <span className="chip ml-2 !text-micro">{plans.length}</span>
          </h4>
          <p className="mt-0.5 text-micro text-slate-500">
            Lo que el cliente acaba contratando. Cada plan tiene su URL de WHMCS y, si quieres el
            recorrido con filtros, su ubicación y su CPU.
          </p>
        </div>
        <button onClick={() => onEditPlan(addPlan(product.id))} className="btn-primary btn-sm">
          <Plus size={13} />
          Nuevo plan
        </button>
      </header>

      <div className="space-y-1.5">
        {plans.map((plan, index) => (
          <div
            key={plan.id}
            className="flex items-center gap-2 rounded-lg border border-line-soft bg-black/25 p-2"
          >
            <div className="flex shrink-0 flex-col">
              <IconButton
                icon={ChevronUp}
                label="Subir"
                tiny
                disabled={index === 0}
                onClick={() => reorderPlan(plan.id, -1)}
              />
              <IconButton
                icon={ChevronDown}
                label="Bajar"
                tiny
                disabled={index === plans.length - 1}
                onClick={() => reorderPlan(plan.id, 1)}
              />
            </div>

            <button
              onClick={() => onEditPlan(plan.id)}
              aria-label={`Editar ${plan.name}`}
              className="min-w-0 flex-1 text-left"
            >
              <span className="flex flex-wrap items-center gap-2">
                <span className="truncate text-sm font-medium text-slate-200">{plan.name}</span>
                <StatusDot status={plan.status} />
                {plan.featured && <span className="chip !text-micro !text-hex-300">popular</span>}
                {plan.hasConfigurableOptions && (
                  <span className="chip !text-micro !text-slate-400">
                    {plan.configurableOptions.length} opts
                  </span>
                )}
              </span>
              <span className="mt-0.5 block text-micro text-slate-500">
                {formatPrice(plan.price, site.currency.base)}
                {plan.period}
                {groupLabel(site, plan) && (
                  <span className="text-hex-300/80"> · {groupLabel(site, plan)}</span>
                )}{' '}
                · {plan.specs?.length || 0} specs · {plan.includes?.length || 0} incluye ·{' '}
                {plan.whmcsUrl || plan.whmcsPid ? (
                  <span className="text-emerald-400/80">WHMCS OK</span>
                ) : (
                  <span className="text-amber-400/80">sin URL WHMCS</span>
                )}
              </span>
            </button>

            <div className="flex shrink-0 items-center">
              <IconButton icon={Pencil} label="Editar" onClick={() => onEditPlan(plan.id)} />
              <IconButton icon={Copy} label="Duplicar" onClick={() => duplicatePlan(plan.id)} />
              <IconButton
                icon={Trash2}
                label="Eliminar"
                danger
                onClick={() => {
                  if (confirm(`¿Eliminar el plan "${plan.name}"?`)) removePlan(plan.id)
                }}
              />
            </div>
          </div>
        ))}

        {plans.length === 0 && (
          <p className="rounded-lg border border-dashed border-line p-4 text-center text-micro text-slate-600">
            Este producto no tiene planes: en la web aparecerá como no disponible.
          </p>
        )}
      </div>
    </section>
  )
}

/** «Santiago · Ryzen 9 7950X»: el grupo de WHMCS del plan, si lo tiene. */
function groupLabel(site, plan) {
  return [findLocation(site, plan.locationId)?.city, findCpu(site, plan.cpuId)?.name]
    .filter(Boolean)
    .join(' · ')
}

function StatusDot({ status }) {
  const tone = PRODUCT_STATUS[status]?.tone ?? 'emerald'
  const colors = { emerald: 'bg-emerald-400', rose: 'bg-rose-400', amber: 'bg-amber-400' }
  return (
    <span
      title={PRODUCT_STATUS[status]?.label}
      className={cx('size-1.5 shrink-0 rounded-full', colors[tone])}
    />
  )
}

function IconButton({ icon: IconComponent, label, onClick, disabled, danger, tiny }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={cx(
        'rounded-md text-slate-500 transition disabled:opacity-25',
        tiny ? 'p-0.5' : 'p-1.5',
        danger ? 'hover:bg-rose-500/15 hover:text-rose-400' : 'hover:bg-surface-3 hover:text-white',
      )}
    >
      <IconComponent size={tiny ? 12 : 14} />
    </button>
  )
}

export { IconButton, StatusDot }
