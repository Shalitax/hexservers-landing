/**
 * Router del navegador, sobre la History API.
 *
 * El análisis de rutas en sí vive en `shared/routes.js`, fuera de `src/`, porque
 * el servidor necesita exactamente el mismo para saber qué página está sirviendo
 * antes de mandar el HTML. Aquí queda sólo lo que requiere un navegador: el hook
 * que re-renderiza, la navegación sin recarga y la intercepción de enlaces.
 *
 * Antes esto iba por hash (`#/productos`). Se cambió porque el `#` no se envía
 * nunca al servidor: se queda en el navegador. Eso tenía dos consecuencias que
 * no se arreglaban de ninguna otra forma.
 *
 * La primera es que para un buscador la web entera era **una sola URL** — todas
 * las fichas de producto colapsaban en la portada, así que ninguna podía
 * posicionar. El esquema que hacía funcionar aquello (`#!`) lo abandonó Google
 * en 2015.
 *
 * La segunda es que el servidor no podía saber qué página le pedían, y sin eso
 * no hay forma de poner un título ni una imagen distintos en cada una. Los
 * rastreadores de Discord, WhatsApp o X no ejecutan JavaScript: leen el HTML tal
 * como llega. Con hash, todo enlace compartido enseñaba lo mismo.
 *
 * A cambio hace falta que el servidor devuelva el `index.html` en cualquier ruta
 * —`server/index.js` ya lo hace, y Vite también en desarrollo—, así que la web
 * ya no se puede abrir desde un `file://` ni subir a un estático sin una regla
 * de reescritura.
 *
 * Los enlaces antiguos con `#/…` se siguen entendiendo: al cargar se traducen a
 * su ruta equivalente y se sustituyen en el historial.
 *
 * Los hashes que no empiezan por `/` siguen siendo anclas de la portada, para
 * que valgan enlaces como `#features`, `#contacto` o `#admin`.
 */

import { useEffect, useState } from 'react'
import { parsePath, productPath, decodeSegment, STATIC_PATHS } from '../../shared/routes.js'

export { parsePath, productPath, STATIC_PATHS }

/* --------------------------------- lectura --------------------------------- */

/** La ruta de la barra de direcciones, con el ancla ya separada. */
export function parseLocation(loc = window.location) {
  const route = parsePath(loc.pathname, loc.search)
  return { ...route, anchor: decodeSegment(String(loc.hash || '').replace(/^#/, '')) }
}

/**
 * Traduce un enlace antiguo con hash a su ruta.
 *
 * `#/productos/vps` → `/productos/vps`, y `#features` → '' porque eso sigue
 * siendo un ancla de la portada y no una ruta.
 */
export function legacyHashTarget(hash = window.location.hash) {
  const raw = String(hash || '').replace(/^#/, '')
  if (!raw.startsWith('/')) return ''
  // El ancla podía ir detrás de la ruta: `#/productos#comparativa`.
  const [pathAndQuery, anchor = ''] = raw.split('#')
  return anchor ? `${pathAndQuery}#${anchor}` : pathAndQuery
}

/* -------------------------------- navegación ------------------------------- */

/* Un `pushState` no dispara ningún evento, así que el router se avisa a sí mismo
   con uno propio. `popstate` cubre los botones atrás y adelante. */
const ROUTE_EVENT = 'hexservers:route'

const normalize = (to) => (String(to).startsWith('/') ? String(to) : `/${to}`)

/** Navega a una ruta interna. `to` es la ruta (ej. '/productos/vps'). */
export function navigate(to, { replace = false } = {}) {
  const target = normalize(to)
  const current = `${window.location.pathname}${window.location.search}${window.location.hash}`

  if (target === current) {
    /* Misma ruta: no hay nada que cambiar en el historial, pero quien pulsó
       espera al menos volver arriba. */
    window.scrollTo({ top: 0, behavior: 'smooth' })
    return
  }

  if (replace) window.history.replaceState(null, '', target)
  else window.history.pushState(null, '', target)

  window.dispatchEvent(new Event(ROUTE_EVENT))
}

/**
 * Enlaces internos sin recarga.
 *
 * Se intercepta en `document` en lugar de envolver cada `<a>` en un componente
 * propio. No es por ahorrar trabajo: buena parte de los enlaces del sitio los
 * escribe el administrador desde el panel —el menú, el pie, los CTA— y salen de
 * `content.json` como cadenas de texto. Un componente `<Link>` no los cubriría,
 * y son justo los que más cambian.
 */
function interceptLinks(event) {
  if (event.defaultPrevented || event.button !== 0) return
  /* Ctrl/⌘ para abrir en pestaña nueva, Shift para ventana: son del navegador. */
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return

  const anchor = event.target?.closest?.('a')
  if (!anchor) return

  const raw = anchor.getAttribute('href')
  if (!raw) return

  /* Se respeta lo que pide el propio enlace: abrir fuera, descargar o salir. */
  if (anchor.hasAttribute('download')) return
  if (anchor.target && anchor.target !== '_self') return
  if (anchor.getAttribute('rel')?.includes('external')) return

  /* Anclas de la propia página y esquemas que no son navegación: mailto:, tel:,
     y el `javascript:` que `safeUrl` ya bloquea antes de llegar aquí. */
  if (raw.startsWith('#') || /^[a-z][a-z0-9+.-]*:/i.test(raw)) return

  let url
  try {
    url = new URL(raw, window.location.href)
  } catch {
    return
  }
  if (url.origin !== window.location.origin) return

  event.preventDefault()
  navigate(`${url.pathname}${url.search}${url.hash}`)
}

/** Ruta actual. Se re-renderiza al navegar y con los botones atrás y adelante. */
export function useRoute() {
  const [route, setRoute] = useState(() => {
    /* Antes del primer render: si se ha entrado por un enlace antiguo con hash,
       se corrige la barra de direcciones sin dejar rastro en el historial, para
       que el botón atrás no rebote contra la propia redirección. */
    const legacy = legacyHashTarget()
    if (legacy) window.history.replaceState(null, '', normalize(legacy))
    return parseLocation()
  })

  useEffect(() => {
    const sync = () => setRoute(parseLocation())

    window.addEventListener('popstate', sync)
    window.addEventListener(ROUTE_EVENT, sync)
    /* Sigue haciendo falta: un ancla (`#contacto`) cambia el hash sin pasar por
       `navigate`, y la ruta tiene que enterarse para hacer scroll. */
    window.addEventListener('hashchange', sync)
    document.addEventListener('click', interceptLinks)

    return () => {
      window.removeEventListener('popstate', sync)
      window.removeEventListener(ROUTE_EVENT, sync)
      window.removeEventListener('hashchange', sync)
      document.removeEventListener('click', interceptLinks)
    }
  }, [])

  return route
}

/* --------------------------------- enlaces --------------------------------- */

/**
 * Href listo para un `<a>` interno.
 *
 * Desde la migración a rutas reales esto es casi la identidad, pero se conserva
 * como el único sitio por el que pasan los enlaces internos: si algún día la web
 * cuelga de un subdirectorio, el prefijo se pone aquí y en ningún otro lugar.
 */
export const href = (to) => normalize(to)

export const groupHref = (group) => href(`/productos/${group.slug}`)

export const productHref = (product, stage = 'config', params) =>
  href(productPath(product, stage, params))
