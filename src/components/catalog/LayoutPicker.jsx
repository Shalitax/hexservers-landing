import { useSite, useCatalogLayout } from '../../store/useSite.js'
import { DENSITIES, densityOf } from '../../lib/layouts.js'
import { cx } from '../../lib/utils.js'
import { Icon } from '../ui/icons.jsx'

/**
 * Densidad del catálogo, para el visitante.
 *
 * Antes esto enseñaba las seis formas de listar el catálogo más un botón de
 * restablecer: siete controles, la mitad del ruido de la página, para responder a
 * una pregunta que no se hace nadie que venga a comprar un servidor. Las seis
 * siguen ahí — las elige el admin, en el panel. Aquí queda lo que tiene cualquier
 * tienda: ver más grande o ver más denso.
 *
 * «Tarjetas» no fija ningún modo: **borra** la preferencia del visitante, así que
 * devuelve la vista que haya elegido el sitio, sea cual sea de las que llevan
 * tarjetas. Es lo que permite que dos botones cubran seis modos sin mentir sobre
 * cuál está activo, y por eso tampoco hace falta un botón de restablecer.
 */
export default function LayoutPicker() {
  const allowViewer = useSite((s) => s.site.catalog.allowViewerLayout !== false)
  const setViewerLayout = useSite((s) => s.setViewerLayout)
  const active = densityOf(useCatalogLayout())

  if (!allowViewer) return null

  return (
    <div
      role="group"
      aria-label="Densidad del catálogo"
      className="glass-soft flex shrink-0 items-center gap-1 p-1"
    >
      {DENSITIES.map((density) => (
        <button
          key={density.id}
          onClick={() => setViewerLayout(density.id === 'lista' ? 'lista' : '')}
          aria-pressed={active === density.id}
          title={`Ver en ${density.name.toLowerCase()}`}
          className={cx(
            'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition',
            active === density.id
              ? 'bg-hex-500/20 text-white ring-1 ring-hex-500/40'
              : 'text-slate-500 hover:bg-surface-2 hover:text-white',
          )}
        >
          <Icon name={density.icon} size={13} />
          <span className="hidden sm:inline">{density.name}</span>
        </button>
      ))}
    </div>
  )
}
