import { ArrowRight } from 'lucide-react'
import { useSite } from '../store/useSite.js'
import { cx, safeUrl } from '../lib/utils.js'
import Editable from '../components/ui/Editable.jsx'
import Contact from '../components/Contact.jsx'
import { Icon, Glyph, glyphBox } from '../components/ui/icons.jsx'

/** Página «Nosotros»: quiénes somos, cómo trabajamos y en qué se nota. */
export default function AboutPage() {
  const about = useSite((s) => s.site.about)
  const locations = useSite((s) => s.site.locations.items)
  const cities = locations.filter((item) => item.status !== 'soon').map((item) => item.city)

  return (
    <main className="pt-28 pb-8 sm:pt-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Cabecera */}
        <header className="mx-auto max-w-3xl text-center">
          <div className="eyebrow mb-3">{about.eyebrow}</div>
          <Editable
            path="about.title"
            as="h1"
            multiline
            className="display text-3xl font-bold text-balance text-white sm:text-4xl lg:text-5xl"
          />
          <Editable
            path="about.subtitle"
            as="p"
            multiline
            className="mt-5 text-base leading-relaxed text-pretty text-slate-400 sm:text-lg"
          />
        </header>

        {/* Cifras */}
        {about.stats?.length > 0 && (
          <div className="mt-14 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            {about.stats.map((stat) => (
              <div key={stat.id} className="glass glass-hover px-4 py-5 text-center">
                <div className="pixel bg-gradient-to-b from-white to-hex-300 bg-clip-text text-base text-transparent sm:text-lg">
                  {stat.value}
                </div>
                <div className="mt-2.5 text-[11px] font-medium tracking-wide text-slate-500 uppercase">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Historia */}
        {about.story?.length > 0 && (
          <section className="mt-20 grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-start">
            <div className="space-y-5">
              {about.story.map((paragraph, index) => (
                <Editable
                  key={paragraph.id}
                  path={`about.story.${index}.text`}
                  as="p"
                  multiline
                  placeholder="Párrafo de la historia"
                  className="text-base leading-relaxed text-pretty text-slate-400"
                />
              ))}
            </div>

            {/* Imagen opcional del equipo o del rack */}
            {about.image ? (
              <img
                src={about.image}
                alt=""
                loading="lazy"
                className="glass w-full object-cover p-1.5"
              />
            ) : (
              <div className="glass relative overflow-hidden p-8 text-center">
                <div
                  className="glow-violet pointer-events-none absolute -top-20 -right-16 size-64 opacity-60"
                  aria-hidden="true"
                />
                {/* Sale de las ubicaciones reales: no hay que tocarlo al añadir una. */}
                <div className="relative">
                  <Icon name="server" size={34} className="mx-auto text-hex-300" />
                  <p className="display mt-4 text-lg font-bold text-white">
                    {cities.join(' · ')}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-500">
                    Racks propios en {cities.length === 1 ? 'un datacenter' : `${cities.length} datacenters`},
                    con red anti-DDoS de 1 Tbps y NVMe Gen4 en todos los nodos.
                  </p>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Cómo trabajamos */}
        {about.pillars?.length > 0 && (
          <section className="mt-20">
            <h2 className="display text-2xl font-bold text-white sm:text-3xl">Cómo trabajamos</h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {about.pillars.map((pillar, index) => (
                <article key={pillar.id} className="glass glass-hover group p-6">
                  <span
                    className={cx(
                      'mb-4 grid size-11 place-items-center rounded-xl border border-white/10 transition',
                      pillar.image ? '' : 'group-hover:from-hex-500/30 group-hover:text-hex-200',
                      glyphBox(pillar.image),
                    )}
                  >
                    <Glyph name={pillar.icon} image={pillar.image} size={pillar.image ? 28 : 19} />
                  </span>
                  <Editable
                    path={`about.pillars.${index}.title`}
                    as="h3"
                    className="display text-base font-bold text-white"
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
          </section>
        )}

        {/* Cierre hacia el catálogo */}
        <section className="glass relative mt-20 overflow-hidden p-8 sm:p-12">
          <div
            className="glow-blue pointer-events-none absolute -bottom-24 -left-20 size-96 opacity-45"
            aria-hidden="true"
          />
          <div className="relative flex flex-col items-start gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-xl">
              <Editable
                path="about.ctaTitle"
                as="h2"
                multiline
                className="display text-2xl font-bold text-balance text-white sm:text-3xl"
              />
              <Editable
                path="about.ctaText"
                as="p"
                multiline
                className="mt-3 text-sm leading-relaxed text-pretty text-slate-400"
              />
            </div>
            <a
              href={safeUrl(about.ctaHref)}
              className="btn-primary shrink-0 px-6 py-3"
            >
              {about.ctaLabel}
              <ArrowRight size={16} />
            </a>
          </div>
        </section>
      </div>

      {/* El contacto cierra la página: es la pregunta natural al terminar de leer. */}
      <Contact />
    </main>
  )
}
