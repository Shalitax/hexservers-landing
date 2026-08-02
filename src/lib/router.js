/**
 * Router mínimo por hash. Sin dependencias y sin servidor: la landing sigue
 * funcionando abierta desde un `file://` o servida como estático puro.
 *
 * Rutas:
 *   #/                                     → portada
 *   #/nosotros                             → quiénes somos
 *   #/hub                                  → núcleo: hardware, equipo y próximos cambios
 *   #/soporte                              → soporte: ticket de WHMCS y contacto
 *   #/productos                            → catálogo completo
 *   #/productos/{grupo}                    → catálogo filtrado por subcategoría
 *   #/producto/{producto}                  → ficha + configurador
 *   #/producto/{producto}?ubicacion=&cpu=  → el configurador con lo ya elegido
 *   #/producto/{producto}/plan/{planId}    → detalle del plan elegido
 *
 * El configurador es una sola página: ubicación, CPU y planes son bloques que se
 * despliegan hacia abajo conforme el cliente elige. La selección viaja en la query
 * y no en la ruta, porque no son páginas distintas — pero sigue estando en la URL
 * a propósito: el botón atrás deshace la última elección y un enlace reproduce la
 * pantalla exacta.
 *
 * Las rutas del recorrido antiguo por pasos (`/ubicacion`, `/cpu/…`, `/planes/…`)
 * se siguen entendiendo y la página las redirige a la nueva; `_` era su hueco de
 * «sin filtrar».
 *
 * Los hashes que no empiezan por `/` se tratan como anclas de la portada, para
 * que sigan valiendo enlaces antiguos como `#features`, `#contacto` o `#admin`.
 */

import { useEffect, useState } from 'react'

export function parseHash(hash = window.location.hash) {
  const raw = decodeURIComponent(String(hash).replace(/^#/, ''))

  // Ancla suelta (#features) → portada + scroll a la sección.
  if (!raw.startsWith('/')) {
    return { name: 'home', path: '/', anchor: raw, segments: [] }
  }

  const [pathAndQuery, anchor = ''] = raw.split('#')
  const [pathPart, queryPart = ''] = pathAndQuery.split('?')
  const segments = pathPart.split('/').filter(Boolean)
  const query = new URLSearchParams(queryPart)
  const base = { path: `/${segments.join('/')}`, anchor, segments, query }

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
      return { ...product, stage: 'detail', planId: segments[3], locationId: '', cpuId: '' }
    }

    // Recorrido antiguo por pasos: se conserva la selección y se redirige.
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
      locationId: query.get('ubicacion') || '',
      cpuId: query.get('cpu') || '',
    }
  }

  return { ...base, name: 'notfound' }
}

/** Hueco de la ruta antigua: `_` (o vacío) significaba «sin filtrar». */
const slot = (segment) => (!segment || segment === '_' ? '' : segment)

/** Ruta actual, re-renderizada en cada `hashchange`. */
export function useRoute() {
  const [route, setRoute] = useState(() => parseHash())

  useEffect(() => {
    const sync = () => setRoute(parseHash())
    window.addEventListener('hashchange', sync)
    return () => window.removeEventListener('hashchange', sync)
  }, [])

  return route
}

/** Navega a una ruta interna. `to` es la ruta sin `#` (ej. '/productos/vps'). */
export function navigate(to, { replace = false } = {}) {
  const target = `#${to.startsWith('/') ? to : `/${to}`}`
  if (window.location.hash === target) {
    // Mismo hash: no hay `hashchange`, así que al menos subimos al principio.
    window.scrollTo({ top: 0, behavior: 'smooth' })
    return
  }
  if (replace) window.location.replace(target)
  else window.location.hash = target
}

/** Href listo para un `<a>` interno. */
export const href = (to) => `#${to.startsWith('/') ? to : `/${to}`}`

export const groupHref = (group) => href(`/productos/${group.slug}`)

/**
 * Ruta de una pantalla de producto.
 *
 *   productPath(product)                                   → configurador vacío
 *   productPath(product, 'config', { locationId, cpuId })  → con lo ya elegido
 *   productPath(product, 'detail', { planId })             → detalle del plan
 */
export function productPath(product, stage = 'config', { locationId = '', cpuId = '', planId = '' } = {}) {
  const base = `/producto/${product.slug}`
  if (stage === 'detail' && planId) return `${base}/plan/${planId}`

  const query = new URLSearchParams()
  if (locationId) query.set('ubicacion', locationId)
  if (cpuId) query.set('cpu', cpuId)
  const search = query.toString()
  return search ? `${base}?${search}` : base
}

export const productHref = (product, stage = 'config', params) =>
  href(productPath(product, stage, params))
