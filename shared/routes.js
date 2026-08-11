/**
 * Rutas del sitio, sin navegador y sin React.
 *
 * Vive fuera de `src/` porque lo importan los dos lados: el navegador a través
 * de `src/lib/router.js`, y `server/index.js` para saber qué página le están
 * pidiendo antes de mandar el HTML. Sin eso no hay forma de poner un título y
 * una imagen distintos en cada página, que es lo que leen los rastreadores de
 * Google, Discord o WhatsApp —ninguno ejecuta JavaScript.
 *
 * De ahí la única regla de este archivo: **nada de `window`, `document` ni
 * dependencias**. Todo lo que necesite el navegador va en `src/lib/router.js`.
 */

/** Hueco de la ruta antigua: `_` (o vacío) significaba «sin filtrar». */
const slot = (segment) => (!segment || segment === '_' ? '' : segment)

/** Un slug mal codificado no debe tirar la página entera. */
export const decodeSegment = (segment) => {
  try {
    return decodeURIComponent(segment)
  } catch {
    return segment
  }
}

/**
 * Ruta a partir de un pathname y una query.
 *
 *   /                                     → portada
 *   /nosotros                             → quiénes somos
 *   /hub                                  → núcleo: hardware, equipo y próximos cambios
 *   /soporte                              → soporte: ticket de WHMCS y contacto
 *   /productos                            → catálogo completo
 *   /productos/{grupo}                    → catálogo filtrado por subcategoría
 *   /producto/{producto}                  → ficha + configurador
 *   /producto/{producto}?ubicacion=&cpu=  → el configurador con lo ya elegido
 *   /producto/{producto}/plan/{planId}    → detalle del plan elegido
 */
export function parsePath(pathname = '/', search = '') {
  const query = new URLSearchParams(String(search || '').replace(/^\?/, ''))
  const segments = String(pathname || '/')
    .split('/')
    .map(decodeSegment)
    .filter(Boolean)

  const base = { path: `/${segments.join('/')}`, anchor: '', segments, query }

  if (segments.length === 0) return { ...base, name: 'home', path: '/' }

  if (segments[0] === 'nosotros') return { ...base, name: 'about' }

  if (segments[0] === 'hub') return { ...base, name: 'hub' }

  if (segments[0] === 'soporte') return { ...base, name: 'support' }

  if (segments[0] === 'productos') {
    return { ...base, name: 'products', groupSlug: segments[1] || '' }
  }

  if (segments[0] === 'producto' && segments[1]) {
    const sub = segments[2] || ''
    const product = { ...base, name: 'product', productSlug: segments[1], legacy: false }

    if (sub === 'plan' && segments[3]) {
      return {
        ...product,
        stage: 'detail',
        planId: segments[3],
        tierId: '',
        locationId: '',
        cpuId: '',
      }
    }

    /* Recorrido antiguo por pasos: se conserva la selección y se redirige. */
    if (sub === 'ubicacion' || sub === 'cpu' || sub === 'planes') {
      return {
        ...product,
        stage: 'config',
        legacy: true,
        planId: '',
        locationId: sub === 'ubicacion' ? '' : slot(segments[3]),
        cpuId: sub === 'planes' ? slot(segments[4]) : '',
      }
    }

    return {
      ...product,
      stage: 'config',
      planId: '',
      tierId: query.get('gama') || '',
      locationId: query.get('ubicacion') || '',
      cpuId: query.get('cpu') || '',
    }
  }

  return { ...base, name: 'notfound' }
}

/**
 * Ruta de una pantalla de producto.
 *
 *   productPath(product)                                   → configurador vacío
 *   productPath(product, 'config', { tierId, locationId, cpuId })  → con lo ya elegido
 *   productPath(product, 'detail', { planId })             → detalle del plan
 */
export function productPath(
  product,
  stage = 'config',
  { tierId = '', locationId = '', cpuId = '', planId = '' } = {},
) {
  const base = `/producto/${product.slug}`
  if (stage === 'detail' && planId) return `${base}/plan/${planId}`

  const query = new URLSearchParams()
  if (tierId) query.set('gama', tierId)
  if (locationId) query.set('ubicacion', locationId)
  if (cpuId) query.set('cpu', cpuId)
  const search = query.toString()
  return search ? `${base}?${search}` : base
}

/** Rutas fijas del sitio, en el orden en que van al sitemap. */
export const STATIC_PATHS = ['/', '/productos', '/hub', '/nosotros', '/soporte']
