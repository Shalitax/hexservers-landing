/**
 * Paleta de color editable.
 *
 * Todo el diseño se pinta con las variables que declara `@theme` en index.css
 * (`--color-hex-*` para el color principal, `--color-plasma-*` para el acento y
 * `--color-void*` para los fondos). Aquí se derivan esas variables a partir de
 * unos pocos colores base y se escriben como estilo en línea del elemento
 * <html>: gana a la hoja de estilos sin recompilar Tailwind y el cambio se ve al
 * instante mientras el admin mueve el selector.
 */

/**
 * Estilo visual: cuánto ruido tiene la interfaz. Es un interruptor y no una
 * reescritura, así que se puede ir y volver sin perder nada.
 *
 * - `sobrio`: fondos casi negros, cristal plano, halos apenas insinuados, sin
 *   animaciones de fondo y tipografía pixel reservada al logo.
 * - `vivo`: el aspecto anterior — degradados, halos grandes a la deriva y precios
 *   en tipografía pixel.
 * - `nitido`: el lenguaje de los hosts modernos — nada de cristal translúcido, sino
 *   tarjetas opacas de borde capilar, esquinas más cerradas, fondo reglado en lugar
 *   de halos y un hero partido con una consola al lado del titular.
 */
export const THEME_STYLES = [
  {
    id: 'sobrio',
    name: 'Sobrio',
    description:
      'Fondo casi negro, tarjetas planas y cero adornos en movimiento. El contenido manda.',
  },
  {
    id: 'vivo',
    name: 'Vivo',
    description: 'Halos de color, degradados y halos grandes. El aspecto original.',
  },
  {
    id: 'nitido',
    name: 'Nítido',
    description:
      'Tarjetas opacas de borde fino, fondo de rejilla y hero partido con consola. Estilo host moderno.',
  },
]

/**
 * Tipografía pixel: interruptor propio, independiente del estilo.
 *
 * Antes iba pegada al modo (`vivo` la encendía, `sobrio` la apagaba). Se separó
 * porque son dos gustos distintos: hay quien quiere los halos pero no los precios
 * en pixel, y quien quiere la web sobria conservando el guiño retro.
 *
 * - `auto`: como siempre — encendida en «vivo», apagada en los demás estilos.
 * - `on`:   precios, cifras y etiquetas en pixel, vaya el estilo que vaya.
 * - `off`:  pixel sólo en el logo; todo lo demás en la tipografía de titulares.
 */
export const PIXEL_MODES = [
  { id: 'auto', name: 'Según el estilo', description: 'Encendida sólo en «Vivo».' },
  { id: 'on', name: 'Siempre', description: 'Precios, cifras y etiquetas en tipografía pixel.' },
  { id: 'off', name: 'Nunca', description: 'Pixel sólo en el logo. Lo demás, legible.' },
]

/**
 * El diseño de HexServers.
 *
 * Esto no es «una configuración por defecto» entre muchas: es la combinación
 * declarada, la que se cuida y contra la que se prueba todo. Entre estilos, paletas,
 * tipografía pixel, sprites y vistas de catálogo hay más de ochocientas maneras de
 * ver esta web, y una web que puede verse de ochocientas maneras no tiene un
 * aspecto: tiene un configurador. Las demás combinaciones siguen ahí y funcionan,
 * pero son accesorios — ésta es la casa.
 *
 * Las tres decisiones que la definen:
 *
 *   `nitido`      superficies planas de borde fino en lugar de cristal y halos. Es
 *                 el lenguaje de los hosts con los que compites.
 *   `pixel: off`  ningún dato en tipografía de 8 bits. Un precio o una cifra de RAM
 *                 se leen para decidir una compra, y ahí el pixel resta. Sobrevive
 *                 en el logo y en el sello del pie, que no son datos.
 *   `sprites: on` el guiño retro, en dos sitios contados. Ver el punto anterior:
 *                 es lo mismo dicho de otra forma.
 */
export const DEFAULT_THEME = {
  preset: 'noche',
  style: 'nitido',
  /* Ver PIXEL_MODES: 'auto' | 'on' | 'off'. */
  pixel: 'off',
  /* Sprites de pixel art animados. Sólo quedan dos: la píldora del hero y el sello
     del footer — repartirlos por todas las secciones los convertía en el estilo. */
  sprites: true,
  primary: '#5b8def',
  accent: '#7a6ff0',
  background: '#07070a',
  surface: '#0e0e13',
  text: '#e4e6ee',
  /* Si el visitante puede ajustar la apariencia desde el navbar. */
  allowViewer: true,
}

