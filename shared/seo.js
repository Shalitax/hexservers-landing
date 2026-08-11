/**
 * Meta de cada página: título, descripción, tarjeta de enlace y datos estructurados.
 *
 * Igual que `routes.js`, vive fuera de `src/` porque lo usan los dos lados. Pero
 * el que importa de verdad es el servidor: los rastreadores de Google, Discord,
 * WhatsApp y X **no ejecutan JavaScript**. Leen el HTML tal como sale del
 * servidor. Cualquier meta que ponga el navegador después de cargar no la ve
 * ninguno de ellos, así que esto tiene que resolverse antes de enviar la página.
 *
 * El navegador lo usa igualmente para el título de la pestaña al navegar entre
 * páginas sin recargar, que ahí sí manda él.
 *
 * Sin `window`, sin React y sin dependencias.
 */

/* --------------------------------- valores --------------------------------- */

export const DEFAULT_SEO = {
  /* Dominio público, con esquema y sin barra final: 'https://hexservers.com'.
     Es obligatorio para el canonical, la tarjeta de enlace y el sitemap, porque
     todos necesitan URL absolutas. Si está vacío, el servidor usa la cabecera
     Host de la propia petición, que funciona pero no sobrevive a un proxy mal
     configurado. */
  siteUrl: '',
  /* `%s` es el título de la página. El de la portada no pasa por aquí. */
  titleTemplate: '%s · HexServers',
  homeTitle: 'HexServers — VPS y servidores de juegos con anti-DDoS',
  description:
    'Servidores de juegos y VPS con NVMe, anti-DDoS y despliegue en menos de un minuto. Soporte en español y panel propio.',
  /* Cuenta de X para la atribución de la tarjeta, con arroba. Opcional. */
  twitterSite: '',
  locale: 'es_CL',
  /* Lo que se le permite a los buscadores en todo el sitio. Para tapar la web
     entera mientras se prepara: 'noindex,nofollow'. */
  robots: 'index,follow',
  /* Contenido de la meta de verificación de Google Search Console. */
  googleVerification: '',
  /* Título y descripción propios de las páginas fijas. Vacío = se calculan. */
  pages: {
    home: { title: '', description: '' },
    products: { title: '', description: '' },
    hub: { title: '', description: '' },
    about: { title: '', description: '' },
    support: { title: '', description: '' },
  },
  analytics: {
    /* 'none' | 'plausible' | 'umami' */
    provider: 'none',
    /* URL completa del script de tu instalación:
         https://analitica.tudominio.com/js/script.js       (Plausible)
         https://analitica.tudominio.com/script.js          (Umami) */
    scriptUrl: '',
    /* Plausible: el dominio dado de alta. Umami: el website id. */
    siteId: '',
  },
}

/** Rutas donde el servidor publica las imágenes que se suben desde el panel. */
export const BRAND_ASSETS = {
  favicon: '/brand/favicon',
  appleIcon: '/brand/apple-touch-icon',
  ogImage: '/brand/card',
  logo: '/brand/logo',
}

/* --------------------------------- utilidades ------------------------------- */

