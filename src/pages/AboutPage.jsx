import { ArrowRight, Mail } from 'lucide-react'
import { useSite } from '../store/useSite.js'
import { cx, safeUrl } from '../lib/utils.js'
import Editable from '../components/ui/Editable.jsx'
import { Glyph } from '../components/ui/icons.jsx'
import CountUp from '../components/ui/CountUp.jsx'
import { stagger } from '../lib/reveal.js'

/**
 * Página «Nosotros»: quiénes somos, cómo trabajamos y en qué se nota.
 *
 * Al mismo ritmo que la portada: cabecera grande, cifras en franja, la historia
 * compacta junto al rack (foto si hay, si no un rack dibujado con las ubicaciones
 * reales) y un único cierre centrado con el CTA del panel.
 */
export default function AboutPage() {
  const site = useSite((s) => s.site)
  const about = site.about
  const locations = site.locations.items
  const cities = locations.filter((item) => item.status !== 'soon').map((item) => item.city)

  return (
    <main className="pb-8">
      {/* Cabecera, al ritmo de la portada. */}
      <header className="pt-32 sm:pt-44">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <div className="eyebrow mb-3">{about.eyebrow}</div>
          <Editable
            path="about.title"
            as="h1"
            multiline
            className="display text-4xl leading-[1.06] font-extrabold text-balance text-white sm:text-5xl lg:text-6xl"
          />
          <Editable
            path="about.subtitle"
            as="p"
            multiline
            className="anim-up mx-auto mt-6 max-w-2xl text-base leading-relaxed text-pretty text-slate-400 sm:text-lg"
          />
        </div>
      </header>

      {/* ------------------------------- Cifras -------------------------------- */}
      {about.stats?.length > 0 && (
        <section className="section">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 lg:grid-cols-4">
              {about.stats.map((stat, index) => (
                <div
                  key={stat.id}
                  data-reveal
                  style={stagger(index)}
                  className={cx(
                    'px-5 py-8 text-center sm:py-10',
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
      )}

      {/* ------------------------- Rack + historia compacta --------------------- */}
      {about.story?.length > 0 && (
        <section className="section">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
              {/* El rack como protagonista: foto si la hay, si no uno dibujado con
                  las ubicaciones reales — no hay que tocarlo al añadir una. */}
              <div className="order-2 lg:order-1" data-reveal>
                {about.image ? (
                  <img
                    src={about.image}
                    alt=""
                    loading="lazy"
                    className="w-full rounded-2xl border border-line object-cover"
                  />
                ) : (
                  <RackArt cities={cities} />
                )}
              </div>

              {/* Historia compacta: el primer párrafo manda, el resto acompaña. */}
              <div className="order-1 lg:order-2" data-reveal>
                <div className="eyebrow mb-3">Nuestra historia</div>
                <div className="space-y-5">
                  {about.story.map((paragraph, index) => (
                    <Editable
                      key={paragraph.id}
                      path={`about.story.${index}.text`}
                      as="p"
                      multiline
                      placeholder="Párrafo de la historia"
                      className={cx(
                        index === 0
                          ? 'display text-lg leading-relaxed font-semibold text-balance text-slate-200 sm:text-xl'
                          : 'text-base leading-relaxed text-pretty text-slate-400',
                      )}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* --------------------------- Cómo trabajamos --------------------------- */}
      {about.pillars?.length > 0 && (
        <section className="section">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl" data-reveal>
              <h2 className="display text-3xl font-bold text-white sm:text-4xl">
                Cómo trabajamos
              </h2>
            </div>

            {/* Fila editorial: línea capilar arriba de cada pilar, como en la
                portada. La página ya tiene bastante superficie. */}
            <div className="mt-10 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
              {about.pillars.map((pillar, index) => (
                <article
                  key={pillar.id}
                  className="group border-t border-line pt-6"
                  data-reveal
                  style={stagger(index)}
                >
                  <span className="grid size-11 place-items-center rounded-lg border border-line bg-surface-1 text-hex-300 transition group-hover:border-hex-500/40 group-hover:text-hex-200">
                    <Glyph
                      name={pillar.icon}
                      image={pillar.image}
                      size={pillar.image ? 26 : 19}
                      alt=""
                    />
                  </span>
                  <Editable
                    path={`about.pillars.${index}.title`}
                    as="h3"
                    className="display mt-4 text-base font-bold text-white"
                  />
                  <Editable
                    path={`about.pillars.${index}.description`}
                    as="p"
                    multiline
                    className="mt-2 text-sm leading-relaxed text-slate-400"
                  />
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ------------------------------ Cierre único ---------------------------- */}
      <section className="section">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center" data-reveal>
            <Editable
              path="about.ctaTitle"
              as="h2"
              multiline
              className="display text-3xl font-bold text-balance text-white sm:text-5xl"
            />
            <Editable
              path="about.ctaText"
              as="p"
              multiline
              className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-pretty text-slate-400"
            />

            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a
                href={safeUrl(about.ctaHref)}
                className="btn-primary group w-full px-7 py-3.5 sm:w-auto"
              >
                {about.ctaLabel}
                <ArrowRight
                  size={16}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </a>
              <a
                href={`mailto:${site.contact.email}`}
                className="btn-ghost w-full px-7 py-3.5 sm:w-auto"
              >
                <Mail size={16} />
                {site.contact.email}
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

/* --------------------------------- rack dibujado ----------------------------- */

/**
 * Un rack en CSS para cuando no hay foto: las bahías salen de las ubicaciones
 * reales del panel. Es adorno, no dato — las ubicaciones vacías se leen
 * «SLOT-0N», esperando el próximo datacenter.
 */
function RackArt({ cities }) {
  const slots = Array.from({ length: 4 }, (_, index) => cities[index] || '')

  return (
    <div className="glass overflow-hidden" aria-hidden="true">
      {/* Cabecera del rack */}
      <div className="flex items-center justify-between border-b border-line-soft bg-surface-1 px-4 py-3">
        <span className="pixel text-micro text-slate-400 uppercase">Rack · hexservers</span>
        <span className="flex items-center gap-1.5">
          {[0, 1, 2].map((dot) => (
            <span key={dot} className="size-1.5 rounded-full bg-emerald-400/90" />
          ))}
        </span>
      </div>

      {/* Bahías */}
      <div className="space-y-2.5 p-4 sm:p-5">
        {slots.map((city, index) => (
          <div
            key={index}
            className={cx(
              'flex items-center gap-3 rounded-lg border px-4 py-3.5',
              city
                ? 'border-line-soft bg-surface-1'
                : 'border-dashed border-line-soft bg-transparent',
            )}
          >
            <span className="relative flex size-2">
              {city && (
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-50" />
              )}
              <span
                className={cx(
                  'relative size-2 rounded-full',
                  city ? 'bg-emerald-400' : 'bg-surface-3',
                )}
              />
            </span>
            <span className={cx('font-mono text-micro', city ? 'text-hex-300' : 'text-slate-600')}>
              {city || `SLOT-0${index + 1}`}
            </span>

            {/* Luces de actividad */}
            <span className="ml-auto flex gap-1">
              {[0, 1, 2, 3].map((dot) => (
                <span
                  key={dot}
                  className={cx(
                    'size-1 rounded-full',
                    city && dot % 2 === 0 ? 'bg-hex-400/70' : 'bg-surface-3',
                  )}
                />
              ))}
            </span>
          </div>
        ))}
      </div>

      {/* Regleta */}
      <div className="border-t border-line-soft bg-surface-1 px-4 py-2.5 text-center text-micro text-slate-600">
        PDU · 1 Tbps anti-DDoS · NVMe Gen4
      </div>
    </div>
  )
}
