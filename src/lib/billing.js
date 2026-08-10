/**
 * Ciclos de facturación.
 *
 * Un plan tiene un precio mensual, y contratarlo por más tiempo sale más barato.
 * Este archivo es la aritmética de ese descuento y nada más: quién lo elige y dónde
 * se pinta vive en el store y en `BillingCyclePicker`.
 *
 * Los identificadores son los de WHMCS (`monthly`, `quarterly`, `semiannually`,
 * `annually`) y no unos propios, porque acaban viajando tal cual en el parámetro
 * `billingcycle` de la URL del carrito. Traducirlos en medio sería una tabla más que
 * mantener y una manera más de que la web y el carrito dejen de coincidir.
 *
 * DECISIÓN: el precio que se enseña es siempre el **equivalente mensual** con el
 * descuento ya aplicado, no el importe del cargo. Un plan a 5,99 €/mes con un 15 %
 * anual se anuncia como 5,09 €/mes, y aparte se avisa de que el cobro son 61,08 €
 * cada 12 meses. Así los planes siguen siendo comparables entre sí sea cual sea el
 * ciclo, que es justo lo que se rompe cuando unos precios son mensuales y otros
 * anuales.
 */

export const BILLING_CYCLES = [
  { id: 'monthly', name: 'Mensual', short: 'Mensual', months: 1 },
  { id: 'quarterly', name: 'Trimestral', short: '3 meses', months: 3 },
  { id: 'semiannually', name: 'Semestral', short: '6 meses', months: 6 },
  { id: 'annually', name: 'Anual', short: '1 año', months: 12 },
]

export const DEFAULT_CYCLE = 'monthly'

/**
 * Descuento de fábrica de cada ciclo, en porcentaje.
 *
 * Son cero a propósito. Un descuento inventado aquí sería un precio que la web
 * promete y el carrito no cumple, así que el número tiene que ponerlo quien sepa
 * qué cobra WHMCS de verdad — panel → Catálogo.
 */
export const DEFAULT_CYCLE_DISCOUNTS = {
  monthly: 0,
  quarterly: 0,
  semiannually: 0,
  annually: 0,
}

const byId = (id) => BILLING_CYCLES.find((cycle) => cycle.id === id)

/** Porcentaje saneado: fuera del 0–90 no es un descuento, es un error de tecleo. */
const safeDiscount = (value) => {
  const number = Number(value)
  if (!Number.isFinite(number)) return 0
  return Math.min(90, Math.max(0, number))
}

/**
 * Ciclo activo con su descuento ya resuelto. Cualquier id que no exista cae en el
 * mensual, que no descuenta nada: ante la duda, el precio de tarifa.
 */
export function resolveCycle(id, discounts = {}) {
  const cycle = byId(id) || byId(DEFAULT_CYCLE)
  return { ...cycle, discount: safeDiscount(discounts[cycle.id]) }
}

/** Equivalente mensual con el descuento aplicado. Es el número que se anuncia. */
export function monthlyPrice(price, cycle) {
  const base = Number(price) || 0
  if (!cycle?.discount) return base
  return Math.round(base * (1 - cycle.discount / 100) * 100) / 100
}

/** Lo que se cobra de una vez: el equivalente mensual por los meses del ciclo. */
export function cycleTotal(price, cycle) {
  const months = cycle?.months || 1
  return Math.round(monthlyPrice(price, cycle) * months * 100) / 100
}

/** Ciclos que de verdad aportan algo: el mensual y los que descuenten. */
export function usableCycles(discounts = {}) {
  return BILLING_CYCLES.filter(
    (cycle) => cycle.id === DEFAULT_CYCLE || safeDiscount(discounts[cycle.id]) > 0,
  )
}
