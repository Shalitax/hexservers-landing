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

import {
  IconServer,
  IconBox,
  IconCrosshair,
  IconDeviceGamepad2,
  IconShield,
  IconDatabase,
  IconBolt,
  IconLayoutDashboard,
  IconHeadset,
  IconRocket,
  IconCpu,
  IconDeviceSdCard,
  IconWorld,
  IconLock,
  IconNetwork,
  IconClock,
  IconUsers,
  IconTool,
  IconReceipt,
  IconTerminal2,
  IconBrandGithub,
  IconBrandX,
  IconSparkles,
  IconMail,
  IconCloud,
  IconGauge,
  IconCode,
  IconStack2,
  IconRefresh,
  IconInfinity,
  IconWallet,
  IconCreditCard,
  IconBuildingBank,
  IconCash,
  IconDeviceMobile,
} from '@tabler/icons-react'

import { useSite } from '../../store/useSite.js'
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

/**
 * Los kits de iconos, cada uno con el mismo juego de nombres.
 *
 * Que sean intercambiables no es casualidad, es lo que permite probarlos: en
 * `content.json` lo que se guarda es la cadena `"shield"`, nunca el dibujo. Así
 * que cambiar de kit no toca el contenido, ni los diecinueve archivos que pintan
 * iconos —todos pasan por `Glyph` o por `Icon`—, sino sólo este mapa.
 *
 * La regla al añadir un kit es que **cubra todos los nombres**. Si a uno le falta
 * alguno se cae al de lucide para ese icono en concreto, que es mejor que un
 * hueco, pero es una mezcla que se nota: mejor buscar el equivalente.
 */

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

/**
 * Tabler: la misma familia de trazo que lucide pero sobre una rejilla más
 * estricta, así que se lee más seco y más técnico. Es el motivo de tenerlo aquí.
 *
 * Dos diferencias que se ven a simple vista y no son errores de mapeo:
 * `twitter` es el logo actual de X y no el pájaro, y `disk` es una tarjeta de
 * almacenamiento en vez de un disco duro — Tabler no tiene el segundo con un
 * trazo que se distinga a 19 px.
 *
 * El de Discord se queda siendo el nuestro en los dos kits: Tabler trae uno,
 * pero es su redibujo sobre su propia rejilla, y para una marca registrada vale
 * más el trazo original.
 */
export const TABLER_ICONS = {
  server: IconServer,
  box: IconBox,
  crosshair: IconCrosshair,
  gamepad: IconDeviceGamepad2,
  shield: IconShield,
  database: IconDatabase,
  zap: IconBolt,
  layout: IconLayoutDashboard,
  headset: IconHeadset,
  rocket: IconRocket,
  cpu: IconCpu,
  disk: IconDeviceSdCard,
  globe: IconWorld,
  lock: IconLock,
  network: IconNetwork,
  clock: IconClock,
  users: IconUsers,
  wrench: IconTool,
  receipt: IconReceipt,
  terminal: IconTerminal2,
  github: IconBrandGithub,
  twitter: IconBrandX,
  discord: DiscordIcon,
  sparkles: IconSparkles,
  mail: IconMail,
  cloud: IconCloud,
  gauge: IconGauge,
  code: IconCode,
  layers: IconStack2,
  refresh: IconRefresh,
  infinity: IconInfinity,
  wallet: IconWallet,
  card: IconCreditCard,
  bank: IconBuildingBank,
  banknote: IconCash,
  phone: IconDeviceMobile,
}

/** Los kits disponibles. El `label` es el que sale en el panel → Diseño. */
export const ICON_SETS = {
  lucide: { label: 'Lucide', hint: 'El de siempre: trazo redondeado y suelto.', icons: ICONS },
  tabler: { label: 'Tabler', hint: 'Rejilla más estricta: se lee más seco y técnico.', icons: TABLER_ICONS },
}

export const ICON_SET_NAMES = Object.keys(ICON_SETS)

export const ICON_NAMES = Object.keys(ICONS)

/**
 * `data-icon` lleva el nombre al DOM para que el CSS pueda darle a cada icono el
 * movimiento que le corresponde: el escudo late, el rayo destella, el globo gira.
 *
 * Va por atributo y no por clase a propósito. El nombre del icono ya lo elige el
 * administrador desde el panel y viaja en `content.json`; sacarlo tal cual al
 * marcado significa que animar uno nuevo es una regla en `index.css` y nada más
 * —ni tocar este archivo, ni un componente por icono, que es justo lo que hace
 * inmanejables a las librerías de iconos animados.
 */
export function Icon({ name, set, ...props }) {
  /* El kit lo elige el administrador y no el visitante, así que se lee del tema
     del sitio y no del efectivo. `set` permite forzar uno: lo usa el selector del
     panel para enseñar los dos a la vez y poder compararlos. */
  const active = useSite((s) => s.site.theme?.iconSet)
  const icons = ICON_SETS[set || active]?.icons || ICONS
  const Component = icons[name] || ICONS[name] || Sparkles
  return <Component data-icon={name} {...props} />
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
  if (image) return 'bg-surface-2 p-1'
  return flat
    ? 'bg-surface-2 text-hex-300'
    : 'bg-gradient-to-br from-hex-500/20 to-plasma-500/15 text-hex-300'
}
