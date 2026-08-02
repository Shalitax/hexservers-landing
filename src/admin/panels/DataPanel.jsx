import { useRef, useState } from 'react'
import { Download, Upload, RotateCcw, KeyRound, Database, CheckCircle2 } from 'lucide-react'
import { useSite } from '../../store/useSite.js'
import { storageEngine } from '../../lib/db.js'
import { TextField, Row, PanelSection } from '../controls.jsx'

/** Pestaña "Datos": credenciales, copia de seguridad y reinicio. */
export default function DataPanel() {
  const site = useSite((s) => s.site)
  const changeCredentials = useSite((s) => s.changeCredentials)
  const exportJson = useSite((s) => s.exportJson)
  const importJson = useSite((s) => s.importJson)
  const resetToDefaults = useSite((s) => s.resetToDefaults)
  const fileInput = useRef(null)

  const [username, setUsername] = useState(site.admin.username)
  const [password, setPassword] = useState('')
  const [repeat, setRepeat] = useState('')
  const [notice, setNotice] = useState(null)

  const flash = (type, message) => {
    setNotice({ type, message })
    setTimeout(() => setNotice(null), 4000)
  }

  const saveCredentials = async () => {
    if (password.length < 6) return flash('error', 'La contraseña debe tener al menos 6 caracteres.')
    if (password !== repeat) return flash('error', 'Las contraseñas no coinciden.')
    await changeCredentials(username, password)
    setPassword('')
    setRepeat('')
    flash('ok', 'Credenciales actualizadas.')
  }

  const download = () => {
    const blob = new Blob([exportJson()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `hexservers-${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const upload = async (file) => {
    try {
      await importJson(await file.text())
      flash('ok', 'Contenido importado correctamente.')
    } catch (error) {
      flash('error', `No se pudo importar: ${error.message}`)
    }
  }

  return (
    <div className="space-y-6">
      {notice && (
        <p
          className={
            notice.type === 'error'
              ? 'rounded-lg border border-rose-400/25 bg-rose-400/10 p-3 text-xs text-rose-300'
              : 'flex items-center gap-2 rounded-lg border border-emerald-400/25 bg-emerald-400/10 p-3 text-xs text-emerald-300'
          }
        >
          {notice.type === 'ok' && <CheckCircle2 size={14} />}
          {notice.message}
        </p>
      )}

      <PanelSection title="Almacenamiento">
        <div className="glass-soft grid grid-cols-4 gap-3 p-4 text-center">
          <Stat label="Motor" value={storageEngine().split(' ')[0]} />
          <Stat label="Subcat." value={site.groups.length} />
          <Stat label="Productos" value={site.products.length} />
          <Stat label="Planes" value={site.plans.length} />
        </div>
        <p className="flex items-start gap-2 text-[11px] leading-relaxed text-slate-600">
          <Database size={13} className="mt-px shrink-0" />
          Los datos viven en este navegador. Exporta una copia antes de limpiar el almacenamiento o
          de cambiar de equipo.
        </p>
      </PanelSection>

      <PanelSection title="Credenciales de administrador">
        <Row>
          <TextField label="Usuario" value={username} onChange={setUsername} autoComplete="off" />
          <div />
          <TextField
            label="Nueva contraseña"
            type="password"
            value={password}
            onChange={setPassword}
            autoComplete="new-password"
          />
          <TextField
            label="Repetir contraseña"
            type="password"
            value={repeat}
            onChange={setRepeat}
            autoComplete="new-password"
          />
        </Row>
        <button onClick={saveCredentials} className="btn-primary btn-sm py-2.5">
          <KeyRound size={13} />
          Guardar credenciales
        </button>
      </PanelSection>

      <PanelSection title="Copia de seguridad" description="Exporta o restaura todo el contenido.">
        <div className="flex flex-wrap gap-2">
          <button onClick={download} className="btn-ghost btn-sm py-2.5">
            <Download size={13} />
            Exportar JSON
          </button>
          <button onClick={() => fileInput.current?.click()} className="btn-ghost btn-sm py-2.5">
            <Upload size={13} />
            Importar JSON
          </button>
          <input
            ref={fileInput}
            type="file"
            accept="application/json"
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) upload(file)
              event.target.value = ''
            }}
          />
        </div>
        <p className="text-[11px] leading-relaxed text-slate-600">
          La exportación omite credenciales de admin y de la API de WHMCS a propósito.
        </p>
      </PanelSection>

      <PanelSection title="Zona peligrosa">
        <button
          onClick={async () => {
            if (
              confirm(
                'Se borrará todo el contenido personalizado y volverán los datos de ejemplo.\n\n' +
                  '¿Continuar?',
              )
            ) {
              await resetToDefaults()
              flash('ok', 'Sitio restaurado a los valores de fábrica.')
            }
          }}
          className="btn btn-sm w-full border border-rose-400/25 bg-rose-500/10 py-2.5 text-rose-300 hover:bg-rose-500/20"
        >
          <RotateCcw size={13} />
          Restaurar valores de fábrica
        </button>
      </PanelSection>
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div>
      <div className="pixel text-sm text-white">{value}</div>
      <div className="mt-1.5 text-[10px] tracking-wider text-slate-500 uppercase">{label}</div>
    </div>
  )
}
