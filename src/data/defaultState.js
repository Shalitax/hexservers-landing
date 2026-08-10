/**
 * Estado semilla del sitio. Se escribe en IndexedDB la primera vez y a partir de
 * ahí manda la base de datos local: todo esto es editable desde el panel admin.
 *
 * El catálogo tiene tres niveles:
 *
 *   grupos (subcategoría)  →  productos (la "box" grande)  →  planes (lo que se compra)
 *   Servidores de Juegos   →  Minecraft                    →  MC Iron / Diamond / …
 *
 * Además, cada plan puede declarar en qué ubicación y con qué CPU se sirve. Es el
 * mismo criterio con el que WHMCS agrupa productos (un grupo = una CPU en una
 * ubicación), y es lo que permite el recorrido:
 *
 *   producto → gama → ubicación → CPU → plan → WHMCS
 *
 * Los planes que dejan ubicación o CPU en blanco valen para cualquier selección.
 */

import { DEFAULT_THEME } from '../lib/theme.js'
import { DEFAULT_CYCLE_DISCOUNTS } from '../lib/billing.js'

export const SCHEMA_VERSION = 7

export const PRODUCT_STATUS = {
  available: { label: 'Disponible', tone: 'emerald' },
  soldout: { label: 'Agotado', tone: 'rose' },
  soon: { label: 'Próximamente', tone: 'amber' },
}

/* ------------------------------ fábricas semilla ----------------------------- */

let seq = 0
const sid = (prefix) => `${prefix}_s${(seq += 1).toString(36)}`

/** [['RAM','8 GB'], …] → especificaciones con id. */
const specs = (pairs) => pairs.map(([label, value]) => ({ id: sid('sp'), label, value }))

/** ['Anti-DDoS', …] → checklist de "qué incluye". */
const includes = (texts) => texts.map((text) => ({ id: sid('inc'), text }))

/** [['shield','Anti-DDoS','Filtrado L3/L4/L7'], …] → funciones con icono. */
const funcs = (items) =>
  items.map(([icon, title, description]) => ({ id: sid('fn'), icon, title, description }))

/** Subcategoría del catálogo (pestaña de la página de productos). */
const group = (slug, name, icon, tagline, description, extra = {}) => ({
  id: `grp_${slug.replace(/-/g, '_')}`,
  slug,
  name,
  icon,
  /* Imagen propia que sustituye al icono. Vacío = se pinta el icono. */
  image: '',
  tagline,
  description,
  /* Titular propio de su página. Vacío = se usa el genérico del catálogo. */
  headline: '',
  /* Argumentos de la familia: píldoras bajo el titular y tarjetas al pie. */
  highlights: [],
  ...extra,
})

/** Producto: la box grande. Contiene planes, no precios propios. */
const product = (slug, groupId, name, extra = {}) => ({
  id: `prod_${slug.replace(/-/g, '_')}`,
  groupId,
  slug,
  name,
  tagline: '',
  description: '',
  image: '',
  icon: 'server',
  badge: '',
  status: 'available',
  featured: false,
  /* Oculto: desaparece del listado público, su enlace directo sigue funcionando. */
  hidden: false,
  /* Ficha del producto: por qué elegirlo. */
  highlights: [],
  /* Detalle: funciones comunes a todos sus planes (un plan puede sobreescribirlas). */
  features: [],
  plansTitle: 'Planes disponibles',
  plansSubtitle: 'Elige el que encaje con tu proyecto. Puedes ampliar recursos cuando quieras.',
  ...extra,
})

/**
 * Plan concreto. `price` va siempre en la divisa base del sitio (`currency.base`);
 * lo que ve el visitante se convierte al vuelo. `pid` es un PID de WHMCS de
 * ejemplo: se combina con `whmcs.portalUrl` para generar /cart.php?a=add&pid=N.
 * Sustitúyelos por los PID reales de tu instalación desde el panel.
 */
const plan = (productId, name, price, pid, specList, includeList, extra = {}) => ({
  id: `plan_${name.toLowerCase().replace(/[^a-z0-9]+/g, '')}_${pid}`,
  productId,
  name,
  description: '',
  price,
  period: '/mes',
  status: 'available',
  featured: false,
  /* Grupo de WHMCS al que pertenece: ubicación + CPU. Vacío = vale para todas. */
  locationId: '',
  cpuId: '',
  specs: specList,
  includes: includeList,
  features: [],
  whmcsUrl: '',
  whmcsPid: String(pid),
  billingCycle: 'monthly',
  hasConfigurableOptions: false,
  configurableOptions: [],
  ...extra,
})

/* --------------------------- matriz ubicación × CPU -------------------------- */

/**
 * Minecraft se vende como en WHMCS: el mismo plan existe una vez por cada
 * combinación de ubicación y CPU, cada una con su PID. De ahí sale el recorrido
 * ubicación → CPU → plan. El resto de productos deja los dos campos vacíos, así
 * que sus planes se muestran directamente sin pasos intermedios.
 */
const MC_CPUS = [
  { id: 'cpu_7950x', factor: 1, cores: '5,7 GHz', label: 'Ryzen 7950X' },
  { id: 'cpu_5950x', factor: 0.8, cores: '4,9 GHz', label: 'Ryzen 5950X' },
]

/**
 * El recargo es la diferencia de precio de esa ubicación frente a las demás:
 * Santiago cuesta más porque el tránsito en Chile se paga más caro que en EE. UU.
 * Son cifras de ejemplo, se ajustan plan a plan desde el panel.
 */
const GAME_LOCATIONS = [
  { id: 'loc_santiago', surcharge: 1 },
  { id: 'loc_miami', surcharge: 0 },
  { id: 'loc_texas', surcharge: 0 },
  { id: 'loc_ohio', surcharge: 0 },
]

const MC_TIERS = [
  {
    name: 'MC Iron',
    price: 3.5,
    ram: '4 GB',
    cpu: '200% (2 núcleos)',
    disk: '25 GB NVMe',
    description: 'Vanilla o plugins ligeros para jugar con amigos.',
    includes: [
      'Slots ilimitados',
      'Instalador de modpacks en un click',
      'Subdominio gratuito',
      'Anti-DDoS de 1 Tbps',
      'Backup diario',
    ],
  },
  {
    name: 'MC Diamond',
    price: 7.5,
    ram: '8 GB',
    cpu: '300% (3 núcleos)',
    disk: '50 GB NVMe',
    featured: true,
    description: 'El plan que aguanta un modpack completo y 30–40 jugadores.',
    includes: [
      'Slots ilimitados',
      'Modpacks medianos (Forge / Fabric)',
      'Subdominio gratuito',
      'Anti-DDoS de 1 Tbps',
      'Backup diario con restauración a un click',
    ],
  },
  {
    name: 'MC Netherite',
    price: 14.5,
    ram: '16 GB',
    cpu: '500% (5 núcleos)',
    disk: '120 GB NVMe',
    description: 'Redes con varios mundos, minijuegos o modpacks de 300+ mods.',
    includes: [
      'Slots ilimitados',
      'Modpacks pesados y mundos enormes',
      'Subdominio gratuito',
      'Anti-DDoS de 1 Tbps',
      'Backup cada 12 h',
      'Soporte prioritario',
    ],
  },
]

/**
 * Unturned sí se sirve en varias ubicaciones, pero con una sola CPU: por eso su
 * recorrido enseña el bloque de ubicación y se salta el de procesador.
 */
const UNTURNED_TIERS = [
  {
    name: 'Unturned Basic',
    price: 2.5,
    slots: '24 jugadores',
    ram: '3 GB',
    cpu: '150%',
    description: 'El punto de entrada más barato del catálogo.',
    includes: [
      'Workshop de Steam ilimitado',
      'RocketMod incluido',
      'Anti-DDoS de 1 Tbps',
      'Backup diario',
    ],
  },
  {
    name: 'Unturned Plus',
    price: 5.5,
    slots: '64 jugadores',
    ram: '6 GB',
    cpu: '300%',
    featured: true,
    description: 'Mapas grandes con mods y bastante gente dentro.',
    includes: [
      'Workshop de Steam ilimitado',
      'RocketMod y plugins sin límite',
      'Anti-DDoS de 1 Tbps',
      'Backup diario',
      'Mapas personalizados',
    ],
  },
  {
    name: 'Unturned Server Pack',
    price: 9.5,
    slots: '128 jugadores',
    ram: '10 GB',
    cpu: '450%',
    description: 'Pensado para redes con varios servidores enlazados.',
    includes: [
      'Workshop de Steam ilimitado',
      'Varios servidores en el mismo panel',
      'Anti-DDoS de 1 Tbps',
      'Backup cada 12 h',
      'Soporte prioritario',
    ],
  },
]

