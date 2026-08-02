/**
 * Capa de persistencia local.
 *
 * Base de datos principal: IndexedDB (asíncrona, sin límite práctico de tamaño,
 * soporta imágenes en base64 sin problemas).
 * Fallback de bajo nivel: localStorage — sólo si IndexedDB no está disponible
 * (modo privado antiguo, navegadores exóticos, file:// en algunos entornos).
 */

const DB_NAME = 'hexservers'
const DB_VERSION = 1
const STORE = 'documents'
const LS_PREFIX = 'hexservers:doc:'

let dbPromise = null
let usingFallback = false

function openDB() {
  if (dbPromise) return dbPromise

  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB no disponible'))
      return
    }
    let request
    try {
      request = indexedDB.open(DB_NAME, DB_VERSION)
    } catch (err) {
      reject(err)
      return
    }

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'key' })
      }
    }
    request.onsuccess = () => {
      const db = request.result
      db.onversionchange = () => db.close()
      resolve(db)
    }
    request.onerror = () => reject(request.error || new Error('No se pudo abrir IndexedDB'))
    request.onblocked = () => reject(new Error('IndexedDB bloqueada por otra pestaña'))
  }).catch((err) => {
    console.warn('[hexservers/db] IndexedDB no disponible, usando localStorage:', err?.message)
    usingFallback = true
    return null
  })

  return dbPromise
}

function lsGet(key) {
  try {
    const raw = localStorage.getItem(LS_PREFIX + key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function lsSet(key, value) {
  try {
    localStorage.setItem(LS_PREFIX + key, JSON.stringify(value))
    return true
  } catch (err) {
    console.error('[hexservers/db] fallo al escribir en localStorage:', err)
    return false
  }
}

/** Lee un documento completo por clave. Devuelve `null` si no existe. */
export async function readDoc(key) {
  const db = await openDB()
  if (!db) return lsGet(key)

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE, 'readonly')
      const req = tx.objectStore(STORE).get(key)
      req.onsuccess = () => resolve(req.result ? req.result.value : null)
      req.onerror = () => resolve(lsGet(key))
    } catch {
      resolve(lsGet(key))
    }
  })
}

/** Escribe (upsert) un documento completo. */
export async function writeDoc(key, value) {
  const db = await openDB()
  if (!db) return lsSet(key, value)

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).put({ key, value, updatedAt: Date.now() })
      tx.oncomplete = () => resolve(true)
      tx.onerror = () => resolve(lsSet(key, value))
      tx.onabort = () => resolve(lsSet(key, value))
    } catch {
      resolve(lsSet(key, value))
    }
  })
}

/** Borra un documento (usado por "restaurar valores de fábrica"). */
export async function deleteDoc(key) {
  const db = await openDB()
  try {
    localStorage.removeItem(LS_PREFIX + key)
  } catch {
    /* noop */
  }
  if (!db) return true

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).delete(key)
      tx.oncomplete = () => resolve(true)
      tx.onerror = () => resolve(false)
    } catch {
      resolve(false)
    }
  })
}

/** Motor de almacenamiento realmente en uso (para mostrarlo en el panel admin). */
export function storageEngine() {
  return usingFallback ? 'localStorage (fallback)' : 'IndexedDB'
}
