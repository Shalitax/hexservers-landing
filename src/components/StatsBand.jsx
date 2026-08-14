import { useSite } from '../store/useSite.js'
import { cx } from '../lib/utils.js'
import { stagger } from '../lib/reveal.js'
import CountUp from './ui/CountUp.jsx'

/**
 * Franja de métricas, a la manera de los hosts de referencia: cuatro cifras en
 * una sola tira dividida por líneas capilares, sin tarjetas alrededor.
 *
 * Las cifras siguen siendo las que se editan en el panel → Contenido → Hero
 * (`hero.stats`); el hero las dejó aquí para que el titular respire.
 */
export default function StatsBand() {
  const stats = useSite((s) => s.site.hero.stats)

  if (!stats?.length) return null

  return (
    <section id="stats" className="section">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <div
              key={stat.id}
              data-reveal
              style={stagger(index)}
              className={cx(
                'px-5 py-8 text-center sm:py-10',
                /* Rejilla de 2 columnas en móvil y de 4 en escritorio: cada celda
                   pinta sólo las líneas que le tocan según dónde caiga. */
                index % 2 === 1 && 'max-lg:border-l max-lg:border-line-soft',
                index >= 2 && 'max-lg:border-t max-lg:border-line-soft',
                index > 0 && 'lg:border-l lg:border-line-soft',
              )}
            >
              <CountUp
                value={stat.value}
                className="display block text-3xl font-bold text-white sm:text-4xl"
              />
              <div className="mt-2 text-micro font-medium tracking-wider text-slate-500 uppercase">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
