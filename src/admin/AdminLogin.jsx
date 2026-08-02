import { useState } from 'react'
import { Lock, ShieldAlert } from 'lucide-react'
import Modal from '../components/ui/Modal.jsx'
import { useSite } from '../store/useSite.js'

export default function AdminLogin() {
  const open = useSite((s) => s.loginOpen)
  const closeLogin = useSite((s) => s.closeLogin)
  const login = useSite((s) => s.login)
  const authError = useSite((s) => s.authError)
  const serverMode = useSite((s) => s.serverMode)
  /* El aviso de credenciales de fábrica sólo aplica al login local: con servidor
     la contraseña es la variable de entorno, y no hay ninguna por defecto. */
  const usingDefault = useSite((s) => !s.serverMode && Boolean(s.site.admin.defaultPassword))

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    setBusy(true)
    const ok = await login(username, password)
    setBusy(false)
    if (ok) {
      setUsername('')
      setPassword('')
    }
  }

  return (
    <Modal
      open={open}
      onClose={closeLogin}
      size="sm"
      title="Acceso de administración"
      subtitle="Modo edición del sitio"
    >
      <form onSubmit={submit} className="space-y-4">
        {/* Con servidor sólo hay una contraseña y ningún usuario que elegir. */}
        {!serverMode && (
          <div>
            <label className="label" htmlFor="admin-user">
              Usuario
            </label>
            <input
              id="admin-user"
              data-autofocus
              className="input"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
              placeholder="admin"
            />
          </div>
        )}

        <div>
          <label className="label" htmlFor="admin-pass">
            Contraseña
          </label>
          <input
            id="admin-pass"
            type="password"
            data-autofocus={serverMode ? '' : undefined}
            className="input"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            placeholder="••••••••"
          />
        </div>

        {authError && (
          <p className="flex items-center gap-2 rounded-lg border border-rose-400/25 bg-rose-400/10 px-3 py-2 text-xs text-rose-300">
            <ShieldAlert size={14} />
            {authError}
          </p>
        )}

        <button type="submit" disabled={busy} className="btn-primary w-full py-2.5">
          <Lock size={15} />
          {busy ? 'Comprobando…' : 'Entrar en modo edición'}
        </button>

        {usingDefault && (
          <p className="rounded-lg border border-amber-400/20 bg-amber-400/[0.07] px-3 py-2.5 text-[11px] leading-relaxed text-amber-200/90">
            Credenciales por defecto: <strong>admin</strong> / <strong>hexadmin</strong>. Cámbialas
            desde el panel (pestaña Seguridad) en cuanto entres.
          </p>
        )}

        <p className="text-center text-[11px] leading-relaxed text-slate-600">
          {serverMode
            ? 'La contraseña la valida el servidor (HEX_ADMIN_PASSWORD). Lo que guardes lo verán todos los visitantes.'
            : 'No hay servidor detrás: este login sólo protege el modo edición en este navegador, y lo que edites no lo verán los visitantes.'}
        </p>
      </form>
    </Modal>
  )
}
