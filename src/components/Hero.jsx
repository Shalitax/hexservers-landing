import { Fragment } from 'react'
import { ArrowRight, Gamepad2 } from 'lucide-react'
import { useSite, listedProducts } from '../store/useSite.js'
import { cx, safeUrl } from '../lib/utils.js'
import Editable from './ui/Editable.jsx'
import PixelSprite, { useSprites } from './ui/PixelSprite.jsx'
import { Icon } from './ui/icons.jsx'

/**
 * Hero de la portada, a la manera de los hosts de referencia: titular centrado
 * y enorme que entra palabra a palabra, dos CTA y, debajo, una doble cinta de
 * «qué corre aquí» — los productos del catálogo en una dirección y el stack
 * técnico en la contraria.
 *
 * Lee y escribe exactamente los mismos campos de siempre (`hero.badge`,
 * `hero.title`, `hero.subtitle`, `hero.primaryCta`…), así que el panel de
 * administración y el modo edición funcionan sin tocar nada. Las métricas se
 * fueron a su propia franja (`StatsBand`) para que el titular respire.
 */
export default function Hero() {
  const site = useSite((s) => s.site)
  const hero = site.hero
  const editMode = useSite((s) => s.editMode)
  const sprites = useSprites()

  /* La cinta de productos sale del catálogo vivo: lo que el admin añada o
     renombre aparece solo. La de stack es decorativa — adorno, no dato. */
  const products = listedProducts(site).map((product) => ({
    key: product.id,
    icon: product.icon,
    label: product.name,
  }))

  const rows = [
    { key: 'stack', items: STACK, speed: '58s', reverse: true },
    { key: 'products', items: products.length ? products : STACK, speed: '42s', reverse: false },
  ]

  return (
    <section id="inicio" className="relative pt-32 pb-14 sm:pt-44 sm:pb-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          {/* Badge: un punto fijo, sin parpadeo. No hay nada que avisar. */}
          <div className="anim-up mb-8 inline-flex items-center gap-2 rounded-full border border-hex-500/25 bg-hex-500/[0.08] px-3.5 py-1.5 backdrop-blur">
            {sprites ? (
              <PixelSprite name="invader" size={13} speed="0.8s" className="text-hex-200" />
            ) : (
              <span className="size-1.5 rounded-full bg-emerald-400" />
            )}
            <Editable path="hero.badge" className="pixel text-micro uppercase text-hex-200" />
          </div>

          {/* Titular: palabra a palabra, con el fragmento de `hero.highlight` en
              degradado. La `key` reinicia la entrada cuando cambia el texto. */}
          <Editable
            path="hero.title"
            as="h1"
            multiline
            className="display text-4xl leading-[1.04] font-extrabold text-balance text-white sm:text-6xl lg:text-7xl"
          >
            {editMode ? undefined : (
              <StaggerTitle key={hero.title} title={hero.title} highlight={hero.highlight} />
            )}
          </Editable>

          {/* Subtítulo */}
          <Editable
            path="hero.subtitle"
            as="p"
            multiline
            className="anim-up mx-auto mt-7 max-w-2xl text-base leading-relaxed text-pretty text-slate-400 [animation-delay:260ms] sm:text-lg"
          />

          {/* CTAs */}
          <div className="anim-up mt-10 flex flex-col items-center justify-center gap-3 [animation-delay:340ms] sm:flex-row">
            <a href={safeUrl(hero.primaryCta.href)} className="btn-primary group w-full px-7 py-3.5 sm:w-auto">
              {hero.primaryCta.label}
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
            </a>
            <a href={safeUrl(hero.secondaryCta.href)} className="btn-ghost w-full px-7 py-3.5 sm:w-auto">
              <Gamepad2 size={16} />
              {hero.secondaryCta.label}
            </a>
          </div>

          {editMode && <EditHint />}
        </div>

        {/* Cintas: productos y stack. Adorno sin nada que leer dos veces. */}
        <div className="anim-up mt-16 space-y-4 [animation-delay:440ms] sm:mt-20" aria-hidden="true">
          {rows.map((row) => (
            <MarqueeRow
              key={row.key}
              items={row.items}
              speed={row.speed}
              reverse={row.reverse}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

/* --------------------------------- marquee --------------------------------- */

/** Stack fijo: lo que corre detrás de cada plan. Adorno, no contenido editable. */
const STACK = [
  { icon: 'layout', label: 'Panel Pterodactyl' },
  { icon: 'shield', label: 'Anti-DDoS 1 Tbps' },
  { icon: 'cpu', label: 'Ryzen 7950X' },
  { icon: 'disk', label: 'NVMe Gen4' },
  { icon: 'zap', label: 'Activación en 60 s' },
  { icon: 'server', label: 'KVM dedicado' },
  { icon: 'database', label: 'Backups diarios' },
  { icon: 'terminal', label: 'Consola VNC' },
  { icon: 'network', label: 'Red 1–2 Gbps' },
  { icon: 'globe', label: '4 ubicaciones' },
]

/**
 * Una cinta. La lista se duplica para el bucle: la primera mitad se desliza
 * hacia fuera mientras la copia entra por detrás. Ver `hex-marquee` en index.css.
 */
function MarqueeRow({ items, speed, reverse }) {
  const doubled = [...items, ...items]
  return (
    <div className="marquee-mask">
      <div
        className={cx('marquee', reverse && 'marquee-reverse')}
        style={{ '--marquee-speed': speed }}
      >
        {doubled.map((item, index) => (
          <span
            key={`${item.key || item.label}-${index}`}
            className="mx-2 inline-flex shrink-0 items-center gap-2 rounded-full border border-line-soft bg-surface-1 px-4 py-2 text-sm font-medium text-slate-400"
          >
            <Icon name={item.icon} size={15} className="text-hex-400" />
            {item.label}
          </span>
        ))}
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

/**
 * El titular palabra a palabra, con su retardo de entrada por posición.
 * El fragmento de `hero.highlight` lleva el degradado de marca; el resto, blanco.
 */
function StaggerTitle({ title, highlight }) {
  const text = String(title || '')
  const hlStart = highlight && text.includes(highlight) ? text.indexOf(highlight) : -1
  const hlEnd = hlStart >= 0 ? hlStart + highlight.length : -1
  const words = text.split(/\s+/).filter(Boolean)

  let offset = 0
  return words.map((word, index) => {
    const start = offset
    const end = start + word.length
    offset = end + 1

    const highlighted = hlStart >= 0 && end > hlStart && start < hlEnd
    return (
      <Fragment key={`${word}-${index}`}>
        <span
          className={cx('anim-word', highlighted && 'text-gradient')}
          style={{ '--wi': index }}
        >
          {word}
        </span>
        {/* Espacio entre palabras: los spans son inline-block y no se tocan solos. */}
        {index < words.length - 1 ? ' ' : null}
      </Fragment>
    )
  })
}
