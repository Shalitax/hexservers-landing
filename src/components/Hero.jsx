import { ArrowRight, Gamepad2 } from 'lucide-react'
import { useSite, useEffectiveTheme } from '../store/useSite.js'
import { resolveStyle } from '../lib/theme.js'
import { cx, safeUrl } from '../lib/utils.js'
import Editable from './ui/Editable.jsx'
import PixelSprite, { useSprites } from './ui/PixelSprite.jsx'

/**
 * Hero de la portada, en dos maquetaciones.
 *
 * Los estilos «sobrio» y «vivo» comparten el hero centrado de siempre. El estilo
 * «nítido» lo parte en dos columnas con una consola al lado del titular, que es el
 * gesto que define a los hosts modernos en los que se inspira.
 *
 * Las dos versiones leen y escriben exactamente los mismos campos (`hero.badge`,
 * `hero.title`, `hero.subtitle`, `hero.stats`…), así que el panel de administración
 * y el modo edición funcionan igual en cualquiera de ellas y se puede saltar de una
 * a otra sin tocar el contenido.
 */
export default function Hero() {
  const style = resolveStyle(useEffectiveTheme())
  return style === 'nitido' ? <HeroSplit /> : <HeroCentered />
}

/* ------------------------------ hero centrado ------------------------------ */

