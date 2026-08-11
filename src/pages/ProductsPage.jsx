import { useEffect, useMemo, useState } from 'react'
import { Plus, PackageOpen, Search, SearchX } from 'lucide-react'
import {
  useSite,
  useCatalogLayout,
  listedProducts,
  plansOfProduct,
  findGroupBySlug,
} from '../store/useSite.js'
import { navigate } from '../lib/router.js'
import SectionHeading from '../components/SectionHeading.jsx'
import Editable from '../components/ui/Editable.jsx'
import { Glyph } from '../components/ui/icons.jsx'
import GroupTabs from '../components/catalog/GroupTabs.jsx'
import LayoutPicker from '../components/catalog/LayoutPicker.jsx'
import BillingCyclePicker from '../components/catalog/BillingCyclePicker.jsx'
import ProductBox from '../components/catalog/ProductBox.jsx'
import ProductCard from '../components/catalog/ProductCard.jsx'
import ProductRow from '../components/catalog/ProductRow.jsx'
import ProductTable from '../components/catalog/ProductTable.jsx'
import ProductTile from '../components/catalog/ProductTile.jsx'
import GroupArguments from '../components/catalog/GroupArguments.jsx'
import CatalogFaq from '../components/catalog/CatalogFaq.jsx'

/**
 * Catálogo: la única página que lista productos (la portada sólo enlaza aquí).
 *
 * Cómo se listan lo decide `catalog.layout`, que el visitante puede cambiar desde
 * el selector de arriba — ver src/lib/layouts.js. Lo que cambia es la presentación
 * y nada más: los mismos productos, el mismo orden y los mismos datos.
 */
