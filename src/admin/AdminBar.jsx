import {
  Eye,
  Pencil,
  LogOut,
  SlidersHorizontal,
  Database,
  Cloud,
  CloudOff,
  Check,
  AlertTriangle,
  Loader2,
} from 'lucide-react'
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
    <div className="fixed inset-x-0 bottom-0 z-[80] flex flex-col items-center gap-2 p-3 sm:p-4">
      <ContentAlert />

      <div className="glass flex items-center gap-1.5 bg-void-2/90 p-1.5 shadow-2xl">
        <SyncStatus />

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

/**
 * Aviso de que el contenido guardado no se pudo leer y se está enseñando otro.
 *
 * Sólo lo ve el admin: el visitante está viendo una web coherente y no tiene nada
 * que hacer con esta información. Pero quien administra necesita saberlo ya, porque
 * el siguiente guardado sobrescribe el archivo roto — que es justo cómo se sale del
 * problema, pero también cómo se pierde lo que hubiera dentro.
 */
function ContentAlert() {
  const contentError = useSite((s) => s.contentError)
  if (!contentError) return null

  return (
    <div className="glass flex max-w-2xl items-start gap-2.5 border-amber-400/30 bg-amber-400/[0.12] p-3 text-[11px] leading-relaxed text-amber-100 shadow-2xl">
      <AlertTriangle size={14} className="mt-0.5 shrink-0 text-amber-300" />
      <span>
        <strong>{contentError}</strong> Se está mostrando una copia anterior o el contenido de
        ejemplo. Revisa el archivo del servidor antes de seguir editando: al guardar, lo que veas
        ahora pasará a sustituirlo.
      </span>
    </div>
  )
}

/**
 * Si lo editado ha llegado al servidor, que es lo que ven los visitantes.
 *
 * Sin servidor lo dice claro en vez de callarse: la diferencia entre «guardado
 * para todos» y «guardado sólo en tu navegador» es justo lo que hay que saber
 * antes de dar por publicado un cambio.
 */
function SyncStatus() {
  const serverMode = useSite((s) => s.serverMode)
  const sync = useSite((s) => s.sync)

  if (!serverMode) {
    return (
      <span
        title="No hay servidor: lo que edites se guarda sólo en este navegador y los visitantes no lo verán."
        className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-[10px] font-semibold tracking-wider text-amber-300/90 uppercase"
      >
        <CloudOff size={12} />
        <span className="hidden sm:inline">Sólo local</span>
      </span>
    )
  }

  const STATES = {
    saving: { icon: Loader2, text: 'Guardando…', className: 'text-slate-400', spin: true },
    saved: { icon: Check, text: 'Publicado', className: 'text-emerald-300' },
    error: { icon: AlertTriangle, text: 'Sin guardar', className: 'text-rose-300' },
    idle: { icon: Cloud, text: 'En el servidor', className: 'text-hex-300' },
  }
  const view = STATES[sync.state] || STATES.idle
  const StateIcon = view.icon

  return (
    <span
      title={sync.error || 'Los cambios se guardan en el servidor y los ven todos los visitantes.'}
      className={cx(
        'flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-[10px] font-semibold tracking-wider uppercase',
        view.className,
      )}
    >
      <StateIcon size={12} className={view.spin ? 'animate-spin' : undefined} />
      <span className="hidden sm:inline">{view.text}</span>
    </span>
  )
}