/**
 * Un plan por cada combinación de ubicación × CPU × nivel, que es justo como
 * WHMCS agrupa los productos: cada celda de la matriz es un PID distinto.
 *
 * @param {array}  tiers    Niveles del producto (RAM, precio, qué incluye…)
 * @param {array}  cpus     CPUs entre las que elige el cliente; `[null]` = ninguna
 *                          a elegir, y el bloque de procesador no se llega a pintar
 * @param {number} pidBase  Los PIDs salen correlativos a partir de aquí
 * @param {func}   specsOf  (tier, cpu) → filas de la tabla de especificaciones
 * @param {string} tierId   Gama a la que pertenecen todos los planes de la matriz
 */
function planMatrix(productId, { tiers, cpus = [null], pidBase, specsOf, options, tierId = '' }) {
  let pid = pidBase
  return GAME_LOCATIONS.flatMap((location) =>
    cpus.flatMap((cpu) =>
      tiers.map((tier) => {
        const price = Math.round((tier.price * (cpu?.factor ?? 1) + location.surcharge) * 100) / 100
        pid += 1
        return plan(productId, tier.name, price, pid, specs(specsOf(tier, cpu)), includes(tier.includes), {
          locationId: location.id,
          cpuId: cpu?.id || tier.cpuId || '',
          tierId,
          featured: Boolean(tier.featured),
          description: tier.description,
          ...(tier.featured && options ? options(tier, pid) : null),
        })
      }),
    ),
  )
}

/** 4 ubicaciones × 2 CPUs × 3 niveles = 24 PIDs. */
const minecraftPlans = (productId) =>
  planMatrix(productId, {
    tiers: MC_TIERS,
    cpus: MC_CPUS,
    pidBase: 100,
    tierId: 'tier_estandar',
    specsOf: (tier, cpu) => [
      ['RAM', tier.ram],
      ['CPU', `${cpu.label} · ${tier.cpu}`],
      ['Disco', tier.disk],
      ['Slots', 'Ilimitados'],
      ['Panel', 'Pterodactyl'],
    ],
    options: (tier, pid) => ({
      hasConfigurableOptions: true,
      configurableOptions: [
        {
          id: `opt_mcram_${pid}`,
          name: 'RAM extra',
          whmcsOptionId: '',
          values: [
            { id: `v_mr0_${pid}`, label: `${tier.ram} (base)`, priceDelta: 0, whmcsValueId: '', default: true },
            { id: `v_mr1_${pid}`, label: '12 GB', priceDelta: 3.5, whmcsValueId: '' },
            { id: `v_mr2_${pid}`, label: '16 GB', priceDelta: 7, whmcsValueId: '' },
          ],
        },
      ],
    }),
  })

/** 4 ubicaciones × 3 niveles = 12 PIDs, sin CPU a elegir. */
const unturnedPlans = (productId) =>
  planMatrix(productId, {
    tiers: UNTURNED_TIERS,
    pidBase: 200,
    tierId: 'tier_estandar',
    specsOf: (tier) => [
      ['Slots', tier.slots],
      ['RAM', tier.ram],
      ['CPU', tier.cpu],
      ['Workshop', 'Ilimitado'],
      ['Panel', 'Pterodactyl'],
    ],
  })

/* ------------------------------ gama económica ------------------------------- */

/**
 * Los planes económicos se sirven en las mismas ubicaciones, pero en nodos con
 * CPU compartida de menor reloj: esa es toda la diferencia. Todo lo demás —panel,
 * anti-DDoS, backups, soporte— es exactamente igual que en la gama normal, y por
 * eso los textos no prometen menos de lo que dan ni esconden lo que recortan.
 *
 * Como cada producto económico usa una sola CPU, su configurador no llega a pintar
 * el bloque de procesador: el cliente elige ubicación y plan, y ya está.
 */
const BUDGET_CPU = 'cpu_3600'

const MC_BUDGET_TIERS = [
  {
    name: 'MC Eco 4 GB',
    price: 2,
    ram: '4 GB',
    cpu: '100% (1 núcleo)',
    disk: '20 GB NVMe',
    cpuId: BUDGET_CPU,
    description: 'Vanilla o unos pocos plugins para jugar con amigos.',
    includes: [
      'Slots ilimitados',
      'Panel Pterodactyl completo',
      'Subdominio gratuito',
      'Anti-DDoS de 1 Tbps',
      'Backup diario',
    ],
  },
  {
    name: 'MC Eco 8 GB',
    price: 4,
    ram: '8 GB',
    cpu: '150% (1,5 núcleos)',
    disk: '40 GB NVMe',
    cpuId: BUDGET_CPU,
    featured: true,
    description: 'Modpacks ligeros y comunidades pequeñas sin gastar de más.',
    includes: [
      'Slots ilimitados',
      'Panel Pterodactyl completo',
      'Subdominio gratuito',
      'Anti-DDoS de 1 Tbps',
      'Backup diario',
    ],
  },
  {
    name: 'MC Eco 12 GB',
    price: 6,
    ram: '12 GB',
    cpu: '200% (2 núcleos)',
    disk: '60 GB NVMe',
    cpuId: BUDGET_CPU,
    description: 'Más RAM para mundos grandes, asumiendo que la CPU es compartida.',
    includes: [
      'Slots ilimitados',
      'Panel Pterodactyl completo',
      'Subdominio gratuito',
      'Anti-DDoS de 1 Tbps',
      'Backup diario',
    ],
  },
]

const UNTURNED_BUDGET_TIERS = [
  {
    name: 'Unturned Eco 24',
    price: 1.5,
    slots: '24 jugadores',
    ram: '3 GB',
    cpu: '80%',
    cpuId: BUDGET_CPU,
    description: 'Lo más barato del catálogo para empezar una comunidad.',
    includes: [
      'Workshop de Steam ilimitado',
      'RocketMod incluido',
      'Anti-DDoS de 1 Tbps',
      'Backup diario',
    ],
  },
  {
    name: 'Unturned Eco 48',
    price: 3,
    slots: '48 jugadores',
    ram: '5 GB',
    cpu: '120%',
    cpuId: BUDGET_CPU,
    featured: true,
    description: 'Mapas con mods y gente dentro, sin pagar la gama de rendimiento.',
    includes: [
      'Workshop de Steam ilimitado',
      'RocketMod y plugins sin límite',
      'Anti-DDoS de 1 Tbps',
      'Backup diario',
    ],
  },
]

/** 4 ubicaciones × 3 niveles = 12 PIDs. */
const minecraftBudgetPlans = (productId) =>
  planMatrix(productId, {
    tiers: MC_BUDGET_TIERS,
    pidBase: 300,
    tierId: 'tier_economica',
    specsOf: (tier) => [
      ['RAM', tier.ram],
      ['CPU', `Ryzen 5 3600 · ${tier.cpu}`],
      ['Disco', tier.disk],
      ['Slots', 'Ilimitados'],
      ['Panel', 'Pterodactyl'],
    ],
  })

/** 4 ubicaciones × 2 niveles = 8 PIDs. */
const unturnedBudgetPlans = (productId) =>
  planMatrix(productId, {
    tiers: UNTURNED_BUDGET_TIERS,
    pidBase: 400,
    tierId: 'tier_economica',
    specsOf: (tier) => [
      ['Slots', tier.slots],
      ['RAM', tier.ram],
      ['CPU', `Ryzen 5 3600 · ${tier.cpu}`],
      ['Workshop', 'Ilimitado'],
      ['Panel', 'Pterodactyl'],
    ],
  })

/* ------------------------------- estado inicial ------------------------------ */

