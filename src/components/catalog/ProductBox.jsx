import { ArrowRight, EyeOff, Layers, Settings2, Star } from 'lucide-react'
import { useMoney } from '../../store/useSite.js'
import { cx } from '../../lib/utils.js'
import { productHref } from '../../lib/router.js'
import { Icon, Glyph, glyphBox } from '../ui/icons.jsx'
import StatusPill from './StatusPill.jsx'

/**
 * La "box" grande de un producto en la página de catálogo: Minecraft, VPS Linux,
 * Hosting cPanel… No vende nada por sí misma, lleva al flujo de compra del producto.
 */
export default function ProductBox({ product, group, plans, editMode, onEdit }) {
  const money = useMoney()
  const sellable = plans.filter((plan) => plan.status === 'available')
  const reference = sellable[0] || plans[0]
  const fromPrice = sellable.length
    ? Math.min(...sellable.map((plan) => Number(plan.price) || 0))
    : null
  const open = product.status === 'available' && plans.length > 0

  return (
    <article
      className={cx(
        'glass group relative flex flex-col overflow-hidden p-6 transition duration-300 sm:p-7',
        open && 'hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.07]',
        product.featured && 'border-hex-500/35 bg-hex-500/[0.055]',
        !open && 'opacity-75',
        /* Sólo se ve en modo edición: el visitante no lo tiene en la lista. */
        product.hidden && 'border-dashed border-amber-400/30 opacity-70',
      )}
    >
      {product.featured && (
        <div
          className="glow-blue pointer-events-none absolute -top-24 -right-20 size-72 opacity-50"
          aria-hidden="true"
        />
      )}

      {/* Cabecera: identidad del producto */}
      <header className="relative flex items-start gap-4">
        {product.image ? (
          <img
            src={product.image}
            alt=""
            loading="lazy"
            className="size-16 shrink-0 rounded-xl border border-white/10 object-cover sm:size-20"
          />
        ) : (
          <span className="grid size-16 shrink-0 place-items-center rounded-xl border border-white/10 bg-gradient-to-br from-hex-500/20 to-plasma-500/15 text-hex-300 sm:size-20">
            <Icon name={product.icon} size={30} />
          </span>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="display text-xl font-bold text-white sm:text-2xl">{product.name}</h3>
            {product.badge && (
              <span className="chip pixel border-hex-400/30 bg-hex-500/15 !text-[8px] !text-hex-200">
                <Star size={9} className="fill-current" />
                {product.badge}
              </span>
            )}
            {product.status !== 'available' && <StatusPill status={product.status} />}
            {product.hidden && (
              <span className="chip shrink-0 border-amber-400/25 bg-amber-400/10 !text-[10px] !text-amber-300">
                <EyeOff size={10} />
                Oculto
              </span>
            )}
          </div>

          {group && (
            <p className="mt-1.5 inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
              <Glyph name={group.icon} image={group.image} size={12} className="text-hex-400" />
              {group.name}
            </p>
          )}

          {product.tagline && (
            <p className="mt-2 text-sm font-medium text-slate-300">{product.tagline}</p>
          )}
        </div>
      </header>

      {product.description && (
        <p className="relative mt-4 text-sm leading-relaxed text-slate-400">{product.description}</p>
      )}

      {/* Argumentos de venta del producto */}
      {product.highlights?.length > 0 && (
        <ul className="relative mt-5 grid gap-3 border-t border-white/8 pt-5 sm:grid-cols-3">
          {product.highlights.map((item) => (
            <li key={item.id} className="flex gap-2.5">
              <span
                className={cx(
                  'mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg border border-white/10',
                  glyphBox(item.image, { flat: true }),
                )}
              >
                <Glyph name={item.icon} image={item.image} size={14} />
              </span>
              <span className="min-w-0">
                <span className="block text-xs font-semibold text-white">{item.title}</span>
                <span className="mt-0.5 block text-[11px] leading-snug text-slate-500">
                  {item.description}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}

      {/* Pie: precio de entrada y acceso al flujo de compra */}
      <div className="relative mt-6 flex flex-wrap items-end justify-between gap-4 border-t border-white/8 pt-5">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
            <Layers size={12} className="text-hex-400" />
            {plans.length === 1 ? '1 plan' : `${plans.length} planes`}
          </div>
          {fromPrice !== null ? (
            <div className="mt-1.5 flex items-baseline gap-1.5">
              <span className="text-xs text-slate-500">desde</span>
              <span className="pixel text-lg text-white">
                {money(fromPrice)}
              </span>
              <span className="text-xs font-medium text-slate-500">{reference?.period}</span>
            </div>
          ) : (
            <div className="mt-1.5 text-sm text-slate-500">Sin planes disponibles</div>
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
          className="btn-ghost btn-sm relative mt-4 w-full border-hex-500/30 bg-hex-500/10 py-2 text-hex-200"
        >
          <Settings2 size={13} />
          Editar producto y sus planes
        </button>
      )}
    </article>
  )
}
