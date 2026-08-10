import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Activity, RefreshCw } from 'lucide-react'
import { useSite } from '../store/useSite.js'
import { cx } from '../lib/utils.js'
import { measureLatency, latencyTone, pingTarget } from '../lib/latency.js'
import SectionHeading from './SectionHeading.jsx'
import Flag from './ui/Flag.jsx'

const TONES = {
  emerald: 'border-emerald-400/20 bg-emerald-400/10 !text-emerald-300',
  amber: 'border-amber-400/20 bg-amber-400/10 !text-amber-300',
  rose: 'border-rose-400/20 bg-rose-400/10 !text-rose-300',
  slate: 'border-line bg-surface-2 !text-slate-400',
}

const DOTS = {
  emerald: 'bg-emerald-400',
  amber: 'bg-amber-400',
  rose: 'bg-rose-400',
  slate: 'bg-slate-500',
}

/**
 * Ubicaciones con latencia medida en vivo.
 *
 * Sólo se mide cuando la sección entra en pantalla: no tiene sentido lanzar
 * peticiones por una sección que el visitante quizá no llegue a ver.
 */
export default function Locations() {
  const locations = useSite((s) => s.site.locations)
  const editMode = useSite((s) => s.editMode)
  const sectionRef = useRef(null)

  const live = locations.liveLatency !== false
  const { results, running, measure, measurable } = useLatencies(locations.items, live, sectionRef)

  return (
    <section id="ubicaciones" ref={sectionRef} className="section">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Red"
          titlePath="locations.title"
          subtitlePath="locations.subtitle"
        />

        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {locations.items.map((location) => {
            const online = location.status !== 'soon'
            return (
              <div
                key={location.id}
                className={cx(
                  'glass glass-hover flex items-center gap-3.5 p-4',
                  !online && 'opacity-60',
                )}
              >
                <Flag flag={location.flag} size={30} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-white">{location.city}</div>
                  <div className="truncate text-xs text-slate-500">{location.country}</div>
                  {editMode && online && !pingTarget(location.pingUrl) && (
                    <div className="mt-1 text-micro text-amber-400/80">
                      Sin endpoint: se muestra el valor fijo
                    </div>
                  )}
                </div>

                <LatencyChip
                  location={location}
                  result={results[location.id]}
                  live={live}
                />
              </div>
            )
          })}
        </div>

        {/* Pie: de dónde sale el número y cómo repetir la medición */}
        {live && measurable > 0 && (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-center">
            <p className="inline-flex items-center gap-2 text-xs text-slate-500">
              <Activity size={13} className="text-hex-400" />
              {locations.latencyNote}
            </p>
            <button
              onClick={measure}
              disabled={running}
              className="btn-ghost btn-sm py-1.5 disabled:opacity-50"
            >
              <RefreshCw size={12} className={running ? 'animate-spin' : undefined} />
              {running ? 'Midiendo…' : 'Medir de nuevo'}
            </button>
          </div>
        )}
      </div>
    </section>
  )
}

/* --------------------------------- píldora --------------------------------- */

function LatencyChip({ location, result, live }) {
  if (location.status === 'soon') {
    return <span className={cx('chip shrink-0', TONES.amber)}>Próximamente</span>
  }

  // Sin endpoint configurado (o medición desactivada): el valor declarado en el panel.
  if (!live || !result || result.status === 'unset') {
    return (
      <span
        className={cx('chip shrink-0', TONES.slate)}
        title="Valor de referencia declarado en el panel de administración"
      >
        <span className={cx('size-1.5 rounded-full', DOTS.slate)} />
        {location.ping || '—'}
      </span>
    )
  }

  if (result.status === 'measuring') {
    return (
      <span className={cx('chip shrink-0', TONES.slate)}>
        <span className="relative flex size-1.5">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-hex-400 opacity-75" />
          <span className="relative inline-flex size-1.5 rounded-full bg-hex-400" />
        </span>
        Midiendo…
      </span>
    )
  }

  if (result.status === 'unreachable') {
    return (
      <span
        className={cx('chip shrink-0', TONES.rose)}
        title="El endpoint de esta ubicación no respondió"
      >
        <span className={cx('size-1.5 rounded-full', DOTS.rose)} />
        Sin respuesta
      </span>
    )
  }

  const tone = latencyTone(result.ms)
  return (
    <span
      className={cx('chip shrink-0', TONES[tone])}
      title="Latencia HTTP medida desde tu navegador"
    >
      <span className={cx('size-1.5 rounded-full', DOTS[tone])} />
      {result.ms} ms
    </span>
  )
}

/* ---------------------------------- hook ---------------------------------- */

/** Mide en paralelo por ubicación (cada host abre su propia conexión). */
function useLatencies(items, live, sectionRef) {
  const [results, setResults] = useState({})
  const [running, setRunning] = useState(false)
  const abortRef = useRef(null)

  const targets = useMemo(
    () =>
      items
        .filter((item) => item.status !== 'soon' && pingTarget(item.pingUrl))
        .map((item) => ({ id: item.id, url: item.pingUrl })),
    [items],
  )

  const measure = useCallback(async () => {
    if (!targets.length) return

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setRunning(true)
    setResults(Object.fromEntries(targets.map((t) => [t.id, { status: 'measuring', ms: null }])))

    await Promise.all(
      targets.map(async (target) => {
        const result = await measureLatency(target.url, { signal: controller.signal })
        if (controller.signal.aborted) return
        setResults((prev) => ({ ...prev, [target.id]: result }))
      }),
    )

    if (!controller.signal.aborted) setRunning(false)
  }, [targets])

  // Primera medición al asomar la sección; se corta si el componente desaparece.
  useEffect(() => {
    if (!live || !targets.length || !sectionRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          observer.disconnect()
          measure()
        }
      },
      { rootMargin: '200px' },
    )
    observer.observe(sectionRef.current)

    return () => observer.disconnect()
  }, [live, targets, measure, sectionRef])

  useEffect(() => () => abortRef.current?.abort(), [])

  return { results, running, measure, measurable: targets.length }
}
