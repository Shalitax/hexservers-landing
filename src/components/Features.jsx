import { useSite } from '../store/useSite.js'
import { stagger } from '../lib/reveal.js'
import SectionHeading from './SectionHeading.jsx'
import Editable from './ui/Editable.jsx'
import { Glyph } from './ui/icons.jsx'

export default function Features() {
  const features = useSite((s) => s.site.features)

  return (
    <section id="features" className="section">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Incluido"
          titlePath="features.title"
          subtitlePath="features.subtitle"
        />

        {/* Fila editorial: línea capilar arriba de cada motivo, sin tarjetas
            alrededor. La página ya tiene bastante superficie, esto pesa menos. */}
        <div className="mt-14 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
          {features.items.map((item, index) => (
            <article
              key={item.id}
              className="group border-t border-line pt-6"
              data-reveal
              style={stagger(index)}
            >
              <span className="grid size-11 place-items-center rounded-lg border border-line bg-surface-1 text-hex-300 transition group-hover:border-hex-500/40 group-hover:text-hex-200">
                <Glyph name={item.icon} image={item.image} size={item.image ? 26 : 19} alt="" />
              </span>
              <Editable
                path={`features.items.${index}.title`}
                as="h3"
                className="display mt-4 text-base font-bold text-white"
              />
              <Editable
                path={`features.items.${index}.description`}
                as="p"
                multiline
                className="mt-2 text-sm leading-relaxed text-slate-400"
              />
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
