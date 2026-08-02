/**
 * Medición de latencia real desde el navegador del visitante.
 *
 * AVISO TÉCNICO: un navegador no puede enviar ICMP, así que esto no es el `ping` de
 * consola. Se mide el ida y vuelta de una petición HTTP diminuta contra el endpoint
 * de cada ubicación. El número sale un poco por encima del ICMP puro porque incluye
 * el procesamiento del servidor, pero es más útil para el cliente: es la latencia que
 * va a tener él, desde su conexión, no la que medimos nosotros desde la oficina.
 *
 * Para que el número sea honesto:
 *  - una petición de calentamiento abre la conexión (DNS + TCP + TLS) y se descarta,
 *    porque ese coste se paga una vez y no es latencia de red;
 *  - se toman varias muestras sobre la conexión ya abierta y se queda la más baja,
 *    que es la que menos ruido de jitter arrastra.
 */

const DEFAULT_SAMPLES = 3
const DEFAULT_TIMEOUT = 4000

/** Normaliza a URL http(s) absoluta. Devuelve `null` si no es utilizable. */
export function pingTarget(value) {
  const raw = String(value || '').trim()
  if (!raw) return null

  const candidate = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`
  try {
    const url = new URL(candidate)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : null
  } catch {
    return null
  }
}

/** Cada muestra lleva su propio parámetro para que no la sirva ninguna caché. */
const bust = (url) =>
  `${url}${url.includes('?') ? '&' : '?'}_hex=${Date.now().toString(36)}${Math.random()
    .toString(36)
    .slice(2, 7)}`

/**
 * Una sola muestra. Devuelve los ms del ida y vuelta, o `null` si no se alcanzó el host.
 *
 * Se usa `mode: 'no-cors'`: no necesitamos leer la respuesta, sólo saber que llegó, así
 * que funciona contra cualquier endpoint sin pedirle que configure CORS. La distinción
 * que importa la da el propio fetch: un 404 o un 403 **resuelven** (el host contestó,
 * el ida y vuelta es válido) y sólo **rechaza** cuando no se pudo alcanzar — DNS que no
 * resuelve, conexión rechazada o TLS roto.
 */
async function probe(url, timeout, signal) {
  const controller = new AbortController()
  const onAbort = () => controller.abort()
  signal?.addEventListener('abort', onAbort)
  const timer = setTimeout(onAbort, timeout)

  const start = performance.now()
  try {
    await fetch(bust(url), {
      mode: 'no-cors',
      cache: 'no-store',
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
      signal: controller.signal,
    })
    return performance.now() - start
  } catch {
    return null
  } finally {
    clearTimeout(timer)
    signal?.removeEventListener('abort', onAbort)
  }
}

/**
 * Mide la latencia contra `url`.
 *
 * @returns {{ status: 'ok'|'unset'|'unreachable', ms: number|null }}
 *   `unset` = no hay endpoint configurado; `unreachable` = no contestó.
 */
export async function measureLatency(url, { samples = DEFAULT_SAMPLES, timeout = DEFAULT_TIMEOUT, signal } = {}) {
  const target = pingTarget(url)
  if (!target) return { status: 'unset', ms: null }

  // Calentamiento descartado: DNS + handshake no son latencia de red.
  const warmup = await probe(target, timeout, signal)
  if (warmup === null) return { status: 'unreachable', ms: null }

  const times = []
  for (let i = 0; i < samples; i += 1) {
    if (signal?.aborted) break
    const ms = await probe(target, timeout, signal)
    if (ms !== null) times.push(ms)
  }

  if (!times.length) return { status: 'unreachable', ms: null }
  return { status: 'ok', ms: Math.round(Math.min(...times)) }
}

/** Franjas de color para pintar el resultado. */
export function latencyTone(ms) {
  if (ms == null) return 'slate'
  if (ms < 60) return 'emerald'
  if (ms < 150) return 'amber'
  return 'rose'
}
