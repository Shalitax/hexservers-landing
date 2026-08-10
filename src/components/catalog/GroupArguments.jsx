import { cx } from '../../lib/utils.js'
import { Glyph, glyphBox } from '../ui/icons.jsx'
import { stagger } from '../../lib/reveal.js'

/**
 * Argumentos de la familia, bajo la rejilla del catálogo.
 *
 * Los mismos `group.highlights` que salen como píldoras junto al titular, aquí en
 * grande y con su descripción. No es repetirse: arriba son una promesa de una
 * palabra para quien está decidiendo si esta página le sirve, y abajo son el
 * argumento entero para quien ya ha mirado los productos y está dudando.
 *
 * Aparece después de las tarjetas a propósito. Antes de ellas empujaría el
 * catálogo fuera de la pantalla, y a un catálogo se entra a ver qué hay.
 */
export default function GroupArguments({ group }) {
  const items = group?.highlights || []
  if (items.length === 0) return null

  return (
    <section className="section">
      <div
        className={cx(
          'grid gap-5',
          items.length === 2 && 'sm:grid-cols-2',
          items.length === 3 && 'sm:grid-cols-2 lg:grid-cols-3',
          items.length >= 4 && 'sm:grid-cols-2 lg:grid-cols-4',
        )}
      >
        {items.map((item, index) => (
          <article key={item.id} className="glass p-5" data-reveal style={stagger(index)}>
            <span
              className={cx(
                'mb-4 grid size-11 place-items-center rounded-xl border border-line',
                glyphBox(item.image, { flat: true }),
              )}
            >
              <Glyph name={item.icon} image={item.image} size={item.image ? 26 : 19} alt="" />
            </span>
            <h3 className="display text-base font-bold text-white">{item.title}</h3>
            {item.description && (
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{item.description}</p>
            )}
          </article>
        ))}
      </div>
    </section>
  )
}
