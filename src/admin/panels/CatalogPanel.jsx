import { useState } from 'react'
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Copy,
  Pencil,
  ExternalLink,
  Boxes,
  Eye,
  EyeOff,
} from 'lucide-react'
import { useSite, useCatalogLayout, productsOfGroup, plansOfProduct } from '../../store/useSite.js'
import { cx, formatPrice } from '../../lib/utils.js'
import { href, productHref } from '../../lib/router.js'
import { CATALOG_LAYOUTS, findLayout } from '../../lib/layouts.js'
import { BILLING_CYCLES, monthlyPrice, resolveCycle, usableCycles } from '../../lib/billing.js'
import { Icon } from '../../components/ui/icons.jsx'
import {
  TextField,
  SelectField,
  GlyphField,
  CompactGlyphPicker,
  Row,
  PanelSection,
  Toggle,
} from '../controls.jsx'
import { IconButton, StatusDot } from '../ProductEditor.jsx'
import MergeProducts from '../MergeProducts.jsx'
import TierSection from '../TierSection.jsx'
import { IconItemList } from '../CollectionFields.jsx'

/**
 * Pestaña "Catálogo": los tres niveles del árbol.
 *
 *   subcategoría → producto → plan
 */
export default function CatalogPanel({ onEditProduct, onEditPlan }) {
  const site = useSite((s) => s.site)
  const addGroup = useSite((s) => s.addGroup)
  const removeGroup = useSite((s) => s.removeGroup)
  const reorderGroup = useSite((s) => s.reorderGroup)
  const addProduct = useSite((s) => s.addProduct)
  const [openGroup, setOpenGroup] = useState(site.groups[0]?.id ?? null)

  return (
    <div className="space-y-6">
      <p className="rounded-xl border border-hex-500/20 bg-hex-500/[0.06] p-3 text-micro leading-relaxed text-hex-200/90">
        El catálogo tiene tres niveles: <strong>subcategoría</strong> (Servidores VPS, Servidores de
        Juegos, Hosting Web) → <strong>producto</strong> (la box grande: Minecraft, Unturned…) →{' '}
        <strong>plan</strong> (lo que se compra y va a WHMCS).
      </p>

      <CatalogLayoutSection />
      <BillingCycleSection />

      <PanelSection
        title="Subcategorías"
        description="Cada una es una pestaña de la página de productos."
        action={
          <button onClick={() => setOpenGroup(addGroup())} className="btn-primary btn-sm">
            <Plus size={13} />
            Nueva
          </button>
        }
      >
        <div className="space-y-2">
          {site.groups.map((group, index) => {
            const products = productsOfGroup(site, group.id)
            const open = openGroup === group.id
            const planCount = products.reduce(
              (total, product) => total + plansOfProduct(site, product.id).length,
              0,
            )

            return (
              <div key={group.id} className="rounded-xl border border-line bg-surface-1">
                {/* Cabecera de la subcategoría */}
                <div className="flex items-center gap-2 p-2.5">
                  <button
                    onClick={() => setOpenGroup(open ? null : group.id)}
                    className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
                    aria-expanded={open}
                  >
                    <ChevronDown
                      size={15}
                      className={cx('shrink-0 text-slate-600 transition-transform', open && 'rotate-180')}
                    />
                    <Icon name={group.icon} size={15} className="shrink-0 text-hex-300" />
                    <span className="truncate text-sm font-semibold text-white">{group.name}</span>
                    <span className="chip shrink-0 !text-micro">
                      {products.length} prod · {planCount} planes
                    </span>
                  </button>

                  <div className="flex shrink-0 items-center">
                    <IconButton
                      icon={ChevronUp}
                      label="Subir"
                      disabled={index === 0}
                      onClick={() => reorderGroup(group.id, -1)}
                    />
                    <IconButton
                      icon={ChevronDown}
                      label="Bajar"
                      disabled={index === site.groups.length - 1}
                      onClick={() => reorderGroup(group.id, 1)}
                    />
                    <IconButton
                      icon={Trash2}
                      label="Eliminar subcategoría"
                      danger
                      onClick={() => {
                        if (
                          confirm(
                            `¿Eliminar "${group.name}" con sus ${products.length} productos y ${planCount} planes?`,
                          )
                        )
                          removeGroup(group.id)
                      }}
                    />
                  </div>
                </div>

                {open && (
                  <div className="space-y-4 border-t border-line-soft p-3">
                    <GroupForm group={group} />

                    <div className="space-y-2">
                      <h4 className="text-micro font-semibold tracking-wider text-slate-500 uppercase">
                        Productos
                      </h4>

                      {products.map((product, position) => (
                        <ProductRow
                          key={product.id}
                          product={product}
                          plans={plansOfProduct(site, product.id)}
                          position={position}
                          total={products.length}
                          onEditProduct={onEditProduct}
                          onEditPlan={onEditPlan}
                        />
                      ))}

                      <button
                        onClick={() => onEditProduct(addProduct(group.id))}
                        className="btn-ghost btn-sm w-full border-dashed py-2"
                      >
                        <Plus size={13} />
                        Añadir producto a {group.name}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}

          {site.groups.length === 0 && (
            <p className="rounded-xl border border-dashed border-line p-6 text-center text-xs text-slate-600">
              No hay subcategorías. Crea la primera con el botón «Nueva».
            </p>
          )}
        </div>
      </PanelSection>

      <TierSection />
      <MergeProducts />
      <CpuSection />
      <CurrencySection />
    </div>
  )
}

/* --------------------------- Presentación del catálogo ----------------------- */

/**
 * Cómo se listan los productos en #/productos. Seis formas del mismo contenido
 * (ver src/lib/layouts.js); aquí se fija la que ve todo el mundo al entrar y si el
 * visitante puede cambiarla desde la propia página.
 */
function CatalogLayoutSection() {
  const layout = useSite((s) => s.site.catalog.layout)
  const allowViewer = useSite((s) => s.site.catalog.allowViewerLayout !== false)
  const showAllTab = useSite((s) => s.site.catalog.showAllTab !== false)
  const allLabel = useSite((s) => s.site.catalog.allLabel)
  const searchLabel = useSite((s) => s.site.catalog.searchLabel)
  const viewerLayout = useSite((s) => s.viewerLayout)
  const setViewerLayout = useSite((s) => s.setViewerLayout)
  const setField = useSite((s) => s.setField)
  const active = useCatalogLayout()

  /**
   * Si en este navegador habías elegido otra vista, se descarta al tocar aquí: si
   * no, estarías cambiando la del sitio sin poder verla. Mismo trato que la paleta.
   */
  const choose = (id) => {
    if (viewerLayout) setViewerLayout('')
    setField('catalog.layout', id)
  }

  return (
    <PanelSection
      title="Cómo se ve el catálogo"
      description="La presentación de la página de productos: la forma de listarlos y sus pestañas. No cambia el contenido — los mismos productos y el mismo orden."
    >
      <div className="grid gap-2 sm:grid-cols-2">
        {CATALOG_LAYOUTS.map((option) => {
          const selected = (layout || 'detalle') === option.id
          return (
            <button
              key={option.id}
              onClick={() => choose(option.id)}
              aria-pressed={selected}
              className={cx(
                'rounded-xl border p-3 text-left transition',
                selected
                  ? 'border-hex-500/60 bg-hex-500/12'
                  : 'border-line bg-surface-1 hover:border-line-strong hover:bg-surface-2',
              )}
            >
              <span className="flex items-center gap-2">
                <span
                  className={cx(
                    'grid size-8 shrink-0 place-items-center rounded-lg border transition',
                    selected
                      ? 'border-hex-400/50 bg-hex-500/20 text-hex-200'
                      : 'border-line bg-surface-2 text-slate-500',
                  )}
                >
                  <Icon name={option.icon} size={14} />
                </span>
                <span className="text-sm font-medium text-slate-200">{option.name}</span>
              </span>
              <span className="mt-1.5 block text-micro leading-snug text-slate-500">
                {option.description}
              </span>
            </button>
          )
        })}
      </div>

      <Toggle
        label="Dejar que el visitante cambie la vista"
        hint="Añade un selector sobre el catálogo. Su elección se guarda sólo en su navegador; lo que fijes aquí sigue siendo lo que ve todo el mundo al entrar."
        checked={allowViewer}
        onChange={(value) => setField('catalog.allowViewerLayout', value)}
      />

      <Toggle
        label="Mostrar la pestaña «Todos»"
        hint="Apagada, el catálogo abre directamente en la primera subcategoría y sólo se ve una familia cada vez. El enlace #/productos sigue funcionando: lleva a esa primera pestaña."
        checked={showAllTab}
        onChange={(value) => setField('catalog.showAllTab', value)}
      />

      {showAllTab && (
        <TextField
          label="Nombre de la pestaña «Todos»"
          value={allLabel}
          placeholder="Todos"
          onChange={(value) => setField('catalog.allLabel', value)}
        />
      )}

      {/* Sólo aparece si lo que estás viendo no es lo que verá un visitante nuevo. */}
      {active !== (layout || 'detalle') && (
        <p className="flex items-center justify-between gap-3 rounded-xl border border-amber-400/25 bg-amber-400/[0.07] p-3 text-micro leading-relaxed text-amber-200">
          <span>
            En este navegador estás viendo el catálogo como{' '}
            <strong>{findLayout(active).name}</strong>, no como lo verá un visitante nuevo.
          </span>
          <button onClick={() => setViewerLayout('')} className="btn-ghost btn-sm shrink-0 py-1">
            Deshacer
          </button>
        </p>
      )}

      {(layout || 'detalle') === 'buscable' && (
        <TextField
          label="Marcador del buscador"
          value={searchLabel}
          placeholder="Buscar por nombre, plan o categoría…"
          hint="El texto en gris del campo de búsqueda. Sólo se ve en la rejilla buscable."
          onChange={(value) => setField('catalog.searchLabel', value)}
        />
      )}

      <a href={href('/productos')} className="btn-ghost btn-sm w-full py-2">
        <ExternalLink size={12} />
        Ver la página de productos
      </a>
    </PanelSection>
  )
}

/* --------------------------- Ciclos de facturación --------------------------- */

/**
 * Descuento por pagar por adelantado.
 *
 * Lo que se escribe aquí es una promesa: el visitante ve el precio ya rebajado y
 * espera que el carrito le cobre eso. Por eso el aviso de abajo insiste en que los
 * porcentajes tienen que ser los mismos que hay configurados en WHMCS — la web no
 * puede comprobarlo por su cuenta.
 */
function BillingCycleSection() {
  const showCycles = useSite((s) => s.site.catalog.showCycles === true)
  const discounts = useSite((s) => s.site.catalog.cycleDiscounts) || {}
  const setField = useSite((s) => s.setField)

  const sample = 10
  const active = usableCycles(discounts)

  return (
    <PanelSection
      title="Ciclos de facturación"
      description="Un selector sobre el catálogo para ver los precios pagando por trimestres, semestres o años."
    >
      <Toggle
        label="Ofrecer pago por adelantado"
        hint="Añade el selector sobre el catálogo. Los precios que se enseñan pasan a ser el equivalente mensual ya rebajado, y bajo cada uno se aclara cuánto se cobra de una vez."
        checked={showCycles}
        onChange={(value) => setField('catalog.showCycles', value)}
      />

      <div className="space-y-2">
        {BILLING_CYCLES.filter((cycle) => cycle.months > 1).map((cycle) => (
          <div key={cycle.id} className="flex items-center gap-3">
            <span className="w-28 shrink-0 text-sm text-slate-400">{cycle.name}</span>
            <div className="relative flex-1">
              <input
                type="number"
                min="0"
                max="90"
                step="1"
                className="input pr-7"
                value={discounts[cycle.id] ?? 0}
                onChange={(event) =>
                  setField(`catalog.cycleDiscounts.${cycle.id}`, Number(event.target.value) || 0)
                }
              />
              <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-slate-500">
                %
              </span>
            </div>
            <span className="w-32 shrink-0 text-right text-micro text-slate-500 tabular-nums">
              {formatPrice(monthlyPrice(sample, resolveCycle(cycle.id, discounts)))} /mes
            </span>
          </div>
        ))}
      </div>

      <p className="text-micro leading-relaxed text-slate-500">
        La columna de la derecha es lo que costaría un plan de {formatPrice(sample)} al mes con cada
        descuento. Un ciclo al 0 % no aparece en el selector: serían botones que no cambian nada.
        {showCycles && active.length < 2 && (
          <strong className="mt-1 block text-amber-300">
            Ahora mismo no hay ningún descuento, así que el selector no se está pintando.
          </strong>
        )}
      </p>

      <p className="rounded-xl border border-amber-400/25 bg-amber-400/[0.07] p-3 text-micro leading-relaxed text-amber-200">
        Estos porcentajes tienen que ser los que WHMCS cobra de verdad en cada ciclo. La web no
        puede comprobarlo: si aquí pones un 15 % anual que allí no existe, el cliente llega al
        carrito con un precio distinto del que le prometiste. El ciclo elegido sí viaja al carrito
        (<code className="text-amber-100">billingcycle</code>).
      </p>
    </PanelSection>
  )
}

/* -------------------------------- Divisas ----------------------------------- */

/**
 * Divisas del sitio. Los precios se escriben una vez en la divisa base y el
 * navegador convierte al vuelo; el visitante elige la suya en el navbar.
 */
function CurrencySection() {
  const currency = useSite((s) => s.site.currency)
  const setField = useSite((s) => s.setField)
  const addListItem = useSite((s) => s.addListItem)
  const updateListItem = useSite((s) => s.updateListItem)
  const removeListItem = useSite((s) => s.removeListItem)
  const moveListItem = useSite((s) => s.moveListItem)

  const codes = currency.items.map((item) => ({ value: item.code, label: item.code }))
  const set = (id, patch) => updateListItem('currency.items', id, patch)

  return (
    <PanelSection
      title="Divisas"
      description="El visitante las cambia desde el navbar. Los precios de los planes se escriben siempre en la divisa base."
      action={
        <button
          onClick={() =>
            addListItem('currency.items', {
              code: 'USD',
              label: 'Nueva divisa',
              rate: 1,
              locale: 'es-ES',
              whmcsId: '',
            })
          }
          className="btn-ghost btn-sm"
        >
          <Plus size={13} />
          Añadir
        </button>
      }
    >
      <Row>
        <SelectField
          label="Divisa base"
          value={currency.base}
          onChange={(v) => setField('currency.base', v)}
          options={codes}
          hint="En la que escribes los precios. Su cambio es siempre 1."
        />
        <SelectField
          label="Divisa por defecto"
          value={currency.default}
          onChange={(v) => setField('currency.default', v)}
          options={codes}
          hint="La que ve quien entra por primera vez."
        />
      </Row>

      <div className="space-y-2">
        <div className="grid grid-cols-[4.5rem_1fr_6rem_5rem_2.5rem] gap-2 px-1 text-micro font-semibold tracking-wider text-slate-600 uppercase">
          <span>Código</span>
          <span>Nombre</span>
          <span>Cambio</span>
          <span>Id WHMCS</span>
          <span />
        </div>

        {currency.items.map((item, index) => {
          const isBase = item.code === currency.base

          return (
            <div key={item.id} className="space-y-2 rounded-xl border border-line bg-surface-1 p-2.5">
              <div className="grid grid-cols-[4.5rem_1fr_6rem_5rem_2.5rem] items-center gap-2">
                <input
                  className="input uppercase"
                  maxLength={3}
                  value={item.code}
                  onChange={(event) => set(item.id, { code: event.target.value.toUpperCase() })}
                />
                <input
                  className="input"
                  placeholder="Peso chileno"
                  value={item.label}
                  onChange={(event) => set(item.id, { label: event.target.value })}
                />
                <input
                  type="number"
                  step="0.0001"
                  min="0"
                  className="input"
                  title={isBase ? 'La divisa base siempre vale 1' : `1 ${currency.base} = X ${item.code}`}
                  disabled={isBase}
                  value={isBase ? 1 : item.rate}
                  onChange={(event) => set(item.id, { rate: Number(event.target.value) || 0 })}
                />
                <input
                  className="input"
                  placeholder="2"
                  title="Id de la divisa en tu WHMCS: abre el carrito ya en esta moneda"
                  value={item.whmcsId ?? ''}
                  onChange={(event) => set(item.id, { whmcsId: event.target.value })}
                />
                <div className="flex items-center">
                  <IconButton
                    icon={ChevronUp}
                    label="Subir"
                    tiny
                    disabled={index === 0}
                    onClick={() => moveListItem('currency.items', item.id, -1)}
                  />
                  <IconButton
                    icon={ChevronDown}
                    label="Bajar"
                    tiny
                    disabled={index === currency.items.length - 1}
                    onClick={() => moveListItem('currency.items', item.id, 1)}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  className="input"
                  placeholder="es-CL"
                  title="Formato regional: decide el símbolo y los separadores"
                  value={item.locale ?? ''}
                  onChange={(event) => set(item.id, { locale: event.target.value })}
                />
                <span className="chip shrink-0 !text-micro">
                  {formatPrice(10 * (isBase ? 1 : Number(item.rate) || 0), item.code, item.locale)}
                </span>
                <IconButton
                  icon={Trash2}
                  label="Eliminar divisa"
                  danger
                  disabled={isBase || currency.items.length < 2}
                  onClick={() => removeListItem('currency.items', item.id)}
                />
              </div>
            </div>
          )
        })}
      </div>

      <p className="rounded-xl border border-amber-400/25 bg-amber-400/[0.07] p-3 text-micro leading-relaxed text-amber-200">
        Los cambios los fijas tú: aquí no hay servidor que consulte cotizaciones, y colgar los
        precios de una API ajena sería dejarlos en manos de un tercero. Revísalos de vez en cuando.
        La muestra de al lado es cómo se vería un plan de 10 {currency.base}.
      </p>
    </PanelSection>
  )
}

/* --------------------------------- CPUs ------------------------------------- */

/**
 * Catálogo de CPUs. Cada plan apunta a una CPU y a una ubicación: esa pareja es
 * el grupo de productos de WHMCS y define el recorrido de compra del cliente.
 */
function CpuSection() {
  const cpus = useSite((s) => s.site.cpus)
  const plans = useSite((s) => s.site.plans)
  const addCpu = useSite((s) => s.addCpu)
  const updateCpu = useSite((s) => s.updateCpu)
  const removeCpu = useSite((s) => s.removeCpu)
  const reorderCpu = useSite((s) => s.reorderCpu)

  return (
    <PanelSection
      title="CPUs"
      description="Una CPU + una ubicación = un grupo de WHMCS. El cliente elige ubicación y CPU antes de ver los planes."
      action={
        <button onClick={() => addCpu()} className="btn-primary btn-sm">
          <Plus size={13} />
          Nueva
        </button>
      }
    >
      <p className="rounded-xl border border-line bg-surface-1 p-3 text-micro leading-relaxed text-slate-500">
        Los pasos de ubicación y CPU sólo aparecen cuando hay más de una opción entre los planes de
        un producto. Las ubicaciones se editan en <strong>Contenido → Ubicaciones</strong>.
      </p>

      <div className="space-y-2">
        {cpus.map((cpu, index) => {
          const used = plans.filter((plan) => plan.cpuId === cpu.id).length

          return (
            <div key={cpu.id} className="space-y-2 rounded-xl border border-line bg-surface-1 p-3">
              <div className="flex items-center gap-2">
                <CompactGlyphPicker
                  icon={cpu.icon}
                  image={cpu.image}
                  onIcon={(v) => updateCpu(cpu.id, { icon: v })}
                  onImage={(v) => updateCpu(cpu.id, { image: v })}
                />
                <input
                  className="input"
                  placeholder="Ryzen 9 7950X"
                  value={cpu.name}
                  onChange={(event) => updateCpu(cpu.id, { name: event.target.value })}
                />
                <span className="chip shrink-0 !text-micro">{used} planes</span>
                <div className="flex shrink-0 items-center">
                  <IconButton
                    icon={ChevronUp}
                    label="Subir"
                    disabled={index === 0}
                    onClick={() => reorderCpu(cpu.id, -1)}
                  />
                  <IconButton
                    icon={ChevronDown}
                    label="Bajar"
                    disabled={index === cpus.length - 1}
                    onClick={() => reorderCpu(cpu.id, 1)}
                  />
                  <IconButton
                    icon={Trash2}
                    label="Eliminar CPU"
                    danger
                    onClick={() => {
                      if (
                        confirm(
                          `¿Eliminar "${cpu.name}"? Los ${used} planes que la usan quedarán sin CPU (válidos para cualquiera).`,
                        )
                      )
                        removeCpu(cpu.id)
                    }}
                  />
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <input
                  className="input"
                  placeholder="Frase corta (Máximo reloj)"
                  value={cpu.tagline ?? ''}
                  onChange={(event) => updateCpu(cpu.id, { tagline: event.target.value })}
                />
                <input
                  className="input"
                  placeholder="Etiqueta (Recomendada)"
                  value={cpu.badge ?? ''}
                  onChange={(event) => updateCpu(cpu.id, { badge: event.target.value })}
                />
              </div>

              <textarea
                className="input min-h-16 resize-y"
                placeholder="Para qué encaja esta CPU."
                value={cpu.description ?? ''}
                onChange={(event) => updateCpu(cpu.id, { description: event.target.value })}
              />
            </div>
          )
        })}

        {cpus.length === 0 && (
          <p className="rounded-xl border border-dashed border-line p-6 text-center text-xs text-slate-600">
            Sin CPUs: los productos van directos de la ficha a la lista de planes.
          </p>
        )}
      </div>
    </PanelSection>
  )
}

/* ------------------------------ Formulario de grupo --------------------------- */

function GroupForm({ group }) {
  const updateGroup = useSite((s) => s.updateGroup)
  const addGroupItem = useSite((s) => s.addGroupItem)
  const updateGroupItem = useSite((s) => s.updateGroupItem)
  const removeGroupItem = useSite((s) => s.removeGroupItem)
  const moveGroupItem = useSite((s) => s.moveGroupItem)
  const set = (patch) => updateGroup(group.id, patch)

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <TextField label="Nombre" value={group.name} onChange={(v) => set({ name: v })} />
      <TextField
        label="Slug (URL)"
        value={group.slug}
        onChange={(v) => set({ slug: v })}
        hint={`#/productos/${group.slug || '…'}`}
      />
      {/**
       * Con titular propio, `#/productos/{slug}` deja de ser «el catálogo filtrado»
       * y se presenta como una página que vende esta familia. Vacío = se usa el
       * titular genérico del catálogo, como hasta ahora.
       */}
      <TextField
        label="Titular propio de la página"
        value={group.headline}
        onChange={(v) => set({ headline: v })}
        className="sm:col-span-2"
        placeholder="Elige tu juego. Del resto nos encargamos nosotros."
        hint={`Encabeza #/productos/${group.slug || '…'} en lugar del titular general. Déjalo vacío para usar el del catálogo.`}
      />
      <TextField
        label="Frase corta"
        value={group.tagline}
        onChange={(v) => set({ tagline: v })}
        className="sm:col-span-2"
        placeholder="KVM dedicado con NVMe y root completo"
      />
      <TextField
        label="Descripción"
        textarea
        value={group.description}
        onChange={(v) => set({ description: v })}
        className="sm:col-span-2"
        placeholder="Se muestra bajo las pestañas y en la portada."
      />
      <div className="sm:col-span-2">
        <GlyphField
          icon={group.icon}
          image={group.image}
          onIcon={(v) => set({ icon: v })}
          onImage={(v) => set({ image: v })}
          hint="Sube una imagen para usarla en lugar del icono, en la portada y en las pestañas."
        />
      </div>

      {/* Sólo tienen dónde pintarse si la subcategoría tiene cabecera propia. */}
      {group.headline && (
        <div className="sm:col-span-2">
          <IconItemList
            title="Argumentos de la familia"
            hint="Píldoras bajo el titular de la página de la subcategoría. De la descripción se encarga el campo de arriba; esto son los tres o cuatro motivos de un vistazo."
            items={group.highlights || []}
            onAdd={() =>
              addGroupItem(group.id, { icon: 'sparkles', title: 'Nuevo argumento', description: '' })
            }
            onUpdate={(itemId, patch) => updateGroupItem(group.id, itemId, patch)}
            onRemove={(itemId) => removeGroupItem(group.id, itemId)}
            onMove={(itemId, dir) => moveGroupItem(group.id, itemId, dir)}
            emptyHint="Sin argumentos: bajo el titular sólo irá la descripción."
          />
        </div>
      )}
    </div>
  )
}

/* ----------------------------- Fila de producto ------------------------------ */

function ProductRow({ product, plans, position, total, onEditProduct, onEditPlan }) {
  const removeProduct = useSite((s) => s.removeProduct)
  const updateProduct = useSite((s) => s.updateProduct)
  const duplicateProduct = useSite((s) => s.duplicateProduct)
  const reorderProduct = useSite((s) => s.reorderProduct)
  const addPlan = useSite((s) => s.addPlan)
  const [openPlans, setOpenPlans] = useState(false)

  const missingWhmcs = plans.filter((plan) => !plan.whmcsUrl && !plan.whmcsPid).length

  return (
    <div
      className={cx(
        'rounded-lg border border-line-soft bg-black/25',
        product.hidden && 'border-dashed border-amber-400/25',
      )}
    >
      <div className="flex items-center gap-2 p-2">
        <div className="flex shrink-0 flex-col">
          <IconButton
            icon={ChevronUp}
            label="Subir"
            tiny
            disabled={position === 0}
            onClick={() => reorderProduct(product.id, -1)}
          />
          <IconButton
            icon={ChevronDown}
            label="Bajar"
            tiny
            disabled={position === total - 1}
            onClick={() => reorderProduct(product.id, 1)}
          />
        </div>

        <button
          onClick={() => onEditProduct(product.id)}
          aria-label={`Editar ${product.name}`}
          className="min-w-0 flex-1 text-left"
        >
          <span className="flex flex-wrap items-center gap-2">
            <Icon name={product.icon} size={13} className="shrink-0 text-hex-400" />
            <span
              className={cx(
                'truncate text-sm font-medium',
                product.hidden ? 'text-slate-500' : 'text-slate-200',
              )}
            >
              {product.name}
            </span>
            <StatusDot status={product.status} />
            {product.featured && <span className="chip !text-micro !text-hex-300">destacado</span>}
            {product.hidden && <span className="chip !text-micro !text-amber-300">oculto</span>}
          </span>
          <span className="mt-0.5 block text-micro text-slate-500">
            /{product.slug} · {plans.length} planes ·{' '}
            {missingWhmcs === 0 ? (
              <span className="text-emerald-400/80">WHMCS OK</span>
            ) : (
              <span className="text-amber-400/80">{missingWhmcs} sin URL WHMCS</span>
            )}
          </span>
        </button>

        <div className="flex shrink-0 items-center">
          <IconButton
            icon={product.hidden ? EyeOff : Eye}
            label={product.hidden ? 'Mostrar en el listado' : 'Ocultar del listado'}
            onClick={() => updateProduct(product.id, { hidden: !product.hidden })}
          />
          <IconButton
            icon={Boxes}
            label={openPlans ? 'Ocultar planes' : 'Ver planes'}
            onClick={() => setOpenPlans((o) => !o)}
          />
          <IconButton icon={Pencil} label="Editar producto" onClick={() => onEditProduct(product.id)} />
          <IconButton
            icon={Copy}
            label="Duplicar con sus planes"
            onClick={() => duplicateProduct(product.id)}
          />
          <IconButton
            icon={Trash2}
            label="Eliminar producto"
            danger
            onClick={() => {
              if (confirm(`¿Eliminar "${product.name}" y sus ${plans.length} planes?`))
                removeProduct(product.id)
            }}
          />
        </div>
      </div>

      {openPlans && (
        <div className="space-y-1.5 border-t border-line-soft p-2">
          {plans.map((plan) => (
            <div key={plan.id} className="flex items-center gap-2 rounded-md bg-surface-1 px-2 py-1.5">
              <StatusDot status={plan.status} />
              <button
                onClick={() => onEditPlan(plan.id)}
                className="min-w-0 flex-1 truncate text-left text-sm text-slate-400 transition hover:text-white"
              >
                {plan.name}
              </button>
              <span className="shrink-0 text-micro text-slate-500">
                {formatPrice(plan.price, site.currency.base)}
                {plan.period}
              </span>
              <IconButton icon={Pencil} label="Editar plan" tiny onClick={() => onEditPlan(plan.id)} />
            </div>
          ))}

          <div className="flex gap-2 pt-1">
            <button
              onClick={() => onEditPlan(addPlan(product.id))}
              className="btn-ghost btn-sm flex-1 border-dashed py-1.5"
            >
              <Plus size={12} />
              Añadir plan
            </button>
            <a
              href={productHref(product)}
              className="btn-ghost btn-sm py-1.5"
              title="Ver la ficha pública"
            >
              <ExternalLink size={12} />
              Ver
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
