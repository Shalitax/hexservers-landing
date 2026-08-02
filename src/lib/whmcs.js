/**
 * Capa WHMCS.
 *
 * 1) Construcción de la URL de carrito (funciona hoy, sin backend).
 * 2) Placeholder de la API (endpoint / identifier / secret) para cuando exista un
 *    proxy servidor que permita sincronizar productos, precios y stock reales.
 *
 * NOTA DE SEGURIDAD: las credenciales de la API de WHMCS NO deben viajar nunca
 * desde el navegador. WHMCS además bloquea CORS. Por eso `syncFromWhmcs()` está
 * preparada pero apunta a un proxy propio (`/api/whmcs`) que aún no existe.
 */

import { safeUrl } from './utils.js'

/**
 * Construye la URL final de "Contratar".
 *
 * @param {object} product  Producto local (con `whmcsUrl`, `whmcsPid`, opciones)
 * @param {object} selection  { [optionId]: valueId }
 * @param {object} whmcsConfig  Config global de WHMCS del sitio
 * @param {object} currency  Divisa que está viendo el visitante (opcional)
 */
export function buildOrderUrl(product, selection = {}, whmcsConfig = {}, currency = null) {
  const base = resolveBaseUrl(product, whmcsConfig)
  if (!base) return '#'

  let url
  try {
    url = new URL(base, window.location.origin)
  } catch {
    return safeUrl(base)
  }

  // pid del producto en WHMCS (si el admin lo definió y la URL aún no lo lleva)
  if (product?.whmcsPid && !url.searchParams.has('pid')) {
    if (!url.searchParams.has('a')) url.searchParams.set('a', 'add')
    url.searchParams.set('pid', String(product.whmcsPid))
  }

  // Ciclo de facturación
  if (product?.billingCycle) url.searchParams.set('billingcycle', product.billingCycle)

  // Opciones configurables -> configoption[ID]=VALUE_ID
  if (product?.hasConfigurableOptions) {
    for (const option of product.configurableOptions || []) {
      const chosenId = selection[option.id]
      const value = (option.values || []).find((v) => v.id === chosenId)
      if (!value) continue

      const paramId = String(option.whmcsOptionId || '').trim()
      const paramValue = String(value.whmcsValueId || '').trim()

      if (paramId && paramValue) {
        url.searchParams.set(`configoption[${paramId}]`, paramValue)
      } else {
        // Sin IDs de WHMCS: se envía como metadato legible para no perder la selección.
        url.searchParams.append('hex_opt', `${option.name}=${value.label}`)
      }
    }
  }

  // Código promocional activo
  if (whmcsConfig?.promocode) url.searchParams.set('promocode', whmcsConfig.promocode)

  /* Divisa: WHMCS espera el id numérico de su propia tabla, no el código ISO. Sin
     ese id no se envía nada y el carrito abre en la divisa por defecto. */
  const currencyId = String(currency?.whmcsId || '').trim()
  if (currencyId) url.searchParams.set('currency', currencyId)

  return url.toString()
}

function resolveBaseUrl(product, whmcsConfig) {
  const direct = String(product?.whmcsUrl || '').trim()
  if (direct) return safeUrl(direct)

  const portal = String(whmcsConfig?.portalUrl || '').trim()
  if (portal && product?.whmcsPid) {
    return `${safeUrl(portal).replace(/\/+$/, '')}/cart.php?a=add&pid=${product.whmcsPid}`
  }
  return ''
}

/**
 * URL para abrir un ticket. Si el panel no la fija a mano, sale del portal
 * (`…/submitticket.php`), que es la ruta estándar de WHMCS: así basta con tener
 * bien configurado el portal para que el botón de la página de soporte funcione.
 *
 * Devuelve '' —y no '#'— cuando no hay nada configurado, para que quien la use
 * pueda decidir si esconde el botón o enseña un aviso.
 */
export function ticketUrl(whmcsConfig = {}, override = '') {
  const direct = String(override || '').trim()
  if (direct) return safeUrl(direct)

  const portal = String(whmcsConfig.portalUrl || whmcsConfig.clientAreaUrl || '').trim()
  if (!portal) return ''
  /* clientAreaUrl ya apunta a un .php: se sustituye la página, no se cuelga de ella. */
  return `${safeUrl(portal).replace(/\/[^/]*\.php.*$/, '').replace(/\/+$/, '')}/submitticket.php`
}

/** Precio final = base + recargos de las opciones seleccionadas. */
export function computePrice(product, selection = {}) {
  let total = Number(product?.price) || 0
  if (!product?.hasConfigurableOptions) return total

  for (const option of product.configurableOptions || []) {
    const value = (option.values || []).find((v) => v.id === selection[option.id])
    if (value) total += Number(value.priceDelta) || 0
  }
  return Math.round(total * 100) / 100
}

/** Selección por defecto de todas las opciones configurables de un producto. */
export function defaultSelection(product) {
  const selection = {}
  if (!product?.hasConfigurableOptions) return selection
  for (const option of product.configurableOptions || []) {
    const values = option.values || []
    if (!values.length) continue
    selection[option.id] = (values.find((v) => v.default) || values[0]).id
  }
  return selection
}

/**
 * Sincronización futura con la API de WHMCS (GetProducts).
 * Requiere un proxy servidor; desde el navegador siempre fallará por CORS
 * y expondría el secret. Se deja cableado para el día que exista backend.
 */
export async function syncFromWhmcs(whmcsConfig) {
  if (!whmcsConfig?.apiEnabled) {
    throw new Error('La API de WHMCS está desactivada en la configuración.')
  }
  if (!whmcsConfig.apiUrl || !whmcsConfig.identifier || !whmcsConfig.secret) {
    throw new Error('Faltan endpoint, identifier o secret.')
  }

  const proxy = String(whmcsConfig.proxyUrl || '').trim()
  if (!proxy) {
    throw new Error(
      'Configura una URL de proxy backend. Llamar a WHMCS directamente desde el navegador ' +
        'expondría el secret y WHMCS lo bloquea por CORS.',
    )
  }

  const response = await fetch(proxy, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'GetProducts' }),
  })
  if (!response.ok) throw new Error(`El proxy respondió ${response.status}`)
  return response.json()
}
