import { ArrowRight, Settings2 } from 'lucide-react'
import { useCatalogMoney } from '../../store/useSite.js'
import { productSummary } from '../../lib/catalog.js'
import { cx } from '../../lib/utils.js'
import { productHref } from '../../lib/router.js'
import ProductCover from './ProductCover.jsx'

/**
 * Tarjeta compacta de producto para el modo «rejilla»: portada, nombre, una
 * frase y el precio de entrada. El mismo patrón simple que la baldosa — lo que
 * cambia es que aquí todas las piezas pesan igual, sin destacados.
 */
export default function ProductCard({ product, plans, editMode, onEdit }) {
  const money = useCatalogMoney()
  const { open, price, period } = productSummary(product, plans)

  return (
    <article
      className={cx(
        'glass group relative flex flex-col overflow-hidden',
        open && 'transition duration-300 hover:-translate-y-1 hover:border-line-strong',
        product.featured && 'border-hex-500/35 bg-hex-500/[0.055]',
        !open && 'opacity-75',
        product.hidden && 'border-dashed border-amber-400/30 opacity-70',
      )}
    >
      <ProductCover product={product} iconSize={44} />

      <div className="flex flex-1 flex-col p-4">
        <h3 className="display truncate text-base font-bold text-white">{product.name}</h3>

        {product.tagline && (
          <p className="mt-1.5 line-clamp-2 text-sm leading-snug text-slate-400">
            {product.tagline}
          </p>
        )}

        <div className="mt-5 border-t border-line-soft pt-4">
          {price !== null ? (
            <>
              <div className="text-micro font-semibold tracking-wider text-slate-500 uppercase">
                Desde
              </div>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="pixel text-2xl text-white">{money(price)}</span>
                <span className="text-micro text-slate-500">{period}</span>
              </div>
            </>
          ) : (
            <div className="text-sm text-slate-500">Sin planes disponibles</div>
          )}
        </div>

        <a
          href={productHref(product)}
          aria-disabled={!open}
          onClick={(event) => !open && event.preventDefault()}
          aria-label={`Ver planes de ${product.name}`}
          className={cx(
            'btn mt-4 w-full py-2.5',
            open ? 'btn-primary' : 'btn-ghost pointer-events-none opacity-50',
          )}
        >
          {open ? 'Ver planes' : 'No disponible'}
          {open && (
            <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
          )}
        </a>

        {editMode && (
          <button
            onClick={() => onEdit(product.id)}
            className="btn-ghost btn-sm mt-3 w-full border-hex-500/30 bg-hex-500/10 py-1.5 text-hex-200"
          >
            <Settings2 size={12} />
            Editar
          </button>
        )}
      </div>
    </article>
  )
}
