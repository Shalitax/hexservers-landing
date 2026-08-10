import { useMemo } from 'react'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { useSite, useCatalogMoney, listedProducts } from '../store/useSite.js'
import { href, groupHref } from '../lib/router.js'
import { cx } from '../lib/utils.js'
import SectionHeading from './SectionHeading.jsx'
import { Icon, Glyph } from './ui/icons.jsx'
import { stagger } from '../lib/reveal.js'

/**
 * Bloque de portada que presenta las subcategorías del catálogo. No vende planes:
 * su único trabajo es mandar al cliente a la página de productos.
 */
export default function Showcase() {
  const site = useSite((s) => s.site)
  const showcase = site.showcase
  const money = useCatalogMoney()

  const cards = useMemo(
    () =>
      site.groups.map((group) => {
        // La portada nunca muestra ocultos, tampoco en modo edición.
        const products = listedProducts(site, group.id)
        const plans = site.plans.filter((plan) =>
          products.some((product) => product.id === plan.productId && plan.status === 'available'),
        )
        const from = plans.length ? Math.min(...plans.map((p) => Number(p.price) || 0)) : null
        return { group, products, from }
      }),
    [site],
  )

  return (
    <section id="catalogo" className="section">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow={showcase.eyebrow}
          titlePath="showcase.title"
          subtitlePath="showcase.subtitle"
        />

        {/* La rejilla se adapta al número de subcategorías, no al revés. */}
        <div
          className={cx(
            'mt-12 grid gap-5 sm:grid-cols-2',
            cards.length === 3 && 'lg:grid-cols-3',
            cards.length >= 4 && 'lg:grid-cols-4',
          )}
        >
          {cards.map(({ group, products, from }, index) => (
            <a
              key={group.id}
              href={groupHref(group)}
              data-reveal
              style={stagger(index)}
              className="glass glass-hover group relative flex flex-col overflow-hidden p-6"
            >
              <div
                className="glow-blue pointer-events-none absolute -top-24 -right-16 size-56 opacity-0 transition-opacity duration-500 group-hover:opacity-60"
                aria-hidden="true"
              />

              <span
                className={cx(
                  'relative grid size-11 place-items-center rounded-xl border border-line transition',
                  group.image
                    ? 'bg-surface-2 p-1.5'
                    : 'bg-gradient-to-br from-hex-500/20 to-plasma-500/15 text-hex-300 group-hover:from-hex-500/30 group-hover:text-hex-200',
                )}
              >
                <Glyph name={group.icon} image={group.image} size={group.image ? 32 : 22} alt="" />
              </span>

              <h3 className="display relative mt-4 text-lg font-bold text-white">{group.name}</h3>
              <p className="relative mt-2 text-sm leading-relaxed text-slate-400">
                {group.description || group.tagline}
              </p>

              {/* Productos que contiene la subcategoría */}
              {products.length > 0 && (
                <ul className="relative mt-4 flex flex-wrap gap-1.5">
                  {products.slice(0, 4).map((product) => (
                    <li key={product.id} className="chip !text-micro">
                      <Icon name={product.icon} size={11} className="text-hex-400" />
                      {product.name}
                    </li>
                  ))}
                  {products.length > 4 && (
                    <li className="chip !text-micro !text-slate-500">
                      +{products.length - 4}
                    </li>
                  )}
                </ul>
              )}

              <div className="relative mt-auto flex items-end justify-between gap-3 pt-6">
                {from !== null ? (
                  <span className="text-sm text-slate-500">
                    desde{' '}
                    <span className="pixel text-sm text-white">{money(from)}</span>
                  </span>
                ) : (
                  <span className="text-sm text-slate-600">Próximamente</span>
                )}
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-hex-300">
                  Ver productos
                  <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </a>
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <a href={href('/productos')} className="btn-primary px-6 py-3">
            {showcase.ctaLabel}
            <ArrowUpRight size={16} />
          </a>
        </div>
      </div>
    </section>
  )
}
