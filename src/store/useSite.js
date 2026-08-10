import { useMemo } from 'react'
import { create } from 'zustand'
import { readDoc, writeDoc, deleteDoc } from '../lib/db.js'
import { hashPassword, verifyPassword, randomSalt } from '../lib/auth.js'
import { createDefaultState, SCHEMA_VERSION } from '../data/defaultState.js'
import { DEFAULT_CURRENCY, formatMoney, resolveCurrency } from '../lib/money.js'
import { mergeTheme } from '../lib/theme.js'
import { DEFAULT_CYCLE, monthlyPrice, resolveCycle } from '../lib/billing.js'
import { resolveLayout } from '../lib/layouts.js'
import {
  fetchRemoteContent,
  saveRemoteContent,
  loginRemote,
  logoutRemote,
  readToken,
  writeToken,
} from '../lib/remote.js'
import { uid, clone, moveItem, slugify } from '../lib/utils.js'

const DOC_KEY = 'site'
const SESSION_KEY = 'hexservers:admin-session'
/* La divisa es preferencia del visitante, no contenido del sitio: va al dispositivo. */
const CURRENCY_KEY = 'hexservers:currency'
/* Ídem con la apariencia que elige el visitante desde el navbar. */
const VIEWER_THEME_KEY = 'hexservers:viewer-theme'
/* Ídem con la forma de listar el catálogo que elige desde la página de productos. */
const VIEWER_LAYOUT_KEY = 'hexservers:catalog-layout'
const VIEWER_CYCLE_KEY = 'hexservers:billing-cycle'

/* --------------------------------- persistencia -------------------------------- */

/**
 * Guardado diferido, a dos sitios.
 *
 * Siempre al navegador, que es instantáneo y funciona sin red. Y además al
 * servidor, si lo hay y hay sesión de admin — ese es el que ven los demás. El
 * orden importa: primero lo local, para que un servidor caído nunca haga perder
 * lo que se acaba de escribir.
 *
 * `onSync` lo pone el store al arrancar para poder pintar el estado en la barra
 * de administración; aquí no se sabe nada de React.
 */
let saveTimer = null
let onSync = () => {}

export const setSyncListener = (listener) => {
  onSync = listener
}

function scheduleSave(site) {
  clearTimeout(saveTimer)
  saveTimer = setTimeout(async () => {
    try {
      await writeDoc(DOC_KEY, site)
    } catch (err) {
      console.error('[hexservers] error al guardar en el navegador:', err)
    }
    if (readToken()) pushToServer(site)
  }, 250)
}

/**
 * Envío al servidor, de uno en uno.
 *
 * Editando rápido —arrastrando un color, escribiendo en un campo— el retardo de
 * 250 ms no impide que un envío salga mientras el anterior sigue en vuelo. Dos
 * peticiones en paralelo pueden llegar en cualquier orden, y entonces el archivo
 * acabaría con una versión intermedia en lugar de la última.
 *
 * Con esto sólo hay una petición viva a la vez: lo que llegue mientras tanto
 * espera su turno y, si llegan varios, sólo se manda el último — los de en medio
 * ya no le importan a nadie.
 */
let sending = false
let pendingSite = null

async function pushToServer(site) {
  pendingSite = site
  if (sending) return

  sending = true
  try {
    while (pendingSite) {
      const next = pendingSite
      pendingSite = null

      const token = readToken()
      if (!token) break

      onSync({ state: 'saving', error: '' })
      await saveRemoteContent(publicSite(next), token)
      onSync({ state: 'saved', error: '', at: Date.now() })
    }
  } catch (err) {
    /* Se descarta la cola: si falló la sesión o la red, reintentar en bucle sólo
       encadenaría errores. El siguiente cambio lo vuelve a intentar. */
    pendingSite = null
    onSync({ state: 'error', error: err.message })
  } finally {
    sending = false
  }
}

/**
 * El documento sin nada que no deba ser público.
 *
 * Lo que se manda al servidor acaba en un archivo que sirve `GET /api/content`,
 * y eso lo lee cualquier visitante: el hash de la contraseña y las claves de la
 * API de WHMCS no pueden ir dentro. Es la misma limpieza que hace `exportJson`.
 */
function publicSite(site) {
  const clean = clone(site)
  clean.admin = { username: site.admin?.username || 'admin', salt: '', passwordHash: '', defaultPassword: '' }
  clean.whmcs = { ...site.whmcs, identifier: '', secret: '' }
  return clean
}

/* ---------------------------------- plantillas --------------------------------- */

const emptyProduct = (partial = {}) => ({
  id: uid('prod'),
  groupId: '',
  slug: '',
  name: 'Nuevo producto',
  tagline: '',
  description: '',
  image: '',
  icon: 'server',
  badge: '',
  status: 'available',
  featured: false,
  hidden: false,
  highlights: [],
  features: [],
  plansTitle: 'Planes disponibles',
  plansSubtitle: 'Elige el que encaje con tu proyecto.',
  ...partial,
})

const emptyPlan = (partial = {}) => ({
  id: uid('plan'),
  productId: '',
  name: 'Nuevo plan',
  description: '',
  /* Siempre en la divisa base del sitio (`site.currency.base`). */
  price: 0,
  period: '/mes',
  status: 'available',
  featured: false,
  locationId: '',
  cpuId: '',
  /* Gama (v7): el segundo eje del catálogo. Vacío = el plan no tiene gama. */
  tierId: '',
  specs: [],
  includes: [],
  features: [],
  whmcsUrl: '',
  whmcsPid: '',
  billingCycle: 'monthly',
  hasConfigurableOptions: false,
  configurableOptions: [],
  ...partial,
})

/* ---------------------------------- migración --------------------------------- */

/** Garantiza un slug único y válido dentro de una colección. */
function ensureSlug(desired, taken, fallback) {
  let base = slugify(desired) || slugify(fallback) || 'item'
  let slug = base
  let n = 2
  while (taken.has(slug)) slug = `${base}-${n++}`
  taken.add(slug)
  return slug
}

/**
 * Catálogo v1 → v2.
 *
 * v1 tenía dos niveles: `categories` (Minecraft, VPS…) + `productList` (planes).
 * v2 mete un nivel por encima: `groups` (Servidores VPS / de Juegos / Hosting Web).
 * Cada categoría antigua se convierte en un producto y se reparte por grupo según
 * su `kind`; sus planes conservan todo (precios, specs, WHMCS y opciones).
 */
