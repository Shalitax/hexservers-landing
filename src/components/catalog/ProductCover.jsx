import { EyeOff, Star } from 'lucide-react'
import { cx } from '../../lib/utils.js'
import { Icon } from '../ui/icons.jsx'
import StatusPill from './StatusPill.jsx'

/**
 * Portada de las tarjetas de producto.
 *
 * Manda la imagen subida desde el panel: es la carátula que identifica un juego
 * de un vistazo, como en los hosts de referencia. Sin imagen no se deja un hueco
 * vacío — se pinta una cubierta generada con el icono del producto sobre un
 * degradado de la marca, con un sello de serigrafía en la esquina.
 *
 * Los distintivos (badge, estado, oculto) van encima de la portada, como las
 * etiquetas de una tienda.
 */
export default function ProductCover({ product, aspect = 'aspect-[16/10]', iconSize = 48 }) {
  return (
    <div className={cx('relative overflow-hidden border-b border-line-soft', aspect)}>
      {product.image ? (
        <img
          src={product.image}
          alt=""
          loading="lazy"
          className="size-full object-cover transition duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="relative grid size-full place-items-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-hex-500/20 via-void-2 to-plasma-500/15" />
          <div className="glow-blue absolute -top-12 -right-10 size-44 opacity-70" />
          <Icon name={product.icon} size={iconSize} className="relative text-hex-300" />
          {/* Sello de serigrafía: la marca, en la cubierta. */}
          <span className="pixel absolute right-3 bottom-2.5 text-[8px] text-white/25 uppercase">
            HEX
          </span>
        </div>
      )}

      {/* Distintivos sobre la portada */}
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
  )
}
