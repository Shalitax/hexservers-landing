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
 * O, para no tener que escribirla cada vez en local, un archivo `.env` en la raíz
 * del proyecto con `HEX_ADMIN_PASSWORD=...`. Lo lee este mismo archivo, sin
 * banderas ni dependencias, y lo que ya venga en el entorno tiene prioridad.
 *
 * No hay contraseña por defecto: el servidor se niega a arrancar sin ella. Una
 * contraseña de fábrica en un servicio que escribe en disco es una puerta abierta
 * con un cartel que dice dónde está.
 */

import { createServer } from 'node:http'
import { readFile, writeFile, rename, mkdir, stat } from 'node:fs/promises'
import { createReadStream, readFileSync } from 'node:fs'
import { randomBytes, timingSafeEqual, scrypt as scryptCb } from 'node:crypto'
import { promisify } from 'node:util'
import { join, extname, normalize, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { parsePath } from '../shared/routes.js'
import { renderHead, renderSitemap, renderRobots, BRAND_ASSETS } from '../shared/seo.js'

const scrypt = promisify(scryptCb)

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

/**
 * Carga del `.env`, a mano.
 *
 * Node sabe hacer esto solo con `--env-file-if-exists`, pero esa bandera no
 * existe hasta la 20.12. En una Node 18 el proceso no llega ni a ejecutarse
 * —«bad option», código de salida 9— y desde fuera eso no se ve como un error de
 * versión: se ve como una web servida sin servidor detrás, con el panel diciendo
 * que sólo puede guardar en el navegador. Quince líneas aquí funcionan en
 * cualquier versión y devuelven el arranque a `node server/index.js` a secas.
 *
 * Lo que ya viene en el entorno manda sobre el archivo. En un PaaS las variables
 * las inyecta el panel, y un `.env` que se colara en la imagen no debe pisarlas.
 */
function loadEnvFile(file) {
  let raw
  try {
    raw = readFileSync(file, 'utf8')
  } catch {
    return /* No hay `.env`: es lo normal en producción, la variable viene del entorno. */
  }

  /* Se quita la marca de orden de bytes (U+FEFF) que deja el Bloc de notas de
     Windows al guardar en UTF-8. Sin esto la primera clave del archivo pasaría
     a llamarse "\uFEFFHEX_ADMIN_PASSWORD" y no la encontraría nadie. */
  for (const line of raw.replace(/^\uFEFF/, '').split(/\r?\n/)) {
    const clean = line.trim().replace(/^export\s+/, '')
    if (!clean || clean.startsWith('#')) continue

    const eq = clean.indexOf('=')
    if (eq < 1) continue

    const key = clean.slice(0, eq).trim()
    let value = clean.slice(eq + 1).trim()
    /* Comillas emparejadas: se quitan, y lo de dentro va literal. No se recortan
       comentarios al final de la línea a propósito: una contraseña puede llevar
       una almohadilla y truncarla en silencio sería peor que no soportarlo. */
    if (value.length > 1 && (value[0] === '"' || value[0] === "'") && value.at(-1) === value[0]) {
      value = value.slice(1, -1)
    }

    if (process.env[key] === undefined) process.env[key] = value
  }
}

loadEnvFile(process.env.HEX_ENV_FILE || join(ROOT, '.env'))

/* `resolve` normaliza separadores y relativos: sin esto, un HEX_STATIC_DIR escrito
   con las barras del otro sistema no coincidiría con las rutas que arma `join`, y
   el guardián contra el recorrido de rutas rechazaría archivos legítimos. */
const STATIC_DIR = resolve(process.env.HEX_STATIC_DIR || join(ROOT, 'dist'))
/* Donde Vite deja los archivos con hash en el nombre: los únicos cacheables a largo plazo. */
const ASSETS_DIR = join(STATIC_DIR, 'assets')
const DATA_DIR = resolve(process.env.HEX_DATA_DIR || join(ROOT, 'data'))
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

/**
 * Barrido de lo caducado.
 *
 * Los dos mapas sólo se limpiaban al consultarlos, así que un token que expira y
 * nadie vuelve a usar —lo normal: se cierra la pestaña y ya— se quedaba en memoria
 * para siempre. En un proceso pensado para estar meses levantado, eso es una fuga.
 *
 * `unref()` para que este temporizador no sea motivo de que Node siga vivo.
 */
setInterval(() => {
  const now = Date.now()
  for (const [token, expires] of sessions) if (now > expires) sessions.delete(token)
  for (const [ip, entry] of attempts) if (now > entry.until) attempts.delete(ip)
}, 30 * 60 * 1000).unref()

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

/**
 * El contenido ya interpretado, para las meta y el sitemap.
 *
 * Se cachea contra la fecha de modificación del archivo. Sin esto, cada visita
 * a cualquier página releería y volvería a interpretar un JSON que ronda los
 * 100 KB —y con imágenes, bastante más—, y esto se ejecuta en la ruta crítica de
 * absolutamente todas las peticiones de HTML.
 *
 * Si el archivo está corrupto se devuelve `null` y la página sale con las meta
 * de respaldo del `index.html`: una web con el título genérico es mucho menos
 * grave que una web caída.
 */
let siteCache = { key: '', site: null }

async function loadSite() {
  let key
  try {
    const info = await stat(CONTENT_FILE)
    key = `${info.mtimeMs}:${info.size}`
  } catch {
    return null
  }

  if (siteCache.key === key) return siteCache.site

  try {
    const site = JSON.parse(await readFile(CONTENT_FILE, 'utf8'))
    siteCache = { key, site: site && typeof site === 'object' ? site : null }
  } catch (err) {
    console.error('[hexservers] contenido ilegible, se usan las meta de respaldo:', err.message)
    siteCache = { key, site: null }
  }
  return siteCache.site
}

/**
 * Origen público (`https://hexservers.com`).
 *
 * Manda lo que el administrador haya escrito en el panel, porque es lo único que
 * sobrevive a un proxy que no reenvíe bien las cabeceras. Si está vacío se
 * deduce de la petición, que acierta en la mayoría de los casos.
 */
function originOf(req, site) {
  const declared = String(site?.seo?.siteUrl || '').trim()
  if (declared) return declared.replace(/\/+$/, '')

  const host = req.headers['x-forwarded-host'] || req.headers.host
  if (!host) return ''
  const proto = String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim() || 'http'
  return `${proto}://${host}`
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

  /* Cualquier ruta desconocida devuelve el index: la app enruta por el lado del
     cliente, así que /producto/minecraft no es un archivo pero sí una página. */
  if (!info?.isFile()) {
    file = join(STATIC_DIR, 'index.html')
    info = await stat(file).catch(() => null)
    if (!info?.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
      res.end('No hay build. Ejecuta: npm run build')
      return
    }
  }

  if (file === join(STATIC_DIR, 'index.html')) return serveHtml(req, res, url, file)

  const type = MIME[extname(file).toLowerCase()] || 'application/octet-stream'
  /* Los assets llevan hash en el nombre: se pueden cachear para siempre. El
     index.html no, o el navegador serviría una versión vieja tras desplegar.
     Se compara contra la carpeta real y no contra el literal 'dist/assets', que
     dejaba de valer en cuanto se cambiaba HEX_STATIC_DIR. */
  const cache = file.startsWith(ASSETS_DIR)
    ? 'public, max-age=31536000, immutable'
    : 'no-cache'

  res.writeHead(200, { 'Content-Type': type, 'Cache-Control': cache })
  createReadStream(file).pipe(res)
}

/* ------------------------------- HTML con meta ------------------------------ */

/* El bloque del `index.html` que se sustituye por las meta de cada página. */
const SEO_OPEN = '<!--seo-->'
const SEO_CLOSE = '<!--/seo-->'

/* La plantilla sólo cambia al desplegar, así que se lee una vez. */
let templateCache = { key: '', html: '' }

async function readTemplate(file) {
  const info = await stat(file)
  const key = `${info.mtimeMs}:${info.size}`
  if (templateCache.key !== key) {
    templateCache = { key, html: await readFile(file, 'utf8') }
  }
  return templateCache.html
}

/**
 * El `index.html` con las meta de la página que se está pidiendo.
 *
 * Esto es lo único que ven Google, Discord, WhatsApp y X: ninguno ejecuta el
 * JavaScript de la página. Lo que la aplicación ponga en el `<head>` después de
 * cargar sirve para la pestaña del navegador y para nada más.
 */
async function serveHtml(req, res, url, file) {
  const template = await readTemplate(file)
  const site = await loadSite()

  let html = template
  let status = 200

  const open = template.indexOf(SEO_OPEN)
  const close = template.indexOf(SEO_CLOSE)

  if (site && open !== -1 && close > open) {
    const route = parsePath(url.pathname, url.search)
    const head = renderHead(site, route, originOf(req, site))
    html = template.slice(0, open + SEO_OPEN.length) + '\n' + head + template.slice(close)

    /* Una ruta que no existe debe responder 404 y no 200 con la página de
       «no encontrado» dentro. Un 200 en una página vacía es un «soft 404»: el
       buscador la indexa igualmente y penaliza por ello. */
    if (route.name === 'notfound') status = 404
  }

  const body = Buffer.from(html, 'utf8')
  res.writeHead(status, {
    'Content-Type': 'text/html; charset=utf-8',
    'Content-Length': body.length,
    'Cache-Control': 'no-cache',
  })
  res.end(req.method === 'HEAD' ? undefined : body)
}

/* ------------------------------ imágenes de marca --------------------------- */

/* Sólo formatos que un navegador pinta como icono o como tarjeta de enlace. Que
   la lista sea cerrada evita que subir un archivo cualquiera acabe sirviéndose
   con un tipo que el navegador interprete como otra cosa. */
const IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml', 'image/x-icon', 'image/gif'])

/** Separa un data URL en tipo y bytes. Devuelve null si no lo es o no vale. */
function decodeDataUrl(value) {
  const match = /^data:([\w.+/-]+);base64,(.+)$/s.exec(String(value || '').trim())
  if (!match) return null
  const [, type, base64] = match
  if (!IMAGE_TYPES.has(type)) return null
  try {
    return { type, body: Buffer.from(base64, 'base64') }
  } catch {
    return null
  }
}

/**
 * Las imágenes que se suben desde el panel, publicadas en una URL de verdad.
 *
 * Se guardan en el contenido como data URL, que sirve para pintarlas dentro de
 * la página pero no vale para lo que más importa: **ningún rastreador acepta un
 * data URL como `og:image`**. La tarjeta de un enlace en Discord o WhatsApp sale
 * vacía. Así que el servidor las republica aquí, con su tipo y su longitud.
 */
async function serveBrandAsset(req, res, url) {
  const site = await loadSite()
  const field = Object.entries(BRAND_ASSETS).find(([, path]) => path === url.pathname)?.[0]
  const asset = field ? decodeDataUrl(site?.brand?.[field]) : null

  if (!asset) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
    res.end('No hay imagen configurada.')
    return
  }

  res.writeHead(200, {
    'Content-Type': asset.type,
    'Content-Length': asset.body.length,
    /* Corta: la imagen cambia cuando el administrador sube otra, y ahí interesa
       que se vea el cambio pronto. Los rastreadores la cachean por su cuenta
       mucho más tiempo, y eso no lo decide esta cabecera. */
    'Cache-Control': 'public, max-age=300',
  })
  res.end(req.method === 'HEAD' ? undefined : asset.body)
}

