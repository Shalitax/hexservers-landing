import { Check, Palette, RotateCcw, Wand2 } from 'lucide-react'
import { useSite } from '../../store/useSite.js'
import { cx } from '../../lib/utils.js'
import {
  DEFAULT_THEME,
  PIXEL_MODES,
  THEME_PRESETS,
  THEME_STYLES,
  matchPreset,
  parseHex,
  resolvePixel,
  themeVars,
} from '../../lib/theme.js'
import PixelSprite, { SPRITE_NAMES } from '../../components/ui/PixelSprite.jsx'
import { ColorField, PanelSection, Toggle } from '../controls.jsx'

const FIELDS = [
  { key: 'primary', label: 'Color principal', hint: 'Botones, enlaces, halos y estados activos.' },
  { key: 'accent', label: 'Color de acento', hint: 'Degradados y el segundo glow del fondo.' },
  { key: 'background', label: 'Fondo', hint: 'El lienzo de toda la web.' },
  { key: 'surface', label: 'Superficie', hint: 'Modales, menús y el panel de administración.' },
  { key: 'text', label: 'Texto base', hint: 'Color de referencia del cuerpo de texto.' },
]

/** Escalones que se enseñan en la tira de vista previa. */
const RAMP_PREVIEW = [
  '--color-hex-200',
  '--color-hex-300',
  '--color-hex-400',
  '--color-hex-500',
  '--color-hex-600',
  '--color-hex-700',
  '--color-plasma-400',
  '--color-plasma-500',
  '--color-plasma-600',
]

/**
 * Pestaña "Diseño": la paleta del sitio. Se escriben unos pocos colores base y de
 * ellos se derivan todas las variables CSS (ver src/lib/theme.js). El cambio se
 * aplica al instante sobre la página que hay detrás del panel.
 */
