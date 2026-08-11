import { useEffect } from 'react'
import { useSite } from '../store/useSite.js'
import { resolveMeta } from '../../shared/seo.js'

/**
 * Título y descripción de la pestaña al navegar sin recargar.
 *
 * El servidor ya manda las meta correctas en la primera carga, y son las únicas
 * que ve un rastreador. Pero al moverse por el sitio no hay petición nueva, así
 * que sin esto la pestaña se quedaría con el título de la página por la que se
 * entró: molesto con varias abiertas, y peor en el historial y en los
 * marcadores, que guardan el título del momento.
 *
 * Se actualizan sólo las dos que significan algo para una persona. El resto
 * —canonical, Open Graph, datos estructurados— se deja tal como llegó del
 * servidor: quien las lee nunca ejecuta este código, así que reescribirlas sería
 * trabajo en cada navegación a cambio de nada.
 */
export function useDocumentMeta(route) {
  /* Sólo estos dos se vigilan. Suscribirse al documento entero re-renderizaría
     App —y con él la página completa— en cada tecla del modo edición; el resto
     (productos, grupos, planes) se lee dentro del efecto, que para cuando hace
     falta ya se ha disparado por el cambio de ruta. */
  const seo = useSite((s) => s.site.seo)
  const brand = useSite((s) => s.site.brand)

  useEffect(() => {
    if (!route) return

    const meta = resolveMeta(useSite.getState().site, route)
    if (meta.title) document.title = meta.title

    const tag = document.querySelector('meta[name="description"]')
    if (tag && meta.description) tag.setAttribute('content', meta.description)
  }, [route, seo, brand])
}
