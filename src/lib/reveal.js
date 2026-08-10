import { useEffect } from 'react'

/**
 * Revelado por scroll: que cada bloque entre cuando se llega a él.
 *
 * La web ya tenía animaciones de entrada, pero arrancaban al montar el componente,
 * o sea al cargar la página. Todo lo que estaba por debajo del pliegue terminaba de
 * animarse mucho antes de que nadie lo mirase: la animación existía y no se veía
 * nunca. Esto la ata al scroll, que es lo único que hace que se note.
 *
 * ── Cómo se usa ──────────────────────────────────────────────────────────────
 *
 *   <section data-reveal>…</section>
 *   <article data-reveal style={stagger(index)}>…</article>
 *
 * Y ya está. No hay hook que llamar en cada componente ni ref que colgar: un único
 * observador vigila el documento entero y se encarga de lo que vaya apareciendo,
 * incluido lo que React monte después —al filtrar el catálogo con el buscador, al
 * abrir una pestaña—. Marcar un atributo es todo lo que tiene que saber un
 * componente sobre las animaciones.
 *
 * ── Por qué no hay riesgo de página en blanco ────────────────────────────────
 *
 * El estado oculto sólo se aplica bajo `[data-anim='on']`, que escribe `applyTheme`
 * en <html>. Si el JS no llega a ejecutarse, si el observador falla o si las
 * animaciones están apagadas, `data-reveal` no pinta nada y el contenido se ve tal
 * cual. Es al revés de lo habitual —ocultar por CSS y confiar en que el JS
 * aparezca— porque un fallo ahí deja la web vacía, y eso no se arriesga por un
 * adorno.
 *
 * ── Una sola vez ─────────────────────────────────────────────────────────────
 *
 * Lo revelado no se vuelve a ocultar al salir de pantalla. Un bloque que se
 * desvanece cada vez que pasas por encima marea y no aporta nada.
 */

const REVEALED = 'in'

let io = null
let mo = null

/** Marca el elemento como revelado y deja de vigilarlo: ya no vuelve atrás. */
function reveal(el) {
  el.dataset.reveal = REVEALED
  io?.unobserve(el)
}

function observeWithin(node) {
  if (!io || node.nodeType !== 1) return
  if (node.hasAttribute?.('data-reveal') && node.dataset.reveal !== REVEALED) io.observe(node)
  for (const child of node.querySelectorAll?.('[data-reveal]') || []) {
    if (child.dataset.reveal !== REVEALED) io.observe(child)
  }
}

/**
 * Arranca el sistema. Se llama una vez, desde App.
 *
 * Sin `IntersectionObserver` —navegador muy viejo, o un entorno de pruebas— no se
 * monta nada y todo queda visible: el CSS no oculta hasta que alguien empieza a
 * revelar, así que la degradación es a «sin animación», no a «sin contenido».
 */
function start() {
  if (io || typeof IntersectionObserver === 'undefined') return

  io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) if (entry.isIntersecting) reveal(entry.target)
    },
    {
      /* Un margen negativo abajo hace que el bloque entre cuando ya se ve un trozo
         de verdad, no cuando asoma un píxel por el borde. */
      rootMargin: '0px 0px -12% 0px',
      threshold: 0.05,
    },
  )

  observeWithin(document.body)

  /* Lo que React monte después —resultados de una búsqueda, otra pestaña— nace sin
     vigilar. Esto lo recoge sin que ningún componente tenga que avisar. */
  if (typeof MutationObserver !== 'undefined') {
    mo = new MutationObserver((records) => {
      for (const record of records) for (const node of record.addedNodes) observeWithin(node)
    })
    mo.observe(document.body, { childList: true, subtree: true })
  }
}

function stop() {
  io?.disconnect()
  mo?.disconnect()
  io = null
  mo = null
}

/**
 * Enciende o apaga el sistema según el tema. Va en App, junto a `applyTheme`.
 *
 * Al apagarlo se limpia el atributo de lo ya revelado: si quedara `in` por ahí y
 * más tarde se volviesen a encender, esos bloques no se animarían nunca y el
 * resultado sería una página que se revela a medias.
 */
export function useRevealSystem(enabled) {
  useEffect(() => {
    if (!enabled) {
      stop()
      for (const el of document.querySelectorAll('[data-reveal]')) delete el.dataset.reveal
      return
    }
    start()
    return stop
  }, [enabled])
}

/** Estilo del escalonado: el puesto en la fila. `<div style={stagger(i)}>`. */
export const stagger = (index) => ({ '--stagger': index })
