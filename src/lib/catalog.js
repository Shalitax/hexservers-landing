/**
 * Configurador de un producto.
 *
 * En WHMCS un grupo de productos es una CPU en una ubicación, así que el mismo
 * plan existe tantas veces como combinaciones haya, cada una con su PID. Aquí se
 * reconstruye ese árbol a partir de los planes del producto para presentarlo como
 * bloques encadenados en una sola página:
 *
 *   ficha → [ubicación] → [CPU] → planes → detalle → WHMCS
 *
 * Los bloques entre corchetes sólo existen cuando hay algo que elegir: con una
 * única opción se da por elegida y el bloque no se pinta, de modo que un producto
 * cuyos planes no declaran ubicación ni CPU enseña la lista de planes directamente.
 *
 * Un plan sin ubicación (o sin CPU) es comodín: vale para cualquier selección.
 */

/** ¿Este plan encaja con la ubicación y la CPU elegidas? */
export function planMatches(plan, { locationId = '', cpuId = '' } = {}) {
  if (locationId && plan.locationId && plan.locationId !== locationId) return false
  if (cpuId && plan.cpuId && plan.cpuId !== cpuId) return false
  return true
}

/** Elementos del catálogo (ubicaciones o CPUs) usados por alguno de estos planes. */
const optionsFor = (catalog, plans, key) =>
  (catalog || []).filter((item) => plans.some((plan) => plan[key] === item.id))

/** La selección vale si existe entre las opciones; con una sola opción, se asume. */
const resolve = (selected, options) => {
  if (options.some((option) => option.id === selected)) return selected
  return options.length === 1 ? options[0].id : ''
}

/**
 * Estado del configurador.
 *
 * @param {object} site      Documento del sitio (aporta ubicaciones y CPUs)
 * @param {array}  plans     Planes del producto
 * @param {object} selection { locationId, cpuId } tal y como vienen de la URL
 */
export function buildFlow(site, plans, selection = {}) {
  const locations = optionsFor(site.locations?.items, plans, 'locationId')
  const locationId = resolve(selection.locationId, locations)

  // Las CPUs disponibles dependen de la ubicación: no todas están en todas partes.
  const byLocation = plans.filter((plan) => planMatches(plan, { locationId }))
  const cpus = optionsFor(site.cpus, byLocation, 'cpuId')
  const cpuId = resolve(selection.cpuId, cpus)

  const hasLocationChoice = locations.length > 1
  const hasCpuChoice = cpus.length > 1

  return {
    locations,
    cpus,
    locationId,
    cpuId,
    hasLocationChoice,
    hasCpuChoice,
    /* Planes que quedan tras aplicar lo elegido. */
    plans: byLocation.filter((plan) => planMatches(plan, { cpuId })),
    /* ¿Se puede enseñar ya la lista de planes? */
    ready: (!hasLocationChoice || Boolean(locationId)) && (!hasCpuChoice || Boolean(cpuId)),
    /* El bloque de CPU no se pinta hasta que la ubicación está resuelta. */
    showCpu: hasCpuChoice && (!hasLocationChoice || Boolean(locationId)),
  }
}

/** Precio de entrada de una lista de planes (sólo los que se pueden comprar). */
export function fromPrice(plans) {
  const sellable = plans.filter((plan) => plan.status === 'available')
  if (!sellable.length) return null
  return Math.min(...sellable.map((plan) => Number(plan.price) || 0))
}

/**
 * Lo que toda tarjeta de producto necesita saber, se dibuje como se dibuje.
 *
 * Existe porque las cinco formas de listar el catálogo enseñan los mismos cuatro
 * datos —si se puede comprar, cuántos planes hay, desde cuánto y en qué periodo—
 * y sería fácil que una de ellas calculara «desde» de otra manera.
 */
export function productSummary(product, plans = []) {
  const sellable = plans.filter((plan) => plan.status === 'available')
  const reference = sellable[0] || plans[0]
  return {
    open: product.status === 'available' && plans.length > 0,
    count: plans.length,
    price: fromPrice(plans),
    period: reference?.period || '',
  }
}

export const findLocation = (site, id) =>
  (site.locations?.items || []).find((item) => item.id === id) || null

export const findCpu = (site, id) => (site.cpus || []).find((cpu) => cpu.id === id) || null
