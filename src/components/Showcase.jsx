import { useMemo, useState } from 'react'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { useSite, useCatalogMoney, listedProducts, plansOfProduct } from '../store/useSite.js'
import { href, productHref } from '../lib/router.js'
import { cx } from '../lib/utils.js'
import SectionHeading from './SectionHeading.jsx'
import { Icon } from './ui/icons.jsx'
import { stagger } from '../lib/reveal.js'

const ALL = '*'

/**
 * Explorador de productos de la portada, a la manera de los hosts de referencia:
 * una fila de pestañas (una por subcategoría) y una rejilla de fichas que se
 * filtra al instante. No vende planes — su único trabajo es mandar al cliente a
 * la página de productos.
 */
export default function Showcase() {
  const site = useSite((s) => s.site)
  const showcase = site.showcase
  const money = useCatalogMoney()
  const [active, setActive] = useState(ALL)

  /* Producto + su plan más barato disponible. */
  const cards = useMemo(
    () =>
      listedProducts(site).map((product) => {
        const plans = plansOfProduct(site, product.id).filter(
          (plan) => plan.status === 'available',
        )
        const from = plans.length ? Math.min(...plans.map((p) => Number(p.price) || 0)) : null
        return { product, from }
      }),
    [site],
  )

  const visible =
    active === ALL ? cards : cards.filter(({ product }) => product.groupId === active)

  return (
    <section id="catalogo" className="section">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow={showcase.eyebrow}
          titlePath="showcase.title"
          subtitlePath="showcase.subtitle"
        />

        {/* Pestañas: «Todo» + una por subcategoría. */}
        <div
          role="tablist"
          aria-label="Filtrar por subcategoría"
          className="mt-10 flex flex-wrap justify-center gap-2"
          data-reveal
        >
          <Tab id={ALL} active={active === ALL} onClick={() => setActive(ALL)}>
            Todo
          </Tab>
          {site.groups.map((group) => (
            <Tab
              key={group.id}
              id={group.id}
              active={active === group.id}
              onClick={() => setActive(group.id)}
            >
              {group.name}
            </Tab>
          ))}
        </div>

        {/* Fichas de producto */}
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map(({ product, from }, index) => (
            <a
              key={product.id}
              href={productHref(product)}
              data-reveal
              style={stagger(index)}
              className="glass glass-hover group relative flex flex-col overflow-hidden p-6"
            >
              <div
                className="glow-blue pointer-events-none absolute -top-24 -right-16 size-56 opacity-0 transition-opacity duration-500 group-hover:opacity-60"
                aria-hidden="true"
              />

              <div className="relative flex items-start justify-between gap-3">
                <span
                  className={cx(
                    'grid size-11 place-items-center rounded-xl border border-line transition',
                    'bg-gradient-to-br from-hex-500/20 to-plasma-500/15 text-hex-300 group-hover:from-hex-500/30 group-hover:text-hex-200',
                  )}
                >
                  <Icon name={product.icon} size={20} />
                </span>
                <ArrowRight
                  size={16}
                  className="mt-1 shrink-0 -translate-x-1 text-hex-300 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100"
                />
              </div>

              <h3 className="display relative mt-4 text-lg font-bold text-white">
                {product.name}
              </h3>
              <p className="relative mt-2 line-clamp-2 text-sm leading-relaxed text-slate-400">
                {product.tagline || product.description}
              </p>

              <div className="relative mt-auto flex items-center gap-2 pt-5 text-sm">
                {from !== null ? (
                  <>
                    <span className="text-slate-500">desde</span>
                    <span className="pixel text-base text-white">{money(from)}</span>
                  </>
                ) : (
                  <span className="text-slate-600">Próximamente</span>
                )}
              </div>
            </a>
          ))}
        </div>

        <div className="mt-10 flex justify-center" data-reveal>
          <a href={href('/productos')} className="btn-primary px-6 py-3">
            {showcase.ctaLabel}
            <ArrowUpRight size={16} />
          </a>
        </div>
      </div>
    </section>
  )
}

/* ---------------------------------- pestaña --------------------------------- */

function Tab({ id, active, onClick, children }) {
  return (
    <button
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cx(
        'cursor-pointer rounded-full border px-4 py-2 text-sm font-medium transition',
        active
          ? 'border-hex-500/60 bg-hex-500/15 text-white'
          : 'border-line bg-surface-1 text-slate-400 hover:border-line-strong hover:text-white',
      )}
    >
      {children}
    </button>
  )
}
