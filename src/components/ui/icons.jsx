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
  MessageCircle,
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
  discord: MessageCircle,
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
