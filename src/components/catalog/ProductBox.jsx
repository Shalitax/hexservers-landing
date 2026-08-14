import { ArrowRight, Settings2 } from 'lucide-react'
import { useCatalogMoney } from '../../store/useSite.js'
import { cx } from '../../lib/utils.js'
import { productHref } from '../../lib/router.js'
import ProductCover from './ProductCover.jsx'

/**
 * Ficha grande de producto: la portada manda, y debajo nombre, descripción y
 * precio. Es el modo «detalladas» — lo que la distingue de la baldosa es el
 * tamaño, no el ruido: sin argumentos sueltos ni contadores, igual que el resto
 * de tarjetas del catálogo.
 */
export default function ProductBox({ product, plans, editMode, onEdit }) {
  const money = useCatalogMoney()
  const sellable = plans.filter((plan) => plan.status === 'available')
  const reference = sellable[0] || plans[0]
  const fromPrice = sellable.length
    ? Math.min(...sellable.map((plan) => Number(plan.price) || 0))
    : null
  const open = product.status === 'available' && plans.length > 0

  return (
    <article
      className={cx(
        'glass group relative flex flex-col overflow-hidden transition duration-300',
        open && 'hover:-translate-y-1 hover:border-line-strong',
        product.featured && 'border-hex-500/35 bg-hex-500/[0.055]',
        !open && 'opacity-75',
        product.hidden && 'border-dashed border-amber-400/30 opacity-70',
      )}
    >
      <ProductCover product={product} aspect="aspect-[16/8]" iconSize={72} />

      <div className="flex flex-1 flex-col p-6 sm:p-7">
        <h3 className="display text-xl font-bold text-white sm:text-2xl">{product.name}</h3>

        {product.tagline && (
          <p className="mt-2 text-sm font-medium text-slate-400">{product.tagline}</p>
        )}

        {product.description && (
          <p className="mt-2 text-sm leading-relaxed text-slate-400">{product.description}</p>
        )}

        {/* Pie: precio de entrada y acceso al flujo de compra */}
        <div className="mt-6 flex flex-wrap items-end justify-between gap-4 border-t border-line-soft pt-5">
        <div>
          {fromPrice !== null ? (
            <>
              <div className="text-micro font-semibold tracking-wider text-slate-500 uppercase">
                Desde
              </div>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="pixel text-2xl text-white">{money(fromPrice)}</span>
                <span className="text-micro text-slate-500">{reference?.period}</span>
              </div>
            </>
          ) : (
            <div className="text-sm text-slate-500">Sin planes disponibles</div>
          )}
        </div>

        <a
          href={productHref(product)}
          aria-disabled={!open}
          onClick={(event) => {
            if (!open) event.preventDefault()
          }}
          className={cx(
            'px-5 py-2.5',
            open ? 'btn-primary' : 'btn-ghost pointer-events-none opacity-50',
          )}
        >
          {open ? 'Ver planes' : 'No disponible'}
          <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
        </a>
        </div>

        {editMode && (
          <button
            onClick={() => onEdit(product.id)}
            className="btn-ghost btn-sm mt-4 w-full border-hex-500/30 bg-hex-500/10 py-2 text-hex-200"
          >
            <Settings2 size={13} />
            Editar producto y sus planes
          </button>
        )}
      </div>
    </article>
  )
}
