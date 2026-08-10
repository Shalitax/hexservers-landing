import { ArrowRight, Check, EyeOff, Settings2, Star } from 'lucide-react'
import { useSite, useCatalogMoney } from '../../store/useSite.js'
import { productSummary, tiersOf } from '../../lib/catalog.js'
import { cx } from '../../lib/utils.js'
import { productHref } from '../../lib/router.js'
import { stagger } from '../../lib/reveal.js'
import { Icon, Glyph } from '../ui/icons.jsx'
import StatusPill from './StatusPill.jsx'

/**
 * Baldosa de producto para el modo «rejilla buscable».
 *
 * A diferencia de `ProductCard`, aquí manda la imagen: ocupa la mitad de la pieza y
 * el texto se reduce a nombre, categoría y una línea. Está pensada para catálogos
 * donde lo que se elige es *cuál* —un juego, sobre todo— y no *cuánto*: en esa
 * decisión la carátula identifica más rápido que cualquier ficha de specs.
 *
 * Sin imagen no se deja el hueco vacío: el icono del producto se pinta en grande
 * sobre un degradado de la marca, que es feo sólo si se compara con una carátula
 * que no existe.
 *
 * En versión `featured` ocupa el doble de ancho y añade lo que en la compacta no
 * cabe: los argumentos del producto y el precio en grande. Sin eso el catálogo era
 * una cuadrícula plana donde las ocho piezas pesaban igual y la mirada no tenía
 * dónde caer — que es medio motivo por el que una página de catálogo no vende.
 */
export default function ProductTile({
  product,
  group,
  plans,
  editMode,
  onEdit,
  featured = false,
  index = 0,
}) {
  const site = useSite((s) => s.site)
  const money = useCatalogMoney()
  const { open, price, period } = productSummary(product, plans)
  /* Gamas en las que este producto tiene planes. Enseñarlas aquí es la diferencia
     entre «tenemos Minecraft» y «tenemos Minecraft, también en versión barata»:
     antes esa segunda mitad vivía en otra pestaña y no se enteraba nadie. */
  const tiers = tiersOf(site, plans)

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
      <div
        className={cx(
          'relative overflow-hidden border-b border-line-soft',
          featured ? 'aspect-[16/7]' : 'aspect-[16/10]',
        )}
      >
        {product.image ? (
          <img
            src={product.image}
            alt=""
            loading="lazy"
            className="size-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="grid size-full place-items-center bg-gradient-to-br from-hex-500/20 to-plasma-500/15 text-hex-300">
            <Icon name={product.icon} size={44} />
          </div>
        )}

        {/* Distintivos sobre la imagen, como las etiquetas de una tienda. */}
        <div className="absolute inset-x-2 top-2 flex flex-wrap items-start gap-1.5">
          {product.badge && (
            <span className="chip border-hex-400/40 bg-void/80 !text-micro !text-hex-200 backdrop-blur">
              <Star size={9} className="fill-current" />
              {product.badge}
            </span>
          )}
          {product.status !== 'available' && <StatusPill status={product.status} />}
          {product.hidden && (
            <span className="chip border-amber-400/30 bg-void/80 !text-micro !text-amber-300 backdrop-blur">
              <EyeOff size={10} />
              Oculto
            </span>
          )}
        </div>
      </div>

      {/* Ficha */}
      <div className="flex flex-1 flex-col p-4">
        <h3 className={cx('display truncate font-bold text-white', featured ? 'text-xl' : 'text-base')}>
          {product.name}
        </h3>

        {group && (
          <p className="mt-1 inline-flex items-center gap-1.5 text-micro font-semibold tracking-wider text-slate-500 uppercase">
            <Glyph name={group.icon} image={group.image} size={11} className="text-hex-400" />
            {group.name}
          </p>
        )}

        {tiers.length > 1 && (
          <ul className="mt-2 flex flex-wrap gap-1">
            {tiers.map((tier) => (
              <li key={tier.id} className="chip !text-micro">
                {tier.name}
              </li>
            ))}
          </ul>
        )}

        {product.tagline && (
          <p
            className={cx(
              'mt-2.5 text-sm leading-snug text-slate-400',
              featured ? 'line-clamp-3' : 'line-clamp-2',
            )}
          >
            {product.tagline}
          </p>
        )}

        {/* Sólo en el destacado: los argumentos, que es lo que justifica el tamaño. */}
        {featured && product.highlights?.length > 0 && (
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {product.highlights.slice(0, 4).map((item) => (
              <li key={item.id} className="flex items-start gap-2 text-sm text-slate-400">
                <Check size={14} className="mt-0.5 shrink-0 text-hex-400" />
                <span className="min-w-0">{item.title}</span>
              </li>
            ))}
          </ul>
        )}

        {/* Empuja el pie abajo para que las baldosas de una fila cuadren entre sí. */}
        <div className="min-h-2 grow" aria-hidden="true" />

        <div className="mt-4 flex items-end justify-between gap-2 border-t border-line-soft pt-3">
          {price !== null ? (
            <div className="min-w-0">
              <div className="text-micro font-semibold tracking-wider text-slate-500 uppercase">
                Desde
              </div>
              <div className="flex items-baseline gap-1">
                {/**
                 * En el destacado el precio es lo segundo más grande de la pieza,
                 * después del nombre: es el dato por el que se está mirando esto.
                 * En la compacta se queda pequeño para no competir con él.
                 */}
                <span className={cx('pixel text-white', featured ? 'text-2xl' : 'text-sm')}>
                  {money(price)}
                </span>
                <span className={cx('text-slate-500', featured ? 'text-sm' : 'text-micro')}>
                  {period}
                </span>
              </div>
            </div>
          ) : (
            <span className="text-xs text-slate-600">Sin planes</span>
          )}

          <a
            href={productHref(product)}
            aria-disabled={!open}
            onClick={(event) => !open && event.preventDefault()}
            aria-label={`Ver planes de ${product.name}`}
            className={cx(
              'btn-sm shrink-0 px-3 py-2',
              open ? 'btn-primary' : 'btn-ghost pointer-events-none opacity-50',
            )}
          >
            {open ? 'Desplegar' : 'No disponible'}
            {open && (
              <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
            )}
          </a>
        </div>

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