function migrateCatalog(stored, base) {
  const hasV2 =
    Array.isArray(stored.groups) && Array.isArray(stored.products) && Array.isArray(stored.plans)
  const hasV1 = Array.isArray(stored.categories) || Array.isArray(stored.productList)

  // Documento sin catálogo de ningún esquema (JSON parcial importado a mano): semilla.
  if (!hasV2 && !hasV1) {
    return { groups: base.groups, products: base.products, plans: base.plans }
  }

  const groups = hasV2 && stored.groups.length ? stored.groups : base.groups
  const groupSlugs = new Set()
  const normalizedGroups = groups.map((group) => ({
    id: group.id || uid('grp'),
    name: group.name || 'Subcategoría',
    icon: group.icon || 'server',
    /* Imagen que sustituye al icono, si la hay. Ver `Glyph` en ui/icons.jsx. */
    image: group.image || '',
    tagline: group.tagline || '',
    description: group.description || '',
    /* Titular propio de la subcategoría (v7). Vacío = se usa el del catálogo. */
    headline: group.headline || '',
    /* Argumentos de venta de la familia, misma forma que los del producto. */
    highlights: Array.isArray(group.highlights) ? group.highlights : [],
    slug: ensureSlug(group.slug || group.name, groupSlugs, group.id),
  }))

  const fallbackGroupId = normalizedGroups[0]?.id || ''
  const groupByKind = (kind) => {
    const bySlug = (slug) => normalizedGroups.find((g) => g.slug === slug)?.id
    if (kind === 'vps') return bySlug('vps') || fallbackGroupId
    if (kind === 'web') return bySlug('hosting-web') || fallbackGroupId
    return bySlug('juegos') || fallbackGroupId
  }

  // Origen de productos y planes: v2 tal cual, o conversión desde v1.
  const rawProducts = hasV2
    ? stored.products
    : (stored.categories || []).map((category) => ({
        id: category.id,
        groupId: groupByKind(category.kind),
        name: category.name,
        icon: category.icon,
        tagline: category.tagline,
      }))

  const rawPlans = hasV2
    ? stored.plans
    : (stored.productList || []).map((item) => ({ ...item, productId: item.categoryId }))

  const productSlugs = new Set()
  const products = rawProducts.map((product) =>
    emptyProduct({
      ...product,
      id: product.id || uid('prod'),
      groupId: normalizedGroups.some((g) => g.id === product.groupId)
        ? product.groupId
        : fallbackGroupId,
      slug: ensureSlug(product.slug || product.name, productSlugs, product.id),
      hidden: Boolean(product.hidden),
      highlights: product.highlights || [],
      features: product.features || [],
    }),
  )

  const validProductIds = new Set(products.map((p) => p.id))
  const plans = rawPlans
    .filter((plan) => validProductIds.has(plan.productId))
    .map((plan) => {
      const next = emptyPlan({
        ...plan,
        id: plan.id || uid('plan'),
        locationId: plan.locationId || '',
        cpuId: plan.cpuId || '',
        tierId: plan.tierId || '',
        specs: plan.specs || [],
        includes: plan.includes || [],
        features: plan.features || [],
        configurableOptions: plan.configurableOptions || [],
      })
      // v5: la divisa dejó de ser del plan y pasó a ser del sitio.
      delete next.currency
      return next
    })

  return { groups: normalizedGroups, products, plans }
}

/**
 * Ids de enlaces del navbar que han venido en alguna versión de la semilla. Si el
 * documento guardado solo contiene enlaces de esta lista, nadie ha tocado el menú y
 * podemos sustituirlo por el de la versión actual. Si hay uno propio, se respeta tal
 * cual: el menú es contenido del usuario.
 */
const SEED_NAV_IDS = new Set([
  'nav_home',
  'nav_products',
  'nav_vps',
  'nav_games',
  'nav_web',
  'nav_features',
  'nav_contact',
  'nav_about',
  'nav_hub',
  'nav_support',
])

/**
 * Página Hub (v6). Sus tres listas son contenido del usuario: si el documento ya
 * trae una, se respeta tal cual —incluso vacía, que es una decisión— y sólo se
 * siembra la que nunca ha existido.
 */
function migrateHub(stored, base) {
  const hub = { ...base.hub, ...stored.hub }
  for (const key of ['nodes', 'team', 'changes']) {
    hub[key] = Array.isArray(stored.hub?.[key]) ? stored.hub[key] : base.hub[key]
  }
  return hub
}

function migrateNav(stored, base) {
  const nav = { ...base.nav, ...stored.nav }
  const links = nav.links || []
  const untouched = links.length > 0 && links.every((link) => SEED_NAV_IDS.has(link.id))
  return { ...nav, links: untouched ? base.nav.links : links }
}

/* --------------------------------- divisas ---------------------------------- */

const normalizeCurrency = (item = {}) => ({
  id: item.id || uid('cur'),
  code: String(item.code || 'USD').toUpperCase().slice(0, 3),
  label: item.label || item.code || 'Divisa',
  rate: Number(item.rate) > 0 ? Number(item.rate) : 1,
  locale: item.locale || 'es-ES',
  whmcsId: item.whmcsId || '',
})

/** Divisa que llevaban la mayoría de los planes en documentos v4 y anteriores. */
function legacyPlanCurrency(plans) {
  const tally = {}
  for (const plan of plans || []) {
    if (plan?.currency) tally[plan.currency] = (tally[plan.currency] || 0) + 1
  }
  return Object.entries(tally).sort((a, b) => b[1] - a[1])[0]?.[0] || ''
}

/**
 * Config de divisas (v5). Los precios pasan a estar escritos en una única divisa
 * base: si el documento venía del esquema antiguo, esa base es la que usaban sus
 * planes, para que ningún precio cambie de significado al migrar.
 */
