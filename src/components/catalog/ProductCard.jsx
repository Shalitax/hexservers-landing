import { ArrowRight, EyeOff, Settings2, Star } from 'lucide-react'
import { useSite, useCatalogMoney } from '../../store/useSite.js'
import { productSummary, tiersOf } from '../../lib/catalog.js'
import { cx } from '../../lib/utils.js'
import { productHref } from '../../lib/router.js'
import { Icon, Glyph } from '../ui/icons.jsx'
import StatusPill from './StatusPill.jsx'

/**
 * Tarjeta compacta de producto: lo mismo que la box grande pero sin descripción
 * larga ni argumentos de venta. Es la pieza de los modos «rejilla» y «escaparate».
 */
export default function ProductCard({ product, group, plans, editMode, onEdit }) {
  const site = useSite((s) => s.site)
  const money = useCatalogMoney()
  const tiers = tiersOf(site, plans)
  const { open, count, price, period } = productSummary(product, plans)

  return (
    <article
      className={cx(
        'glass group relative flex flex-col p-5',
        open && 'transition duration-300 hover:-translate-y-1 hover:border-line-strong hover:bg-surface-3',
        product.featured && 'border-hex-500/35 bg-hex-500/[0.055]',
        !open && 'opacity-75',
        product.hidden && 'border-dashed border-amber-400/30 opacity-70',
      )}
    >
      <header className="flex items-start gap-3">
        {product.image ? (
          <img
            src={product.image}
            alt=""
            loading="lazy"
            className="size-11 shrink-0 rounded-xl border border-line object-cover"
          />
        ) : (
          <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-line bg-gradient-to-br from-hex-500/20 to-plasma-500/15 text-hex-300">
            <Icon name={product.icon} size={22} />
          </span>
        )}

        <div className="min-w-0 flex-1">
          <h3 className="display truncate text-base font-bold text-white">{product.name}</h3>
          {group && (
            <p className="mt-0.5 inline-flex items-center gap-1.5 text-micro font-semibold tracking-wider text-slate-500 uppercase">
              <Glyph name={group.icon} image={group.image} size={11} className="text-hex-400" />
              {group.name}
            </p>
          )}
        </div>
      </header>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {/* Gamas disponibles: sólo si hay más de una, que es cuando informan. */}
        {tiers.length > 1 &&
          tiers.map((tier) => (
            <span key={tier.id} className="chip !text-micro">
              {tier.name}
            </span>
          ))}
        {product.badge && (
          <span className="chip pixel border-hex-400/30 bg-hex-500/15 !text-micro !text-hex-200">
            <Star size={9} className="fill-current" />
            {product.badge}
          </span>
        )}
        {product.status !== 'available' && <StatusPill status={product.status} />}
        {product.hidden && (
          <span className="chip border-amber-400/25 bg-amber-400/10 !text-micro !text-amber-300">
            <EyeOff size={10} />
            Oculto
          </span>
        )}
      </div>

      {product.tagline && (
        <p className="mt-3 flex-1 text-sm leading-snug text-slate-400">{product.tagline}</p>
      )}

      <div className="mt-5 flex items-end justify-between gap-3 border-t border-line-soft pt-4">
        <div className="min-w-0">
          <div className="text-micro font-semibold tracking-wider text-slate-500 uppercase">
            {count === 1 ? '1 plan' : `${count} planes`}
          </div>
          {price !== null ? (
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-micro text-slate-500">desde</span>
              <span className="pixel text-sm text-white">{money(price)}</span>
              <span className="text-micro text-slate-500">{period}</span>
            </div>
          ) : (
            <div className="mt-1 text-xs text-slate-500">Sin planes</div>
          )}
        </div>

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
          {open ? 'Ver' : 'No disponible'}
          {open && <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />}
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
    </article>
  )
}
