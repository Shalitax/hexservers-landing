import { useSite } from '../store/useSite.js'
import { cx } from '../lib/utils.js'
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

        {/* Complementos */}
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.items.map((item, index) => (
            <article
              key={item.id}
              className="glass glass-hover group p-5"
              style={{ animationDelay: `${index * 40}ms` }}
            >
              <span
                className={cx(
                  'mb-4 grid size-11 place-items-center rounded-xl border border-white/10 transition',
                  item.image
                    ? 'bg-white/[0.06] p-1.5'
                    : 'bg-gradient-to-br from-hex-500/20 to-plasma-500/15 text-hex-300 group-hover:from-hex-500/30 group-hover:text-hex-200',
                )}
              >
                <Glyph name={item.icon} image={item.image} size={item.image ? 28 : 19} alt="" />
              </span>
              <Editable
                path={`features.items.${index}.title`}
                as="h3"
                className="display text-base font-bold text-white"
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
