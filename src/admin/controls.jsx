import { useEffect, useRef, useState } from 'react'
import { Upload, Image as ImageIcon } from 'lucide-react'
import { cx, fileToDataUrl } from '../lib/utils.js'
import { ICON_NAMES, Icon, Glyph } from '../components/ui/icons.jsx'

export function Field({ label, hint, children, className = '' }) {
  return (
    <div className={className}>
      <label className="label">{label}</label>
      {children}
      {hint && <p className="mt-1 text-[11px] leading-snug text-slate-600">{hint}</p>}
    </div>
  )
}

// `className` estiliza el contenedor (útil para `col-span-*`), no el input.
export function TextField({ label, hint, value, onChange, textarea, className, ...props }) {
  const Tag = textarea ? 'textarea' : 'input'
  return (
    <Field label={label} hint={hint} className={className}>
      <Tag
        className={cx('input', textarea && 'min-h-20 resize-y')}
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value)}
        {...props}
      />
    </Field>
  )
}

export function NumberField({ label, hint, value, onChange, step = '0.01', className, ...props }) {
  return (
    <Field label={label} hint={hint} className={className}>
      <input
        type="number"
        step={step}
        className="input"
        value={value ?? 0}
        onChange={(event) => onChange(event.target.value === '' ? 0 : Number(event.target.value))}
        {...props}
      />
    </Field>
  )
}

export function SelectField({ label, hint, value, onChange, options, className }) {
  return (
    <Field label={label} hint={hint} className={className}>
      <select className="input" value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </Field>
  )
}

/**
 * Color en hexadecimal: muestrario nativo + campo de texto, porque pegar un
 * `#rrggbb` de la guía de marca es más rápido que buscarlo en la rueda.
 */
export function ColorField({ label, hint, value, onChange }) {
  const safe = /^#[0-9a-f]{6}$/i.test(String(value)) ? value : '#000000'

  return (
    <Field label={label} hint={hint}>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={safe}
          onChange={(event) => onChange(event.target.value)}
          aria-label={label}
          className="size-9 shrink-0 cursor-pointer rounded-lg border border-white/10 bg-transparent p-0.5"
        />
        <input
          className="input font-mono"
          value={value ?? ''}
          placeholder="#4f7cff"
          spellCheck="false"
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
    </Field>
  )
}

export function Toggle({ label, hint, checked, onChange }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 transition hover:border-white/20">
      <input
        type="checkbox"
        checked={Boolean(checked)}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 size-4 shrink-0 rounded border-white/20 bg-transparent accent-hex-500"
      />
      <span className="min-w-0">
        <span className="block text-sm font-medium text-slate-200">{label}</span>
        {hint && <span className="mt-0.5 block text-[11px] leading-snug text-slate-500">{hint}</span>}
      </span>
    </label>
  )
}

export function IconPicker({ label, value, onChange }) {
  return (
    <Field label={label}>
      <div className="grid max-h-32 grid-cols-8 gap-1 overflow-y-auto rounded-lg border border-white/10 bg-black/40 p-2">
        {ICON_NAMES.map((name) => (
          <button
            key={name}
            type="button"
            title={name}
            onClick={() => onChange(name)}
            className={cx(
              'grid aspect-square place-items-center rounded-md transition',
              value === name
                ? 'bg-hex-500/25 text-hex-200 ring-1 ring-hex-500/60'
                : 'text-slate-500 hover:bg-white/[0.07] hover:text-white',
            )}
          >
            <Icon name={name} size={15} />
          </button>
        ))}
      </div>
    </Field>
  )
}

/**
 * Icono con imagen propia opcional: la rejilla de iconos de siempre más un hueco
 * para subir una imagen (o pegar su URL) que la sustituya.
 *
 * Existe porque un icono de trazo sirve para un concepto pero no para una marca:
 * el logo de PayPal o de Mercado Pago hay que enseñarlo tal cual. Mientras haya
 * imagen, manda ella y la rejilla se muestra apagada — pero no se esconde, para que
 * quitar la imagen devuelva exactamente el icono que ya había elegido.
 */
