import { Eye, Pencil, LogOut, SlidersHorizontal, Database } from 'lucide-react'
import { useSite } from '../store/useSite.js'
import { storageEngine } from '../lib/db.js'
import { cx } from '../lib/utils.js'

/** Barra fija inferior visible sólo con sesión de administrador. */
export default function AdminBar() {
  const isAdmin = useSite((s) => s.isAdmin)
  const editMode = useSite((s) => s.editMode)
  const toggleEditMode = useSite((s) => s.toggleEditMode)
  const setPanelOpen = useSite((s) => s.setPanelOpen)
  const logout = useSite((s) => s.logout)

  if (!isAdmin) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-[80] flex justify-center p-3 sm:p-4">
      <div className="glass flex items-center gap-1.5 bg-void-2/90 p-1.5 shadow-2xl">
        <span className="hidden items-center gap-1.5 px-3 text-[10px] font-semibold tracking-wider text-slate-500 uppercase sm:flex">
          <Database size={12} className="text-hex-400" />
          {storageEngine()}
        </span>

        <button
          onClick={toggleEditMode}
          className={cx(
            'btn btn-sm gap-1.5 px-3 py-2',
            editMode
              ? 'bg-hex-500/20 text-hex-200 ring-1 ring-hex-500/40'
              : 'text-slate-400 hover:bg-white/[0.07] hover:text-white',
          )}
          title={editMode ? 'Ver como cliente' : 'Volver a editar'}
        >
          {editMode ? <Pencil size={14} /> : <Eye size={14} />}
          {editMode ? 'Editando' : 'Vista cliente'}
        </button>

        <button onClick={() => setPanelOpen(true)} className="btn-primary btn-sm gap-1.5 px-3 py-2">
          <SlidersHorizontal size={14} />
          Panel
        </button>

        <button
          onClick={logout}
          title="Cerrar sesión de administrador"
          aria-label="Cerrar sesión"
          className="btn btn-sm p-2 text-slate-500 hover:bg-rose-500/15 hover:text-rose-300"
        >
          <LogOut size={14} />
        </button>
      </div>
    </div>
  )
}