export function createDefaultState() {
  seq = 0

  const groups = [
    group(
      'vps',
      'Servidores VPS',
      'server',
      'KVM dedicado con NVMe y root completo',
      'Máquinas virtuales con recursos garantizados, acceso root y consola VNC. Para hospedar webs, bots, paneles o lo que se te ocurra.',
      {
        headline: 'Tu máquina, tus reglas.',
        highlights: funcs([
          ['lock', 'Root completo', 'Acceso total por SSH y consola VNC para cuando el SSH no arranca.'],
          ['disk', 'NVMe de verdad', 'Sin discos compartidos ni sorpresas de IOPS a las ocho de la tarde.'],
          ['shield', 'Anti-DDoS incluido', '1 Tbps de filtrado, también en el plan más pequeño.'],
          ['refresh', 'Amplía sin reinstalar', 'Se suben recursos en caliente y sólo pagas la diferencia.'],
        ]),
      },
    ),
    group(
      'juegos',
      'Servidores de Juegos',
      'gamepad',
      'Anti-DDoS y panel Pterodactyl incluidos',
      'Servidores optimizados por juego, con panel web, mods y backups automáticos. Online en menos de un minuto.',
      {
        headline: 'Elige tu juego. Del resto nos encargamos nosotros.',
        highlights: funcs([
          ['rocket', 'Online en 60 segundos', 'El servidor se crea solo en cuanto se confirma el pago.'],
          ['layout', 'Panel Pterodactyl', 'Consola en vivo, archivos por SFTP, backups y tareas programadas.'],
          ['box', 'Mods en un click', 'Instaladores de modpacks y plugins integrados en el panel.'],
          ['users', 'Slots ilimitados', 'Nunca pagas por jugador: pagas por RAM y CPU.'],
        ]),
      },
    ),
    group(
      'hosting-web',
      'Hosting Web',
      'globe',
      'cPanel, SSL y correo profesional',
      'Alojamiento compartido con NVMe, certificados SSL gratuitos y migración asistida sin cortes de servicio.',
      {
        headline: 'Tu web online, sin pelearte con el servidor.',
        highlights: funcs([
          ['lock', 'SSL gratis y automático', 'Certificado emitido y renovado solo, sin tocar nada.'],
          ['mail', 'Correo profesional', 'Buzones con tu dominio, webmail y antispam incluidos.'],
          ['refresh', 'Migración asistida', 'Te traemos la web desde tu proveedor actual sin cortes.'],
        ]),
      },
    ),
  ]

  const [gVps, gGames, gWeb] = groups.map((g) => g.id)

  const products = [
    /* ------------------------------ Servidores VPS ----------------------------- */
    product('vps-linux', gVps, 'VPS Linux', {
      icon: 'server',
      badge: 'Más vendido',
      featured: true,
      tagline: 'KVM con Ryzen 7950X, NVMe Gen4 y root completo',
      description:
        'Virtualización KVM real: recursos garantizados, kernel propio y acceso root sin restricciones. Elige entre Debian, Ubuntu, AlmaLinux o Rocky y despliega en menos de 60 segundos.',
      highlights: funcs([
        ['cpu', 'CPU de sobremesa', 'Ryzen 7950X a 5,7 GHz. Núcleos dedicados, sin overselling.'],
        ['disk', 'NVMe Gen4 en RAID10', 'Sin discos mecánicos ni SATA en ningún plan.'],
        ['terminal', 'Root y consola VNC', 'Reinstala, monta ISOs y entra aunque tumbes la red.'],
      ]),
      features: funcs([
        ['shield', 'Anti-DDoS de 1 Tbps', 'Filtrado L3/L4/L7 activo por defecto, sin coste extra.'],
        ['database', 'Backups diarios', '7 días de retención y restauración a un click.'],
        ['network', 'Red de 1–2 Gbps', 'IPv4 dedicada + /64 IPv6 incluidas en todos los planes.'],
        ['layout', 'Panel de control', 'Consola VNC, reinstalación de SO y métricas en tiempo real.'],
        ['rocket', 'Activación instantánea', 'Se aprovisiona solo al confirmarse el pago.'],
        ['headset', 'Soporte 24/7', 'Tickets y Discord atendidos por técnicos.'],
      ]),
    }),
    product('vps-windows', gVps, 'VPS Windows', {
      icon: 'terminal',
      tagline: 'Windows Server con licencia incluida y RDP',
      description:
        'Windows Server 2022 activado y listo para usar, con acceso por Escritorio Remoto. Ideal para software que solo existe en Windows: bots de trading, paneles legacy o entornos de desarrollo .NET.',
      highlights: funcs([
        ['lock', 'Licencia incluida', 'Windows Server 2022 Datacenter activado, sin cargos aparte.'],
        ['layout', 'RDP listo al arrancar', 'Credenciales de administrador en el correo de alta.'],
        ['disk', 'NVMe Gen4', 'Arranques y compilaciones sin esperar al disco.'],
      ]),
      features: funcs([
        ['shield', 'Anti-DDoS de 1 Tbps', 'Protección permanente incluida en el precio.'],
        ['database', 'Snapshots', 'Punto de restauración antes de cada cambio grande.'],
        ['network', 'IPv4 dedicada', 'Sin NAT ni puertos compartidos.'],
        ['headset', 'Soporte 24/7', 'También para dudas de configuración de Windows.'],
      ]),
    }),

    /* -------------------------- Servidores de Juegos -------------------------- */
    product('minecraft', gGames, 'Minecraft', {
      icon: 'box',
      badge: 'Java y Bedrock',
      featured: true,
      tagline: 'Mods, plugins y modpacks sin límites de slots',
      description:
        'Java y Bedrock en el mismo panel, con instalador de modpacks en un click (Forge, Fabric, Paper, Purpur) y slots siempre ilimitados. Sube tu mundo por SFTP y sigue jugando donde lo dejaste.',
      highlights: funcs([
        ['box', 'Modpacks en un click', 'CurseForge y Modrinth integrados en el panel.'],
        ['users', 'Slots ilimitados', 'Nunca pagas por jugador: pagas por RAM y CPU.'],
        ['globe', 'Java + Bedrock', 'Cambia de plataforma o usa Geyser para jugar con ambas.'],
      ]),
      features: funcs([
        ['layout', 'Panel Pterodactyl', 'Consola, archivos, subdominios y programador de tareas.'],
        ['shield', 'Anti-DDoS de 1 Tbps', 'Filtrado específico para el protocolo de Minecraft.'],
        ['database', 'Backups automáticos', 'Copia diaria del mundo con restauración inmediata.'],
        ['zap', 'CPU de alto reloj', 'Ryzen 7950X: menos lag de tick en mundos grandes.'],
        ['network', 'Subdominio gratis', 'tuserver.hexservers.gg apuntando a tu IP y puerto.'],
        ['rocket', 'Online en 60 segundos', 'El servidor se crea solo tras el pago.'],
      ]),
    }),
    product('unturned', gGames, 'Unturned', {
      icon: 'gamepad',
      tagline: 'Workshop de Steam y RocketMod incluidos',
      description:
        'Unturned con integración directa del Workshop de Steam y RocketMod listo para tus plugins. Ligero, barato y perfecto para comunidades que empiezan.',
      highlights: funcs([
        ['box', 'Workshop ilimitado', 'Pega IDs de Steam y el servidor descarga los mods solo.'],
        ['wrench', 'RocketMod incluido', 'Plugins y permisos sin instalar nada a mano.'],
        ['zap', 'Precio de entrada bajo', 'Desde 2,50 $/mes con anti-DDoS incluido.'],
      ]),
      features: funcs([
        ['layout', 'Panel Pterodactyl', 'Consola, archivos y reinicios programados.'],
        ['shield', 'Anti-DDoS de 1 Tbps', 'Incluido también en el plan más pequeño.'],
        ['database', 'Backups automáticos', 'Copia diaria del mapa y de la configuración.'],
        ['headset', 'Soporte 24/7', 'Te ayudamos a montar el primer servidor.'],
      ]),
    }),


    /* ------------------------------- Hosting Web ------------------------------ */
    product('hosting-cpanel', gWeb, 'Hosting cPanel', {
      icon: 'globe',
      tagline: 'cPanel, SSL gratis y correo profesional',
      description:
        'Alojamiento compartido sobre NVMe con cPanel completo, certificados SSL de Let’s Encrypt automáticos y buzones de correo con tu dominio. Migramos tu web actual sin cortes.',
      highlights: funcs([
        ['layout', 'cPanel completo', 'Gestor de archivos, bases de datos, cron y DNS.'],
        ['mail', 'Correo con tu dominio', 'Buzones IMAP con antispam y webmail incluido.'],
        ['lock', 'SSL automático', 'HTTPS activo desde el minuto uno y renovación sola.'],
      ]),
      features: funcs([
        ['disk', 'Almacenamiento NVMe', 'Discos NVMe en RAID10, sin cabinas compartidas lentas.'],
        ['database', 'Backups diarios', 'Restauras la web o solo una base de datos desde cPanel.'],
        ['cloud', 'Migración gratuita', 'Traemos tu web de otro proveedor sin downtime.'],
        ['code', 'PHP 7.4–8.3 y Node', 'Cambia de versión por dominio desde el panel.'],
        ['shield', 'WAF y antispam', 'Reglas de firewall de aplicación activas por defecto.'],
        ['headset', 'Soporte 24/7', 'Tickets atendidos por técnicos, no por bots.'],
      ]),
    }),
    product('hosting-wordpress', gWeb, 'Hosting WordPress', {
      icon: 'zap',
      tagline: 'WordPress gestionado con caché y staging',
      description:
        'WordPress preinstalado y afinado: caché de objetos con Redis, LiteSpeed, actualizaciones gestionadas y entorno de staging con un click para probar antes de publicar.',
      highlights: funcs([
        ['gauge', 'Caché de serie', 'LiteSpeed + Redis configurados: TTFB por debajo de 200 ms.'],
        ['layers', 'Staging en un click', 'Clona la web, prueba y publica los cambios.'],
        ['refresh', 'Actualizaciones gestionadas', 'Core y plugins al día con copia previa.'],
      ]),
      features: funcs([
        ['disk', 'Almacenamiento NVMe', 'Rendimiento estable incluso con catálogos grandes.'],
        ['database', 'Backups diarios', '30 días de retención y restauración selectiva.'],
        ['shield', 'Seguridad reforzada', 'WAF con reglas para WordPress y bloqueo de fuerza bruta.'],
        ['cloud', 'Migración gratuita', 'Movemos tu WordPress sin perder posiciones ni correos.'],
        ['mail', 'Correo incluido', 'Buzones con tu dominio y antispam.'],
        ['headset', 'Soporte 24/7', 'Especializado en WordPress y WooCommerce.'],
      ]),
    }),
  ]

  const byId = (slug) => `prod_${slug.replace(/-/g, '_')}`

  const plans = [
    /* ------------------------------- VPS Linux ------------------------------- */
    plan(
      byId('vps-linux'),
      'VPS Starter',
      5.99,
      11,
      specs([
        ['CPU', '2 vCPU Ryzen 7950X'],
        ['RAM', '4 GB DDR5'],
        ['Disco', '60 GB NVMe'],
        ['Red', '1 Gbps · 4 TB'],
        ['Ubicación', 'Santiago / Miami'],
      ]),
      includes([
        '1 IPv4 dedicada + /64 IPv6',
        'Root completo y consola VNC',
        'Anti-DDoS de 1 Tbps',
        'Backup diario con 7 días de retención',
      ]),
      { description: 'Para un bot, una web pequeña o un entorno de pruebas.' },
    ),
    plan(
      byId('vps-linux'),
      'VPS Pro',
      11.99,
      12,
      specs([
        ['CPU', '4 vCPU Ryzen 7950X'],
        ['RAM', '8 GB DDR5'],
        ['Disco', '120 GB NVMe'],
        ['Red', '1 Gbps · 8 TB'],
        ['Ubicación', 'Santiago / Miami / Texas'],
      ]),
      includes([
        '1 IPv4 dedicada + /64 IPv6',
        'Root completo y consola VNC',
        'Anti-DDoS de 1 Tbps',
        'Backup diario con 7 días de retención',
        'Ampliable en caliente sin reinstalar',
      ]),
      {
        featured: true,
        description: 'El equilibrio que recomendamos para producción.',
        hasConfigurableOptions: true,
        configurableOptions: [
          {
            id: 'opt_ram',
            name: 'RAM adicional',
            whmcsOptionId: '',
            values: [
              { id: 'v_ram_0', label: 'Sin extra', priceDelta: 0, whmcsValueId: '', default: true },
              { id: 'v_ram_1', label: '+8 GB', priceDelta: 6, whmcsValueId: '' },
              { id: 'v_ram_2', label: '+16 GB', priceDelta: 11, whmcsValueId: '' },
            ],
          },
          {
            id: 'opt_disk',
            name: 'Disco adicional',
            whmcsOptionId: '',
            values: [
              { id: 'v_dk_0', label: 'Sin extra', priceDelta: 0, whmcsValueId: '', default: true },
              { id: 'v_dk_1', label: '+100 GB NVMe', priceDelta: 4, whmcsValueId: '' },
              { id: 'v_dk_2', label: '+250 GB NVMe', priceDelta: 9, whmcsValueId: '' },
            ],
          },
          {
            id: 'opt_backup',
            name: 'Backups',
            whmcsOptionId: '',
            values: [
              { id: 'v_bk_0', label: 'Diario (incluido)', priceDelta: 0, whmcsValueId: '', default: true },
              { id: 'v_bk_1', label: 'Cada 6 h + 30 días', priceDelta: 3.5, whmcsValueId: '' },
            ],
          },
        ],
      },
    ),
    plan(
      byId('vps-linux'),
      'VPS Elite',
      23.99,
      13,
      specs([
        ['CPU', '8 vCPU Ryzen 7950X'],
        ['RAM', '16 GB DDR5'],
        ['Disco', '250 GB NVMe'],
        ['Red', '2 Gbps · Ilimitado'],
        ['Ubicación', 'Todas'],
      ]),
      includes([
        '2 IPv4 dedicadas + /64 IPv6',
        'Root completo y consola VNC',
        'Anti-DDoS de 1 Tbps',
        'Backup diario con 14 días de retención',
        'Tráfico sin límite',
      ]),
      { description: 'Varias webs, bases de datos o contenedores en la misma máquina.' },
    ),
    plan(
      byId('vps-linux'),
      'VPS Titan',
      44.99,
      14,
      specs([
        ['CPU', '16 vCPU Ryzen 7950X'],
        ['RAM', '32 GB DDR5'],
        ['Disco', '500 GB NVMe'],
        ['Red', '2 Gbps · Ilimitado'],
        ['Ubicación', 'Todas'],
      ]),
      includes([
        '2 IPv4 dedicadas + /64 IPv6',
        'Root completo y consola VNC',
        'Anti-DDoS de 1 Tbps',
        'Backup cada 12 h con 30 días de retención',
        'Soporte prioritario',
      ]),
      { description: 'Para clústeres, CI/CD o cargas que ya no caben en un plan medio.' },
    ),

    /* ------------------------------ VPS Windows ------------------------------ */
    plan(
      byId('vps-windows'),
      'Windows Basic',
      14.99,
      15,
      specs([
        ['CPU', '4 vCPU Ryzen 7950X'],
        ['RAM', '8 GB DDR5'],
        ['Disco', '120 GB NVMe'],
        ['Licencia', 'Windows Server 2022'],
        ['Acceso', 'RDP + consola VNC'],
      ]),
      includes([
        'Licencia de Windows Server incluida',
        '1 IPv4 dedicada',
        'Anti-DDoS de 1 Tbps',
        'Snapshot semanal',
      ]),
      { description: 'Lo mínimo razonable para que Windows Server vaya fino.' },
    ),
    plan(
      byId('vps-windows'),
      'Windows Pro',
      27.99,
      16,
      specs([
        ['CPU', '8 vCPU Ryzen 7950X'],
        ['RAM', '16 GB DDR5'],
        ['Disco', '250 GB NVMe'],
        ['Licencia', 'Windows Server 2022'],
        ['Acceso', 'RDP + consola VNC'],
      ]),
      includes([
        'Licencia de Windows Server incluida',
        '2 IPv4 dedicadas',
        'Anti-DDoS de 1 Tbps',
        'Snapshots diarios',
        'Soporte prioritario',
      ]),
      { featured: true, description: 'Varios usuarios por RDP o aplicaciones .NET exigentes.' },
    ),

    /* ------- Minecraft: un plan por ubicación y CPU (ver `minecraftPlans`) ------ */
    ...minecraftPlans(byId('minecraft')),

    /* ------- Unturned: un plan por ubicación (ver `unturnedPlans`) ------------ */
    ...unturnedPlans(byId('unturned')),

    /**
     * Gama económica: los mismos productos, otra liga de hardware.
     *
     * Cuelgan de 'minecraft' y 'unturned', no de un producto aparte. Tenerlos
     * separados partía el mismo juego en dos sitios del árbol y escondía la mitad
     * de los planes a quien entraba por el otro. Ver `tiers` más abajo.
     */
    ...minecraftBudgetPlans(byId('minecraft')),
    ...unturnedBudgetPlans(byId('unturned')),

    /* ----------------------------- Hosting cPanel ---------------------------- */
    plan(
      byId('hosting-cpanel'),
      'Web Start',
      2.99,
      51,
      specs([
        ['Webs', '1 dominio'],
        ['Disco', '10 GB NVMe'],
        ['Correo', '5 buzones'],
        ['Bases de datos', '5 MySQL'],
        ['Tráfico', 'Sin medir'],
      ]),
      includes([
        'cPanel completo',
        'SSL de Let’s Encrypt automático',
        'Correo con tu dominio',
        'Backup diario',
        'Migración gratuita',
      ]),
      { description: 'Una web personal o el escaparate de un negocio pequeño.' },
    ),
    plan(
      byId('hosting-cpanel'),
      'Web Pro',
      5.99,
      52,
      specs([
        ['Webs', '10 dominios'],
        ['Disco', '40 GB NVMe'],
        ['Correo', '50 buzones'],
        ['Bases de datos', 'Ilimitadas'],
        ['Tráfico', 'Sin medir'],
      ]),
      includes([
        'cPanel completo',
        'SSL automático en todos los dominios',
        'Correo con antispam avanzado',
        'Backup diario con 30 días de retención',
        'Migración gratuita',
        'PHP 7.4–8.3 y Node.js',
      ]),
      { featured: true, description: 'Varias webs de cliente en la misma cuenta.' },
    ),
    plan(
      byId('hosting-cpanel'),
      'Web Business',
      11.99,
      53,
      specs([
        ['Webs', 'Ilimitadas'],
        ['Disco', '100 GB NVMe'],
        ['Correo', 'Ilimitado'],
        ['Bases de datos', 'Ilimitadas'],
        ['Tráfico', 'Sin medir'],
      ]),
      includes([
        'cPanel completo con acceso SSH',
        'SSL automático e IP dedicada',
        'Correo ilimitado con antispam',
        'Backup cada 12 h',
        'Migración gratuita',
        'Soporte prioritario',
      ]),
      { description: 'Agencias y proyectos con muchos dominios que mover.' },
    ),

    /* --------------------------- Hosting WordPress -------------------------- */
    plan(
      byId('hosting-wordpress'),
      'WP Lite',
      4.99,
      61,
      specs([
        ['Webs', '1 WordPress'],
        ['Disco', '20 GB NVMe'],
        ['Visitas', 'Hasta 50k/mes'],
        ['Caché', 'LiteSpeed'],
        ['Staging', 'No incluido'],
      ]),
      includes([
        'WordPress preinstalado y afinado',
        'Caché LiteSpeed activa',
        'SSL automático',
        'Actualizaciones gestionadas',
        'Backup diario',
      ]),
      { description: 'Un blog o una web corporativa con tráfico normal.' },
    ),
    plan(
      byId('hosting-wordpress'),
      'WP Turbo',
      9.99,
      62,
      specs([
        ['Webs', '5 WordPress'],
        ['Disco', '60 GB NVMe'],
        ['Visitas', 'Hasta 300k/mes'],
        ['Caché', 'LiteSpeed + Redis'],
        ['Staging', 'Incluido'],
      ]),
      includes([
        'WordPress preinstalado y afinado',
        'Caché LiteSpeed + objeto Redis',
        'Entorno de staging en un click',
        'SSL automático',
        'Backup diario con 30 días de retención',
        'Optimizado para WooCommerce',
      ]),
      { featured: true, description: 'Tiendas WooCommerce y webs con picos de tráfico.' },
    ),
  ]

  return {
    schemaVersion: SCHEMA_VERSION,

    /* Paleta editable desde el panel → Diseño. Ver src/lib/theme.js. */
    theme: { ...DEFAULT_THEME },

    /**
     * Divisas. Los precios de los planes se escriben SIEMPRE en la divisa base;
     * el resto son conversiones que hace el navegador con el cambio que fijes
     * aquí (no hay backend que consulte cotizaciones, así que las actualizas tú).
     *
     * `whmcsId` es el id de esa divisa en WHMCS: si lo rellenas, el carrito se
     * abre ya en la moneda que el visitante estaba viendo.
     */
    currency: {
      base: 'USD',
      default: 'CLP',
      items: [
        { id: 'cur_clp', code: 'CLP', label: 'Peso chileno', rate: 950, locale: 'es-CL', whmcsId: '' },
        { id: 'cur_usd', code: 'USD', label: 'Dólar estadounidense', rate: 1, locale: 'en-US', whmcsId: '' },
        { id: 'cur_eur', code: 'EUR', label: 'Euro', rate: 0.92, locale: 'es-ES', whmcsId: '' },
      ],
    },

    brand: {
      name: 'HexServers',
      claim: 'Hosting chileno, trato directo',
      poweredBy: 'Powered by HexServers',
    },

    nav: {
      links: [
        { id: 'nav_home', label: 'Inicio', href: '#/' },
        { id: 'nav_products', label: 'Productos', href: '#/productos' },
        { id: 'nav_hub', label: 'Hub', href: '#/hub' },
        { id: 'nav_about', label: 'Nosotros', href: '#/nosotros' },
        /* Ocupa el sitio que tenía «Contacto»: soporte es a donde se va a escribir. */
        { id: 'nav_support', label: 'Soporte', href: '#/soporte' },
      ],
      logins: [
        {
          id: 'login_client',
          label: 'Portal de Clientes',
          hint: 'Facturas, servicios y tickets (WHMCS)',
          url: 'https://billing.hexservers.com/clientarea.php',
          icon: 'receipt',
        },
        {
          id: 'login_panel',
          label: 'Panel de Juegos',
          hint: 'Consola, archivos y backups (Pterodactyl)',
          url: 'https://panel.hexservers.com',
          icon: 'gamepad',
        },
      ],
    },

    /**
     * Los textos son de una tienda pequeña: prometen lo que una tienda pequeña
     * puede cumplir (trato directo y precio) y no lo que sólo puede prometer un
     * gigante (99,9 % medido, salas propias, soporte de 300 personas).
     */
    hero: {
      badge: 'Servidores en Santiago y EE. UU.',
      title: 'Servidores de juego con alguien detrás que te responde.',
      highlight: 'alguien detrás que te responde',
      subtitle:
        'Minecraft, Unturned y VPS con servidor local en Chile. Precios en pesos, especificaciones claras y soporte por Discord con la persona que administra las máquinas: sin call center ni tickets que se pierden.',
      primaryCta: { label: 'Ver planes', href: '#/productos' },
      secondaryCta: { label: 'Ver ubicaciones', href: '#ubicaciones' },
      stats: [
        { id: 'st_1', value: 'Santiago', label: 'Servidor local' },
        { id: 'st_2', value: '< 15 min', label: 'Respuesta media' },
        { id: 'st_3', value: 'CLP', label: 'Precios en pesos' },
        { id: 'st_4', value: '1 Tbps', label: 'Anti-DDoS incluido' },
      ],
    },

    /* Bloque de la portada que presenta las subcategorías del catálogo. */
    showcase: {
      eyebrow: 'Catálogo',
      /* Sin número en el titular: cambia solo si añades o quitas subcategorías. */
      title: 'Todo el catálogo, un mismo estándar',
      subtitle:
        'Misma red, mismo panel y mismo soporte en todas. Lo único que cambia entre la gama normal y la económica es el procesador. Entra en la que necesites y compara sus planes.',
      ctaLabel: 'Ver todos los productos',
    },

    /* Cuatro motivos y no seis: cuantos menos hay, más se leen. */
    features: {
      title: 'Lo que incluye cualquier plan',
      subtitle: 'Sin extras obligatorios ni versiones «pro» de lo que ya pagaste.',
      items: [
        {
          id: 'f_support',
          icon: 'headset',
          title: 'Hablas con quien lo administra',
          description:
            'Soporte por Discord con la persona que gestiona las máquinas. Sin niveles de escalado ni respuestas de plantilla.',
        },
        {
          id: 'f_price',
          icon: 'wallet',
          title: 'Precio sin sorpresas',
          description:
            'El precio en pesos que ves es el que pagas. Anti-DDoS, backups y panel van dentro, también en la gama económica.',
        },
        {
          id: 'f_local',
          icon: 'globe',
          title: 'Servidor en Santiago',
          description:
            'Latencia baja de verdad para jugadores chilenos, y tres ubicaciones en EE. UU. si tu comunidad está repartida.',
        },
        {
          id: 'f_panel',
          icon: 'layout',
          title: 'Panel y backups de serie',
          description:
            'Pterodactyl completo para juegos, consola VNC en los VPS y copia diaria en todos los planes.',
        },
      ],
    },

    /**
     * `pingUrl` es el endpoint que se mide en vivo desde el navegador del visitante.
     * Viene vacío a propósito: hasta que pongas los tuyos se muestra el valor fijo de
     * `ping`. Nunca apuntes a infraestructura ajena — sería vender la latencia de otro
     * como si fuera la tuya.
     */
    locations: {
      title: 'Ubicaciones disponibles',
      subtitle: 'Elige el datacenter más cercano a tus jugadores.',
      liveLatency: true,
      latencyNote: 'Latencia medida desde tu navegador ahora mismo.',
      items: [
        { id: 'loc_santiago', flag: '🇨🇱', city: 'Santiago', country: 'Chile', ping: '6 ms', status: 'online', pingUrl: '' },
        { id: 'loc_miami', flag: '🇺🇸', city: 'Miami', country: 'EE. UU.', ping: '110 ms', status: 'online', pingUrl: '' },
        { id: 'loc_texas', flag: '🇺🇸', city: 'Texas', country: 'EE. UU.', ping: '140 ms', status: 'online', pingUrl: '' },
        { id: 'loc_ohio', flag: '🇺🇸', city: 'Ohio', country: 'EE. UU.', ping: '165 ms', status: 'online', pingUrl: '' },
      ],
    },

    /**
     * Formas de pago de la portada. Es información, no un formulario: el cobro lo
     * hace la pasarela desde el carrito de WHMCS y aquí sólo se cuenta con qué se
     * puede pagar, que es la duda que aparece antes de llegar al carrito.
     */
    payments: {
      title: 'Formas de pago',
      subtitle:
        'Elige la que te acomode al pasar por caja. El precio final es el mismo en todas: no cobramos recargo por medio de pago.',
      items: [
        {
          id: 'pay_paypal',
          name: 'PayPal',
          icon: 'card',
          /* Sube el logo desde el panel y sustituye al icono (ver `Glyph`). */
          image: '',
          description:
            'Con tu saldo de PayPal o con tarjeta de crédito y débito, aunque no tengas cuenta. El servicio se activa en cuanto se confirma el pago.',
          badge: 'Activación inmediata',
        },
        {
          id: 'pay_mercadopago',
          name: 'Mercado Pago',
          icon: 'wallet',
          image: '',
          description:
            'Débito, crédito y saldo de Mercado Pago, en pesos chilenos. Es la vía más cómoda si pagas desde Chile.',
          badge: 'Pago en pesos',
        },
        {
          id: 'pay_transferencia',
          name: 'Transferencia bancaria',
          icon: 'bank',
          image: '',
          description:
            'Transferencia a nuestra cuenta chilena. Los datos salen en la factura; en cuanto entra el pago damos de alta el servicio.',
          badge: 'Sin comisiones',
        },
      ],
      note: 'El cobro lo procesa la pasarela desde el carrito. Nosotros nunca vemos ni guardamos los datos de tu tarjeta.',
    },

    contact: {
      title: 'Pregunta antes de contratar',
      subtitle:
        'Cuéntame qué quieres montar y te digo qué plan te sirve — o si te sobra con uno más barato del que estabas mirando. Respondo yo, no un formulario.',
      email: 'soporte@hexservers.com',
      discord: 'https://discord.gg/hexservers',
      responseTime: 'Respuesta media: 15 minutos por Discord',
    },

    /**
     * Página /hub: el núcleo de la operación, contado sin marketing.
     *
     * Tres bloques, y el orden importa: primero el hierro (qué máquina hay en cada
     * ubicación), después quién lo atiende, y al final qué falta por hacer. Los
     * nodos se agrupan por `locationId`, que apunta a `locations.items`: así una
     * ubicación nueva aparece sola y no hay dos listas de ciudades que mantener.
     */
    hub: {
      eyebrow: 'Hub',
      title: 'El núcleo, por dentro',
      subtitle:
        'Qué máquinas hay detrás de cada ubicación, quién atiende los tickets y qué estamos construyendo ahora mismo. Si algo cambia en la infraestructura, se cuenta aquí.',

      hardwareTitle: 'Hardware por ubicación',
      hardwareSubtitle:
        'Los nodos que damos de alta en cada datacenter. Un plan tuyo vive en uno de estos.',
      /* `locationId` cuelga de locations.items; sin él, el nodo cae en «Sin asignar». */
      nodes: [
        {
          id: 'node_scl_1',
          locationId: 'loc_santiago',
          name: 'SCL-01',
          role: 'Juegos · gama rendimiento',
          cpu: 'Ryzen 9 7950X · 16c/32t @ 5,7 GHz',
          ram: '128 GB DDR5 ECC',
          disk: '2 × 2 TB NVMe Gen4 (RAID10)',
          network: '1 Gbps · anti-DDoS 1 Tbps',
          status: 'online',
        },
        {
          id: 'node_scl_2',
          locationId: 'loc_santiago',
          name: 'SCL-02',
          role: 'Juegos · gama económica',
          cpu: 'Ryzen 5 3600 · 6c/12t @ 4,2 GHz',
          ram: '64 GB DDR4',
          disk: '2 × 1 TB NVMe (RAID1)',
          network: '1 Gbps · anti-DDoS 1 Tbps',
          status: 'online',
        },
        {
          id: 'node_mia_1',
          locationId: 'loc_miami',
          name: 'MIA-01',
          role: 'VPS Linux y Windows',
          cpu: 'Ryzen 9 7950X · 16c/32t @ 5,7 GHz',
          ram: '128 GB DDR5 ECC',
          disk: '4 × 2 TB NVMe Gen4 (RAID10)',
          network: '2 Gbps · anti-DDoS 1 Tbps',
          status: 'online',
        },
        {
          id: 'node_tex_1',
          locationId: 'loc_texas',
          name: 'TEX-01',
          role: 'Juegos · gama rendimiento',
          cpu: 'Ryzen 9 5950X · 16c/32t @ 4,9 GHz',
          ram: '128 GB DDR4 ECC',
          disk: '2 × 2 TB NVMe Gen4 (RAID10)',
          network: '1 Gbps · anti-DDoS 1 Tbps',
          status: 'online',
        },
        {
          id: 'node_ohi_1',
          locationId: 'loc_ohio',
          name: 'OHI-01',
          role: 'Hosting web y correo',
          cpu: 'Ryzen 9 5950X · 16c/32t @ 4,9 GHz',
          ram: '64 GB DDR4 ECC',
          disk: '2 × 1 TB NVMe (RAID1)',
          network: '1 Gbps · anti-DDoS 1 Tbps',
          status: 'maintenance',
        },
      ],

      teamTitle: 'Miembros de soporte',
      teamSubtitle:
        'Quién está detrás de los tickets y del Discord. No hay más gente que esta: por eso contestamos como personas.',
      team: [
        {
          id: 'mem_1',
          name: 'Matías',
          role: 'Infraestructura y guardias',
          handle: '@matias',
          icon: 'server',
          schedule: 'L–D · 09:00–01:00 (CLT)',
          status: 'active',
        },
        {
          id: 'mem_2',
          name: 'Cami',
          role: 'Soporte de juegos y paneles',
          handle: '@cami',
          icon: 'gamepad',
          schedule: 'L–V · 14:00–23:00 (CLT)',
          status: 'active',
        },
        {
          id: 'mem_3',
          name: 'Nico',
          role: 'Facturación y altas',
          handle: '@nico',
          icon: 'receipt',
          schedule: 'L–V · 10:00–19:00 (CLT)',
          status: 'active',
        },
      ],

      roadmapTitle: 'Próximos cambios',
      roadmapSubtitle:
        'Lo que viene y lo que ya entró. Se actualiza cuando algo cambia de estado, no cuando queda bonito.',
      changes: [
        {
          id: 'chg_1',
          title: 'Backups fuera del nodo',
          description:
            'Copia diaria replicada a un almacenamiento aparte, para que un fallo de disco no se lleve también el respaldo.',
          status: 'progress',
          date: 'En curso',
          tag: 'Infraestructura',
        },
        {
          id: 'chg_2',
          title: 'Nodo nuevo en Santiago (SCL-03)',
          description:
            'Un 7950X más para la gama de rendimiento: menos servidores por máquina y hueco para crecer.',
          status: 'planned',
          date: 'Próximo trimestre',
          tag: 'Hardware',
        },
        {
          id: 'chg_3',
          title: 'Página de estado pública',
          description:
            'Estado por nodo y por servicio, con historial de incidencias, sin tener que preguntar en Discord.',
          status: 'planned',
          date: 'Sin fecha',
          tag: 'Web',
        },
        {
          id: 'chg_4',
          title: 'Precios en pesos chilenos',
          description:
            'Selector de divisa en toda la web con el cambio actualizado a mano, para no pagar en dólares sin saberlo.',
          status: 'done',
          date: 'Ya disponible',
          tag: 'Web',
        },
      ],
    },

    /**
     * Página /soporte. El botón lleva a los tickets de WHMCS: si `ticketUrl` está
     * vacío se deriva de `whmcs.portalUrl` (…/submitticket.php), así que basta con
     * tener bien el portal para que funcione.
     */
    support: {
      eyebrow: 'Soporte',
      title: '¿Necesitas ayuda con tu servicio?',
      subtitle:
        'Abre un ticket y queda registrado con tu cuenta: es la vía que revisamos siempre, también de madrugada. Para dudas rápidas, el Discord va más suelto.',
      cardTitle: '¿Necesitas soporte?',
      cardText:
        'Cuéntanos qué pasa —servidor, hora aproximada y qué esperabas que ocurriera— y lo miramos con acceso a la máquina. Los tickets los contesta un técnico, no un bot.',
      ticketLabel: 'Abrir ticket',
      /* Vacío = se construye a partir de whmcs.portalUrl. */
      ticketUrl: '',
      ticketHint: 'Te llevamos al área de clientes de WHMCS para crear el ticket.',
      /* Vacío = se usa contact.email, para no tener el correo escrito en dos sitios. */
      email: '',
      emailHint: 'Si aún no eres cliente y no tienes cuenta, escríbenos por correo.',
      responseTime: 'Respuesta media: 15 minutos por Discord, menos de 1 h por ticket',
      notes: [
        {
          id: 'sup_n1',
          icon: 'clock',
          title: 'Guardias reales',
          description: 'Las caídas se atienden a la hora que sean. El resto, en horario de oficina.',
        },
        {
          id: 'sup_n2',
          icon: 'shield',
          title: 'Nunca pedimos tu contraseña',
          description:
            'Ni por ticket ni por Discord. Si alguien te la pide en nuestro nombre, no somos nosotros.',
        },
        {
          id: 'sup_n3',
          icon: 'layout',
          title: 'Mira antes el panel',
          description:
            'Consola, archivos y backups están en Pterodactyl: muchas veces se arregla desde ahí en un minuto.',
        },
      ],
    },

    /* Página /nosotros. */
    about: {
      eyebrow: 'Nosotros',
      title: 'Hardware propio, precios honestos y gente que responde',
      subtitle:
        'HexServers no revende máquinas de otros. Compramos el hierro, lo montamos, lo mantenemos y damos la cara cuando algo se rompe.',
      image: '',
      story: [
        {
          id: 'ab_1',
          text: 'Empezamos en 2019 alquilando un servidor para la comunidad de Minecraft en la que jugábamos. El proveedor prometía 8 GB de RAM y un núcleo dedicado; la realidad era un contenedor compartido con veinte servidores más y un panel que se caía cada semana. Nos cansamos y compramos nuestra propia máquina.',
        },
        {
          id: 'ab_2',
          text: 'Cinco años después seguimos con la misma idea, solo que con racks en Santiago y Estados Unidos: si un plan dice 8 GB, son 8 GB para ti. No hacemos overselling, no cobramos aparte por el anti-DDoS ni por los backups, y no escondemos nada en la letra pequeña del carrito.',
        },
        {
          id: 'ab_3',
          text: 'Somos un equipo pequeño de técnicos, sin departamento comercial. Cuando abres un ticket te contesta alguien que tiene acceso al servidor y sabe qué está mirando, normalmente en menos de quince minutos.',
        },
      ],
      pillars: [
        {
          id: 'ab_p1',
          icon: 'server',
          title: 'Hardware nuestro',
          description:
            'Ryzen 7950X y NVMe Gen4 en RAID10, comprados y administrados por nosotros. Sin capas de reventa entre tu servidor y quien lo mantiene.',
        },
        {
          id: 'ab_p2',
          icon: 'wallet',
          title: 'Precios sin sorpresas',
          description:
            'El precio de la web es el precio del carrito. Anti-DDoS, backups y panel van incluidos: no existe la versión "pro" de lo que ya pagaste.',
        },
        {
          id: 'ab_p3',
          icon: 'headset',
          title: 'Soporte técnico de verdad',
          description:
            'Tickets y Discord atendidos por los mismos que administran la infraestructura. Sin bots, sin scripts, sin escalados eternos.',
        },
        {
          id: 'ab_p4',
          icon: 'lock',
          title: 'Tus datos son tuyos',
          description:
            'Copias diarias cifradas, root completo en los VPS y exportación de tus mundos y bases de datos cuando quieras. Irte es tan fácil como entrar.',
        },
      ],
      stats: [
        { id: 'ab_s1', value: '2019', label: 'Desde' },
        { id: 'ab_s2', value: '4.200+', label: 'Servidores activos' },
        { id: 'ab_s3', value: '4', label: 'Datacenters' },
        { id: 'ab_s4', value: '<15 min', label: 'Respuesta media' },
      ],
      ctaTitle: '¿Quieres saber cómo montamos la infraestructura?',
      ctaText:
        'Preguntamos poco y contamos mucho: escríbenos y te detallamos el hardware exacto, la red y las políticas de backup del servicio que te interese.',
      ctaLabel: 'Ver productos',
      ctaHref: '#/productos',
    },

    /* Textos de la página /productos y del recorrido de compra. */
    catalog: {
      eyebrow: 'Catálogo',
      title: 'Nuestros productos',
      subtitle:
        'Elige una familia, entra en el producto y compara sus planes. Todos los precios son finales.',
      allLabel: 'Todos',
      /**
       * Si se enseña la pestaña «Todos». Apagada, el catálogo entra directamente
       * en la primera subcategoría y siempre hay una pestaña activa.
       */
      showAllTab: true,
      emptyLabel: 'Todavía no hay productos en esta subcategoría.',
      /* Marcador del buscador. Sólo se ve en el modo «rejilla buscable». */
      searchLabel: 'Buscar por nombre, plan o categoría…',
      /* Encabeza la rejilla compacta cuando hay destacados por encima. */
      restLabel: 'Todo el catálogo',
      /**
       * Preguntas frecuentes del catálogo, plegadas al pie de la página.
       *
       * La página terminaba en seco después de la última tarjeta: un directorio, y
       * los directorios no venden. Esto es lo que hacen las tres referencias — y de
       * paso quita tickets, porque son las dudas que llegan siempre antes de pagar.
       *
       * Vacío = la sección no se pinta.
       */
      faqTitle: 'Preguntas frecuentes',
      faqSubtitle: 'Lo que casi todo el mundo pregunta antes de contratar.',
      faq: [
        {
          id: 'faq_activacion',
          question: '¿Cuánto tarda en estar listo mi servidor?',
          answer:
            'Se crea solo en cuanto se confirma el pago, normalmente en menos de un minuto. Recibes los accesos al panel por correo y ya puedes arrancarlo.',
        },
        {
          id: 'faq_cambiar',
          question: '¿Puedo cambiar de plan más adelante?',
          answer:
            'Sí, y sin reinstalar nada ni perder tus datos. Se amplían los recursos sobre la misma máquina y sólo pagas la diferencia del tiempo que quede.',
        },
        {
          id: 'faq_gama',
          question: '¿Qué diferencia hay entre la gama estándar y la económica?',
          answer:
            'El procesador, y nada más. La económica va sobre CPU compartida de menor reloj; el panel, el anti-DDoS, los backups y las ubicaciones son los mismos. Para vanilla y grupos pequeños va sobrada; para modpacks grandes, vete a la estándar.',
        },
        {
          id: 'faq_ddos',
          question: '¿El anti-DDoS es un extra que se paga aparte?',
          answer:
            'No. Va incluido en todos los planes, también en el más barato. No cobramos por que tu servidor siga en pie.',
        },
        {
          id: 'faq_reembolso',
          question: '¿Y si no me convence?',
          answer:
            'Escríbenos por ticket o por Discord y lo hablamos. Preferimos devolver el dinero a tener a alguien pagando por algo que no le sirve.',
        },
      ],
      /**
       * Cómo se listan los productos. Ver CATALOG_LAYOUTS en src/lib/layouts.js:
       * 'detalle' | 'rejilla' | 'lista' | 'escaparate' | 'tabla'.
       */
      layout: 'detalle',
      /* Si el visitante puede cambiar esa forma desde la propia página. */
      allowViewerLayout: true,
      /**
       * Selector de ciclo de facturación sobre el catálogo. Apagado de fábrica:
       * los descuentos de abajo son cero y encenderlo sin haberlos rellenado sólo
       * añadiría botones que no cambian ningún precio. Ver src/lib/billing.js.
       */
      showCycles: false,
      /**
       * Descuento de cada ciclo, en porcentaje sobre la tarifa mensual. Tienen que
       * coincidir con lo que cobra WHMCS de verdad: lo que se pinta aquí es lo que
       * el cliente espera pagar en el carrito.
       */
      cycleDiscounts: { ...DEFAULT_CYCLE_DISCOUNTS },
      /**
       * Bloques del configurador de la ficha de producto. Se apilan en la misma
       * página y cada uno aparece cuando el anterior está resuelto; los de
       * gama, ubicación y CPU sólo existen si los planes los usan.
       */
      sections: {
        tier: 'Elige la gama',
        tierHint: 'Qué clase de máquina hay debajo. Lo demás —panel, red y soporte— es idéntico.',
        location: 'Elige la ubicación',
        locationHint: 'El datacenter más cercano a tus jugadores.',
        cpu: 'Elige el procesador',
        cpuHint: 'Más reloj, menos lag por tick. Todo lo demás es idéntico.',
        plans: 'Elige tu plan',
        plansHint: 'Puedes ampliar recursos más adelante sin reinstalar nada.',
      },
      detailTitle: 'Todo lo que incluye',
      checkoutLabel: 'Continuar al pago',
      checkoutHint: 'Te llevamos al carrito de WHMCS con esta configuración aplicada.',
    },

    footer: {
      description:
        'HexServers — VPS, servidores de juegos y hosting web con hardware dedicado, red anti-DDoS y precios claros.',
      columns: [
        {
          id: 'fc_prod',
          title: 'Productos',
          links: [
            { id: 'fl_1', label: 'VPS Linux', href: '#/producto/vps-linux' },
            { id: 'fl_2', label: 'Minecraft', href: '#/producto/minecraft' },
            { id: 'fl_3', label: 'Unturned', href: '#/producto/unturned' },
            { id: 'fl_13', label: 'Minecraft económico', href: '#/producto/minecraft?gama=tier_economica' },
            { id: 'fl_4', label: 'Hosting cPanel', href: '#/producto/hosting-cpanel' },
          ],
        },
        {
          id: 'fc_help',
          title: 'Soporte',
          links: [
            { id: 'fl_14', label: 'Abrir un ticket', href: '#/soporte' },
            { id: 'fl_15', label: 'Hub', href: '#/hub' },
            { id: 'fl_5', label: 'Portal de clientes', href: 'https://billing.hexservers.com/clientarea.php' },
            { id: 'fl_6', label: 'Panel de juegos', href: 'https://panel.hexservers.com' },
            { id: 'fl_7', label: 'Estado del servicio', href: 'https://status.hexservers.com' },
            { id: 'fl_8', label: 'Base de conocimiento', href: '#' },
          ],
        },
        {
          id: 'fc_legal',
          title: 'Legal',
          links: [
            { id: 'fl_9', label: 'Términos de servicio', href: '#' },
            { id: 'fl_10', label: 'Política de privacidad', href: '#' },
            { id: 'fl_11', label: 'Política de reembolso', href: '#' },
            { id: 'fl_12', label: 'Aviso legal', href: '#' },
          ],
        },
      ],
      social: [
        { id: 'so_dc', label: 'Discord', url: 'https://discord.gg/hexservers', icon: 'discord' },
        { id: 'so_tw', label: 'X / Twitter', url: 'https://x.com/hexservers', icon: 'twitter' },
        { id: 'so_gh', label: 'GitHub', url: 'https://github.com/hexservers', icon: 'github' },
      ],
      legal: `© ${new Date().getFullYear()} HexServers. Todos los derechos reservados.`,
    },

    promo: {
      enabled: true,
      code: 'HEX25',
      title: '25% de descuento',
      description:
        'Aplica este código en el carrito y llévate el primer mes con un 25% menos en cualquier plan.',
      badge: 'Oferta de lanzamiento',
      expires: 'Válido hasta fin de mes',
      triggerSeconds: 8,
      triggerOnScroll: true,
      ctaLabel: 'Ver productos',
      ctaHref: '#/productos',
    },

    whmcs: {
      portalUrl: 'https://billing.hexservers.com',
      clientAreaUrl: 'https://billing.hexservers.com/clientarea.php',
      apiEnabled: false,
      apiUrl: 'https://billing.hexservers.com/includes/api.php',
      identifier: '',
      secret: '',
      proxyUrl: '',
      promocode: '',
      lastSync: null,
    },

    admin: {
      username: 'admin',
      // Contraseña por defecto: hexadmin — se sustituye por su hash en el primer arranque.
      salt: '',
      passwordHash: '',
      defaultPassword: 'hexadmin',
    },

    /**
     * Gamas: el segundo eje del catálogo.
     *
     * La subcategoría dice *qué* se vende (VPS, juegos, web) y la gama dice *en qué
     * liga juega* ese mismo producto. Son ejes distintos, y meterlos en la misma
     * lista de pestañas es lo que llevaba a tener «Minecraft» y «Minecraft
     * Económico» como dos productos separados: el mismo juego partido en dos sitios,
     * con la mitad de los planes escondidos de quien buscaba el otro.
     *
     * Cuelga del plan (`plan.tierId`) y no del producto, igual que la ubicación y la
     * CPU, porque es el plan lo que cambia de gama: un mismo Minecraft tiene planes
     * en hardware dedicado y planes en hardware compartido, y ambos son Minecraft.
     * Así es también como lo tienen las referencias — Centrix lleva un campo `tier`
     * por plan y los llama «Budget VPS | Developer».
     *
     * Vacío en un plan = sin gama. Con una sola gama en juego, el selector no se
     * pinta: no hay nada que elegir.
     */
    tiers: [
      {
        id: 'tier_estandar',
        name: 'Estándar',
        tagline: 'Hardware dedicado',
        description:
          'Recursos reservados para ti y el procesador más rápido. Lo que necesitas si el servidor va en serio.',
        icon: 'zap',
        badge: 'Recomendada',
      },
      {
        id: 'tier_economica',
        name: 'Económica',
        tagline: 'Hardware compartido',
        description:
          'El mismo panel y la misma red, en máquinas compartidas. Para empezar o para grupos pequeños.',
        icon: 'wallet',
        badge: '',
      },
    ],

    /**
     * CPUs del catálogo. Junto con `locations.items` forman los grupos de WHMCS:
     * cada plan apunta a una ubicación y a una CPU, y el cliente las elige antes
     * de ver los planes.
     */
    cpus: [
      {
        id: 'cpu_7950x',
        name: 'Ryzen 9 7950X',
        tagline: 'Máximo reloj',
        description: 'Hasta 5,7 GHz. La opción para modpacks pesados y mundos grandes.',
        icon: 'zap',
        badge: 'Recomendada',
      },
      {
        id: 'cpu_5950x',
        name: 'Ryzen 9 5950X',
        tagline: 'Equilibrada',
        description: 'Hasta 4,9 GHz por bastante menos. De sobra para servidores normales.',
        icon: 'cpu',
        badge: '',
      },
      {
        id: 'cpu_3600',
        name: 'Ryzen 5 3600',
        tagline: 'Compartida',
        description:
          'Hasta 4,2 GHz repartidos entre varios servidores. Es el hardware de la gama económica: lo que hace posible el precio bajo.',
        icon: 'wallet',
        badge: '',
      },
    ],

    groups,
    products,
    plans,
  }
}
