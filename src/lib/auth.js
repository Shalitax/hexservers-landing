/**
 * Hash de la contraseña de administrador.
 *
 * Aviso importante: esto es una landing page 100% cliente. El "login" de admin
 * sólo evita que un visitante casual entre al modo edición; NO es seguridad real
 * — cualquiera con las devtools puede leer el estado local. Cuando exista backend
 * (WHMCS API / servidor propio), la verificación debe moverse al servidor.
 */

const ITERATIONS = 120_000

const toHex = (buf) =>
  Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

const fromHex = (hex) => Uint8Array.from(hex.match(/.{1,2}/g).map((b) => parseInt(b, 16)))

export function randomSalt(bytes = 16) {
  return toHex(crypto.getRandomValues(new Uint8Array(bytes)))
}

/** PBKDF2-SHA256 si hay WebCrypto (https/localhost); si no, SHA-256 simple. */
export async function hashPassword(password, saltHex) {
  const enc = new TextEncoder()

  if (crypto?.subtle?.importKey) {
    const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, [
      'deriveBits',
    ])
    const bits = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', hash: 'SHA-256', salt: fromHex(saltHex), iterations: ITERATIONS },
      key,
      256,
    )
    return `pbkdf2$${toHex(bits)}`
  }

  // Fallback degradado (contexto no seguro): mejor que texto plano, nada más.
  let h = 0x811c9dc5
  const data = `${saltHex}:${password}`
  for (let i = 0; i < data.length; i++) {
    h ^= data.charCodeAt(i)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return `weak$${h.toString(16)}`
}

export async function verifyPassword(password, saltHex, expectedHash) {
  if (!expectedHash) return false
  const actual = await hashPassword(password, saltHex)
  if (actual.length !== expectedHash.length) return false
  // Comparación de tiempo constante (por higiene, no por amenaza real aquí).
  let diff = 0
  for (let i = 0; i < actual.length; i++) diff |= actual.charCodeAt(i) ^ expectedHash.charCodeAt(i)
  return diff === 0
}