/** Fondos sugeridos en el selector del visitante. Todos oscuros a propósito. */
export const BACKGROUND_PRESETS = [
  { id: 'negro', name: 'Negro', value: '#000000' },
  { id: 'carbon', name: 'Carbón', value: '#07070a' },
  { id: 'azul', name: 'Azul noche', value: '#060911' },
  { id: 'bosque', name: 'Verde noche', value: '#050a08' },
  { id: 'cafe', name: 'Café', value: '#0a0705' },
]

/** Combinaciones listas para usar. `custom` no está aquí: es "ninguna de estas". */
export const THEME_PRESETS = [
  { id: 'noche', name: 'Noche', primary: '#5b8def', accent: '#7a6ff0', background: '#07070a', surface: '#0e0e13', text: '#e4e6ee' },
  { id: 'grafito', name: 'Grafito', primary: '#8ea3bf', accent: '#64748b', background: '#050506', surface: '#0d0e10', text: '#e6e7ea' },
  { id: 'bosque', name: 'Bosque', primary: '#3f9d72', accent: '#2f8f8f', background: '#050907', surface: '#0c1310', text: '#e3ede7' },
  { id: 'brasa', name: 'Brasa', primary: '#d97642', accent: '#b8453a', background: '#0a0705', surface: '#140f0b', text: '#f0e7e1' },
  { id: 'arctic', name: 'Arctic', primary: '#06b6d4', accent: '#6366f1', background: '#060f14', surface: '#0a161c', text: '#e2f0f5' },
  { id: 'hex', name: 'Hex (original)', primary: '#4f7cff', accent: '#a855f7', background: '#0a0a0f', surface: '#0d0d12', text: '#e7e9f0' },
  /* Las dos siguientes están pensadas para el estilo «Nítido»: son las paletas que
     usan los hosts en los que se inspira. Funcionan igual en los otros estilos. */
  { id: 'violeta', name: 'Violeta', primary: '#8c32ff', accent: '#a762ff', background: '#07051b', surface: '#14112f', text: '#f0f0ff' },
  { id: 'acero', name: 'Acero', primary: '#3b82f6', accent: '#6366f1', background: '#0a0b10', surface: '#151a24', text: '#e8eaf2' },
]

/**
 * Escalones de cada rampa. Positivo = mezcla con blanco, negativo = con negro.
 * Los valores están ajustados para reproducir la paleta original a partir de su
 * color 500, así que cualquier otro color base genera una rampa equivalente.
 */
const PRIMARY_RAMP = { 50: 0.93, 200: 0.62, 300: 0.4, 400: 0.2, 500: 0, 600: -0.12, 700: -0.28 }
const ACCENT_RAMP = { 400: 0.25, 500: 0, 600: -0.14 }

/* --------------------------------- color ---------------------------------- */

