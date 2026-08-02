import { useEffect, useMemo } from 'react'
import { Plus, PackageOpen } from 'lucide-react'
import {
  useSite,
  useCatalogLayout,
  listedProducts,
  plansOfProduct,
  findGroupBySlug,
} from '../store/useSite.js'
import { navigate } from '../lib/router.js'
import SectionHeading from '../components/SectionHeading.jsx'
import GroupTabs from '../components/catalog/GroupTabs.jsx'
import LayoutPicker from '../components/catalog/LayoutPicker.jsx'
import ProductBox from '../components/catalog/ProductBox.jsx'
import ProductCard from '../components/catalog/ProductCard.jsx'
import ProductRow from '../components/catalog/ProductRow.jsx'
import ProductTable from '../components/catalog/ProductTable.jsx'

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

  const activeGroup = route.groupSlug ? findGroupBySlug(site, route.groupSlug) : null
  const activeSlug = activeGroup?.slug || ''
  const showAllTab = site.catalog.showAllTab !== false

  /**
   * Sin pestaña «Todos» no hay ninguna vista «sin filtrar» que enseñar, así que
   * `#/productos` entra en la primera subcategoría. Se reemplaza en el historial —y
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

  const countOf = (groupId) => listedProducts(site, groupId || '', editMode).length

  const createProduct = () => {
    const groupId = activeGroup?.id || site.groups[0]?.id
    if (!groupId) return
    onEditProduct(addProduct(groupId))
  }

  return (
    <main className="pt-28 pb-20 sm:pt-32 sm:pb-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow={site.catalog.eyebrow}
          titlePath="catalog.title"
          subtitlePath="catalog.subtitle"
        />

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

        {/* Descripción de la subcategoría activa */}
        {activeGroup && (activeGroup.description || activeGroup.tagline) && (
          <p className="mx-auto mt-6 max-w-2xl text-center text-sm leading-relaxed text-slate-500">
            {activeGroup.description || activeGroup.tagline}
          </p>
        )}

        {products.length > 0 ? (
          <>
            <div className="mt-8">
              <LayoutPicker />
            </div>

            <div className="mt-8">
              <ProductList
                layout={layout}
                site={site}
                products={products}
                editMode={editMode}
                onEditProduct={onEditProduct}
                onCreate={createProduct}
                activeGroup={activeGroup}
              />
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
      </div>
    </main>
  )
}

/* --------------------------- las cinco presentaciones ------------------------- */

/**
 * Pinta la misma lista de productos de la forma que toque. Cada modo decide sólo su
 * rejilla y qué pieza usa; los datos ya vienen resueltos y ordenados de arriba.
 */
function ProductList({ layout, site, products, editMode, onEditProduct, onCreate, activeGroup }) {
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