export function GlyphField({
  label = 'Icono',
  icon,
  image,
  onIcon,
  onImage,
  hint = 'Sube una imagen (un logo, por ejemplo) para usarla en lugar del icono.',
}) {
  const fileInput = useRef(null)
  const [error, setError] = useState('')

  const upload = async (file) => {
    setError('')
    try {
      onImage(await fileToDataUrl(file))
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-3">
        <div
          className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-xl border border-white/10 bg-black/40 text-hex-300"
          title={image ? 'Se usará esta imagen' : 'Se usará este icono'}
        >
          <Glyph name={icon} image={image} size={image ? 30 : 20} />
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <TextField
            label={`${label} — imagen`}
            hint={hint}
            value={image?.startsWith('data:') ? '' : image}
            placeholder="https://… (opcional)"
            onChange={onImage}
          />
          <div className="flex gap-2">
            <button onClick={() => fileInput.current?.click()} className="btn-ghost btn-sm">
              <Upload size={13} />
              Subir imagen
            </button>
            {image && (
              <button onClick={() => onImage('')} className="btn-ghost btn-sm text-rose-400">
                Quitar y volver al icono
              </button>
            )}
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              hidden
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) upload(file)
                event.target.value = ''
              }}
            />
          </div>
          {error && <p className="text-[11px] text-rose-400">{error}</p>}
        </div>
      </div>

      <div className={cx('transition', image && 'pointer-events-none opacity-40')}>
        <IconPicker label={label} value={icon} onChange={onIcon} />
      </div>
    </div>
  )
}

/**
 * Imagen con vista previa: acepta una URL pegada o un archivo subido, que se guarda
 * como data URL en la base de datos local (máximo 1,5 MB).
 */
export function ImageField({ label = 'URL de la imagen', value, onChange, hint }) {
  const fileInput = useRef(null)
  const [error, setError] = useState('')

  const upload = async (file) => {
    setError('')
    try {
      onChange(await fileToDataUrl(file))
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="flex items-start gap-4">
      <div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-xl border border-white/10 bg-black/40">
        {value ? (
          <img src={value} alt="" className="size-full object-cover" />
        ) : (
          <ImageIcon size={20} className="text-slate-700" />
        )}
      </div>

      <div className="min-w-0 flex-1 space-y-2">
        <TextField
          label={label}
          hint={hint}
          value={value?.startsWith('data:') ? '' : value}
          onChange={onChange}
          placeholder="https://…"
        />
        <div className="flex gap-2">
          <button onClick={() => fileInput.current?.click()} className="btn-ghost btn-sm">
            <Upload size={13} />
            Subir archivo
          </button>
          {value && (
            <button onClick={() => onChange('')} className="btn-ghost btn-sm text-rose-400">
              Quitar
            </button>
          )}
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) upload(file)
              event.target.value = ''
            }}
          />
        </div>
        {error && <p className="text-[11px] text-rose-400">{error}</p>}
      </div>
    </div>
  )
}

/**
 * Selector de icono compacto: un botón con el icono actual que despliega la
 * rejilla. Pensado para filas de lista, donde `IconPicker` ocuparía demasiado.
 */
export function CompactIconPicker({ value, onChange, label = 'Cambiar icono' }) {
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

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title={label}
        aria-label={label}
        aria-expanded={open}
        className="grid size-9 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-hex-300 transition hover:border-white/25 hover:text-hex-200"
      >
        <Icon name={value} size={16} />
      </button>

      {open && (
        <div className="absolute left-0 z-30 mt-1 grid w-60 grid-cols-8 gap-1 rounded-xl border border-white/10 bg-void-2 p-2 shadow-2xl">
          {ICON_NAMES.map((name) => (
            <button
              key={name}
              type="button"
              title={name}
              onClick={() => {
                onChange(name)
                setOpen(false)
              }}
              className={cx(
                'grid aspect-square place-items-center rounded-md transition',
                value === name
                  ? 'bg-hex-500/25 text-hex-200 ring-1 ring-hex-500/60'
                  : 'text-slate-500 hover:bg-white/[0.07] hover:text-white',
              )}
            >
              <Icon name={name} size={14} />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function Row({ children, cols = 2 }) {
  return (
    <div className={cx('grid gap-3', cols === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2')}>
      {children}
    </div>
  )
}

export function PanelSection({ title, description, action, children }) {
  return (
    <section className="space-y-3">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h3 className="display text-sm font-bold text-white">{title}</h3>
          {description && <p className="mt-0.5 text-xs text-slate-500">{description}</p>}
        </div>
        {action}
      </header>
      {children}
    </section>
  )
}