function migrateCurrency(stored, base) {
  const source = stored.currency
  const items = (Array.isArray(source?.items) && source.items.length
    ? source.items
    : base.currency.items
  ).map(normalizeCurrency)

  const baseCode = source?.base || legacyPlanCurrency(stored.plans) || base.currency.base
  if (!items.some((item) => item.code === baseCode)) {
    items.unshift(normalizeCurrency({ ...DEFAULT_CURRENCY, id: uid('cur'), code: baseCode, label: baseCode }))
  }
  // La base es la unidad en la que están escritos los precios: su cambio es 1.
  items.forEach((item) => {
    if (item.code === baseCode) item.rate = 1
  })

  const preferred = source?.default || base.currency.default
  return {
    base: baseCode,
    default: items.some((item) => item.code === preferred) ? preferred : baseCode,
    items,
  }
}

/**
 * Gama del catálogo (v7): el segundo eje, junto a la subcategoría.
 *
 * Misma forma que una CPU a propósito — son la misma clase de cosa: una dimensión
 * transversal que un plan referencia por id en lugar de repetir. Ver el comentario
 * largo en src/data/defaultState.js.
 */
const normalizeTier = (tier = {}) => ({
  id: tier.id || uid('tier'),
  name: tier.name || 'Gama',
  tagline: tier.tagline || '',
  description: tier.description || '',
  icon: tier.icon || 'layers',
  badge: tier.badge || '',
})

/** CPU del catálogo (v4): la mitad "hardware" de un grupo de productos de WHMCS. */
const normalizeCpu = (cpu = {}) => ({
  id: cpu.id || uid('cpu'),
  name: cpu.name || 'CPU',
  tagline: cpu.tagline || '',
  description: cpu.description || '',
  icon: cpu.icon || 'cpu',
  badge: cpu.badge || '',
})

/** Rellena campos nuevos que no existían en documentos guardados previamente. */
function migrate(stored) {
  const base = createDefaultState()
  if (!stored) return base

  const catalog = migrateCatalog(stored, base)
  const site = {
    ...base,
    ...stored,
    schemaVersion: SCHEMA_VERSION,
    theme: { ...base.theme, ...stored.theme },
    currency: migrateCurrency(stored, base),
    cpus: Array.isArray(stored.cpus) ? stored.cpus.map(normalizeCpu) : base.cpus,
    tiers: Array.isArray(stored.tiers) ? stored.tiers.map(normalizeTier) : base.tiers,
    brand: { ...base.brand, ...stored.brand },
    nav: migrateNav(stored, base),
    hero: { ...base.hero, ...stored.hero },
    showcase: { ...base.showcase, ...stored.showcase },
    features: { ...base.features, ...stored.features },
    locations: { ...base.locations, ...stored.locations },
    payments: {
      ...base.payments,
      ...stored.payments,
      /* Una lista vacía es una decisión (esconder la sección): sólo se siembra si no existía. */
      items: Array.isArray(stored.payments?.items) ? stored.payments.items : base.payments.items,
    },
    contact: { ...base.contact, ...stored.contact },
    about: { ...base.about, ...stored.about },
    hub: migrateHub(stored, base),
    support: {
      ...base.support,
      ...stored.support,
      notes: Array.isArray(stored.support?.notes) ? stored.support.notes : base.support.notes,
    },
    catalog: {
      ...base.catalog,
      ...stored.catalog,
      sections: { ...base.catalog.sections, ...stored.catalog?.sections },
    },
    footer: { ...base.footer, ...stored.footer },
    promo: { ...base.promo, ...stored.promo },
    whmcs: { ...base.whmcs, ...stored.whmcs },
    admin: { ...base.admin, ...stored.admin },
    ...catalog,
  }

  // Claves del esquema v1 que ya no se usan.
  delete site.categories
  delete site.productList

  // La portada ya no tiene sección «cómo funciona»: fuera sus textos y cualquier
  // enlace que apuntase a su ancla, que se habría quedado muerto.
  delete site.steps

  // El recorrido ya no son pasos separados, sino bloques de una misma página.
  delete site.catalog.stepLabels
  site.hero = { ...site.hero, secondaryCta: fixLegacyAnchor(site.hero.secondaryCta, base) }
  site.nav = { ...site.nav, links: site.nav.links.filter((link) => link.href !== STEPS_ANCHOR) }

  return site
}

/**
 * `migrate` a prueba de contenido corrupto.
 *
 * `migrate` da por hecho que lo que recibe tiene la forma de un documento del
 * sitio, y con razón: normalmente lo escribió esta misma app. Pero el contenido
 * del servidor es un archivo de texto en un disco —se respalda, se restaura y a
 * veces se toca a mano—, así que puede llegar con la forma cambiada. Sin esta
 * red, un `nav.links` que sea una cadena en vez de una lista deja la web entera
 * colgada del «CARGANDO…» para todos los visitantes.
 *
 * Devuelve el documento o `null`, y deja dicho por qué falló para poder avisar.
 */
function safeMigrate(source, origen) {
  if (!source) return { site: null, error: '' }
  try {
    return { site: migrate(source), error: '' }
  } catch (err) {
    const error = `El contenido ${origen} no se pudo leer (${err.message}).`
    console.error(`[hexservers] ${error}`)
    return { site: null, error }
  }
}

const STEPS_ANCHOR = '#como-funciona'

/** Botón del hero que apuntaba a la sección eliminada → el de la semilla actual. */
const fixLegacyAnchor = (cta, base) =>
  cta?.href === STEPS_ANCHOR ? { ...base.hero.secondaryCta } : cta

/* ----------------------------------- store ----------------------------------- */