export default function ProductsPage({ route, onEditProduct }) {
  const site = useSite((s) => s.site)
  const editMode = useSite((s) => s.editMode)
  const addGroup = useSite((s) => s.addGroup)
  const addProduct = useSite((s) => s.addProduct)
  const layout = useCatalogLayout()
  const [query, setQuery] = useState('')

  const activeGroup = route.groupSlug ? findGroupBySlug(site, route.groupSlug) : null
  const activeSlug = activeGroup?.slug || ''
  const showAllTab = site.catalog.showAllTab !== false

  /**
   * Sin pestaña «Todos» no hay ninguna vista «sin filtrar» que enseñar, así que
   * `/productos` entra en la primera subcategoría. Se reemplaza en el historial —y
   * no se apila— para que el botón atrás siga saliendo de la página, no rebotando
   * contra la redirección.
   */
  useEffect(() => {
    if (showAllTab || route.groupSlug) return
    const first = site.groups[0]
    if (first) navigate(`/productos/${first.slug}`, { replace: true })
  }, [showAllTab, route.groupSlug, site.groups])

  // Los productos ocultos sólo se listan en modo edición, para poder gestionarlos.
  const products = useMemo(
    () => listedProducts(site, activeGroup?.id || '', editMode),
    [site, activeGroup, editMode],
  )

  /**
   * El buscador es de la rejilla buscable y no del catálogo entero: en los otros
   * modos hay pocas piezas en pantalla y un campo de texto sobraría. Al cambiar de
   * modo o de subcategoría se vacía, para no dejar la lista filtrada por algo que
   * ya no se ve escrito en ningún sitio.
   */
  const searchable = layout === 'buscable'
  useEffect(() => setQuery(''), [layout, activeSlug])

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!searchable || !term) return products
    return products.filter((product) => matchesProduct(site, product, term))
  }, [searchable, query, products, site])

  const countOf = (groupId) => listedProducts(site, groupId || '', editMode).length

  const createProduct = () => {
    const groupId = activeGroup?.id || site.groups[0]?.id
    if (!groupId) return
    onEditProduct(addProduct(groupId))
  }

  return (
    <main className="pt-28 pb-20 sm:pt-32 sm:pb-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/**
         * Cabecera. Con una subcategoría activa manda la suya, no la genérica del
         * catálogo: /productos/juegos y /productos/vps venden cosas distintas y se
         * presentaban con el mismo titular, así que ninguna de las dos se vendía.
         * Si la subcategoría no ha escrito titular propio, se cae al del catálogo.
         */}
        {activeGroup?.headline ? (
          <GroupHeading group={activeGroup} groupIndex={site.groups.indexOf(activeGroup)} />
        ) : (
          <SectionHeading
            eyebrow={site.catalog.eyebrow}
            titlePath="catalog.title"
            subtitlePath="catalog.subtitle"
          />
        )}

        <div className="mt-10">
          <GroupTabs
            groups={site.groups}
            activeSlug={activeSlug}
            allLabel={site.catalog.allLabel}
            countOf={countOf}
            editMode={editMode}
            showAll={showAllTab}
            onAddGroup={() => {
              const id = addGroup()
              const group = useSite.getState().site.groups.find((g) => g.id === id)
              if (group) navigate(`/productos/${group.slug}`)
            }}
          />
        </div>

        {/* Descripción suelta: sólo cuando la subcategoría no tiene cabecera propia,
            porque si la tiene el texto ya va dentro y saldría dos veces. */}
        {activeGroup && !activeGroup.headline && (activeGroup.description || activeGroup.tagline) && (
          <p className="mx-auto mt-6 max-w-2xl text-center text-sm leading-relaxed text-slate-500">
            {activeGroup.description || activeGroup.tagline}
          </p>
        )}

        {products.length > 0 ? (
          <>
            {/**
             * Todos los controles en una fila.
             *
             * Estaban en tres filas apiladas —vistas, ciclo y buscador—, y entre las
             * pestañas y ellos había trece elementos interactivos antes de que se
             * viera un solo producto. Las referencias ponen uno o dos. Aquí caben en
             * una línea porque el selector de vistas bajó de siete botones a dos.
             */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:justify-between">
              {searchable ? (
                <label className="relative min-w-56 flex-1 sm:max-w-sm">
                  <Search
                    size={16}
                    className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-slate-500"
                  />
                  <input
                    type="search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder={site.catalog.searchLabel}
                    aria-label={site.catalog.searchLabel}
                    className="input py-2.5 pl-10"
                  />
                </label>
              ) : (
                <span />
              )}

              <div className="flex flex-wrap items-center justify-center gap-3">
                <BillingCyclePicker />
                <LayoutPicker />
              </div>
            </div>

            <div className="mt-8">
              {visible.length > 0 ? (
                <ProductList
                  layout={layout}
                  site={site}
                  products={visible}
                  editMode={editMode}
                  onEditProduct={onEditProduct}
                  onCreate={createProduct}
                  activeGroup={activeGroup}
                  searching={Boolean(query.trim())}
                  restLabel={site.catalog.restLabel}
                />
              ) : (
                /* Filtrado a cero: no es un catálogo vacío, es una búsqueda sin suerte. */
                <div className="glass flex flex-col items-center gap-3 p-12 text-center">
                  <SearchX size={28} className="text-slate-600" />
                  <p className="text-sm text-slate-500">
                    Ningún producto coincide con «{query.trim()}».
                  </p>
                  <button onClick={() => setQuery('')} className="btn-ghost btn-sm">
                    Limpiar la búsqueda
                  </button>
                </div>
              )}
            </div>

            {/* Fuera del modo «detalle» el hueco de añadir no encaja en la rejilla. */}
            {editMode && layout !== 'detalle' && (
              <button
                onClick={createProduct}
                className="glass glass-hover mt-4 flex w-full items-center justify-center gap-2 border-dashed py-4 text-sm font-semibold text-slate-500 hover:text-white"
              >
                <Plus size={16} />
                Añadir producto{activeGroup ? ` a ${activeGroup.name}` : ''}
              </button>
            )}
          </>
        ) : (
          <div className="glass mt-10 flex flex-col items-center gap-3 p-14 text-center">
            <PackageOpen size={30} className="text-slate-600" />
            <p className="text-sm text-slate-500">
              {site.groups.length === 0
                ? 'Aún no hay subcategorías. Crea la primera desde el panel de administración.'
                : site.catalog.emptyLabel}
            </p>
            {editMode && site.groups.length > 0 && (
              <button onClick={createProduct} className="btn-primary btn-sm mt-1">
                <Plus size={14} />
                Añadir el primero
              </button>
            )}
          </div>
        )}
        {/**
         * El cierre de la página. Antes terminaba en seco después de la última
         * tarjeta: un directorio. Los argumentos de la familia sólo salen si la
         * subcategoría activa los tiene escritos, y el FAQ es del catálogo entero.
         */}
        <GroupArguments group={activeGroup} />
        <CatalogFaq />
      </div>
    </main>
  )
}

/**
 * Cabecera propia de una subcategoría: antetítulo, titular, texto y argumentos.
 *
 * Es la diferencia entre que `/productos/juegos` sea «el catálogo filtrado» y que
 * sea una página que vende servidores de juegos. Los textos son editables en línea
 * como el resto, apuntando al grupo por su índice.
 */