function HeroCentered() {
  const hero = useSite((s) => s.site.hero)
  const editMode = useSite((s) => s.editMode)
  const sprites = useSprites()

  /* El pt es propio: el hero arranca bajo el navbar fijo, no sigue el ritmo. */
  return (
    <section id="inicio" className="relative pt-32 pb-12 sm:pt-40 sm:pb-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          {/* Badge: un punto fijo, sin parpadeo. No hay nada que avisar. */}
          <div className="anim-up mb-7 inline-flex items-center gap-2 rounded-full border border-hex-500/25 bg-hex-500/[0.08] px-3.5 py-1.5 backdrop-blur">
            {sprites ? (
              <PixelSprite name="invader" size={13} speed="0.8s" className="text-hex-200" />
            ) : (
              <span className="size-1.5 rounded-full bg-emerald-400" />
            )}
            <Editable path="hero.badge" className="pixel text-micro uppercase text-hex-200" />
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

          {editMode && <EditHint />}
        </div>

        {/* Métricas */}
        <div className="anim-up mx-auto mt-16 grid max-w-4xl grid-cols-2 gap-3 [animation-delay:240ms] sm:mt-20 sm:grid-cols-4 sm:gap-4">
          {hero.stats.map((stat) => (
            <div key={stat.id} className="glass px-4 py-5 text-center">
              <div className="pixel text-lg text-white sm:text-xl">{stat.value}</div>
              <div className="mt-2.5 text-micro font-medium tracking-wide text-slate-500 uppercase">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ------------------------------- hero partido ------------------------------- */

function HeroSplit() {
  const hero = useSite((s) => s.site.hero)
  const brand = useSite((s) => s.site.brand.name)
  const editMode = useSite((s) => s.editMode)
  const sprites = useSprites()

  return (
    <section id="inicio" className="relative pt-28 pb-12 sm:pt-36 sm:pb-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-10">
          {/* Columna de texto */}
          <div className="text-center lg:text-left">
            <div className="anim-up mb-6 inline-flex items-center gap-2 rounded-full border border-line bg-surface-2 px-3 py-1.5">
              {sprites ? (
                <PixelSprite name="server" size={13} speed="1.2s" className="text-hex-300" />
              ) : (
                <span className="relative flex size-1.5">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex size-1.5 rounded-full bg-emerald-400" />
                </span>
              )}
              <Editable
                path="hero.badge"
                className="text-micro font-medium tracking-wide text-slate-400"
              />
            </div>

            <Editable
              path="hero.title"
              as="h1"
              multiline
              className="display anim-up text-4xl leading-[1.05] font-extrabold text-balance text-white [animation-delay:60ms] sm:text-5xl lg:text-[3.4rem]"
            >
              {editMode ? undefined : (
                <HighlightedTitle title={hero.title} highlight={hero.highlight} />
              )}
            </Editable>

            <Editable
              path="hero.subtitle"
              as="p"
              multiline
              className="anim-up mt-6 max-w-xl text-base leading-relaxed text-pretty text-slate-400 [animation-delay:120ms] max-lg:mx-auto sm:text-lg"
            />

            <div className="anim-up mt-8 flex flex-col gap-3 [animation-delay:180ms] sm:flex-row sm:justify-center lg:justify-start">
              <a
                href={safeUrl(hero.primaryCta.href)}
                className="btn-primary group w-full px-6 py-3 sm:w-auto"
              >
                {hero.primaryCta.label}
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
              </a>
              <a
                href={safeUrl(hero.secondaryCta.href)}
                className="btn-ghost w-full px-6 py-3 sm:w-auto"
              >
                <Gamepad2 size={16} />
                {hero.secondaryCta.label}
              </a>
            </div>

            {editMode && <EditHint />}
          </div>

          {/* Columna visual */}
          <Console brand={brand} />
        </div>

        {/**
         * Métricas en una sola tira dividida por líneas, en lugar de cuatro tarjetas
         * sueltas: pesa menos en la página y deja el protagonismo al hero.
         */}
        <div className="glass anim-up mt-14 grid grid-cols-2 [animation-delay:240ms] sm:mt-20 sm:grid-cols-4">
          {hero.stats.map((stat, index) => (
            <div
              key={stat.id}
              className={cx(
                'px-5 py-6 text-center sm:text-left',
                /* Rejilla de 2 columnas en móvil y de 4 en escritorio: cada celda
                   pinta sólo las líneas que le tocan según dónde caiga. */
                index % 2 === 1 && 'max-sm:border-l max-sm:border-line-soft',
                index >= 2 && 'max-sm:border-t max-sm:border-line-soft',
                index > 0 && 'sm:border-l sm:border-line-soft',
              )}
            >
              <div className="display text-2xl font-bold text-white tabular-nums">{stat.value}</div>
              <div className="mt-1.5 text-micro font-medium tracking-wider text-slate-500 uppercase">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/**
 * Consola decorativa del hero partido.
 *
 * Es adorno, no dato: el texto está aquí a propósito y no en el contenido editable
 * porque no es información que nadie tenga que mantener — sólo enseña de un vistazo
 * que detrás hay un servidor de verdad. Lo único que se toma del sitio es el nombre
 * de la marca, para que el prompt no diga el de otro.
 */
function Console({ brand }) {
  const host = String(brand || 'server').replace(/\s+/g, '').toLowerCase() || 'server'

  const lines = [
    { tone: 'muted', text: `$ ssh root@${host}` },
    { tone: 'accent', text: '→ Desplegando contenedor…' },
    { tone: 'muted', text: '  Imagen actualizada · NVMe listo' },
    { tone: 'ok', text: '✓ Anti-DDoS activo · 1.2 Tbps' },
    { tone: 'ok', text: '✓ Servidor arrancado en 6.7s' },
    { tone: 'plain', text: 'Escuchando en 0.0.0.0:25565' },
  ]

  const toneClass = {
    muted: 'text-slate-500',
    accent: 'text-hex-300',
    ok: 'text-emerald-400',
    plain: 'text-slate-400',
  }

  return (
    <div className="glass anim-up overflow-hidden [animation-delay:300ms]" aria-hidden="true">
      {/* Barra de título */}
      <div className="flex items-center gap-2 border-b border-line-soft bg-surface-1 px-4 py-2.5">
        <span className="size-2.5 rounded-full bg-surface-3" />
        <span className="size-2.5 rounded-full bg-surface-3" />
        <span className="size-2.5 rounded-full bg-surface-3" />
        <span className="ml-2 font-mono text-micro text-slate-500">{host} — consola</span>
        <span className="ml-auto inline-flex items-center gap-1.5 rounded-md border border-emerald-400/25 bg-emerald-400/10 px-2 py-0.5 text-micro font-semibold text-emerald-300">
          <span className="size-1 rounded-full bg-emerald-400" />
          ONLINE
        </span>
      </div>

      {/* Salida */}
      <div className="space-y-1.5 px-4 py-5 font-mono text-sm leading-relaxed sm:text-sm">
        {lines.map((line, index) => (
          <div
            key={line.text}
            className={`anim-up ${toneClass[line.tone]}`}
            style={{ animationDelay: `${360 + index * 90}ms` }}
          >
            {line.text}
          </div>
        ))}
        <div className="flex items-center gap-1.5 pt-1 text-slate-400">
          <span className="text-hex-400">❯</span>
          <span className="anim-blink inline-block h-4 w-2 bg-hex-400/80" />
        </div>
      </div>
    </div>
  )
}

/* --------------------------------- comunes --------------------------------- */

function EditHint() {
  return (
    <p className="mt-4 text-xs text-slate-600">
      Los textos de los botones se editan desde el panel → Contenido → Hero.
    </p>
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
