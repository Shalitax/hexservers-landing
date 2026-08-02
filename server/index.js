/**
 * Servidor de la landing: estáticos + persistencia del contenido.
 *
 * La web nació como estático puro y el panel guardaba en el navegador de quien
 * editaba, así que sus cambios no los veía nadie más. Este servidor arregla eso
 * sin convertir el proyecto en otra cosa: sigue sirviendo el mismo `dist/`, y
 * añade lo mínimo para que el contenido viva en el disco del servidor.
 *
 *   GET  /api/content   → el contenido guardado (público: lo lee cada visitante)
 *   POST /api/login     → cambia la contraseña de admin por un token de sesión
 *   PUT  /api/content   → guarda el contenido (exige token)
 *   POST /api/logout    → invalida el token
 *
 * Sin dependencias a propósito: `node server/index.js` y ya está. Menos cosas
 * que instalar en el servidor y menos superficie que auditar.
 *
 * Arranque:
 *   HEX_ADMIN_PASSWORD='...' node server/index.js
 *
 * No hay contraseña por defecto: el servidor se niega a arrancar sin ella. Una
 * contraseña de fábrica en un servicio que escribe en disco es una puerta abierta
 * con un cartel que dice dónde está.
 */

import { createServer } from 'node:http'
import { readFile, writeFile, rename, mkdir } from 'node:fs/promises'
import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { randomBytes, timingSafeEqual, scrypt as scryptCb } from 'node:crypto'
import { promisify } from 'node:util'
import { join, extname, normalize, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const scrypt = promisify(scryptCb)

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const STATIC_DIR = process.env.HEX_STATIC_DIR || join(ROOT, 'dist')
const DATA_DIR = process.env.HEX_DATA_DIR || join(ROOT, 'data')
const CONTENT_FILE = join(DATA_DIR, 'content.json')

const PORT = Number(process.env.PORT) || 8080
const HOST = process.env.HOST || '0.0.0.0'
const PASSWORD = process.env.HEX_ADMIN_PASSWORD || ''

/* El cuerpo más grande es el contenido con imágenes en base64. 8 MB da margen
   de sobra sin dejar que cualquiera nos llene el disco de una sentada. */
const MAX_BODY = 8 * 1024 * 1024
const SESSION_MS = 12 * 60 * 60 * 1000

if (!PASSWORD) {
  console.error(
    'Falta HEX_ADMIN_PASSWORD. Arranca así:\n' +
      "  HEX_ADMIN_PASSWORD='tu-contraseña' node server/index.js",
  )
  process.exit(1)
}

/* ---------------------------------- sesiones --------------------------------- */

/** Tokens vivos → cuándo caducan. En memoria: reiniciar el server cierra sesiones. */
const sessions = new Map()

function issueToken() {
  const token = randomBytes(32).toString('hex')
  sessions.set(token, Date.now() + SESSION_MS)
  return token
}

function validToken(token) {
  const expires = sessions.get(token)
  if (!expires) return false
  if (Date.now() > expires) {
    sessions.delete(token)
    return false
  }
  return true
}

/** Comparación en tiempo constante de dos cadenas de cualquier longitud. */
async function samePassword(candidate) {
  // Se derivan ambas con el mismo salt para comparar longitudes iguales sin
  // filtrar por timing cuánto se parecía la contraseña enviada.
  const salt = 'hexservers-login'
  const [a, b] = await Promise.all([
    scrypt(candidate, salt, 32),
    scrypt(PASSWORD, salt, 32),
  ])
  return timingSafeEqual(a, b)
}

/**
 * Freno a la fuerza bruta por IP. No es un WAF, pero convierte un ataque de
 * diccionario de minutos en uno de días, que es todo lo que hace falta aquí.
 */
const attempts = new Map()
const MAX_ATTEMPTS = 10
const ATTEMPT_WINDOW_MS = 10 * 60 * 1000

function tooManyAttempts(ip) {
  const entry = attempts.get(ip)
  if (!entry) return false
  if (Date.now() > entry.until) {
    attempts.delete(ip)
    return false
  }
  return entry.count >= MAX_ATTEMPTS
}

function noteFailure(ip) {
  const entry = attempts.get(ip) || { count: 0, until: Date.now() + ATTEMPT_WINDOW_MS }
  entry.count += 1
  attempts.set(ip, entry)
}

/* ---------------------------------- contenido -------------------------------- */

/**
 * Campos que nunca deben acabar en el archivo público.
 *
 * `GET /api/content` lo lee cualquier visitante — es el contenido de la web. Si
 * el hash de la contraseña o las claves de WHMCS viajaran dentro, estaríamos
 * publicándolos. El cliente ya los quita antes de enviar; esto es la segunda
 * cerradura, por si algún día alguien llama a la API a mano.
 */
function sanitize(site) {
  const clean = { ...site }
  if (clean.admin) {
    clean.admin = { username: clean.admin.username || 'admin', salt: '', passwordHash: '', defaultPassword: '' }
  }
  if (clean.whmcs) {
    clean.whmcs = { ...clean.whmcs, identifier: '', secret: '' }
  }
  return clean
}

/** Escritura atómica: se escribe al lado y se renombra encima. */
async function saveContent(site) {
  await mkdir(DATA_DIR, { recursive: true })
  const temp = `${CONTENT_FILE}.${randomBytes(6).toString('hex')}.tmp`
  await writeFile(temp, JSON.stringify(sanitize(site), null, 2), 'utf8')
  await rename(temp, CONTENT_FILE)
}

async function loadContent() {
  try {
    return await readFile(CONTENT_FILE, 'utf8')
  } catch {
    return null
  }
}

/* ----------------------------------- HTTP ----------------------------------- */

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
}