export const useSite = create((set, get) => ({
  site: createDefaultState(),
  ready: false,

  /* Divisa elegida por el visitante. Vacío = la que traiga el sitio por defecto. */
  currencyCode: safeRead(CURRENCY_KEY),

  /* Apariencia elegida por el visitante: { preset, style, pixel, background }. */
  viewerTheme: safeReadJson(VIEWER_THEME_KEY),

  /* Forma de listar el catálogo elegida por el visitante. Vacío = la del sitio. */
  viewerLayout: safeRead(VIEWER_LAYOUT_KEY),

  /* Ciclo de facturación con el que mira los precios. Vacío = mensual. */
  viewerCycle: safeRead(VIEWER_CYCLE_KEY),

  // sesión admin
  isAdmin: false,
  editMode: false,
  panelOpen: false,
  loginOpen: false,
  authError: '',

  /* ¿Hay servidor detrás? Lo resuelve `init()`. Cambia dónde vive el contenido
     y quién valida la contraseña, así que media app pregunta por esto. */
  serverMode: false,

  /* Estado del último guardado en el servidor: idle | saving | saved | error. */
  sync: { state: 'idle', error: '', at: null },

  /* Por qué no se pudo usar el contenido guardado, si es que pasó. Vacío = todo
     bien. Se enseña sólo al admin: el visitante ya está viendo algo coherente. */
  contentError: '',

  /* ------------------------------- ciclo de vida ------------------------------ */

  /**
   * Arranque. De dónde sale el contenido, en orden de autoridad:
   *
   *   1. El servidor, si lo hay. Es lo que ve todo el mundo, así que manda.
   *   2. El navegador (IndexedDB). Sin servidor, es lo único que hay; con
   *      servidor, queda como copia local de quien editó.
   *   3. El contenido semilla, la primera vez.
   *
   * El servidor gana a propósito: si mandara la copia local, quien editó vería
   * una web distinta de la de sus visitantes y volveríamos al problema original.
   */
  async init() {
    let contentError = ''
    let remote = { available: false, site: null }
    let site = null

    /**
     * Todo el arranque va dentro de un `try`, y el `finally` garantiza que
     * `ready` acabe en `true` pase lo que pase. La regla es que **la web siempre
     * se pinta**: es preferible enseñar el contenido semilla que dejar a los
     * visitantes mirando un «CARGANDO…» eterno porque un archivo venía torcido.
     */
    try {
      const [stored, fetched] = await Promise.all([readDoc(DOC_KEY), fetchRemoteContent()])
      remote = fetched

      // Cada origen se intenta por separado, para poder caer al siguiente.
      const fromRemote = safeMigrate(remote.site, 'del servidor')
      const fromLocal = fromRemote.site ? { site: null, error: '' } : safeMigrate(stored, 'guardado en este navegador')

      contentError = fromRemote.error || fromLocal.error
      site = fromRemote.site || fromLocal.site

      /* Ni servidor ni copia local utilizables: la semilla. Con el aviso puesto,
         que es lo que separa «esto acaba de instalarse» de «algo se rompió». */
      if (!site) site = createDefaultState()

      /**
       * Primer arranque: genera el hash de la contraseña por defecto.
       *
       * Sólo sin servidor. Con servidor la contraseña la valida él, y el
       * contenido que sirve trae el hash vacío a propósito — sin esta condición,
       * cada visitante derivaría un PBKDF2 de 120.000 iteraciones en cada carga
       * para nada.
       */
      if (!remote.available && !site.admin.passwordHash) {
        const salt = randomSalt()
        site = {
          ...site,
          admin: {
            ...site.admin,
            salt,
            passwordHash: await hashPassword(site.admin.defaultPassword || 'hexadmin', salt),
          },
        }
        await writeDoc(DOC_KEY, site)
      }
    } catch (err) {
      console.error('[hexservers] fallo al arrancar:', err)
      contentError = contentError || `No se pudo preparar el contenido (${err.message}).`
      site = site || createDefaultState()
    } finally {
      /* Con servidor, la sesión válida es la que él reconoce (el token). La marca
         local por sí sola no basta: reiniciar el servidor cierra las sesiones. */
      const localSession = safeSession()
      const isAdmin = remote.available ? localSession && Boolean(readToken()) : localSession

      set({
        site: site || createDefaultState(),
        ready: true,
        isAdmin,
        editMode: isAdmin,
        serverMode: remote.available,
        contentError,
        sync: { state: 'idle', error: '', at: null },
      })
    }
  },

  /** Mutación inmutable + guardado diferido. Único punto de escritura del store. */
  update(recipe) {
    set((state) => {
      const draft = clone(state.site)
      recipe(draft)
      scheduleSave(draft)
      return { site: draft }
    })
  },

  /* ---------------------------------- sesión --------------------------------- */

  openLogin: () => set({ loginOpen: true, authError: '' }),
  closeLogin: () => set({ loginOpen: false, authError: '' }),

  /**
   * Entrar en modo edición.
   *
   * Con servidor, quien decide es él: la contraseña se comprueba contra
   * `HEX_ADMIN_PASSWORD` y devuelve un token, que es lo único que permite
   * guardar. Sin servidor, se cae al hash local de siempre — que sólo protege el
   * modo edición en este navegador y no es seguridad real.
   */
  async login(username, password) {
    if (get().serverMode) {
      try {
        await loginRemote(password)
      } catch (err) {
        set({ authError: err.message })
        return false
      }
      sessionStorage.setItem(SESSION_KEY, '1')
      set({ isAdmin: true, editMode: true, loginOpen: false, authError: '', panelOpen: true })
      return true
    }

    const { admin } = get().site
    const ok =
      username.trim().toLowerCase() === String(admin.username).toLowerCase() &&
      (await verifyPassword(password, admin.salt, admin.passwordHash))

    if (!ok) {
      set({ authError: 'Usuario o contraseña incorrectos.' })
      return false
    }
    sessionStorage.setItem(SESSION_KEY, '1')
    set({ isAdmin: true, editMode: true, loginOpen: false, authError: '', panelOpen: true })
    return true
  },

  logout() {
    sessionStorage.removeItem(SESSION_KEY)
    logoutRemote(readToken())
    set({ isAdmin: false, editMode: false, panelOpen: false, sync: { state: 'idle', error: '', at: null } })
  },

  async changeCredentials(username, newPassword) {
    const salt = randomSalt()
    const passwordHash = await hashPassword(newPassword, salt)
    get().update((d) => {
      d.admin.username = username.trim() || d.admin.username
      d.admin.salt = salt
      d.admin.passwordHash = passwordHash
      d.admin.defaultPassword = ''
    })
    return true
  },

  toggleEditMode: () => set((s) => ({ editMode: s.isAdmin && !s.editMode })),
  setPanelOpen: (panelOpen) => set({ panelOpen }),

  /* ---------------------------------- divisa --------------------------------- */

  setCurrency(code) {
    try {
      localStorage.setItem(CURRENCY_KEY, code)
    } catch {
      /* Sin localStorage la elección dura lo que la pestaña. */
    }
    set({ currencyCode: code })
  },

  /* -------------------------- apariencia del visitante ----------------------- */

  /**
   * Preferencia de apariencia de quien está mirando la web. No toca el documento
   * del sitio: es de este dispositivo y se puede deshacer con `resetViewerTheme`.
   */
  setViewerTheme(patch) {
    const viewerTheme = { ...get().viewerTheme, ...patch }
    safeWriteJson(VIEWER_THEME_KEY, viewerTheme)
    set({ viewerTheme })
  },

  resetViewerTheme() {
    safeWriteJson(VIEWER_THEME_KEY, null)
    set({ viewerTheme: {} })
  },

  /**
   * Forma de listar el catálogo elegida por quien mira la web. Como la divisa: es
   * de su dispositivo y no toca el documento. Con '' vuelve a mandar el sitio.
   */
  setViewerLayout(id) {
    try {
      if (id) localStorage.setItem(VIEWER_LAYOUT_KEY, id)
      else localStorage.removeItem(VIEWER_LAYOUT_KEY)
    } catch {
      /* Sin localStorage la elección dura lo que la pestaña. */
    }
    set({ viewerLayout: id })
  },

  /** Ciclo de facturación con el que el visitante mira los precios. */
  setViewerCycle(id) {
    try {
      if (id && id !== DEFAULT_CYCLE) localStorage.setItem(VIEWER_CYCLE_KEY, id)
      else localStorage.removeItem(VIEWER_CYCLE_KEY)
    } catch {
      /* Sin localStorage la elección dura lo que la pestaña. */
    }
    set({ viewerCycle: id })
  },

  /* --------------------------------- contenido -------------------------------- */

  /** Edición inline: setField('hero.title', 'nuevo texto') */
  setField(path, value) {
    get().update((d) => {
      const keys = path.split('.')
      let node = d
      for (let i = 0; i < keys.length - 1; i++) node = node[keys[i]]
      node[keys.at(-1)] = value
    })
  },

  /* ------------------------- grupos (subcategorías) --------------------------- */

  addGroup(partial = {}) {
    const id = uid('grp')
    get().update((d) => {
      const taken = new Set(d.groups.map((g) => g.slug))
      d.groups.push({
        id,
        name: partial.name || 'Nueva subcategoría',
        slug: ensureSlug(partial.slug || partial.name || 'subcategoria', taken, id),
        icon: partial.icon || 'server',
        image: partial.image || '',
        tagline: partial.tagline || '',
        description: partial.description || '',
      })
    })
    return id
  },

  updateGroup(id, patch) {
    get().update((d) => {
      const group = d.groups.find((g) => g.id === id)
      if (!group) return
      if (patch.slug !== undefined) {
        const taken = new Set(d.groups.filter((g) => g.id !== id).map((g) => g.slug))
        patch = { ...patch, slug: ensureSlug(patch.slug, taken, group.name) }
      }
      Object.assign(group, patch)
    })
  },

  /** Elimina la subcategoría con sus productos y los planes de esos productos. */
  removeGroup(id) {
    get().update((d) => {
      const productIds = d.products.filter((p) => p.groupId === id).map((p) => p.id)
      d.groups = d.groups.filter((g) => g.id !== id)
      d.products = d.products.filter((p) => p.groupId !== id)
      d.plans = d.plans.filter((p) => !productIds.includes(p.productId))
    })
  },

  reorderGroup(id, direction) {
    get().update((d) => {
      const index = d.groups.findIndex((g) => g.id === id)
      if (index === -1) return
      d.groups = moveItem(d.groups, index, index + direction)
    })
  },

  /* ----------------------------- CPUs del catálogo ---------------------------- */

  /** Una CPU + una ubicación = un grupo de productos de WHMCS. */
  addCpu(partial = {}) {
    const id = uid('cpu')
    get().update((d) => {
      d.cpus.push({
        id,
        name: partial.name || 'Nueva CPU',
        tagline: partial.tagline || '',
        description: partial.description || '',
        icon: partial.icon || 'cpu',
        badge: partial.badge || '',
      })
    })
    return id
  },

  updateCpu(id, patch) {
    get().update((d) => {
      const cpu = d.cpus.find((c) => c.id === id)
      if (cpu) Object.assign(cpu, patch)
    })
  },

  /** Los planes que la usaban quedan sin CPU, es decir, válidos para cualquiera. */
  removeCpu(id) {
    get().update((d) => {
      d.cpus = d.cpus.filter((c) => c.id !== id)
      d.plans.forEach((plan) => {
        if (plan.cpuId === id) plan.cpuId = ''
      })
    })
  },

  reorderCpu(id, direction) {
    get().update((d) => {
      const index = d.cpus.findIndex((c) => c.id === id)
      if (index === -1) return
      d.cpus = moveItem(d.cpus, index, index + direction)
    })
  },

  /* ------------------------------- gamas (v7) -------------------------------- */

  addTier(partial = {}) {
    const id = uid('tier')
    get().update((d) => {
      d.tiers.push({
        id,
        name: partial.name || 'Nueva gama',
        tagline: partial.tagline || '',
        description: partial.description || '',
        icon: partial.icon || 'layers',
        badge: partial.badge || '',
      })
    })
    return id
  },

  updateTier(id, patch) {
    get().update((d) => {
      const tier = d.tiers.find((t) => t.id === id)
      if (tier) Object.assign(tier, patch)
    })
  },

  /** Los planes que la usaban quedan sin gama: válidos para cualquiera. */
  removeTier(id) {
    get().update((d) => {
      d.tiers = d.tiers.filter((t) => t.id !== id)
      d.plans.forEach((plan) => {
        if (plan.tierId === id) plan.tierId = ''
      })
    })
  },

  reorderTier(id, direction) {
    get().update((d) => {
      const index = d.tiers.findIndex((t) => t.id === id)
      if (index === -1) return
      d.tiers = moveItem(d.tiers, index, index + direction)
    })
  },

  /* ---------------------- productos (las "box" grandes) ---------------------- */

  addProduct(groupId) {
    const id = uid('prod')
    get().update((d) => {
      const taken = new Set(d.products.map((p) => p.slug))
      const group = d.groups.find((g) => g.id === groupId)
      d.products.push(
        emptyProduct({
          id,
          groupId: groupId || d.groups[0]?.id || '',
          slug: ensureSlug('nuevo-producto', taken, id),
          icon: group?.icon || 'server',
        }),
      )
    })
    return id
  },

  updateProduct(id, patch) {
    get().update((d) => {
      const product = d.products.find((p) => p.id === id)
      if (!product) return
      if (patch.slug !== undefined) {
        const taken = new Set(d.products.filter((p) => p.id !== id).map((p) => p.slug))
        patch = { ...patch, slug: ensureSlug(patch.slug, taken, product.name) }
      }
      Object.assign(product, patch)
    })
  },

  /** Elimina el producto y todos sus planes. */
  removeProduct(id) {
    get().update((d) => {
      d.products = d.products.filter((p) => p.id !== id)
      d.plans = d.plans.filter((p) => p.productId !== id)
    })
  },

  /**
   * Absorbe un producto dentro de otro, marcando sus planes con una gama.
   *
   * Es la operación que deshace haber usado las subcategorías para dos cosas a la
   * vez. Si el catálogo tiene «Minecraft» en Juegos y «Minecraft Económico» en
   * Económicos, el mismo juego está partido en dos sitios y el cliente que entra
   * por uno no llega a ver el otro. Esto los junta: los planes del absorbido pasan
   * al que se queda con la gama puesta, y los que ya estaban reciben la gama que se
   * indique para no quedar sueltos entre medias.
   *
   * El producto absorbido desaparece. Es irreversible desde la interfaz, así que
   * quien la llama debe confirmarlo antes.
   *
   * @param sourceId    producto que se disuelve
   * @param targetId    producto que se queda con todo
   * @param sourceTier  gama que reciben los planes que vienen del absorbido
   * @param targetTier  gama para los que ya tenía el destino ('' = no se tocan)
   */
  mergeProductAsTier(sourceId, targetId, sourceTier, targetTier = '') {
    if (!sourceId || !targetId || sourceId === targetId) return
    get().update((d) => {
      const source = d.products.find((p) => p.id === sourceId)
      const target = d.products.find((p) => p.id === targetId)
      if (!source || !target) return

      for (const plan of d.plans) {
        if (plan.productId === sourceId) {
          plan.productId = targetId
          plan.tierId = sourceTier
        } else if (plan.productId === targetId && targetTier && !plan.tierId) {
          plan.tierId = targetTier
        }
      }
      d.products = d.products.filter((p) => p.id !== sourceId)
    })
  },

  duplicateProduct(id) {
    const newId = uid('prod')
    get().update((d) => {
      const source = d.products.find((p) => p.id === id)
      if (!source) return
      const taken = new Set(d.products.map((p) => p.slug))
      const copy = clone(source)
      copy.id = newId
      copy.name = `${source.name} (copia)`
      copy.slug = ensureSlug(`${source.slug}-copia`, taken, newId)
      copy.featured = false
      d.products.splice(d.products.indexOf(source) + 1, 0, copy)

      // Los planes también se duplican para que la copia sea usable de inmediato.
      const clonedPlans = d.plans
        .filter((plan) => plan.productId === id)
        .map((plan) => ({ ...clone(plan), id: uid('plan'), productId: newId }))
      d.plans.push(...clonedPlans)
    })
    return newId
  },

  /** Mueve el producto dentro de su subcategoría. */
  reorderProduct(id, direction) {
    get().update((d) => {
      const index = d.products.findIndex((p) => p.id === id)
      if (index === -1) return
      const product = d.products[index]
      const siblings = d.products.filter((p) => p.groupId === product.groupId)
      const target = siblings[siblings.indexOf(product) + direction]
      if (!target) return
      d.products = moveItem(d.products, index, d.products.indexOf(target))
    })
  },

  /** Listas internas del producto: `highlights` (ficha) y `features` (detalle). */
  addProductItem(productId, key, item = {}) {
    get().update((d) => {
      const product = d.products.find((p) => p.id === productId)
      if (product) product[key] = [...(product[key] || []), { id: uid('it'), ...item }]
    })
  },

  updateProductItem(productId, key, itemId, patch) {
    get().update((d) => {
      const item = d.products.find((p) => p.id === productId)?.[key]?.find((i) => i.id === itemId)
      if (item) Object.assign(item, patch)
    })
  },

  removeProductItem(productId, key, itemId) {
    get().update((d) => {
      const product = d.products.find((p) => p.id === productId)
      if (product) product[key] = (product[key] || []).filter((i) => i.id !== itemId)
    })
  },

  moveProductItem(productId, key, itemId, direction) {
    get().update((d) => {
      const product = d.products.find((p) => p.id === productId)
      if (!product) return
      const list = product[key] || []
      const index = list.findIndex((i) => i.id === itemId)
      if (index === -1) return
      product[key] = moveItem(list, index, index + direction)
    })
  },

  /**
   * Argumentos de una subcategoría (`group.highlights`), para su página propia.
   *
   * Duplican la forma de las cuatro de arriba, pero contra `groups` en vez de
   * `products`. Generalizar las ocho en un juego de funciones por colección sería
   * bonito y ganaría cuatro líneas: se deja explícito porque un `setIn(colección,
   * id, clave, …)` genérico se lee bastante peor en el sitio donde se llama.
   */
  addGroupItem(groupId, item = {}) {
    get().update((d) => {
      const group = d.groups.find((g) => g.id === groupId)
      if (group) group.highlights = [...(group.highlights || []), { id: uid('it'), ...item }]
    })
  },

  updateGroupItem(groupId, itemId, patch) {
    get().update((d) => {
      const item = d.groups.find((g) => g.id === groupId)?.highlights?.find((i) => i.id === itemId)
      if (item) Object.assign(item, patch)
    })
  },

  removeGroupItem(groupId, itemId) {
    get().update((d) => {
      const group = d.groups.find((g) => g.id === groupId)
      if (group) group.highlights = (group.highlights || []).filter((i) => i.id !== itemId)
    })
  },

  moveGroupItem(groupId, itemId, direction) {
    get().update((d) => {
      const group = d.groups.find((g) => g.id === groupId)
      if (!group) return
      const list = group.highlights || []
      const index = list.findIndex((i) => i.id === itemId)
      if (index === -1) return
      group.highlights = moveItem(list, index, index + direction)
    })
  },

  /* --------------------------------- planes ---------------------------------- */

  addPlan(productId) {
    const id = uid('plan')
    get().update((d) => {
      d.plans.push(
        emptyPlan({
          id,
          productId,
          specs: [{ id: uid('spec'), label: 'RAM', value: '' }],
          includes: [{ id: uid('inc'), text: 'Anti-DDoS incluido' }],
        }),
      )
    })
    return id
  },

  updatePlan(id, patch) {
    get().update((d) => {
      const plan = d.plans.find((p) => p.id === id)
      if (plan) Object.assign(plan, patch)
    })
  },

  removePlan(id) {
    get().update((d) => {
      d.plans = d.plans.filter((p) => p.id !== id)
    })
  },

  duplicatePlan(id) {
    get().update((d) => {
      const source = d.plans.find((p) => p.id === id)
      if (!source) return
      const copy = clone(source)
      copy.id = uid('plan')
      copy.name = `${source.name} (copia)`
      copy.featured = false
      d.plans.splice(d.plans.indexOf(source) + 1, 0, copy)
    })
  },

  /** Mueve el plan dentro de su producto. */
  reorderPlan(id, direction) {
    get().update((d) => {
      const index = d.plans.findIndex((p) => p.id === id)
      if (index === -1) return
      const plan = d.plans[index]
      const siblings = d.plans.filter((p) => p.productId === plan.productId)
      const target = siblings[siblings.indexOf(plan) + direction]
      if (!target) return
      d.plans = moveItem(d.plans, index, d.plans.indexOf(target))
    })
  },

  /** Listas internas del plan: `specs`, `includes` y `features`. */
  addPlanItem(planId, key, item = {}) {
    get().update((d) => {
      const plan = d.plans.find((p) => p.id === planId)
      if (plan) plan[key] = [...(plan[key] || []), { id: uid('it'), ...item }]
    })
  },

  updatePlanItem(planId, key, itemId, patch) {
    get().update((d) => {
      const item = d.plans.find((p) => p.id === planId)?.[key]?.find((i) => i.id === itemId)
      if (item) Object.assign(item, patch)
    })
  },

  removePlanItem(planId, key, itemId) {
    get().update((d) => {
      const plan = d.plans.find((p) => p.id === planId)
      if (plan) plan[key] = (plan[key] || []).filter((i) => i.id !== itemId)
    })
  },

  movePlanItem(planId, key, itemId, direction) {
    get().update((d) => {
      const plan = d.plans.find((p) => p.id === planId)
      if (!plan) return
      const list = plan[key] || []
      const index = list.findIndex((i) => i.id === itemId)
      if (index === -1) return
      plan[key] = moveItem(list, index, index + direction)
    })
  },

  /* ------------------- opciones configurables de un plan --------------------- */

  addOption(planId) {
    get().update((d) => {
      const plan = d.plans.find((p) => p.id === planId)
      if (!plan) return
      plan.configurableOptions.push({
        id: uid('opt'),
        name: 'Nueva opción',
        whmcsOptionId: '',
        values: [{ id: uid('val'), label: 'Base', priceDelta: 0, whmcsValueId: '', default: true }],
      })
    })
  },

  updateOption(planId, optionId, patch) {
    get().update((d) => {
      const option = d.plans
        .find((p) => p.id === planId)
        ?.configurableOptions.find((o) => o.id === optionId)
      if (option) Object.assign(option, patch)
    })
  },

  removeOption(planId, optionId) {
    get().update((d) => {
      const plan = d.plans.find((p) => p.id === planId)
      if (plan)
        plan.configurableOptions = plan.configurableOptions.filter((o) => o.id !== optionId)
    })
  },

  addOptionValue(planId, optionId) {
    get().update((d) => {
      const option = d.plans
        .find((p) => p.id === planId)
        ?.configurableOptions.find((o) => o.id === optionId)
      if (option)
        option.values.push({ id: uid('val'), label: 'Nuevo valor', priceDelta: 0, whmcsValueId: '' })
    })
  },

  updateOptionValue(planId, optionId, valueId, patch) {
    get().update((d) => {
      const option = d.plans
        .find((p) => p.id === planId)
        ?.configurableOptions.find((o) => o.id === optionId)
      const value = option?.values.find((v) => v.id === valueId)
      if (!value) return
      Object.assign(value, patch)
      // `default` es exclusivo dentro de la opción.
      if (patch.default) option.values.forEach((v) => (v.default = v.id === valueId))
    })
  },

  removeOptionValue(planId, optionId, valueId) {
    get().update((d) => {
      const option = d.plans
        .find((p) => p.id === planId)
        ?.configurableOptions.find((o) => o.id === optionId)
      if (option) option.values = option.values.filter((v) => v.id !== valueId)
    })
  },

  /* -------------------------- listas genéricas de contenido ------------------- */

  addListItem(path, item) {
    get().update((d) => {
      const keys = path.split('.')
      let node = d
      for (const key of keys) node = node[key]
      node.push({ id: uid('item'), ...item })
    })
  },

  updateListItem(path, id, patch) {
    get().update((d) => {
      const keys = path.split('.')
      let node = d
      for (const key of keys) node = node[key]
      const item = node.find((i) => i.id === id)
      if (item) Object.assign(item, patch)
    })
  },

  removeListItem(path, id) {
    get().update((d) => {
      const keys = path.split('.')
      let parent = d
      for (let i = 0; i < keys.length - 1; i++) parent = parent[keys[i]]
      const key = keys.at(-1)
      parent[key] = parent[key].filter((i) => i.id !== id)
    })
  },

  moveListItem(path, id, direction) {
    get().update((d) => {
      const keys = path.split('.')
      let parent = d
      for (let i = 0; i < keys.length - 1; i++) parent = parent[keys[i]]
      const key = keys.at(-1)
      const list = parent[key]
      const index = list.findIndex((i) => i.id === id)
      if (index === -1) return
      parent[key] = moveItem(list, index, index + direction)
    })
  },

  /* ------------------------------ import / export ----------------------------- */

  exportJson() {
    const site = clone(get().site)
    // Nunca exportamos credenciales.
    site.admin = { username: site.admin.username, salt: '', passwordHash: '', defaultPassword: '' }
    site.whmcs = { ...site.whmcs, secret: '', identifier: '' }
    return JSON.stringify(site, null, 2)
  },

  async importJson(json) {
    const parsed = JSON.parse(json)
    const current = get().site
    const site = migrate({
      ...parsed,
      admin: current.admin,
      whmcs: { ...parsed.whmcs, ...pickSecrets(current.whmcs) },
    })
    await writeDoc(DOC_KEY, site)
    set({ site })
  },

  async resetToDefaults() {
    await deleteDoc(DOC_KEY)
    const site = createDefaultState()
    const salt = randomSalt()
    site.admin.salt = salt
    site.admin.passwordHash = await hashPassword(site.admin.defaultPassword, salt)
    await writeDoc(DOC_KEY, site)
    set({ site })
  },
}))