/** Recorta por palabras: una descripción cortada a mitad de palabra se nota. */
export function clamp(text, max = 160) {
  const clean = String(text || '')
    .replace(/\s+/g, ' ')
    .trim()
  if (clean.length <= max) return clean
  const cut = clean.slice(0, max - 1)
  const lastSpace = cut.lastIndexOf(' ')
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[,;:.\s]+$/, '')}…`
}

export const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

/** Une origen y ruta sin barras dobles ni barras que falten. */
export const absolute = (origin, path) =>
  `${String(origin || '').replace(/\/+$/, '')}${String(path || '/').startsWith('/') ? '' : '/'}${path || '/'}`

const find = (list, key, value) => (Array.isArray(list) ? list.find((x) => x?.[key] === value) : null) || null

/**
 * URL pública de una imagen de marca.
 *
 * El panel deja poner las dos cosas: subir un archivo —que se guarda como data
 * URL dentro del contenido— o pegar la dirección de una imagen que ya esté
 * alojada en otro sitio. La primera hay que republicarla en `/brand/…` porque
 * ningún rastreador acepta un data URL; la segunda ya es una URL de verdad y
 * pasarla por el servidor sería un rodeo que además la rompería.
 */
export function assetUrl(value, path, origin = '') {
  const raw = String(value || '').trim()
  if (!raw) return ''
  if (/^https?:\/\//i.test(raw)) return raw
  if (raw.startsWith('data:')) return origin ? absolute(origin, path) : path
  /* Una ruta del propio sitio ('/logo.png' en public/) se respeta tal cual. */
  if (raw.startsWith('/')) return origin ? absolute(origin, raw) : raw
  return ''
}

/**
 * Imagen del contenido (la de un producto o una familia) para la tarjeta.
 *
 * A diferencia de las de marca, éstas **no** se republican: son decenas y casi
 * todas son data URL de un icono pequeño, que no sirve como tarjeta ni aunque se
 * publicara. Se acepta sólo lo que ya es una URL utilizable, y si no la hay se
 * cae a la imagen de marca.
 */
function contentImage(value, origin = '') {
  const raw = String(value || '').trim()
  if (/^https?:\/\//i.test(raw)) return raw
  if (raw.startsWith('/')) return origin ? absolute(origin, raw) : raw
  return ''
}

/** Precio de entrada de un producto, en la divisa base del sitio. */
function entryPrice(site, product) {
  const plans = (site.plans || []).filter(
    (plan) => plan.productId === product.id && plan.status === 'available',
  )
  if (!plans.length) return null
  const prices = plans.map((plan) => Number(plan.price)).filter((n) => Number.isFinite(n) && n > 0)
  return prices.length ? Math.min(...prices) : null
}

/* -------------------------------- resolución -------------------------------- */

/**
 * Meta de la página que corresponde a una ruta.
 *
 * `origin` es el esquema y dominio ('https://hexservers.com'). Hace falta porque
 * el canonical y la imagen de la tarjeta tienen que ser absolutos: una ruta
 * relativa la ignoran todos los rastreadores.
 */
export function resolveMeta(site, route, origin = '') {
  const seo = { ...DEFAULT_SEO, ...(site.seo || {}) }
  const pages = { ...DEFAULT_SEO.pages, ...(seo.pages || {}) }
  const brandName = site.brand?.name || 'HexServers'

  /* La imagen de la tarjeta de enlace. Sale ya absoluta porque una relativa no
     la sigue ningún rastreador. */
  const cardImage = assetUrl(site.brand?.ogImage, BRAND_ASSETS.ogImage, origin)

  const page = (key, fallbackTitle, fallbackDescription) => ({
    title: pages[key]?.title || fallbackTitle,
    description: clamp(pages[key]?.description || fallbackDescription || seo.description),
  })

  let meta
  switch (route.name) {
    case 'home':
      meta = {
        ...page('home', seo.homeTitle || brandName, seo.description),
        canonicalPath: '/',
        isHome: true,
      }
      break

    case 'about':
      meta = { ...page('about', 'Quiénes somos', site.about?.subtitle), canonicalPath: '/nosotros' }
      break

    case 'hub':
      meta = { ...page('hub', 'Hub', site.hub?.subtitle), canonicalPath: '/hub' }
      break

    case 'support':
      meta = { ...page('support', 'Soporte', site.support?.subtitle), canonicalPath: '/soporte' }
      break

    case 'products': {
      const group = route.groupSlug ? find(site.groups, 'slug', route.groupSlug) : null
      if (route.groupSlug && !group) {
        meta = { title: 'Página no encontrada', description: '', robots: 'noindex,follow', canonicalPath: route.path }
        break
      }
      meta = group
        ? {
            title: group.name,
            description: clamp(group.description || group.tagline || seo.description),
            image: contentImage(group.image, origin),
            canonicalPath: `/productos/${group.slug}`,
          }
        : { ...page('products', 'Productos', site.catalog?.subtitle), canonicalPath: '/productos' }
      break
    }

    case 'product': {
      const product = find(site.products, 'slug', route.productSlug)
      if (!product || product.status === 'archived') {
        meta = { title: 'Producto no encontrado', description: '', robots: 'noindex,follow', canonicalPath: route.path }
        break
      }

      /* El detalle de un plan y el configurador con filtros son la misma página
         con distinto estado: todos apuntan al canonical del producto, para que
         Google no los cuente como páginas duplicadas. */
      const plan = route.stage === 'detail' ? find(site.plans, 'id', route.planId) : null

      meta = {
        title: plan ? `${plan.name} — ${product.name}` : product.name,
        description: clamp(product.description || product.tagline || seo.description),
        image: contentImage(product.image, origin),
        canonicalPath: `/producto/${product.slug}`,
        /* Un producto oculto sigue siendo accesible por enlace directo, pero no
           tiene por qué salir en los buscadores. */
        robots: product.hidden ? 'noindex,follow' : undefined,
        product,
      }
      break
    }

    default:
      meta = {
        title: 'Página no encontrada',
        description: '',
        robots: 'noindex,follow',
        canonicalPath: route.path,
      }
  }

  const title = meta.isHome
    ? meta.title
    : String(seo.titleTemplate || '%s').includes('%s')
      ? seo.titleTemplate.replace('%s', meta.title)
      : `${meta.title} · ${brandName}`

  return {
    title,
    description: meta.description || clamp(seo.description),
    canonical: origin ? absolute(origin, meta.canonicalPath) : '',
    /* La del producto si la tiene y sirve; si no, la de marca. */
    image: meta.image || cardImage,
    robots: meta.robots || seo.robots || 'index,follow',
    locale: seo.locale || 'es_CL',
    twitterSite: seo.twitterSite || '',
    googleVerification: seo.googleVerification || '',
    siteName: brandName,
    type: route.name === 'product' ? 'product' : 'website',
    notFound: route.name === 'notfound' || String(meta.robots || '').startsWith('noindex'),
    product: meta.product || null,
    analytics: { ...DEFAULT_SEO.analytics, ...(seo.analytics || {}) },
  }
}

/* ------------------------------ datos estructurados ------------------------- */

/**
 * JSON-LD de la página.
 *
 * Es lo que convierte un resultado de búsqueda normal en uno con precio, estado
 * de disponibilidad o preguntas desplegables debajo. Se generan los tipos que
 * Google documenta y para los que aquí hay datos de verdad; inventar campos que
 * no se corresponden con lo que se ve en la página es motivo de penalización.
 */
export function buildJsonLd(site, route, origin = '') {
  const brandName = site.brand?.name || 'HexServers'
  const currency = site.currency?.base || 'USD'
  const blocks = []

  if (route.name === 'home') {
    blocks.push({
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: brandName,
      url: origin || undefined,
      description: site.brand?.claim || undefined,
      logo: assetUrl(site.brand?.logo, BRAND_ASSETS.logo, origin) || undefined,
      sameAs: (site.contact?.social || []).map((item) => item.url).filter(Boolean),
    })
  }

  if (route.name === 'products' || route.name === 'product') {
    const trail = [{ name: 'Inicio', path: '/' }, { name: 'Productos', path: '/productos' }]

    if (route.name === 'products' && route.groupSlug) {
      const group = find(site.groups, 'slug', route.groupSlug)
      if (group) trail.push({ name: group.name, path: `/productos/${group.slug}` })
    }

    if (route.name === 'product') {
      const product = find(site.products, 'slug', route.productSlug)
      if (product) {
        const group = find(site.groups, 'id', product.groupId)
        if (group) trail.push({ name: group.name, path: `/productos/${group.slug}` })
        trail.push({ name: product.name, path: `/producto/${product.slug}` })
      }
    }

    blocks.push({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: trail.map((step, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: step.name,
        item: origin ? absolute(origin, step.path) : undefined,
      })),
    })
  }

  if (route.name === 'product') {
    const product = find(site.products, 'slug', route.productSlug)
    const price = product ? entryPrice(site, product) : null

    if (product && price !== null) {
      blocks.push({
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.name,
        description: clamp(product.description || product.tagline, 300) || undefined,
        brand: { '@type': 'Brand', name: brandName },
        offers: {
          '@type': 'AggregateOffer',
          priceCurrency: currency,
          lowPrice: price,
          offerCount: (site.plans || []).filter(
            (plan) => plan.productId === product.id && plan.status === 'available',
          ).length,
          availability:
            product.status === 'available'
              ? 'https://schema.org/InStock'
              : 'https://schema.org/OutOfStock',
          url: origin ? absolute(origin, `/producto/${product.slug}`) : undefined,
        },
      })
    }
  }

  /* Las preguntas frecuentes están al pie del catálogo, así que el FAQPage sólo
     se declara donde se ven de verdad. */
  const faq = site.catalog?.faq || []
  if (route.name === 'products' && faq.length > 0) {
    blocks.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faq
        .filter((item) => item.question && item.answer)
        .map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: { '@type': 'Answer', text: item.answer },
        })),
    })
  }

  return blocks.filter((block) => block['@type'] !== 'FAQPage' || block.mainEntity.length > 0)
}

/* ------------------------------ cabecera HTML ------------------------------ */

const tag = (name, content, attr = 'name') =>
  content ? `    <meta ${attr}="${escapeHtml(name)}" content="${escapeHtml(content)}" />\n` : ''

/**
 * Todo el `<head>` que depende de la página, listo para incrustar.
 *
 * El servidor sustituye con esto el bloque marcado en `index.html`. Se genera
 * aquí y no allí para que se pueda probar sin levantar nada y para que el
 * navegador pueda reutilizar los mismos cálculos al navegar sin recargar.
 */
export function renderHead(site, route, origin = '') {
  const meta = resolveMeta(site, route, origin)
  const brand = site.brand || {}
  let out = ''

  out += `    <title>${escapeHtml(meta.title)}</title>\n`
  out += tag('description', meta.description)
  out += tag('robots', meta.robots)
  if (meta.canonical) out += `    <link rel="canonical" href="${escapeHtml(meta.canonical)}" />\n`
  out += tag('google-site-verification', meta.googleVerification)

  /* Iconos. Los que el administrador haya subido mandan sobre los del repo, y se
     sirven desde `/brand/…` con su propio tipo. */
  const favicon = assetUrl(brand.favicon, BRAND_ASSETS.favicon)
  const appleIcon = assetUrl(brand.appleIcon, BRAND_ASSETS.appleIcon)

  out += favicon
    ? `    <link rel="icon" href="${escapeHtml(favicon)}" />\n`
    : `    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />\n`
  if (appleIcon) {
    out += `    <link rel="apple-touch-icon" href="${escapeHtml(appleIcon)}" />\n`
  }

  /* Open Graph: lo que leen Discord, WhatsApp, Slack y Facebook. */
  out += tag('og:type', meta.type === 'product' ? 'product' : 'website', 'property')
  out += tag('og:site_name', meta.siteName, 'property')
  out += tag('og:title', meta.title, 'property')
  out += tag('og:description', meta.description, 'property')
  out += tag('og:url', meta.canonical, 'property')
  out += tag('og:locale', meta.locale, 'property')
  if (meta.image) {
    out += tag('og:image', meta.image, 'property')
    /* Sin las medidas, algunos clientes no reservan sitio y enseñan la tarjeta
       pequeña aunque la imagen sea grande. */
    out += tag('og:image:width', '1200', 'property')
    out += tag('og:image:height', '630', 'property')
  }

  /* X/Twitter no lee Open Graph para el tipo de tarjeta: necesita el suyo. */
  out += tag('twitter:card', meta.image ? 'summary_large_image' : 'summary')
  out += tag('twitter:site', meta.twitterSite)
  out += tag('twitter:title', meta.title)
  out += tag('twitter:description', meta.description)
  out += tag('twitter:image', meta.image)

  for (const block of buildJsonLd(site, route, origin)) {
    /* `</script>` dentro de una cadena del JSON cerraría la etiqueta antes de
       tiempo; escapar la barra lo impide sin cambiar el valor. */
    const payload = JSON.stringify(block).replace(/<\//g, '<\\/')
    out += `    <script type="application/ld+json">${payload}</script>\n`
  }

  out += renderAnalytics(meta.analytics)
  return out
}

/**
 * Script de analítica.
 *
 * Plausible y Umami son de una sola etiqueta y sin cookies, así que no hace
 * falta banner de consentimiento. Se pone `defer` para que no retrase el pintado
 * y sólo se emite si hay una instalación configurada — un script a medias es
 * peor que ninguno.
 */
export function renderAnalytics(analytics = {}) {
  const { provider, scriptUrl, siteId } = { ...DEFAULT_SEO.analytics, ...analytics }
  if (!scriptUrl || provider === 'none' || !provider) return ''

  if (provider === 'plausible') {
    if (!siteId) return ''
    return `    <script defer data-domain="${escapeHtml(siteId)}" src="${escapeHtml(scriptUrl)}"></script>\n`
  }

  if (provider === 'umami') {
    if (!siteId) return ''
    return `    <script defer data-website-id="${escapeHtml(siteId)}" src="${escapeHtml(scriptUrl)}"></script>\n`
  }

  return ''
}

/* --------------------------------- sitemap --------------------------------- */

/**
 * Todas las URL indexables del sitio.
 *
 * Se generan del catálogo en vez de mantenerse a mano, que es la única forma de
 * que un producto nuevo aparezca sin que nadie se acuerde de tocar un archivo.
 * Lo oculto y lo que no está a la venta se queda fuera: pedirle a Google que
 * indexe una página que no quieres enseñar es contradictorio.
 */
export function sitemapEntries(site) {
  const entries = [
    { path: '/', priority: '1.0', changefreq: 'weekly' },
    { path: '/productos', priority: '0.9', changefreq: 'weekly' },
    { path: '/hub', priority: '0.5', changefreq: 'monthly' },
    { path: '/nosotros', priority: '0.4', changefreq: 'monthly' },
    { path: '/soporte', priority: '0.4', changefreq: 'monthly' },
  ]

  for (const group of site.groups || []) {
    if (group.slug) entries.push({ path: `/productos/${group.slug}`, priority: '0.8', changefreq: 'weekly' })
  }

  for (const product of site.products || []) {
    if (!product.slug || product.hidden || product.status === 'archived') continue
    entries.push({ path: `/producto/${product.slug}`, priority: '0.7', changefreq: 'weekly' })
  }

  return entries
}

export function renderSitemap(site, origin) {
  const urls = sitemapEntries(site)
    .map(
      (entry) =>
        `  <url>\n` +
        `    <loc>${escapeHtml(absolute(origin, entry.path))}</loc>\n` +
        `    <changefreq>${entry.changefreq}</changefreq>\n` +
        `    <priority>${entry.priority}</priority>\n` +
        `  </url>`,
    )
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
}

export function renderRobots(site, origin) {
  const seo = { ...DEFAULT_SEO, ...(site.seo || {}) }
  /* Si el sitio entero está en noindex, el robots.txt tiene que decir lo mismo:
     dejarlos discrepando es la forma más rápida de que se indexe lo que no debe. */
  const closed = String(seo.robots || '').includes('noindex')

  return closed
    ? 'User-agent: *\nDisallow: /\n'
    : `User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${absolute(origin, '/sitemap.xml')}\n`
}
