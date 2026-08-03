import {
  Server,
  Box,
  Crosshair,
  Gamepad2,
  Shield,
  Database,
  Zap,
  LayoutDashboard,
  Headset,
  Rocket,
  Cpu,
  HardDrive,
  Globe,
  Lock,
  Network,
  Clock,
  Users,
  Wrench,
  Receipt,
  Terminal,
  Github,
  Twitter,
  Sparkles,
  Mail,
  Cloud,
  Gauge,
  Code2,
  Layers,
  RefreshCw,
  Infinity as InfinityIcon,
  Wallet,
  CreditCard,
  Landmark,
  Banknote,
  Smartphone,
} from 'lucide-react'
import { cx } from '../../lib/utils.js'

/**
 * Logo de Discord.
 *
 * lucide no trae marcas comerciales, así que el botón de Discord llevaba un
 * bocadillo genérico que no lo identificaba. El trazo va dibujado aquí, igual que
 * las banderas de `Flag.jsx` y por el mismo motivo: es una marca concreta y no un
 * concepto, y no compensa arrastrar una librería entera de logos por uno solo.
 *
 * A diferencia del resto de iconos —que son trazos— éste es una silueta maciza:
 * el logo de Discord contorneado sería irreconocible. Por eso `fill` en lugar de
 * `stroke`, y por eso hereda el color con `currentColor` como los demás.
 *
 * Se usa para enlazar a un servidor de Discord, que es justo el uso que contemplan
 * sus normas de marca; el logo sigue siendo suyo y no debe alterarse ni recolorearse
 * fuera de eso.
 */
export function DiscordIcon({ size = 24, className = '', ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      className={cx('shrink-0', className)}
      {...props}
    >
      <path d="M20.317 4.3698a19.7913 19.7913 0 0 0-4.8851-1.5152.0741.0741 0 0 0-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 0 0-.0785-.037 19.7363 19.7363 0 0 0-4.8852 1.515.0699.0699 0 0 0-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 0 0 .0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 0 0 .0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 0 0-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 0 1-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 0 1 .0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 0 1 .0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 0 1-.0066.1276 12.2986 12.2986 0 0 1-1.873.8914.0766.0766 0 0 0-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 0 0 .0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 0 0 .0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 0 0-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
    </svg>
  )
}

/** Mapa nombre -> componente, para que el admin elija iconos desde el panel. */
export const ICONS = {
  server: Server,
  box: Box,
  crosshair: Crosshair,
  gamepad: Gamepad2,
  shield: Shield,
  database: Database,
  zap: Zap,
  layout: LayoutDashboard,
  headset: Headset,
  rocket: Rocket,
  cpu: Cpu,
  disk: HardDrive,
  globe: Globe,
  lock: Lock,
  network: Network,
  clock: Clock,
  users: Users,
  wrench: Wrench,
  receipt: Receipt,
  terminal: Terminal,
  github: Github,
  twitter: Twitter,
  discord: DiscordIcon,
  sparkles: Sparkles,
  mail: Mail,
  cloud: Cloud,
  gauge: Gauge,
  code: Code2,
  layers: Layers,
  refresh: RefreshCw,
  infinity: InfinityIcon,
  wallet: Wallet,
  card: CreditCard,
  bank: Landmark,
  banknote: Banknote,
  phone: Smartphone,
}

export const ICON_NAMES = Object.keys(ICONS)

export function Icon({ name, ...props }) {
  const Component = ICONS[name] || Sparkles
  return <Component {...props} />
}

/**
 * Icono con imagen propia opcional.
 *
 * Los iconos de lucide valen para conceptos —soporte, disco, red— pero no para
 * marcas: el logo de PayPal o de Mercado Pago no se puede dibujar con un trazo
 * genérico sin que parezca otra cosa. Donde haya que enseñar una marca, se sube
 * la imagen y manda ella; si no hay imagen, se pinta el icono de siempre.
 *
 * La imagen se ajusta dentro del hueco (`object-contain`) en vez de recortarse:
 * un logo recortado es un logo mal usado.
 */
export function Glyph({ name, image, size = 20, className = '', alt = '' }) {
  if (image) {
    return (
      <img
        src={image}
        alt={alt}
        loading="lazy"
        style={{ width: size, height: size }}
        className={cx('shrink-0 object-contain', className)}
      />
    )
  }
  return <Icon name={name} size={size} className={className} />
}

/**
 * Clases del recuadro que envuelve a un icono, según lleve imagen propia o no.
 *
 * Con imagen se quita el degradado de marca —el nuestro detrás de un logo ajeno
 * confunde de quién es cada cosa— y se mete algo de aire para que el logo no toque
 * el borde. Vive aquí y no repetido en cada tarjeta porque son ocho sitios y la
 * decisión es una sola.
 *
 * `flat` para los huecos que ya eran planos y nunca llevaron degradado.
 */
export function glyphBox(image, { flat = false } = {}) {
  if (image) return 'bg-white/[0.06] p-1'
  return flat
    ? 'bg-white/[0.04] text-hex-300'
    : 'bg-gradient-to-br from-hex-500/20 to-plasma-500/15 text-hex-300'
}