/* ---------------------------- sitemap y robots.txt -------------------------- */

async function serveSitemap(req, res, url) {
  const site = await loadSite()
  if (!site) {
    res.writeHead(503, { 'Content-Type': 'text/plain; charset=utf-8' })
    res.end('Todavía no hay contenido publicado.')
    return
  }
  const body = Buffer.from(renderSitemap(site, originOf(req, site)), 'utf8')
  res.writeHead(200, {
    'Content-Type': 'application/xml; charset=utf-8',
    'Content-Length': body.length,
    'Cache-Control': 'public, max-age=3600',
  })
  res.end(req.method === 'HEAD' ? undefined : body)
}

async function serveRobots(req, res) {
  const site = await loadSite()
  /* Sin contenido aún, lo prudente es no invitar a indexar: el sitio está a
     medio montar y lo que se indexe ahora cuesta semanas en corregirse. */
  const text = site
    ? renderRobots(site, originOf(req, site))
    : 'User-agent: *\nDisallow: /\n'

  const body = Buffer.from(text, 'utf8')
  res.writeHead(200, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Content-Length': body.length,
    'Cache-Control': 'public, max-age=3600',
  })
  res.end(req.method === 'HEAD' ? undefined : body)
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

    if (url.pathname === '/sitemap.xml') return await serveSitemap(req, res, url)
    if (url.pathname === '/robots.txt') return await serveRobots(req, res)
    if (url.pathname.startsWith('/brand/')) return await serveBrandAsset(req, res, url)

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
