import { useState } from 'react'
import { RefreshCw, ShieldAlert, Eye, EyeOff, CheckCircle2 } from 'lucide-react'
import { useSite } from '../../store/useSite.js'
import { syncFromWhmcs } from '../../lib/whmcs.js'
import { TextField, Toggle, Row, PanelSection } from '../controls.jsx'

/**
 * Pestaña "WHMCS": capa de configuración de la integración.
 * Hoy sólo se usa `portalUrl` (para construir URLs de carrito). Los campos de API
 * quedan preparados para cuando exista un proxy backend que permita sincronizar.
 */
export default function WhmcsPanel() {
  const whmcs = useSite((s) => s.site.whmcs)
  const setField = useSite((s) => s.setField)
  const set = (key, value) => setField(`whmcs.${key}`, value)

  const [showSecret, setShowSecret] = useState(false)
  const [syncState, setSyncState] = useState({ status: 'idle', message: '' })

  const runSync = async () => {
    setSyncState({ status: 'loading', message: '' })
    try {
      const result = await syncFromWhmcs(whmcs)
      set('lastSync', new Date().toISOString())
      setSyncState({
        status: 'ok',
        message: `Respuesta recibida (${result?.totalresults ?? 0} productos). La importación al catálogo local aún no está implementada.`,
      })
    } catch (error) {
      setSyncState({ status: 'error', message: error.message })
    }
  }

  return (
    <div className="space-y-6">
      <PanelSection
        title="Portal y carrito"
        description="Lo único necesario para que los botones «Contratar» funcionen."
      >
        <TextField
          label="URL base del portal WHMCS"
          value={whmcs.portalUrl}
          onChange={(v) => set('portalUrl', v)}
          placeholder="https://billing.hexservers.com"
          hint="Se usa para construir /cart.php?a=add&pid=… cuando un producto no tiene URL propia."
        />
        <TextField
          label="URL del área de clientes"
          value={whmcs.clientAreaUrl}
          onChange={(v) => set('clientAreaUrl', v)}
          placeholder="https://billing.hexservers.com/clientarea.php"
        />
      </PanelSection>

      <PanelSection
        title="API de WHMCS"
        description="Preparado para sincronizar productos, precios y stock reales."
      >
        <div className="flex items-start gap-2.5 rounded-xl border border-amber-400/25 bg-amber-400/[0.07] p-3">
          <ShieldAlert size={15} className="mt-px shrink-0 text-amber-400" />
          <p className="text-micro leading-relaxed text-amber-200/90">
            <strong>El identifier y el secret nunca deben viajar en el navegador.</strong> WHMCS
            además bloquea las llamadas por CORS. Para sincronizar de verdad hace falta un proxy en
            tu servidor que guarde las credenciales y exponga un endpoint propio. Estos campos
            quedan aquí como capa de configuración para ese día.
          </p>
        </div>

        <Toggle
          label="Activar integración con la API"
          hint="Mientras esté desactivada, el catálogo se sirve íntegramente desde la base de datos local."
          checked={whmcs.apiEnabled}
          onChange={(v) => set('apiEnabled', v)}
        />

        <TextField
          label="Endpoint de la API"
          value={whmcs.apiUrl}
          onChange={(v) => set('apiUrl', v)}
          placeholder="https://billing.hexservers.com/includes/api.php"
          disabled={!whmcs.apiEnabled}
        />

        <Row>
          <TextField
            label="API Identifier"
            value={whmcs.identifier}
            onChange={(v) => set('identifier', v)}
            autoComplete="off"
            disabled={!whmcs.apiEnabled}
          />
          <div>
            <label className="label">API Secret</label>
            <div className="flex gap-2">
              <input
                className="input"
                type={showSecret ? 'text' : 'password'}
                value={whmcs.secret}
                onChange={(event) => set('secret', event.target.value)}
                autoComplete="off"
                disabled={!whmcs.apiEnabled}
              />
              <button
                onClick={() => setShowSecret((v) => !v)}
                aria-label={showSecret ? 'Ocultar secret' : 'Mostrar secret'}
                className="btn-ghost btn-sm shrink-0 px-2.5"
              >
                {showSecret ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
        </Row>

        <TextField
          label="URL del proxy backend"
          value={whmcs.proxyUrl}
          onChange={(v) => set('proxyUrl', v)}
          placeholder="https://api.hexservers.com/whmcs"
          hint="Endpoint propio que reenvía la petición a WHMCS con las credenciales del servidor."
          disabled={!whmcs.apiEnabled}
        />

        <div className="flex items-center gap-3">
          <button
            onClick={runSync}
            disabled={!whmcs.apiEnabled || syncState.status === 'loading'}
            className="btn-ghost btn-sm py-2.5"
          >
            <RefreshCw
              size={13}
              className={syncState.status === 'loading' ? 'animate-spin' : undefined}
            />
            Probar sincronización
          </button>
          {whmcs.lastSync && (
            <span className="text-micro text-slate-600">
              Último intento: {new Date(whmcs.lastSync).toLocaleString('es-ES')}
            </span>
          )}
        </div>

        {syncState.message && (
          <p
            className={
              syncState.status === 'error'
                ? 'flex items-start gap-2 rounded-lg border border-rose-400/25 bg-rose-400/10 p-3 text-micro leading-relaxed text-rose-300'
                : 'flex items-start gap-2 rounded-lg border border-emerald-400/25 bg-emerald-400/10 p-3 text-micro leading-relaxed text-emerald-300'
            }
          >
            {syncState.status === 'error' ? (
              <ShieldAlert size={14} className="mt-px shrink-0" />
            ) : (
              <CheckCircle2 size={14} className="mt-px shrink-0" />
            )}
            {syncState.message}
          </p>
        )}
      </PanelSection>
    </div>
  )
}
