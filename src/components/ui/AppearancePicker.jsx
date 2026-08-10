import { useEffect, useRef, useState } from 'react'
import { Check, Palette, RotateCcw } from 'lucide-react'
import { useSite } from '../../store/useSite.js'
import { cx } from '../../lib/utils.js'
import {
  BACKGROUND_PRESETS,
  PIXEL_MODES,
  THEME_PRESETS,
  THEME_STYLES,
  clampDark,
} from '../../lib/theme.js'

/**
 * Selector de apariencia para el visitante: estilo, tipografía, color y fondo.
 *
 * Lo que elija vive en su navegador y no toca el contenido del sitio — la
 * configuración del admin sigue siendo la que ve todo el mundo por defecto, y
 * *Restablecer* vuelve a ella. Se puede desactivar entero desde el panel → Diseño.
 *
 * El fondo admite cualquier color, pero se oscurece antes de aplicarlo
 * (`clampDark`): el diseño es texto claro sobre cristal y un fondo claro lo dejaría
 * ilegible. Se conserva el tono, se baja el brillo.
 */
export default function AppearancePicker({ variant = 'menu' }) {
  const allowViewer = useSite((s) => s.site.theme.allowViewer !== false)
  const siteTheme = useSite((s) => s.site.theme)
  const viewer = useSite((s) => s.viewerTheme)
  const setViewerTheme = useSite((s) => s.setViewerTheme)
  const resetViewerTheme = useSite((s) => s.resetViewerTheme)
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

  if (!allowViewer) return null

  const activeStyle = viewer.style || siteTheme.style || 'sobrio'
  const activePixel = viewer.pixel || siteTheme.pixel || 'auto'
  const activePreset = viewer.preset || ''
  const activeBackground = viewer.background || ''
  const touched = Boolean(viewer.preset || viewer.style || viewer.pixel || viewer.background)

  const panel = (
    <div className="space-y-4">
      {/* Estilo */}
      <section>
        <h3 className="label !mb-1.5">Estilo</h3>
        <div className="grid grid-cols-3 gap-1.5">
          {THEME_STYLES.map((option) => (
            <button
              key={option.id}
              onClick={() => setViewerTheme({ style: option.id })}
              aria-pressed={activeStyle === option.id}
              title={option.description}
              className={cx(
                'rounded-lg border px-2 py-2 text-micro font-semibold transition',
                activeStyle === option.id
                  ? 'border-hex-500/50 bg-hex-500/15 text-white'
                  : 'border-line bg-surface-1 text-slate-400 hover:text-white',
              )}
            >
              {option.name}
            </button>
          ))}
        </div>
      </section>

      {/* Tipografía pixel: se elige aparte del estilo, a propósito. */}
      <section>
        <h3 className="label !mb-1.5">Tipografía pixel</h3>
        <div className="grid grid-cols-3 gap-1.5">
          {PIXEL_MODES.map((option) => (
            <button
              key={option.id}
              onClick={() => setViewerTheme({ pixel: option.id })}
              aria-pressed={activePixel === option.id}
              title={option.description}
              className={cx(
                'rounded-lg border px-2 py-2 text-micro font-semibold transition',
                activePixel === option.id
                  ? 'border-hex-500/50 bg-hex-500/15 text-white'
                  : 'border-line bg-surface-1 text-slate-400 hover:text-white',
              )}
            >
              {option.id === 'auto' ? 'Auto' : option.name}
            </button>
          ))}
        </div>
      </section>

      {/* Color */}
      <section>
        <h3 className="label !mb-1.5">Color</h3>
        <div className="flex flex-wrap gap-2">
          {THEME_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => setViewerTheme({ preset: preset.id })}
              title={preset.name}
              aria-label={`Color ${preset.name}`}
              aria-pressed={activePreset === preset.id}
              className={cx(
                'grid size-8 place-items-center rounded-full border transition',
                activePreset === preset.id
                  ? 'border-white/70 scale-110'
                  : 'border-line-strong hover:border-white/40',
              )}
              style={{ background: `linear-gradient(135deg, ${preset.primary}, ${preset.accent})` }}
            >
              {activePreset === preset.id && (
                <Check size={12} className="text-white" strokeWidth={3} />
              )}
            </button>
          ))}
        </div>
      </section>

      {/* Fondo */}
      <section>
        <h3 className="label !mb-1.5">Fondo</h3>
        <div className="flex flex-wrap items-center gap-2">
          {BACKGROUND_PRESETS.map((option) => (
            <button
              key={option.id}
              onClick={() => setViewerTheme({ background: option.value })}
              title={option.name}
              aria-label={`Fondo ${option.name}`}
              aria-pressed={activeBackground === option.value}
              className={cx(
                'grid size-8 place-items-center rounded-lg border transition',
                activeBackground === option.value
                  ? 'border-white/70'
                  : 'border-line-strong hover:border-white/40',
              )}
              style={{ background: option.value }}
            >
              {activeBackground === option.value && (
                <Check size={12} className="text-white" strokeWidth={3} />
              )}
            </button>
          ))}

          {/* Cualquier otro color: se oscurece al aplicarlo. */}
          <label
            title="Elegir otro color de fondo"
            className="grid size-8 cursor-pointer place-items-center rounded-lg border border-dashed border-line-strong text-slate-400 transition hover:border-white/50 hover:text-white"
          >
            <Palette size={13} />
            <input
              type="color"
              className="sr-only"
              value={activeBackground || siteTheme.background}
              onChange={(event) => setViewerTheme({ background: clampDark(event.target.value) })}
            />
          </label>
        </div>
        <p className="mt-1.5 text-micro leading-snug text-slate-600">
          Se ajusta a un tono oscuro para que el texto se siga leyendo.
        </p>
      </section>

      {touched && (
        <button
          onClick={resetViewerTheme}
          className="btn-ghost btn-sm w-full justify-center py-2 text-micro"
        >
          <RotateCcw size={12} />
          Volver a los colores del sitio
        </button>
      )}
    </div>
  )

  // En el menú móvil no hay sitio para un desplegable dentro de otro.
  if (variant === 'inline') return panel

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label="Apariencia de la web"
        title="Apariencia"
        className="btn-ghost btn-sm p-2"
      >
        <Palette size={15} />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Apariencia"
          className="glass anim-pop absolute right-0 mt-2 w-64 bg-void-2/95 p-4"
        >
          {panel}
        </div>
      )}
    </div>
  )
}