const json = (res, status, body) => {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' })
  res.end(JSON.stringify(body))
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0
    const chunks = []
    req.on('data', (chunk) => {
      size += chunk.length
      if (size > MAX_BODY) {
        reject(new Error('cuerpo demasiado grande'))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

const bearer = (req) => (req.headers.authorization || '').replace(/^Bearer\s+/i, '')

async function handleApi(req, res, url) {
  /* ------------------------------- contenido ------------------------------- */
  if (url.pathname === '/api/content' && req.method === 'GET') {
    const stored = await loadContent()
    if (!stored) {
      // Nunca se ha guardado nada: el cliente usará su contenido semilla.
      res.writeHead(204, { 'Cache-Control': 'no-store' })
      res.end()
      return
    }
    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    })
    res.end(stored)
    return
  }

  if (url.pathname === '/api/content' && req.method === 'PUT') {
    if (!validToken(bearer(req))) return json(res, 401, { error: 'Sesión no válida o caducada.' })

    let site
    try {
      site = JSON.parse(await readBody(req))
    } catch (err) {
      return json(res, 400, { error: `No se pudo leer el contenido: ${err.message}` })
    }
    if (!site || typeof site !== 'object' || Array.isArray(site)) {
      return json(res, 400, { error: 'El contenido debe ser un objeto JSON.' })
    }

    try {
      await saveContent(site)
    } catch (err) {
      console.error('[hexservers] error al guardar:', err)
      return json(res, 500, { error: 'No se pudo escribir en disco.' })
    }
    return json(res, 200, { ok: true, savedAt: new Date().toISOString() })
  }

  /* --------------------------------- sesión -------------------------------- */
  if (url.pathname === '/api/login' && req.method === 'POST') {
    const ip = req.socket.remoteAddress || 'desconocida'
    if (tooManyAttempts(ip)) {
      return json(res, 429, { error: 'Demasiados intentos. Prueba de nuevo en unos minutos.' })
    }

    let password = ''
    try {
      password = String(JSON.parse(await readBody(req)).password || '')
    } catch {
      return json(res, 400, { error: 'Petición mal formada.' })
    }

    if (!password || !(await samePassword(password))) {
      noteFailure(ip)
      return json(res, 401, { error: 'Contraseña incorrecta.' })
    }

    attempts.delete(ip)
    return json(res, 200, { token: issueToken(), expiresIn: SESSION_MS })
  }

  if (url.pathname === '/api/logout' && req.method === 'POST') {
    sessions.delete(bearer(req))
    return json(res, 200, { ok: true })
  }

  return json(res, 404, { error: 'Endpoint desconocido.' })
}

/* --------------------------------- estáticos -------------------------------- */

async function serveStatic(req, res, url) {
  // `normalize` + prefijo obligatorio: sin esto, /../../etc/passwd sería servible.
  const relative = normalize(decodeURIComponent(url.pathname)).replace(/^([/\\])+/, '')
  let file = join(STATIC_DIR, relative)
  if (!file.startsWith(STATIC_DIR)) {
    res.writeHead(403)
    res.end('Prohibido')
    return
  }

  let info = await stat(file).catch(() => null)
  if (info?.isDirectory()) {
    file = join(file, 'index.html')
    info = await stat(file).catch(() => null)
  }

  // Cualquier ruta desconocida devuelve el index: la app enruta por hash, pero
  // así un enlace a /algo tampoco se rompe.
  if (!info?.isFile()) {
    file = join(STATIC_DIR, 'index.html')
    info = await stat(file).catch(() => null)
    if (!info?.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
      res.end('No hay build. Ejecuta: npm run build')
      return
    }
  }

  const type = MIME[extname(file).toLowerCase()] || 'application/octet-stream'
  /* Los assets llevan hash en el nombre: se pueden cachear para siempre. El
     index.html no, o el navegador serviría una versión vieja tras desplegar. */
  const cache = file.includes(`${join('dist', 'assets')}`) || /\.[0-9a-f]{8,}\./.test(file)
    ? 'public, max-age=31536000, immutable'
    : 'no-cache'

  res.writeHead(200, { 'Content-Type': type, 'Cache-Control': cache })
  createReadStream(file).pipe(res)
}

/* --------------------------------- arranque --------------------------------- */

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`)
    if (url.pathname.startsWith('/api/')) return await handleApi(req, res, url)
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405)
      res.end('Método no permitido')
      return
    }
    await serveStatic(req, res, url)
  } catch (err) {
    console.error('[hexservers] error no controlado:', err)
    if (!res.headersSent) json(res, 500, { error: 'Error interno.' })
    else res.end()
  }
})

server.listen(PORT, HOST, () => {
  console.log(`[hexservers] escuchando en http://${HOST}:${PORT}`)
  console.log(`[hexservers] estáticos: ${STATIC_DIR}`)
  console.log(`[hexservers] contenido: ${CONTENT_FILE}`)
})
