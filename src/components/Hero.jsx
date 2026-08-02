import { ArrowRight, Gamepad2 } from 'lucide-react'
import { useSite } from '../store/useSite.js'
import { safeUrl } from '../lib/utils.js'
import Editable from './ui/Editable.jsx'

export default function Hero() {
  const hero = useSite((s) => s.site.hero)
  const editMode = useSite((s) => s.editMode)

  /* El pt es propio: el hero arranca bajo el navbar fijo, no sigue el ritmo. */
  return (
    <section id="inicio" className="relative pt-32 pb-12 sm:pt-40 sm:pb-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          {/* Badge: un punto fijo, sin parpadeo. No hay nada que avisar. */}
          <div className="anim-up mb-7 inline-flex items-center gap-2 rounded-full border border-hex-500/25 bg-hex-500/[0.08] px-3.5 py-1.5 backdrop-blur">
            <span className="size-1.5 rounded-full bg-emerald-400" />
            <Editable path="hero.badge" className="pixel text-[9px] uppercase text-hex-200" />
          </div>

          {/* Titular */}
          <Editable
            path="hero.title"
            as="h1"
            multiline
            className="display anim-up text-4xl leading-[1.1] font-bold text-balance text-white [animation-delay:60ms] sm:text-5xl lg:text-6xl"
          >
            {editMode ? undefined : <HighlightedTitle title={hero.title} highlight={hero.highlight} />}
          </Editable>

          {/* Subtítulo */}
          <Editable
            path="hero.subtitle"
            as="p"
            multiline
            className="anim-up mx-auto mt-6 max-w-2xl text-base leading-relaxed text-pretty text-slate-400 [animation-delay:120ms] sm:text-lg"
          />

          {/* CTAs */}
          <div className="anim-up mt-9 flex flex-col items-center justify-center gap-3 [animation-delay:180ms] sm:flex-row">
            <a href={safeUrl(hero.primaryCta.href)} className="btn-primary group w-full px-6 py-3 sm:w-auto">
              {hero.primaryCta.label}
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
            </a>
            <a href={safeUrl(hero.secondaryCta.href)} className="btn-ghost w-full px-6 py-3 sm:w-auto">
              <Gamepad2 size={16} />
              {hero.secondaryCta.label}
            </a>
          </div>

          {editMode && (
            <p className="mt-4 text-xs text-slate-600">
              Los textos de los botones se editan desde el panel → Contenido → Hero.
            </p>
          )}
        </div>

        {/* Métricas */}
        <div className="anim-up mx-auto mt-16 grid max-w-4xl grid-cols-2 gap-3 [animation-delay:240ms] sm:mt-20 sm:grid-cols-4 sm:gap-4">
          {hero.stats.map((stat) => (
            <div key={stat.id} className="glass px-4 py-5 text-center">
              <div className="pixel text-lg text-white sm:text-xl">{stat.value}</div>
              <div className="mt-2.5 text-[11px] font-medium tracking-wide text-slate-500 uppercase">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/** Resalta con degradado el fragmento indicado en `hero.highlight`. */
function HighlightedTitle({ title, highlight }) {
  if (!highlight || !title.includes(highlight)) return title

  const [before, ...rest] = title.split(highlight)
  return (
    <>
      {before}
      <span className="text-gradient">{highlight}</span>
      {rest.join(highlight)}
    </>
  )
}
