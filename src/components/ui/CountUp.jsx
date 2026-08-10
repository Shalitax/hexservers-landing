import { useEffect, useRef, useState } from 'react'
import { useSite } from '../../store/useSite.js'

/**
 * Una cifra que cuenta hasta su valor cuando entra en pantalla.
 *
 * Las métricas del hero son textos libres que escribe el admin: «99,9 %», «< 60 s»,
 * «4 ubicaciones», «1 Tbps». No son números, son frases con un número dentro, así
 * que aquí no se puede parsear a `Number` y ya está — hay que localizar el trozo
 * numérico, animar sólo ese y devolver el resto intacto. Lo que no tenga ningún
 * número se pinta tal cual sin animar nada.
 *
 * Se respetan los decimales del original: «99,9» cuenta con un decimal y «60» sin
 * ninguno, para que la cifra no baile de ancho mientras sube. Y se conserva el
 * separador que venía escrito, coma o punto, porque cambiarlo a mitad de animación
 * quedaría raro en una web en español.
 */

/* Primer número del texto, con sus decimales. Captura antes, número y después. */
const NUMBER = /^(.*?)(\d+(?:[.,]\d+)?)(.*)$/s

const easeOut = (t) => 1 - (1 - t) ** 3

export default function CountUp({ value, duration = 1100, className = '' }) {
  const animations = useSite((s) => s.site.theme.animations !== false)
  const text = String(value ?? '')
  const match = text.match(NUMBER)

  const ref = useRef(null)
  const [shown, setShown] = useState(null)

  useEffect(() => {
    const el = ref.current
    if (!el || !match || !animations) return
    if (typeof IntersectionObserver === 'undefined') return

    const [, , raw] = match
    const separator = raw.includes(',') ? ',' : '.'
    const decimals = raw.split(/[.,]/)[1]?.length || 0
    const target = Number(raw.replace(',', '.'))
    if (!Number.isFinite(target)) return

    const format = (n) => n.toFixed(decimals).replace('.', separator)
    let frame = 0
    let start = 0

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return
        observer.disconnect()

        const step = (now) => {
          if (!start) start = now
          const progress = Math.min(1, (now - start) / duration)
          setShown(format(target * easeOut(progress)))
          if (progress < 1) frame = requestAnimationFrame(step)
          /* Al terminar se suelta el valor calculado y vuelve a mandar el texto
             original: así el final es exactamente lo que escribió el admin y no
             una reconstrucción parecida. */
          else setShown(null)
        }
        frame = requestAnimationFrame(step)
      },
      { threshold: 0.4 },
    )

    observer.observe(el)
    return () => {
      observer.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [text, duration, animations, match])

  if (!match) return <span className={className}>{text}</span>

  const [, before, raw, after] = match
  return (
    <span ref={ref} className={className}>
      {before}
      {/* Ancho tabular: sin él, la cifra se ensancha y encoge mientras sube. */}
      <span className="tabular-nums">{shown ?? raw}</span>
      {after}
    </span>
  )
}
