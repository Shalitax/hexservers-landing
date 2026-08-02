import { useId } from 'react'

/**
 * Logo de HexServers, alineado con el set de iconos de la marca (line-art, uniones
 * redondeadas): hexágono en tres capas — anillo exterior, hexágono interior
 * translúcido y rombo central — y el wordmark en tipografía pixel con la segunda
 * mitad en color de acento.
 *
 * El degradado sale de las variables de la paleta (`style`, no atributo: `var()`
 * no se resuelve en atributos de presentación de SVG), así que el logo cambia de
 * color con el resto del sitio.
 *
 * `variant="mark"` muestra sólo el ícono (favicon inline, espacios estrechos, etc.).
 */
export default function Logo({ name = 'HexServers', variant = 'full', className = '', size = 34 }) {
  // `useId` evita ids duplicados: el logo se pinta a la vez en navbar y footer.
  // Se le quitan los `:` porque no son válidos en un selector CSS.
  const gradientId = `hexGrad${useId().replace(/:/g, '')}`
  const [head, tail] = splitName(name)
  const stroke = `url(#${gradientId})`

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        aria-hidden="true"
        className="logo-mark shrink-0 transition-transform duration-300 group-hover:scale-110"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
            <stop style={{ stopColor: 'var(--color-plasma-600)' }} />
            <stop offset="0.5" style={{ stopColor: 'var(--color-plasma-400)' }} />
            <stop offset="1" style={{ stopColor: 'var(--color-hex-500)' }} />
          </linearGradient>
        </defs>

        {/* Anillo exterior */}
        <polygon
          points="24,4 44,14 44,34 24,44 4,34 4,14"
          stroke={stroke}
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        {/* Hexágono interior translúcido */}
        <polygon
          points="24,10 38,17 38,31 24,38 10,31 10,17"
          fill={stroke}
          fillOpacity="0.3"
          stroke={stroke}
          strokeWidth="1"
          strokeLinejoin="round"
        />
        {/* Rombo central */}
        <polygon
          points="24,16 30,24 24,32 18,24"
          stroke={stroke}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>

      {variant === 'full' && (
        /* `wordmark`: la marca conserva su tipografía pixel también en modo sobrio. */
        <span
          className="pixel wordmark leading-none tracking-wider text-white uppercase"
          style={{ fontSize: Math.round(size * 0.42) }}
        >
          {head}
          {tail && <span className="text-plasma-400">{tail}</span>}
        </span>
      )}
    </span>
  )
}

/** «HexServers» → ['Hex', 'Servers'], para pintar la segunda mitad en violeta. */
function splitName(name) {
  const value = String(name || '')
  const match = value.match(/^(.*?)(servers)$/i)
  return match ? [match[1], match[2]] : [value, '']
}