/* El guardado diferido vive fuera del store (no sabe nada de React); así puede
   contar cómo le fue con el servidor y la barra de admin lo pinta. */
setSyncListener((sync) => useSite.setState((state) => ({ sync: { ...state.sync, ...sync } })))

const pickSecrets = (whmcs) => ({ identifier: whmcs.identifier, secret: whmcs.secret })

/** sessionStorage también puede estar bloqueado, y esto corre en un `finally`. */
function safeSession() {
  try {
    return sessionStorage.getItem(SESSION_KEY) === '1'
  } catch {
    return false
  }
}

/** localStorage puede estar bloqueado (modo privado antiguo, políticas estrictas). */
function safeRead(key) {
  try {
    return localStorage.getItem(key) || ''
  } catch {
    return ''
  }
}

function safeReadJson(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || {}
  } catch {
    return {}
  }
}

function safeWriteJson(key, value) {
  try {
    if (value) localStorage.setItem(key, JSON.stringify(value))
    else localStorage.removeItem(key)
  } catch {
    /* Sin localStorage la preferencia dura lo que la pestaña. */
  }
}

/* -------------------------------- apariencia -------------------------------- */

/** Tema realmente aplicado: el del sitio con las preferencias del visitante encima. */
export function useEffectiveTheme() {
  const theme = useSite((s) => s.site.theme)
  const viewer = useSite((s) => s.viewerTheme)
  return useMemo(() => mergeTheme(theme, viewer), [theme, viewer])
}