/** '#4f7cff' | '#4cf' → [r, g, b]. Devuelve null si no es un hex válido. */
export function parseHex(value) {
  const raw = String(value || '').trim().replace(/^#/, '')
  const full = raw.length === 3 ? raw.replace(/./g, (c) => c + c) : raw
  if (!/^[0-9a-f]{6}$/i.test(full)) return null
  return [full.slice(0, 2), full.slice(2, 4), full.slice(4, 6)].map((part) => parseInt(part, 16))
}

const clampByte = (n) => Math.max(0, Math.min(255, Math.round(n)))

export const toHex = (rgb) => `#${rgb.map((n) => clampByte(n).toString(16).padStart(2, '0')).join('')}`

/** Mezcla lineal de dos colores. `amount` 0 = `a`, 1 = `b`. */
export function mix(a, b, amount) {
  return a.map((channel, index) => channel + (b[index] - channel) * amount)
}

/** `amount` > 0 aclara hacia el blanco, < 0 oscurece hacia el negro. */
export function shade(rgb, amount) {
  return amount >= 0 ? mix(rgb, [255, 255, 255], amount) : mix(rgb, [0, 0, 0], -amount)
}

/** Normaliza un color de entrada; si no es válido devuelve el de fábrica. */
const safeColor = (value, fallback) => parseHex(value) || parseHex(fallback)

/** Luminancia relativa (sRGB). 0 = negro, 1 = blanco. */
function luminance([r, g, b]) {
  const channel = (value) => {
    const v = value / 255
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

/**
 * Oscurece un color hasta que el texto claro siga leyéndose encima.
 *
 * El visitante elige el fondo que quiera, pero todo el diseño —texto claro sobre
 * cristal translúcido— asume fondo oscuro. En vez de prohibir colores, se conserva
 * el tono y se baja el brillo: un blanco acaba en gris muy oscuro y un azul chillón
 * en azul noche, que es lo que la persona buscaba de todas formas.
 */
export function clampDark(value, maxLuminance = 0.012) {
  let rgb = safeColor(value, DEFAULT_THEME.background)
  for (let i = 0; i < 24 && luminance(rgb) > maxLuminance; i++) {
    rgb = mix(rgb, [0, 0, 0], 0.12)
  }
  return toHex(rgb)
}

/** Superficie (modales, menús) a juego con un fondo: el mismo tono, un punto más claro. */
export function surfaceFrom(background) {
  return toHex(mix(safeColor(background, DEFAULT_THEME.background), [255, 255, 255], 0.05))
}

/**
 * Tema del sitio + preferencias del visitante. El documento manda; lo que el
 * visitante elige desde el navbar se superpone sólo en su dispositivo.
 */
export function mergeTheme(theme = {}, viewer = {}) {
  if (theme.allowViewer === false) return theme

  const preset = THEME_PRESETS.find((item) => item.id === viewer.preset)
  const merged = {
    ...theme,
    ...(preset ? presetColors(preset) : null),
    ...(viewer.style ? { style: viewer.style } : null),
    ...(viewer.pixel ? { pixel: viewer.pixel } : null),
  }

  if (viewer.background) {
    merged.background = clampDark(viewer.background)
    merged.surface = surfaceFrom(merged.background)
  }
  return merged
}

/* --------------------------------- variables -------------------------------- */

/** Colores base → mapa de variables CSS listo para escribir en el DOM. */
export function themeVars(theme = {}) {
  const primary = safeColor(theme.primary, DEFAULT_THEME.primary)
  const accent = safeColor(theme.accent, DEFAULT_THEME.accent)
  const background = safeColor(theme.background, DEFAULT_THEME.background)
  const surface = safeColor(theme.surface, DEFAULT_THEME.surface)
  const text = safeColor(theme.text, DEFAULT_THEME.text)

  const vars = {
    '--color-void': toHex(background),
    '--color-void-2': toHex(surface),
    '--color-ink': toHex(text),
  }
  for (const [stop, amount] of Object.entries(PRIMARY_RAMP)) {
    vars[`--color-hex-${stop}`] = toHex(shade(primary, amount))
  }
  for (const [stop, amount] of Object.entries(ACCENT_RAMP)) {
    vars[`--color-plasma-${stop}`] = toHex(shade(accent, amount))
  }
  return vars
}

const STYLE_IDS = new Set(THEME_STYLES.map((option) => option.id))

/** Estilo normalizado: cualquier valor raro cae en el de fábrica. */
export const resolveStyle = (theme) => (STYLE_IDS.has(theme?.style) ? theme.style : 'sobrio')

/**
 * ¿Se pinta la tipografía pixel? Traduce el ajuste de tres estados a un sí/no,
 * resolviendo `auto` contra el estilo que esté activo.
 */
export function resolvePixel(theme) {
  const mode = theme?.pixel
  if (mode === 'on' || mode === 'off') return mode
  return resolveStyle(theme) === 'vivo' ? 'on' : 'off'
}

/**
 * Escribe la paleta en <html>. Llamar cada vez que cambie `site.theme`.
 *
 * El estilo y la tipografía viajan como atributos (`data-style`, `data-pixel`) en
 * lugar de como variables porque no son valores sino modos: index.css cuelga de
 * ellos las reglas del modo sobrio y de la tipografía pixel. Son dos atributos
 * distintos justamente para que se puedan combinar en las cuatro maneras.
 */
export function applyTheme(theme) {
  const root = document.documentElement
  for (const [name, value] of Object.entries(themeVars(theme))) {
    root.style.setProperty(name, value)
  }
  root.dataset.style = resolveStyle(theme)
  root.dataset.pixel = resolvePixel(theme)
}

/** Sólo los colores de un preset: `id` y `name` no son parte del tema. */
export const presetColors = (preset) => ({
  preset: preset.id,
  primary: preset.primary,
  accent: preset.accent,
  background: preset.background,
  surface: preset.surface,
  text: preset.text,
})

/** Preset cuyos colores coinciden exactamente con los actuales, si lo hay. */
export function matchPreset(theme = {}) {
  return (
    THEME_PRESETS.find((preset) =>
      ['primary', 'accent', 'background', 'surface', 'text'].every(
        (key) => String(theme[key]).toLowerCase() === preset[key],
      ),
    )?.id || 'custom'
  )
}
