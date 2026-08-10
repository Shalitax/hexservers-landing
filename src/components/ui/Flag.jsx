import { Globe } from 'lucide-react'
import { cx } from '../../lib/utils.js'

/**
 * Bandera de una ubicación, dibujada como SVG.
 *
 * El catálogo guarda la bandera como emoji (🇨🇱), pero Windows no trae glifos para
 * los indicadores regionales: ahí el navegador pinta las dos letras del país («CL»)
 * en vez de la bandera. Como la web tiene que verse igual en todas partes y no
 * queremos cargar una fuente de emoji entera para cuatro banderas, se dibujan aquí.
 *
 * El código de país sale del propio emoji, así que no hay nada que migrar: las
 * ubicaciones que ya existen funcionan tal cual. Si algún día pones un país que no
 * está en el set, se muestra el emoji original (correcto en móvil y Mac) y, si
 * tampoco lo hay, un globo.
 *
 * Las banderas van en un lienzo de 4×3 con coordenadas fraccionarias: así cada una
 * se lee como lo que es —franjas y proporciones— sin números mágicos.
 */

/** '🇨🇱' → 'cl'. Acepta también el código escrito a mano ('CL', 'cl'). */
export function flagCode(value = '') {
  const text = String(value).trim()

  const points = [...text].map((char) => char.codePointAt(0))
  const regional = points.filter((point) => point >= 0x1f1e6 && point <= 0x1f1ff)
  if (regional.length >= 2) {
    return regional
      .slice(0, 2)
      .map((point) => String.fromCharCode(point - 0x1f1e6 + 97))
      .join('')
  }

  return /^[a-z]{2}$/i.test(text) ? text.toLowerCase() : ''
}

/** Estrella de cinco puntas centrada en (cx, cy). */
function Star({ cx: x, cy: y, r, fill = '#fff' }) {
  const points = Array.from({ length: 10 }, (_, i) => {
    const angle = ((-90 + i * 36) * Math.PI) / 180
    const radius = i % 2 ? r * 0.4 : r
    return `${x + radius * Math.cos(angle)},${y + radius * Math.sin(angle)}`
  })
  return <polygon points={points.join(' ')} fill={fill} />
}

/** Franjas horizontales de igual alto, de arriba abajo. */
const Stripes = ({ colors }) =>
  colors.map((color, index) => (
    <rect
      key={index}
      y={(index * 3) / colors.length}
      width="4"
      height={3 / colors.length}
      fill={color}
    />
  ))

/** Franjas verticales de igual ancho, de izquierda a derecha. */
const Bands = ({ colors }) =>
  colors.map((color, index) => (
    <rect
      key={index}
      x={(index * 4) / colors.length}
      width={4 / colors.length}
      height="3"
      fill={color}
    />
  ))

const FLAGS = {
  /* Chile: cantón azul con estrella, banda blanca y roja. */
  cl: (
    <>
      <rect width="4" height="1.5" fill="#fff" />
      <rect y="1.5" width="4" height="1.5" fill="#d52b1e" />
      <rect width="1.5" height="1.5" fill="#0039a6" />
      <Star cx={0.75} cy={0.75} r={0.42} />
    </>
  ),

  /* EE. UU.: 13 franjas y un cantón con estrellas insinuadas (a este tamaño, 50
     estrellas serían una mancha gris). */
  us: (
    <>
      <Stripes colors={Array.from({ length: 13 }, (_, i) => (i % 2 ? '#fff' : '#b22234'))} />
      <rect width="1.6" height={(3 * 7) / 13} fill="#3c3b6e" />
      {Array.from({ length: 5 }, (_, row) =>
        Array.from({ length: 6 }, (_, col) => (
          <circle
            key={`${row}-${col}`}
            cx={0.18 + col * 0.25}
            cy={0.18 + row * 0.31}
            r="0.06"
            fill="#fff"
          />
        )),
      )}
    </>
  ),

  ar: (
    <>
      <Stripes colors={['#74acdf', '#fff', '#74acdf']} />
      <circle cx="2" cy="1.5" r="0.32" fill="#f6b40e" />
    </>
  ),
  br: (
    <>
      <rect width="4" height="3" fill="#009b3a" />
      <polygon points="2,0.35 3.6,1.5 2,2.65 0.4,1.5" fill="#fedf00" />
      <circle cx="2" cy="1.5" r="0.62" fill="#002776" />
    </>
  ),
  pe: <Bands colors={['#d91023', '#fff', '#d91023']} />,
  co: (
    <>
      <rect width="4" height="1.5" fill="#fcd116" />
      <rect y="1.5" width="4" height="0.75" fill="#003893" />
      <rect y="2.25" width="4" height="0.75" fill="#ce1126" />
    </>
  ),
  mx: (
    <>
      <Bands colors={['#006847', '#fff', '#ce1126']} />
      <circle cx="2" cy="1.5" r="0.3" fill="none" stroke="#8b5a2b" strokeWidth="0.14" />
    </>
  ),
  es: (
    <>
      <rect width="4" height="3" fill="#c60b1e" />
      <rect y="0.75" width="4" height="1.5" fill="#ffc400" />
    </>
  ),
  de: <Stripes colors={['#000', '#dd0000', '#ffce00']} />,
  fr: <Bands colors={['#002395', '#fff', '#ed2939']} />,
  gb: (
    <>
      <rect width="4" height="3" fill="#012169" />
      <path d="M0,0 4,3 M4,0 0,3" stroke="#fff" strokeWidth="0.6" />
      <path d="M0,0 4,3 M4,0 0,3" stroke="#c8102e" strokeWidth="0.36" />
      <path d="M2,0 V3 M0,1.5 H4" stroke="#fff" strokeWidth="1" />
      <path d="M2,0 V3 M0,1.5 H4" stroke="#c8102e" strokeWidth="0.6" />
    </>
  ),
}

export default function Flag({ flag, code, size = 24, className = '', title }) {
  const iso = flagCode(code || flag)
  const drawing = FLAGS[iso]

  if (!drawing) {
    return flag ? (
      <span className={cx('leading-none', className)} style={{ fontSize: size }} title={title}>
        {flag}
      </span>
    ) : (
      <Globe size={size * 0.8} className={cx('text-slate-500', className)} aria-hidden="true" />
    )
  }

  return (
    <svg
      viewBox="0 0 4 3"
      width={size}
      height={(size * 3) / 4}
      role={title ? 'img' : 'presentation'}
      aria-label={title}
      aria-hidden={title ? undefined : 'true'}
      className={cx('shrink-0 rounded-[3px] ring-1 ring-line-strong', className)}
    >
      {drawing}
    </svg>
  )
}
