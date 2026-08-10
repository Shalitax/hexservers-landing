import { useState } from 'react'
import { Plus, Trash2, ExternalLink, ChevronDown } from 'lucide-react'
import Modal from '../components/ui/Modal.jsx'
import { useSite } from '../store/useSite.js'
import { cx, formatPrice } from '../lib/utils.js'
import { buildOrderUrl, defaultSelection } from '../lib/whmcs.js'
import { TextField, NumberField, SelectField, Toggle, Row, Field } from './controls.jsx'
import { PairList, TextList, IconItemList } from './CollectionFields.jsx'

const STATUS_OPTIONS = [
  { value: 'available', label: 'Disponible' },
  { value: 'soldout', label: 'Agotado' },
  { value: 'soon', label: 'Próximamente' },
]

const CYCLE_OPTIONS = [
  { value: 'monthly', label: 'Mensual' },
  { value: 'quarterly', label: 'Trimestral' },
  { value: 'semiannually', label: 'Semestral' },
  { value: 'annually', label: 'Anual' },
]

/**
 * Editor de un plan: precio, especificaciones, todo lo que incluye, funciones,
 * opciones configurables y el destino final en WHMCS.
 */
export default function PlanEditor({ planId, onClose }) {
  const plan = useSite((s) => s.site.plans.find((p) => p.id === planId))
  const products = useSite((s) => s.site.products)
  const locations = useSite((s) => s.site.locations.items)
  const cpus = useSite((s) => s.site.cpus)
  const tiers = useSite((s) => s.site.tiers)
  const currency = useSite((s) => s.site.currency)
  const whmcs = useSite((s) => s.site.whmcs)
  const updatePlan = useSite((s) => s.updatePlan)
  const removePlan = useSite((s) => s.removePlan)
  const addPlanItem = useSite((s) => s.addPlanItem)
  const updatePlanItem = useSite((s) => s.updatePlanItem)
  const removePlanItem = useSite((s) => s.removePlanItem)
  const movePlanItem = useSite((s) => s.movePlanItem)

  if (!plan) return null

  const set = (patch) => updatePlan(plan.id, patch)
  const product = products.find((p) => p.id === plan.productId)
  const previewUrl = buildOrderUrl(plan, defaultSelection(plan), whmcs)

  const listHandlers = (key) => ({
    onUpdate: (itemId, patch) => updatePlanItem(plan.id, key, itemId, patch),
    onRemove: (itemId) => removePlanItem(plan.id, key, itemId),
    onMove: (itemId, dir) => movePlanItem(plan.id, key, itemId, dir),
  })

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={`Plan: ${plan.name}`}
      subtitle={
        product
          ? `Pertenece a ${product.name}. Los cambios se guardan al instante.`
          : 'Los cambios se guardan al instante.'
      }
      footer={
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => {
              if (confirm(`¿Eliminar "${plan.name}"? Esta acción no se puede deshacer.`)) {
                removePlan(plan.id)
                onClose()
              }
            }}
            className="btn btn-sm gap-1.5 px-3 py-2 text-rose-400 hover:bg-rose-500/15"
          >
            <Trash2 size={14} />
            Eliminar plan
          </button>
          <button onClick={onClose} className="btn-primary px-5 py-2.5">
            Listo
          </button>
        </div>
      }
    >
      <div className="space-y-7">
        {/* ------------------------------ Datos básicos ----------------------------- */}
        <section className="space-y-3">
          <Row>
            <TextField
              label="Nombre del plan"
              value={plan.name}
              onChange={(v) => set({ name: v })}
              data-autofocus
            />
            <SelectField
              label="Producto"
              value={plan.productId}
              onChange={(v) => set({ productId: v })}
              options={products.map((p) => ({ value: p.id, label: p.name }))}
            />
          </Row>

          <TextField
            label="Descripción (opcional)"
            textarea
            value={plan.description}
            onChange={(v) => set({ description: v })}
            placeholder="Una línea que aclare para quién es este plan."
          />

          <Row>
            <NumberField
              label={`Precio base en ${currency.base}`}
              value={plan.price}
              onChange={(v) => set({ price: v })}
              min="0"
              hint="El resto de divisas se calculan con el cambio del panel → Catálogo → Divisas."
            />
            <TextField label="Periodo" value={plan.period} onChange={(v) => set({ period: v })} />
          </Row>

          <Row>
            <SelectField
              label="Estado"
              value={plan.status}
              onChange={(v) => set({ status: v })}
              options={STATUS_OPTIONS}
            />
            <div className="flex items-end">
              <Toggle
                label="Marcar como plan destacado"
                hint="Resalta la tarjeta con borde y badge POPULAR."
                checked={plan.featured}
                onChange={(v) => set({ featured: v })}
              />
            </div>
          </Row>
        </section>

        {/* --------------------- Grupo de WHMCS: ubicación + CPU -------------------- */}
        <section className="space-y-3">
          <div>
            <h4 className="display text-sm font-bold text-white">Ubicación y CPU</h4>
            <p className="mt-0.5 text-micro leading-relaxed text-slate-500">
              El equivalente al grupo de productos de WHMCS. Si varios planes de este producto
              declaran gama, ubicación o CPU, el cliente las elige antes de ver la lista:{' '}
              <strong>producto → gama → ubicación → CPU → plan</strong>. Déjalo en «cualquiera» para
              que el plan valga para todas las combinaciones.
            </p>
          </div>
          <Row>
            <SelectField
              label="Gama"
              value={plan.tierId || ''}
              onChange={(v) => set({ tierId: v })}
              options={[
                { value: '', label: 'Sin gama' },
                ...tiers.map((t) => ({ value: t.id, label: t.name })),
              ]}
              hint="El segundo eje: el mismo producto en distintas ligas de hardware."
            />
            <SelectField
              label="Ubicación"
              value={plan.locationId || ''}
              onChange={(v) => set({ locationId: v })}
              options={[
                { value: '', label: 'Cualquiera' },
                ...locations.map((l) => ({ value: l.id, label: `${l.flag} ${l.city}` })),
              ]}
              hint="Se editan en Contenido → Ubicaciones."
            />
            <SelectField
              label="CPU"
              value={plan.cpuId || ''}
              onChange={(v) => set({ cpuId: v })}
              options={[
                { value: '', label: 'Cualquiera' },
                ...cpus.map((c) => ({ value: c.id, label: c.name })),
              ]}
              hint="Se editan en Catálogo → CPUs."
            />
          </Row>
        </section>

        {/* ------------------------------ Lista de planes: specs ---------------------------- */}
        <PairList
          title="Especificaciones"
          hint="La tabla que compara los planes en la lista."
          items={plan.specs || []}
          onAdd={() => addPlanItem(plan.id, 'specs', { label: '', value: '' })}
          {...listHandlers('specs')}
        />

        {/* ---------------------------- Detalle: qué incluye ----------------------- */}
        <TextList
          title="Todo lo que incluye"
          hint="Checklist del detalle del plan, justo antes de pagar."
          items={plan.includes || []}
          onAdd={() => addPlanItem(plan.id, 'includes', { text: '' })}
          {...listHandlers('includes')}
        />

        {/* ---------------------------- Detalle: funciones ------------------------- */}
        <IconItemList
          title="Funciones propias de este plan"
          hint={
            product?.features?.length
              ? `Si lo dejas vacío se muestran las ${product.features.length} funciones del producto ${product.name}.`
              : 'Si lo dejas vacío se muestran las funciones definidas en el producto.'
          }
          items={plan.features || []}
          onAdd={() =>
            addPlanItem(plan.id, 'features', { icon: 'sparkles', title: '', description: '' })
          }
          {...listHandlers('features')}
          emptyHint="Vacío: hereda las funciones del producto."
        />

        {/* -------------------------------- WHMCS ---------------------------------- */}
        <section className="space-y-3">
          <h4 className="display text-sm font-bold text-white">Destino WHMCS</h4>
          <TextField
            label="URL completa del producto"
            value={plan.whmcsUrl}
            onChange={(v) => set({ whmcsUrl: v })}
            placeholder="https://billing.hexservers.com/cart.php?a=add&pid=12"
            hint="Si la dejas vacía se construye a partir del portal WHMCS global + el PID."
          />
          <Row cols={3}>
            <TextField
              label="PID en WHMCS"
              value={plan.whmcsPid}
              onChange={(v) => set({ whmcsPid: v })}
              placeholder="12"
            />
            <SelectField
              label="Ciclo de facturación"
              value={plan.billingCycle}
              onChange={(v) => set({ billingCycle: v })}
              options={CYCLE_OPTIONS}
            />
            <Field label="Comprobar">
              <a
                href={previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={cx(
                  'btn-ghost btn-sm w-full py-2',
                  previewUrl === '#' && 'pointer-events-none opacity-40',
                )}
              >
                <ExternalLink size={13} />
                Abrir URL
              </a>
            </Field>
          </Row>
          {previewUrl !== '#' && (
            <p className="truncate rounded-lg border border-line-soft bg-black/40 px-3 py-2 font-mono text-micro text-slate-500">
              {previewUrl}
            </p>
          )}
        </section>

        {/* -------------------- Opciones configurables (condicional) ---------------- */}
        <section className="space-y-3">
          <Toggle
            label="¿Tiene opciones configurables?"
            hint="Si se activa, el cliente las ajusta en el detalle y viajan al carrito de WHMCS."
            checked={plan.hasConfigurableOptions}
            onChange={(v) => set({ hasConfigurableOptions: v })}
          />

          {plan.hasConfigurableOptions && <OptionsEditor plan={plan} base={currency.base} />}
        </section>
      </div>
    </Modal>
  )
}