/* --------------------------------- catálogo --------------------------------- */

/**
 * Forma en la que se está listando el catálogo ahora mismo.
 *
 * Manda el sitio, y encima se superpone lo que haya elegido el visitante — salvo
 * que el admin le haya quitado esa libertad con `catalog.allowViewerLayout`, que es
 * el mismo trato que tiene la paleta con `theme.allowViewer`.
 */
export function useCatalogLayout() {
  const layout = useSite((s) => s.site.catalog.layout)
  const allowViewer = useSite((s) => s.site.catalog.allowViewerLayout !== false)
  const viewer = useSite((s) => s.viewerLayout)
  return resolveLayout(allowViewer && viewer ? viewer : layout)
}

/* ---------------------------------- divisas --------------------------------- */

/** Divisa que se está mostrando ahora mismo. */
export function useCurrency() {
  const config = useSite((s) => s.site.currency)
  const code = useSite((s) => s.currencyCode)
  return useMemo(() => resolveCurrency(config, code), [config, code])
}

/**
 * Formateador de precios para la parte pública: recibe el importe en la divisa
 * base del catálogo y lo devuelve convertido y formateado.
 */
export function useMoney() {
  const currency = useCurrency()
  return useMemo(() => (amount) => formatMoney(amount, currency), [currency])
}

