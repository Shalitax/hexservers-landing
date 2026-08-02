/**
 * Contenido guardado en el servidor.
 *
 * La web sigue funcionando sin servidor —abierta desde un `file://` o subida a
 * un hosting estático—; en ese caso todo esto falla en silencio y el contenido
 * vuelve a ser el del navegador. Pero cuando la sirve `server/index.js`, el
 * archivo del servidor es la verdad: es lo que ve todo el mundo, y no sólo quien
 * editó.
 *
 * Por eso ninguna función de aquí lanza excepciones hacia arriba salvo el login
 * y el guardado, que sí necesitan poder decir «no se pudo».
 */

const TOKEN_KEY = 'hexservers:admin-token'

/** Peticiones cortas: si el servidor no está, hay que enterarse rápido. */
const TIMEOUT_MS = 8000

async function request(path, options = {}) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), options.timeout || TIMEOUT_MS)
  try {
    return await fetch(path, { ...options, signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}

/* ---------------------------------- token ---------------------------------- */

/* En sessionStorage, igual que la sesión de admin: se va al cerrar la pestaña. */
export function readToken() {
  try {
    return sessionStorage.getItem(TOKEN_KEY) || ''
  } catch {
    return ''
  }
}

export function writeToken(token) {
  try {
    if (token) sessionStorage.setItem(TOKEN_KEY, token)
    else sessionStorage.removeItem(TOKEN_KEY)
  } catch {
    /* Sin sessionStorage la sesión dura lo que el objeto en memoria. */
  }
}

/* --------------------------------- contenido -------------------------------- */

/**
 * Contenido del servidor.
 *
 * @returns {Promise<{available: boolean, site: object|null}>}
 *   `available` dice si hay servidor detrás (aunque aún no haya nada guardado);
 *   es lo que distingue «modo servidor sin configurar» de «no hay servidor».
 */
export async function fetchRemoteContent() {
  try {
    const response = await request('/api/content', { headers: { Accept: 'application/json' } })

    // 204: hay servidor, pero nadie ha guardado nada todavía.
    if (response.status === 204) return { available: true, site: null }

    if (!response.ok) return { available: false, site: null }

    /* Un hosting estático puede devolver 200 con el index.html para cualquier
       ruta. Si no es JSON, no hay servidor: es la web respondiéndose a sí misma. */
    const type = response.headers.get('content-type') || ''
    if (!type.includes('application/json')) return { available: false, site: null }

    const site = await response.json()
    if (!site || typeof site !== 'object' || Array.isArray(site)) {
      return { available: true, site: null }
    }
    return { available: true, site }
  } catch {
    return { available: false, site: null }
  }
}

/** Guarda el contenido. Lanza si el servidor lo rechaza: hay que poder avisar. */
export async function saveRemoteContent(site, token) {
  const response = await request('/api/content', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(site),
  })

  if (response.status === 401) {
    writeToken('')
    throw new Error('La sesión caducó. Vuelve a entrar para seguir guardando.')
  }
  if (!response.ok) {
    const detail = await response.json().catch(() => null)
    throw new Error(detail?.error || `El servidor respondió ${response.status}.`)
  }
  return response.json().catch(() => ({ ok: true }))
}

/* ---------------------------------- sesión ---------------------------------- */

/** Cambia la contraseña por un token. Lanza con el motivo si no cuela. */
export async function loginRemote(password) {
  const response = await request('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  })

  const body = await response.json().catch(() => null)
  if (!response.ok) throw new Error(body?.error || 'No se pudo iniciar sesión.')
  if (!body?.token) throw new Error('El servidor no devolvió una sesión válida.')

  writeToken(body.token)
  return body.token
}

/** Cierra la sesión en el servidor. Si falla, da igual: el token local ya se fue. */
export async function logoutRemote(token) {
  writeToken('')
  if (!token) return
  try {
    await request('/api/logout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
  } catch {
    /* El token caduca solo en el servidor. */
  }
}
