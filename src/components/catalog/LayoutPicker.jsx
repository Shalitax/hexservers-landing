import { RotateCcw } from 'lucide-react'
import { useSite, useCatalogLayout } from '../../store/useSite.js'
import { CATALOG_LAYOUTS } from '../../lib/layouts.js'
import { cx } from '../../lib/utils.js'
import { Icon } from '../ui/icons.jsx'

/**
 * Selector de la forma de listar el catálogo, para el visitante.
 *
 * Vive en la propia página de productos y no en el navbar porque sólo tiene sentido
 * donde se ve el efecto. Lo que elija se guarda en su navegador; el modo que fije el
 * admin sigue siendo el que ve todo el mundo al entrar, y se puede quitar del todo
 * con `catalog.allowViewerLayout`.
 */
export default function LayoutPicker() {
  const allowViewer = useSite((s) => s.site.catalog.allowViewerLayout !== false)
  const viewerLayout = useSite((s) => s.viewerLayout)
  const setViewerLayout = useSite((s) => s.setViewerLayout)
  const active = useCatalogLayout()

  if (!allowViewer) return null

  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <span className="text-micro font-semibold tracking-wider text-slate-500 uppercase">
        Ver como
      </span>

      <div
        role="group"
        aria-label="Forma de ver el catálogo"
        className="glass-soft flex flex-wrap items-center gap-1 p-1"
      >
        {CATALOG_LAYOUTS.map((layout) => (
          <button
            key={layout.id}
            onClick={() => setViewerLayout(layout.id)}
            aria-pressed={active === layout.id}
            title={layout.description}
            className={cx(
              'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition',
              active === layout.id
                ? 'bg-hex-500/20 text-white ring-1 ring-hex-500/40'
                : 'text-slate-500 hover:bg-surface-2 hover:text-white',
            )}
          >
            <Icon name={layout.icon} size={13} />
            <span className="hidden sm:inline">{layout.short}</span>
          </button>
        ))}
      </div>

      {viewerLayout && (
        <button
          onClick={() => setViewerLayout('')}
          title="Volver a la vista por defecto de la web"
          className="btn-ghost btn-sm py-1.5 text-micro"
        >
          <RotateCcw size={11} />
          Por defecto
        </button>
      )}
    </div>
  )
}
