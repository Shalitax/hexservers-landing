import { useEffect, useState } from 'react'
import { X, Boxes, FileText, Tag, Plug, Database, Palette, LifeBuoy } from 'lucide-react'
import { useSite } from '../store/useSite.js'
import { cx } from '../lib/utils.js'
import CatalogPanel from './panels/CatalogPanel.jsx'
import ContentPanel from './panels/ContentPanel.jsx'
import ThemePanel from './panels/ThemePanel.jsx'
import PromoPanel from './panels/PromoPanel.jsx'
import WhmcsPanel from './panels/WhmcsPanel.jsx'
import DataPanel from './panels/DataPanel.jsx'
import HubPanel from './panels/HubPanel.jsx'

const TABS = [
  { id: 'catalog', label: 'Catálogo', icon: Boxes, Component: CatalogPanel },
  { id: 'content', label: 'Contenido', icon: FileText, Component: ContentPanel },
  { id: 'hub', label: 'Hub', icon: LifeBuoy, Component: HubPanel },
  { id: 'theme', label: 'Diseño', icon: Palette, Component: ThemePanel },
  { id: 'promo', label: 'Promo', icon: Tag, Component: PromoPanel },
  { id: 'whmcs', label: 'WHMCS', icon: Plug, Component: WhmcsPanel },
  { id: 'data', label: 'Datos', icon: Database, Component: DataPanel },
]

/** Cajón lateral de administración. */
export default function AdminPanel({ onEditProduct, onEditPlan }) {
  const open = useSite((s) => s.panelOpen)
  const setPanelOpen = useSite((s) => s.setPanelOpen)
  const [tab, setTab] = useState('catalog')

  useEffect(() => {
    if (!open) return
    const onKey = (event) => event.key === 'Escape' && setPanelOpen(false)
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, setPanelOpen])

  if (!open) return null

  const Active = TABS.find((t) => t.id === tab).Component

  return (
    <>
      <div
        className="fixed inset-0 z-[85] bg-black/50 backdrop-blur-[2px] lg:hidden"
        onClick={() => setPanelOpen(false)}
        aria-hidden="true"
      />

      <aside
        className="fixed inset-y-0 right-0 z-[86] flex w-full max-w-xl flex-col border-l border-white/10 bg-void-2/95 shadow-2xl backdrop-blur-2xl"
        aria-label="Panel de administración"
      >
        <header className="flex items-center justify-between gap-3 border-b border-white/8 px-5 py-4">
          <div>
            <h2 className="display text-base font-bold text-white">Panel de administración</h2>
            <p className="text-[11px] text-slate-500">
              Cambios guardados automáticamente en la base de datos local
            </p>
          </div>
          <button
            onClick={() => setPanelOpen(false)}
            aria-label="Cerrar panel"
            className="rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
          >
            <X size={18} />
          </button>
        </header>

        <nav className="no-scrollbar flex gap-1 overflow-x-auto border-b border-white/8 px-3 py-2">
          {TABS.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              aria-current={tab === item.id}
              className={cx(
                'inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition',
                tab === item.id
                  ? 'bg-hex-500/18 text-hex-200 ring-1 ring-hex-500/35'
                  : 'text-slate-500 hover:bg-white/[0.06] hover:text-white',
              )}
            >
              <item.icon size={14} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="flex-1 overflow-y-auto px-5 py-5 pb-24">
          <Active onEditProduct={onEditProduct} onEditPlan={onEditPlan} />
        </div>
      </aside>
    </>
  )
}