/* ------------------------- Editor de opciones configurables ------------------------ */

function OptionsEditor({ plan, base }) {
  const addOption = useSite((s) => s.addOption)
  const removeOption = useSite((s) => s.removeOption)
  const updateOption = useSite((s) => s.updateOption)
  const addOptionValue = useSite((s) => s.addOptionValue)
  const updateOptionValue = useSite((s) => s.updateOptionValue)
  const removeOptionValue = useSite((s) => s.removeOptionValue)
  const [expanded, setExpanded] = useState(() => new Set())

  const toggle = (id) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  return (
    <div className="space-y-3 rounded-xl border border-hex-500/20 bg-hex-500/[0.04] p-3">
      {plan.configurableOptions.map((option) => {
        const open = expanded.has(option.id)
        return (
          <div key={option.id} className="rounded-lg border border-line bg-black/25">
            <div className="flex items-center gap-2 p-2.5">
              <button
                onClick={() => toggle(option.id)}
                className="rounded p-1 text-slate-500 transition hover:text-white"
                aria-expanded={open}
                aria-label={open ? 'Contraer' : 'Expandir'}
              >
                <ChevronDown size={15} className={cx('transition-transform', open && 'rotate-180')} />
              </button>
              <input
                className="input flex-1"
                value={option.name}
                onChange={(event) => updateOption(plan.id, option.id, { name: event.target.value })}
                placeholder="Nombre de la opción (ej. RAM extra)"
              />
              <span className="chip shrink-0">{option.values.length} valores</span>
              <button
                onClick={() => removeOption(plan.id, option.id)}
                aria-label="Eliminar opción"
                className="btn btn-sm shrink-0 p-2 text-slate-500 hover:bg-rose-500/15 hover:text-rose-400"
              >
                <Trash2 size={14} />
              </button>
            </div>

            {open && (
              <div className="space-y-2.5 border-t border-line-soft p-3">
                <TextField
                  label="ID de la opción configurable en WHMCS (opcional)"
                  value={option.whmcsOptionId}
                  onChange={(v) => updateOption(plan.id, option.id, { whmcsOptionId: v })}
                  placeholder="Ej. 3 — se envía como configoption[3]"
                  hint="Sin este ID la selección viaja como parámetro informativo, no como opción real de WHMCS."
                />

                <div className="space-y-2">
                  <div className="grid grid-cols-[1fr_7rem_7rem_4.5rem_2.25rem] gap-2 px-1 text-micro font-semibold tracking-wider text-slate-600 uppercase">
                    <span>Valor</span>
                    <span>Recargo</span>
                    <span>ID WHMCS</span>
                    <span>Por defecto</span>
                    <span />
                  </div>

                  {option.values.map((value) => (
                    <div
                      key={value.id}
                      className="grid grid-cols-[1fr_7rem_7rem_4.5rem_2.25rem] items-center gap-2"
                    >
                      <input
                        className="input"
                        value={value.label}
                        onChange={(event) =>
                          updateOptionValue(plan.id, option.id, value.id, {
                            label: event.target.value,
                          })
                        }
                        placeholder="+8 GB"
                      />
                      <input
                        type="number"
                        step="0.01"
                        className="input"
                        value={value.priceDelta}
                        onChange={(event) =>
                          updateOptionValue(plan.id, option.id, value.id, {
                            priceDelta: Number(event.target.value) || 0,
                          })
                        }
                      />
                      <input
                        className="input"
                        value={value.whmcsValueId}
                        onChange={(event) =>
                          updateOptionValue(plan.id, option.id, value.id, {
                            whmcsValueId: event.target.value,
                          })
                        }
                        placeholder="ID"
                      />
                      <div className="grid place-items-center">
                        <input
                          type="radio"
                          name={`default-${option.id}`}
                          checked={Boolean(value.default)}
                          onChange={() =>
                            updateOptionValue(plan.id, option.id, value.id, { default: true })
                          }
                          className="size-4 accent-hex-500"
                        />
                      </div>
                      <button
                        onClick={() => removeOptionValue(plan.id, option.id, value.id)}
                        aria-label="Eliminar valor"
                        className="btn btn-sm p-2 text-slate-500 hover:bg-rose-500/15 hover:text-rose-400"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between gap-3 pt-1">
                  <button
                    onClick={() => addOptionValue(plan.id, option.id)}
                    className="btn-ghost btn-sm"
                  >
                    <Plus size={13} />
                    Añadir valor
                  </button>
                  <span className="text-micro text-slate-600">
                    Rango:{' '}
                    {formatPrice(
                      plan.price + Math.min(0, ...option.values.map((v) => Number(v.priceDelta) || 0)),
                      base,
                    )}{' '}
                    –{' '}
                    {formatPrice(
                      plan.price + Math.max(0, ...option.values.map((v) => Number(v.priceDelta) || 0)),
                      base,
                    )}
                  </span>
                </div>
              </div>
            )}
          </div>
        )
      })}

      <button onClick={() => addOption(plan.id)} className="btn-ghost btn-sm w-full border-dashed py-2.5">
        <Plus size={14} />
        Añadir opción configurable
      </button>
    </div>
  )
}