/* ---------------------------- ciclo de facturación --------------------------- */

/**
 * Ciclo con el que se están mirando los precios ahora mismo.
 *
 * Mientras el admin no encienda `catalog.showCycles` no hay selector que valga y
 * todo el mundo ve la tarifa mensual: los descuentos por ciclo son un compromiso
 * comercial, y anunciarlos sin que nadie los haya configurado sería prometer un
 * precio que el carrito no va a respetar.
 */
export function useBillingCycle() {
  const enabled = useSite((s) => s.site.catalog.showCycles === true)
  const discounts = useSite((s) => s.site.catalog.cycleDiscounts)
  const viewer = useSite((s) => s.viewerCycle)
  return useMemo(
    () => resolveCycle(enabled ? viewer : DEFAULT_CYCLE, discounts),
    [enabled, viewer, discounts],
  )
}

/**
 * Formateador de precios del catálogo: como `useMoney`, pero aplicando antes el
 * descuento del ciclo activo.
 *
 * Es una función aparte y no un cambio dentro de `useMoney` porque no todo importe
 * es una cuota: los recargos de las opciones configurables y los totales ya
 * calculados se formatean con `useMoney` a secas.
 */
export function useCatalogMoney() {
  const money = useMoney()
  const cycle = useBillingCycle()
  return useMemo(() => (amount) => money(monthlyPrice(amount, cycle)), [money, cycle])
}