export default function ThemePanel() {
  const theme = useSite((s) => s.site.theme)
  const viewerTheme = useSite((s) => s.viewerTheme)
  const resetViewerTheme = useSite((s) => s.resetViewerTheme)
  const rawSetField = useSite((s) => s.setField)

  const active = matchPreset(theme)
  const vars = themeVars(theme)
  const viewerTouched = Boolean(
    viewerTheme.preset || viewerTheme.style || viewerTheme.pixel || viewerTheme.background,
  )

  /**
   * Si en este navegador habías elegido tu propia apariencia desde el selector del
   * navbar, se descarta al tocar aquí: si no, estarías editando los colores del
   * sitio sin poder verlos.
   */
  const setField = (path, value) => {
    if (viewerTouched) resetViewerTheme()
    rawSetField(path, value)
  }

  const applyPreset = (preset, style, pixel) => {
    for (const field of FIELDS) setField(`theme.${field.key}`, preset[field.key])
    setField('theme.preset', preset.id)
    if (style) setField('theme.style', style)
    if (pixel) setField('theme.pixel', pixel)
  }

  const setColor = (key, value) => {
    setField(`theme.${key}`, value)
    setField('theme.preset', 'custom')
  }

  return (
    <div className="space-y-8">
      <p className="rounded-xl border border-hex-500/20 bg-hex-500/[0.06] p-3 text-micro leading-relaxed text-hex-200/90">
        Los cambios se ven al momento en la página de detrás. De cada color base sale una rampa
        completa (claros y oscuros), así que con dos colores ya tienes el sitio entero repintado.
      </p>

      <PanelSection
        title="Estilo"
        description="Cuánto adorno lleva la interfaz. Se cambia en un click y se vuelve igual de rápido."
      >
        <div className="grid gap-2 sm:grid-cols-3">
          {THEME_STYLES.map((option) => (
            <ModeButton
              key={option.id}
              option={option}
              active={(theme.style || 'sobrio') === option.id}
              onClick={() => setField('theme.style', option.id)}
            />
          ))}
        </div>

        {/**
         * «Nítido» está pensado con su propia paleta y sin tipografía pixel: los
         * botones de arriba cambian sólo el estilo, y este deja el conjunto tal y
         * como se diseñó, de una vez.
         */}
        <button
          onClick={() =>
            applyPreset(THEME_PRESETS.find((preset) => preset.id === 'violeta'), 'nitido', 'off')
          }
          className="btn-ghost btn-sm w-full py-2.5"
        >
          <Wand2 size={13} />
          Montar el template nítido entero (Violeta · Nítido)
        </button>
      </PanelSection>

      <PanelSection
        title="Tipografía pixel"
        description="Los precios, las cifras y las etiquetas en tipografía de 8 bits. Es una decisión aparte del estilo: se pueden combinar como quieras."
      >
        <div className="grid gap-2 sm:grid-cols-3">
          {PIXEL_MODES.map((option) => (
            <ModeButton
              key={option.id}
              option={option}
              active={(theme.pixel || 'auto') === option.id}
              onClick={() => setField('theme.pixel', option.id)}
            />
          ))}
        </div>

        <p className="glass-soft flex items-center justify-between gap-3 p-3">
          <span className="text-micro text-slate-500">
            Ahora mismo está{' '}
            <strong className="text-slate-400">
              {resolvePixel(theme) === 'on' ? 'encendida' : 'apagada'}
            </strong>
            .
          </span>
          <span className="pixel shrink-0 text-sm text-hex-300">19,99 US$</span>
        </p>
      </PanelSection>

      <PanelSection
        title="Iconos pixel animados"
        description="El guiño retro, en dos sitios contados: la píldora del hero y el sello del footer."
      >
        <Toggle
          label="Pintar los sprites"
          hint="Estaban también en el antetítulo de cada sección y se quitaron: un guiño que sale seis veces al bajar deja de ser un guiño y pasa a ser el estilo de la web. Se quedan quietos si el visitante tiene activado «reducir movimiento» en su sistema."
          checked={theme.sprites === true}
          onChange={(value) => setField('theme.sprites', value)}
        />

        <div className="glass-soft flex flex-wrap items-center gap-3 p-3 text-hex-300">
          {SPRITE_NAMES.map((name) => (
            <PixelSprite key={name} name={name} size={22} speed="1s" />
          ))}
        </div>
      </PanelSection>

      <PanelSection title="Combinaciones" description="Un punto de partida decente.">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {THEME_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => applyPreset(preset)}
              aria-pressed={active === preset.id}
              className={cx(
                'flex items-center gap-2.5 rounded-xl border p-2.5 text-left transition',
                active === preset.id
                  ? 'border-hex-500/60 bg-hex-500/12'
                  : 'border-line bg-surface-1 hover:border-line-strong hover:bg-surface-2',
              )}
            >
              <span
                className="grid size-11 shrink-0 place-items-center rounded-lg border border-line"
                style={{
                  background: `linear-gradient(135deg, ${preset.primary}, ${preset.accent})`,
                }}
              >
                {active === preset.id && <Check size={14} className="text-white" strokeWidth={3} />}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-slate-200">
                  {preset.name}
                </span>
                <span className="block truncate font-mono text-micro text-slate-500">
                  {preset.primary}
                </span>
              </span>
            </button>
          ))}
        </div>

        {active === 'custom' && (
          <p className="flex items-center gap-2 text-micro text-slate-500">
            <Palette size={12} className="text-hex-400" />
            Paleta personalizada.
          </p>
        )}
      </PanelSection>

      <PanelSection title="Colores base">
        <div className="space-y-3">
          {FIELDS.map((field) => (
            <ColorField
              key={field.key}
              label={field.label}
              hint={field.hint}
              value={theme[field.key]}
              onChange={(value) => setColor(field.key, value)}
            />
          ))}
        </div>

        {FIELDS.some((field) => !parseHex(theme[field.key])) && (
          <p className="rounded-xl border border-amber-400/25 bg-amber-400/[0.07] p-3 text-micro text-amber-200">
            Hay algún color con un valor que no es hexadecimal (#rrggbb). Mientras tanto se usa el
            de fábrica para ese hueco.
          </p>
        )}
      </PanelSection>

      <PanelSection
        title="Rampa generada"
        description="Los tonos que salen de tus colores base y que usa toda la web."
      >
        <div className="flex overflow-hidden rounded-xl border border-line">
          {RAMP_PREVIEW.map((name) => (
            <div
              key={name}
              title={`${name}: ${vars[name]}`}
              className="h-12 flex-1"
              style={{ background: vars[name] }}
            />
          ))}
        </div>

        <div className="glass-soft space-y-3 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <button className="btn-primary btn-sm">Botón principal</button>
            <button className="btn-ghost btn-sm">Secundario</button>
            <span className="chip">Etiqueta</span>
            <span className="eyebrow">Eyebrow</span>
          </div>
          <p className="text-sm text-slate-400">
            Texto normal con un <span className="text-gradient font-semibold">degradado</span> y un{' '}
            <a href="#/productos" className="font-semibold text-hex-300">
              enlace
            </a>
            .
          </p>
        </div>
      </PanelSection>

      <PanelSection
        title="Apariencia del visitante"
        description="El selector de la paleta que aparece en el navbar, junto al de divisa."
      >
        <Toggle
          label="Dejar que el visitante ajuste la apariencia"
          hint="Puede cambiar estilo, color y fondo sólo en su navegador; lo que configures aquí sigue siendo lo que ve todo el mundo al entrar. Desactívalo si prefieres que tu web se vea siempre igual."
          checked={theme.allowViewer !== false}
          onChange={(value) => setField('theme.allowViewer', value)}
        />
      </PanelSection>

      <PanelSection title="Restablecer" description="Dos vueltas atrás, según lo que quieras deshacer.">
        <button
          onClick={() => {
            applyPreset(
              { ...DEFAULT_THEME, id: DEFAULT_THEME.preset },
              DEFAULT_THEME.style,
              DEFAULT_THEME.pixel,
            )
            setField('theme.sprites', DEFAULT_THEME.sprites)
          }}
          className="btn-primary btn-sm w-full py-2.5"
        >
          <RotateCcw size={13} />
          El diseño de HexServers (Noche · Nítido)
        </button>
        <p className="text-micro leading-relaxed text-slate-600">
          La combinación declarada: la que se cuida y contra la que se prueba todo. Lo de arriba se
          puede cambiar entero, pero si algo se te descuadra, este botón vuelve a terreno conocido.
        </p>

        <button
          onClick={() =>
            applyPreset(THEME_PRESETS.find((preset) => preset.id === 'hex'), 'vivo', 'on')
          }
          className="btn-ghost btn-sm w-full py-2.5"
        >
          <RotateCcw size={13} />
          Recuperar el aspecto original (Hex · Vivo)
        </button>
        <p className="text-micro leading-relaxed text-slate-600">
          El segundo botón deja la web exactamente como estaba antes del rediseño: paleta azul
          eléctrica, halos grandes, degradados y precios en tipografía pixel.
        </p>
      </PanelSection>
    </div>
  )
}

/** Opción de un modo (estilo o tipografía): nombre, explicación y marca de activo. */
function ModeButton({ option, active, onClick }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={cx(
        'rounded-xl border p-3 text-left transition',
        active
          ? 'border-hex-500/60 bg-hex-500/12'
          : 'border-line bg-surface-1 hover:border-line-strong hover:bg-surface-2',
      )}
    >
      <span className="flex items-center gap-2">
        <span
          className={cx(
            'grid size-4 shrink-0 place-items-center rounded-full border transition',
            active ? 'border-hex-400 bg-hex-500' : 'border-line-strong',
          )}
        >
          {active && <Check size={10} className="text-white" strokeWidth={3.5} />}
        </span>
        <span className="text-sm font-medium text-slate-200">{option.name}</span>
      </span>
      <span className="mt-1.5 block text-micro leading-snug text-slate-500">
        {option.description}
      </span>
    </button>
  )
}
