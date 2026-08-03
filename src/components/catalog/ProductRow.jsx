import { ArrowRight, EyeOff, Settings2, Star } from 'lucide-react'
import { useMoney } from '../../store/useSite.js'
import { productSummary } from '../../lib/catalog.js'
import { cx } from '../../lib/utils.js'
import { productHref } from '../../lib/router.js'
import { Icon, Glyph } from '../ui/icons.jsx'
import StatusPill from './StatusPill.jsx'

/**
 * Producto como fila a ancho completo: el modo «lista». Cabe mucho más catálogo en
 * la misma pantalla que con tarjetas, a cambio de enseñar menos de cada producto.
 *
 * En móvil se dobla en dos líneas — una fila estrecha no es una fila, es un lío.
 */
export default function ProductRow({ product, group, plans, editMode, onEdit }) {
  const money = useMoney()
  const { open, count, price, period } = productSummary(product, plans)

  return (
    <article
      className={cx(
        'glass glass-hover group flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:gap-5 sm:p-5',
        product.featured && 'border-hex-500/35 bg-hex-500/[0.055]',
        !open && 'opacity-75',
        product.hidden && 'border-dashed border-amber-400/30 opacity-70',
      )}
    >
      {product.image ? (
        <img
          src={product.image}
          alt=""
          loading="lazy"
          className="size-12 shrink-0 rounded-xl border border-white/10 object-cover"
        />
      ) : (
        <span className="grid size-12 shrink-0 place-items-center rounded-xl border border-white/10 bg-gradient-to-br from-hex-500/20 to-plasma-500/15 text-hex-300">
          <Icon name={product.icon} size={22} />
        </span>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="display text-base font-bold text-white">{product.name}</h3>
          {product.badge && (
            <span className="chip pixel border-hex-400/30 bg-hex-500/15 !text-[8px] !text-hex-200">
              <Star size={9} className="fill-current" />
              {product.badge}
            </span>
          )}
          {product.status !== 'available' && <StatusPill status={product.status} />}
          {product.hidden && (
            <span className="chip border-amber-400/25 bg-amber-400/10 !text-[10px] !text-amber-300">
              <EyeOff size={10} />
              Oculto
            </span>
          )}
        </div>

        <p className="mt-1 truncate text-sm text-slate-400">
          {product.tagline || product.description}
        </p>

        {group && (
          <p className="mt-1.5 inline-flex items-center gap-1.5 text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
            <Glyph name={group.icon} image={group.image} size={11} className="text-hex-400" />
            {group.name}
            <span className="text-slate-700">·</span>
            {count === 1 ? '1 plan' : `${count} planes`}
          </p>
        )}
      </div>

      <div className="shrink-0 sm:text-right">
        {price !== null ? (
          <div className="flex items-baseline gap-1.5 sm:justify-end">
            <span className="text-[11px] text-slate-500">desde</span>
            <span className="pixel text-base text-white">{money(price)}</span>
            <span className="text-[11px] text-slate-500">{period}</span>
          </div>
        ) : (
          <div className="text-xs text-slate-500">Sin planes disponibles</div>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {editMode && (
          <button
            onClick={() => onEdit(product.id)}
            aria-label={`Editar ${product.name}`}
            className="btn-ghost btn-sm border-hex-500/30 bg-hex-500/10 p-2 text-hex-200"
          >
            <Settings2 size={13} />
          </button>
        )}
        <a
          href={productHref(product)}
          aria-disabled={!open}
          onClick={(event) => !open && event.preventDefault()}
          className={cx(
            'px-4 py-2 text-sm',
            open ? 'btn-primary' : 'btn-ghost pointer-events-none opacity-50',
          )}
        >
          {open ? 'Ver planes' : 'No disponible'}
          {open && <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />}
        </a>
      </div>
    </article>
  )
}