function GroupHeading({ group, groupIndex }) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <div className="eyebrow mb-3 flex items-center justify-center gap-2">
        <Glyph name={group.icon} image={group.image} size={13} />
        {group.name}
      </div>

      <Editable
        path={`groups.${groupIndex}.headline`}
        as="h1"
        multiline
        className="display text-3xl font-bold text-balance text-white sm:text-4xl"
      />

      {(group.description || group.tagline) && (
        <Editable
          path={`groups.${groupIndex}.description`}
          as="p"
          multiline
          className="mt-3 text-base leading-relaxed text-pretty text-slate-400"
        />
      )}

      {group.highlights?.length > 0 && (
        <ul className="mt-7 flex flex-wrap items-center justify-center gap-2">
          {group.highlights.map((item) => (
            <li key={item.id} className="chip !text-xs">
              <Glyph name={item.icon} image={item.image} size={13} className="text-hex-400" />
              {item.title}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/**
 * ¿Encaja el producto con lo que se ha escrito en el buscador?
 *
 * Se mira más allá del nombre —descripción, subcategoría y el nombre de sus planes—
 * porque quien busca «ryzen» o «económico» no está tecleando el título de nada:
 * está describiendo lo que quiere. Todo en minúsculas y sin más adornos; con
 * catálogos de este tamaño, montar un índice sería resolver un problema que no hay.
 */
function matchesProduct(site, product, term) {
  const haystack = [
    product.name,
    product.tagline,
    product.description,
    site.groups.find((group) => group.id === product.groupId)?.name,
    ...site.plans.filter((plan) => plan.productId === product.id).map((plan) => plan.name),
  ]
  return haystack.some((text) => String(text || '').toLowerCase().includes(term))
}

/* --------------------------- las seis presentaciones -------------------------- */

/**
 * Pinta la misma lista de productos de la forma que toque. Cada modo decide sólo su
 * rejilla y qué pieza usa; los datos ya vienen resueltos y ordenados de arriba.
 */
function ProductList({
  layout,
  site,
  products,
  editMode,
  onEditProduct,
  onCreate,
  activeGroup,
  searching = false,
  restLabel = 'Todo el catálogo',
}) {
  const groupOf = (product) => site.groups.find((g) => g.id === product.groupId)
  const plansOf = (product) => plansOfProduct(site, product.id)

  /* `key` va aparte a propósito: React no lo acepta dentro de un spread. */
  const common = (product) => ({
    product,
    group: groupOf(product),
    plans: plansOf(product),
    editMode,
    onEdit: onEditProduct,
  })

  if (layout === 'tabla') {
    return (
      <ProductTable
        products={products}
        groupOf={groupOf}
        plansOf={plansOf}
        editMode={editMode}
        onEdit={onEditProduct}
      />
    )
  }

  if (layout === 'lista') {
    return (
      <div className="space-y-3">
        {products.map((product) => (
          <ProductRow key={product.id} {...common(product)} />
        ))}
      </div>
    )
  }

  if (layout === 'rejilla') {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <ProductCard key={product.id} {...common(product)} />
        ))}
      </div>
    )
  }

  /**
   * Rejilla buscable, con jerarquía.
   *
   * Los destacados ocupan dos columnas y llevan argumentos y precio en grande; el
   * resto va en baldosas compactas de cuatro por fila. Sin esa diferencia el
   * catálogo era una cuadrícula plana donde todo pesaba igual y la mirada no tenía
   * dónde caer: es el patrón de deluxhost, que abre con tres planes grandes y mete
   * el resto debajo bajo un «All plans».
   *
   * Buscando se apaga la jerarquía a propósito: quien ha escrito «minecraft» ya ha
   * dicho qué quiere, y destacarle otra cosa encima sería ruido.
   */
  if (layout === 'buscable') {
    const featured = searching ? [] : products.filter((product) => product.featured)
    const rest = searching ? products : products.filter((product) => !product.featured)

    return (
      <div className="space-y-10">
        {featured.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((product, index) => (
              <div key={product.id} className="lg:col-span-2">
                <ProductTile {...common(product)} featured index={index} />
              </div>
            ))}
          </div>
        )}

        {rest.length > 0 && (
          <section>
            {featured.length > 0 && (
              <h2 className="eyebrow mb-4">{restLabel}</h2>
            )}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {rest.map((product, index) => (
                <ProductTile key={product.id} {...common(product)} index={index} />
              ))}
            </div>
          </section>
        )}
      </div>
    )
  }

  /**
   * Escaparate: los destacados con la ficha entera y el resto en rejilla. Si no hay
   * ninguno destacado no hay escaparate que valga, así que se comporta como rejilla
   * en lugar de dejar la página coja.
   */
  if (layout === 'escaparate') {
    const featured = products.filter((product) => product.featured)
    const rest = products.filter((product) => !product.featured)

    return (
      <div className="space-y-6">
        {featured.length > 0 && (
          <div className="grid gap-6 lg:grid-cols-2">
            {featured.map((product) => (
              <ProductBox key={product.id} {...common(product)} />
            ))}
          </div>
        )}
        {rest.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((product) => (
              <ProductCard key={product.id} {...common(product)} />
            ))}
          </div>
        )}
      </div>
    )
  }

  // 'detalle': el modo de siempre, con el hueco de «añadir» dentro de la rejilla.
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {products.map((product) => (
        <ProductBox key={product.id} {...common(product)} />
      ))}

      {editMode && (
        <button
          onClick={onCreate}
          className="glass glass-hover flex min-h-[20rem] flex-col items-center justify-center gap-3 border-dashed text-slate-500 hover:text-white"
        >
          <Plus size={28} />
          <span className="text-sm font-semibold">
            Añadir producto{activeGroup ? ` a ${activeGroup.name}` : ''}
          </span>
        </button>
      )}
    </div>
  )
}
