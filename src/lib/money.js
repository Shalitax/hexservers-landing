/**
 * Divisas.
 *
 * Los precios del catálogo se escriben una sola vez, en la divisa base del sitio
 * (`site.currency.base`). Lo que ve el visitante es una conversión hecha en su
 * navegador con el cambio que el admin fija en el panel: aquí no hay backend que
 * consulte cotizaciones, y colgar de una API externa dejaría los precios en manos
 * de un tercero.
 *
 * Los decimales no se fuerzan: los decide `Intl` según la divisa, que es lo que
 * hace que CLP salga sin céntimos y USD con ellos.
 */

export const DEFAULT_CURRENCY = {
  id: 'cur_usd',
  code: 'USD',
  label: 'Dólar estadounidense',
  rate: 1,
  locale: 'en-US',
  whmcsId: '',
}

/** Divisa activa: la elegida si existe, si no la del sitio, si no la primera. */
export function resolveCurrency(config = {}, code = '') {
  const items = config.items?.length ? config.items : [DEFAULT_CURRENCY]
  return (
    items.find((item) => item.code === code) ||
    items.find((item) => item.code === config.default) ||
    items[0]
  )
}

/** Importe en la divisa base → importe en la divisa de destino. */
export function convert(amount, currency) {
  const rate = Number(currency?.rate)
  const value = (Number(amount) || 0) * (rate > 0 ? rate : 1)
  // Sin decimales (CLP, JPY…) el redondeo al entero evita precios con coma.
  return fractionDigits(currency) === 0 ? Math.round(value) : Math.round(value * 100) / 100
}

/** Decimales que `Intl` usa para esa divisa: 2 en USD/EUR, 0 en CLP. */
function fractionDigits(currency) {
  try {
    return new Intl.NumberFormat(currency?.locale || 'es-ES', {
      style: 'currency',
      currency: currency?.code || 'USD',
    }).resolvedOptions().maximumFractionDigits
  } catch {
    return 2
  }
}

/** Convierte y formatea. `1.5` en base + CLP a 950 → «$1.425». */
export function formatMoney(amount, currency) {
  const value = convert(amount, currency)
  const digits = fractionDigits(currency)
  try {
    return new Intl.NumberFormat(currency?.locale || 'es-ES', {
      style: 'currency',
      currency: currency?.code || 'USD',
      // Los importes redondos se ven mejor sin «,00».
      minimumFractionDigits: Number.isInteger(value) ? 0 : digits,
      maximumFractionDigits: digits,
    }).format(value)
  } catch {
    return `${value} ${currency?.code || ''}`.trim()
  }
}
