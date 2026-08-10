import { useEffect, useState } from 'react'
import { Copy, Check, X, Tag } from 'lucide-react'
import { useSite } from '../store/useSite.js'
import { safeUrl, cx } from '../lib/utils.js'

const DISMISS_KEY = 'hexservers:promo-dismissed'

/**
 * Popup de código promocional.
 * Disparadores: temporizador, primer scroll significativo o intención de salida.
 * "No volver a mostrar" se guarda en localStorage (preferencia de dispositivo,
 * no dato del sitio — por eso no va a IndexedDB).
 */
export default function PromoPopup() {
  const promo = useSite((s) => s.site.promo)
  const editMode = useSite((s) => s.editMode)
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [neverAgain, setNeverAgain] = useState(false)
  /* Cerrado a mano: no vuelve a aparecer aunque cambie la promo o el modo de
     edición, que reejecutarían el efecto y rearmarían los disparadores. */
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (!promo.enabled || editMode || dismissed) return
    if (localStorage.getItem(DISMISS_KEY) === promo.code) return

    let done = false
    const show = () => {
      if (done) return
      done = true
      setOpen(true)
      cleanup()
    }

    const timer = setTimeout(show, Math.max(1, Number(promo.triggerSeconds) || 8) * 1000)
    const onScroll = () => {
      if (promo.triggerOnScroll && window.scrollY > window.innerHeight * 0.5) show()
    }
    const onExit = (event) => {
      if (event.clientY <= 0) show()
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    document.addEventListener('mouseleave', onExit)

    function cleanup() {
      clearTimeout(timer)
      window.removeEventListener('scroll', onScroll)
      document.removeEventListener('mouseleave', onExit)
    }
    return cleanup
  }, [promo.enabled, promo.code, promo.triggerSeconds, promo.triggerOnScroll, editMode, dismissed])

  const close = () => {
    if (neverAgain) localStorage.setItem(DISMISS_KEY, promo.code)
    setDismissed(true)
    setOpen(false)
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(promo.code)
    } catch {
      // Fallback para contextos sin permiso de portapapeles.
      const field = document.createElement('textarea')
      field.value = promo.code
      field.style.position = 'fixed'
      field.style.opacity = '0'
      document.body.appendChild(field)
      field.select()
      document.execCommand('copy')
      field.remove()
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!open) return null

  return (
    <div
      className="anim-pop fixed right-4 bottom-4 left-4 z-[90] sm:left-auto sm:w-[24rem]"
      role="dialog"
      aria-label="Código promocional"
    >
      <div className="glass relative overflow-hidden bg-void-2/90 p-5">
        <div
          className="glow-violet pointer-events-none absolute -top-16 -right-16 size-56 opacity-70"
          aria-hidden="true"
        />

        {/* `z-10`: el bloque de contenido es posicionado y va después en el DOM, así
            que sin esto se pinta encima y se come los clicks del aspa. */}
        <button
          type="button"
          onClick={close}
          aria-label="Cerrar"
          className="absolute top-3 right-3 z-10 rounded-lg p-1.5 text-slate-500 transition hover:bg-surface-3 hover:text-white"
        >
          <X size={16} />
        </button>

        <div className="relative">
          <span className="chip pixel mb-3 border-plasma-500/30 bg-plasma-500/12 !text-micro !text-plasma-400">
            <Tag size={9} />
            {promo.badge}
          </span>

          <h3 className="display text-xl font-bold text-white">{promo.title}</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{promo.description}</p>

          {/* Código copiable */}
          <button
            onClick={copy}
            className={cx(
              'group mt-4 flex w-full items-center justify-between gap-3 rounded-xl border border-dashed px-4 py-3 transition',
              copied
                ? 'border-emerald-400/50 bg-emerald-400/10'
                : 'border-hex-500/40 bg-hex-500/[0.08] hover:border-hex-400 hover:bg-hex-500/15',
            )}
            aria-label={`Copiar código ${promo.code}`}
          >
            <span className="pixel text-sm text-white">{promo.code}</span>
            <span
              className={cx(
                'flex items-center gap-1.5 text-xs font-semibold',
                copied ? 'text-emerald-300' : 'text-hex-300',
              )}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'Copiado' : 'Copiar'}
            </span>
          </button>

          {promo.expires && (
            <p className="mt-2.5 text-center text-micro text-slate-600">{promo.expires}</p>
          )}

          <a
            href={safeUrl(promo.ctaHref)}
            onClick={close}
            className="btn-primary mt-4 w-full py-2.5"
          >
            {promo.ctaLabel}
          </a>

          <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 text-micro text-slate-600 transition hover:text-slate-400">
            <input
              type="checkbox"
              checked={neverAgain}
              onChange={(event) => setNeverAgain(event.target.checked)}
              className="size-3.5 rounded border-line-strong bg-transparent accent-hex-500"
            />
            No volver a mostrar
          </label>
        </div>
      </div>
    </div>
  )
}
