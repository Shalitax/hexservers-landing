import { ArrowRight, Settings2 } from 'lucide-react'
import { useCatalogMoney } from '../../store/useSite.js'
import { productSummary } from '../../lib/catalog.js'
import { cx } from '../../lib/utils.js'
import { productHref } from '../../lib/router.js'
import { stagger } from '../../lib/reveal.js'
import ProductCover from './ProductCover.jsx'

/**
 * Baldosa simple de producto: portada, nombre, una frase y el precio de entrada.
 *
 * Es el patrón de los hosts de referencia —carátula + «desde $X» + botón—: en un
 * catálogo de juegos lo que se decide es *cuál*, y eso lo dice la carátula antes
 * que ninguna ficha de especificaciones. Lo demás (gamas, argumentos, planes)
 * vive en la ficha del producto, a un click.
 *
 * La versión `featured` ocupa el doble de ancho y sube la talla de todo —portada,
 * nombre y precio— sin añadir contenido: lo que la hace destacar es el tamaño,
 * no más ruido.
 */
export default function ProductTile({
  product,
  plans,
  editMode,
  onEdit,
  featured = false,
  index = 0,
}) {
  const money = useCatalogMoney()
  const { open, price, period } = productSummary(product, plans)

  return (
    <article
      data-reveal
      style={stagger(index)}
      className={cx(
        'glass group relative flex flex-col overflow-hidden',
        open && 'transition duration-300 hover:-translate-y-1 hover:border-line-strong',
        !open && 'opacity-75',
        product.hidden && 'border-dashed border-amber-400/30 opacity-70',
      )}
    >
      {/* Portada */}
      <ProductCover
        product={product}
        aspect={featured ? 'aspect-[16/7]' : 'aspect-[16/10]'}
        iconSize={featured ? 64 : 48}
      />

      {/* Ficha: nombre, una frase, precio y botón. Nada más que leer. */}
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <h3
          className={cx(
            'display truncate font-bold text-white',
            featured ? 'text-xl sm:text-2xl' : 'text-base sm:text-lg',
          )}
        >
          {product.name}
        </h3>

        {product.tagline && (
          <p
            className={cx(
              'mt-1.5 text-sm leading-snug text-slate-400',
              featured ? 'line-clamp-3' : 'line-clamp-2',
            )}
          >
            {product.tagline}
          </p>
        )}

        {/* El precio es el dato por el que se mira una tarjeta: etiqueta pequeña
            arriba y cifra grande debajo, sin competir con nada. */}
        <div className="mt-5 border-t border-line-soft pt-4">
          {price !== null ? (
            <>
              <div className="text-micro font-semibold tracking-wider text-slate-500 uppercase">
                Desde
              </div>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className={cx('pixel text-white', featured ? 'text-3xl' : 'text-2xl')}>
                  {money(price)}
                </span>
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
