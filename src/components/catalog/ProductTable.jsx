import { ArrowRight, EyeOff, Settings2 } from 'lucide-react'
import { useCatalogMoney } from '../../store/useSite.js'
import { productSummary } from '../../lib/catalog.js'
import { cx } from '../../lib/utils.js'
import { productHref } from '../../lib/router.js'
import { Icon } from '../ui/icons.jsx'
import StatusPill from './StatusPill.jsx'

/**
 * Catálogo como tabla comparativa: el modo «tabla».
 *
 * Es el único modo que no vende — enseña cifras una debajo de otra para poder
 * compararlas de un vistazo, que es lo que hace quien ya conoce el catálogo y sólo
 * quiere saber cuál sale más a cuenta.
 *
 * La tabla desborda en horizontal dentro de su propio contenedor: la página nunca
 * se va de ancho en un móvil.
 */
export default function ProductTable({ products, groupOf, plansOf, editMode, onEdit }) {
  const money = useCatalogMoney()

  return (
    <div className="glass overflow-x-auto">
      <table className="w-full min-w-[42rem] border-collapse text-left">
        <thead>
          <tr className="border-b border-line-soft text-micro font-semibold tracking-wider text-slate-500 uppercase">
            <th className="px-5 py-3.5 font-semibold">Producto</th>
            <th className="px-5 py-3.5 font-semibold">Subcategoría</th>
            <th className="px-5 py-3.5 font-semibold">Planes</th>
            <th className="px-5 py-3.5 font-semibold">Desde</th>
            <th className="px-5 py-3.5" />
          </tr>
        </thead>

        <tbody className="divide-y divide-line-soft">
          {products.map((product) => {
            const group = groupOf(product)
            const { open, count, price, period } = productSummary(product, plansOf(product))

            return (
              <tr
                key={product.id}
                className={cx(
                  'transition hover:bg-surface-1',
                  !open && 'opacity-60',
                  product.featured && 'bg-hex-500/[0.05]',
                )}
              >
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <span className="grid size-11 shrink-0 place-items-center rounded-lg border border-line bg-surface-2 text-hex-300">
                      <Icon name={product.icon} size={16} />
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-semibold text-white">
                          {product.name}
                        </span>
                        {product.hidden && (
                          <EyeOff size={12} className="shrink-0 text-amber-400/80" />
                        )}
                      </div>
                      {product.tagline && (
                        <span className="mt-0.5 block truncate text-xs text-slate-500">
                          {product.tagline}
                        </span>
                      )}
                    </div>
                  </div>
                </td>

                <td className="px-5 py-4 text-xs whitespace-nowrap text-slate-400">
                  {group?.name || '—'}
                </td>

                <td className="px-5 py-4 text-xs whitespace-nowrap text-slate-400">
                  {product.status !== 'available' ? <StatusPill status={product.status} /> : count}
                </td>

                <td className="px-5 py-4 whitespace-nowrap">
                  {price !== null ? (
                    <span className="flex items-baseline gap-1">
                      <span className="pixel text-sm text-white">{money(price)}</span>
                      <span className="text-micro text-slate-500">{period}</span>
                    </span>
                  ) : (
                    <span className="text-xs text-slate-600">—</span>
                  )}
                </td>

                <td className="px-5 py-4">
                  <div className="flex items-center justify-end gap-2">
                    {editMode && (
                      <button
                        onClick={() => onEdit(product.id)}
                        aria-label={`Editar ${product.name}`}
                        className="btn-ghost btn-sm border-hex-500/30 bg-hex-500/10 p-1.5 text-hex-200"
                      >
                        <Settings2 size={12} />
                      </button>
                    )}
                    <a
                      href={productHref(product)}
                      aria-disabled={!open}
                      onClick={(event) => !open && event.preventDefault()}
                      className={cx(
                        'btn-sm whitespace-nowrap',
                        open ? 'btn-primary' : 'btn-ghost pointer-events-none opacity-50',
                      )}
                    >
                      {open ? 'Ver planes' : 'No disponible'}
                      {open && <ArrowRight size={13} />}
                    </a>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