/* -------------------------------- selectores -------------------------------- */

// Nota: se filtra a partir de `site` en los componentes (con useMemo) en lugar de
// devolver arrays nuevos desde un selector, que provocaría renders infinitos.

export const productsOfGroup = (site, groupId) =>
  site.products.filter((p) => p.groupId === groupId)

/**
 * Lo que se lista en la web. Los productos marcados como ocultos desaparecen del
 * catálogo y de la portada, pero su página sigue accesible por enlace directo; en
 * modo edición se muestran igualmente para poder gestionarlos.
 */
export const listedProducts = (site, groupId = '', includeHidden = false) => {
  const list = groupId ? productsOfGroup(site, groupId) : site.products
  return includeHidden ? list : list.filter((p) => !p.hidden)
}

export const plansOfProduct = (site, productId) =>
  site.plans.filter((p) => p.productId === productId)

export const findGroupBySlug = (site, slug) =>
  site.groups.find((g) => g.slug === slug) || null

export const findProductBySlug = (site, slug) =>
  site.products.find((p) => p.slug === slug) || null

export const groupOfProduct = (site, product) =>
  site.groups.find((g) => g.id === product?.groupId) || null

/**
 * Funciones a mostrar en el detalle de un plan: las suyas si las tiene, y si no
 * las del producto (así se define una vez y valen para todos sus planes).
 */
export const featuresOfPlan = (product, plan) =>
  plan?.features?.length ? plan.features : product?.features || []
