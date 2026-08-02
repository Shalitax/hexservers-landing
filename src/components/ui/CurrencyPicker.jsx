import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown, Coins } from 'lucide-react'
import { useSite, useCurrency } from '../../store/useSite.js'
import { cx } from '../../lib/utils.js'

/**
 * Selector de divisa del navbar. Los precios del catálogo están escritos en la
 * divisa base y se convierten al vuelo (ver src/lib/money.js); la elección se
 * guarda en el dispositivo, no en el contenido del sitio.
 *
 * Con una sola divisa configurada no se pinta: sería un desplegable de un ítem.
 */
export default function CurrencyPicker({ variant = 'menu' }) {
  const items = useSite((s) => s.site.currency.items)
  const setCurrency = useSite((s) => s.setCurrency)
  const active = useCurrency()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const onClick = (event) => {
      if (!ref.current?.contains(event.target)) setOpen(false)
    }
    const onKey = (event) => event.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (items.length < 2) return null

  // En el menú móvil no hay sitio para un desplegable: van todas a la vista.
  if (variant === 'inline') {
    return (
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => setCurrency(item.code)}
            aria-pressed={item.code === active.code}
            className={cx(
              'rounded-lg border px-3 py-2 text-xs font-semibold transition',
              item.code === active.code
                ? 'border-hex-500/50 bg-hex-500/15 text-white'
                : 'border-white/10 bg-white/[0.03] text-slate-400 hover:text-white',
            )}
          >
            {item.code}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={`Divisa: ${active.label}`}
        className="btn-ghost btn-sm py-2"
      >
        <Coins size={15} />
        {active.code}
        <ChevronDown
          size={14}
          className={cx('transition-transform duration-200', open && 'rotate-180')}
        />
      </button>

      {open && (
        <div
          role="listbox"
          className="glass anim-pop absolute right-0 mt-2 w-56 overflow-hidden bg-void-2/90 p-1.5"
        >
          {items.map((item) => (
            <button
              key={item.id}
              role="option"
              aria-selected={item.code === active.code}
              onClick={() => {
                setCurrency(item.code)
                setOpen(false)
              }}
              className="flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition hover:bg-white/[0.07]"
            >
              <span className="pixel w-10 shrink-0 text-[10px] text-hex-300">{item.code}</span>
              <span className="min-w-0 flex-1 truncate text-sm text-slate-300">{item.label}</span>
              {item.code === active.code && <Check size={14} className="shrink-0 text-hex-300" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
