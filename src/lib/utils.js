export const cx = (...parts) => parts.filter(Boolean).join(' ')

export const uid = (prefix = 'id') =>
  `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`

export const clone = (value) =>
  typeof structuredClone === 'function' ? structuredClone(value) : JSON.parse(JSON.stringify(value))

export function formatPrice(amount, currency = 'USD', locale = 'es-ES') {
  const value = Number(amount) || 0
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(value)
  } catch {
    return `${value.toFixed(2)} ${currency}`
  }
}

export const slugify = (text) =>
  String(text)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

export function moveItem(list, from, to) {
  if (to < 0 || to >= list.length) return list
  const next = list.slice()
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

/** Lee un File como data URL (para guardar imágenes de producto en IndexedDB). */
export function fileToDataUrl(file, maxBytes = 1_500_000) {
  return new Promise((resolve, reject) => {
    if (file.size > maxBytes) {
      reject(new Error(`La imagen pesa ${(file.size / 1024 / 1024).toFixed(1)} MB (máx. 1.5 MB)`))
      return
    }
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('No se pudo leer el archivo'))
    reader.readAsDataURL(file)
  })
}

/** Evita `javascript:` y demás esquemas raros en URLs editables desde el panel. */
export function safeUrl(url, fallback = '#') {
  const value = String(url || '').trim()
  if (!value) return fallback
  if (/^(https?:|mailto:|tel:|#|\/)/i.test(value)) return value
  return `https://${value}`
}
