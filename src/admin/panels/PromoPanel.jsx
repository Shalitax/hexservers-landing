import { RefreshCw, Eye } from 'lucide-react'
import { useSite } from '../../store/useSite.js'
import { TextField, NumberField, Toggle, Row, PanelSection } from '../controls.jsx'

const DISMISS_KEY = 'hexservers:promo-dismissed'

/** Pestaña "Promo": contenido y disparadores del popup de descuento. */
export default function PromoPanel() {
  const promo = useSite((s) => s.site.promo)
  const promocode = useSite((s) => s.site.whmcs.promocode)
  const setField = useSite((s) => s.setField)
  const set = (key, value) => setField(`promo.${key}`, value)

  const generateCode = () => {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    const random = Array.from(
      { length: 4 },
      () => alphabet[Math.floor(Math.random() * alphabet.length)],
    ).join('')
    set('code', `HEX${random}`)
  }

  return (
    <div className="space-y-6">
      <PanelSection title="Popup de código promocional">
        <Toggle
          label="Popup activo"
          hint="Si se desactiva, el popup no aparece para ningún visitante."
          checked={promo.enabled}
          onChange={(v) => set('enabled', v)}
        />

        <div className="flex items-end gap-2">
          <TextField
            label="Código"
            value={promo.code}
            onChange={(v) => set('code', v.toUpperCase())}
            className="flex-1"
          />
          <button onClick={generateCode} className="btn-ghost btn-sm mb-px py-2.5" title="Generar código">
            <RefreshCw size={13} />
            Generar
          </button>
        </div>

        <Row>
          <TextField label="Badge" value={promo.badge} onChange={(v) => set('badge', v)} />
          <TextField label="Título" value={promo.title} onChange={(v) => set('title', v)} />
        </Row>

        <TextField
          label="Descripción"
          textarea
          value={promo.description}
          onChange={(v) => set('description', v)}
        />

        <Row>
          <TextField label="Aviso de caducidad" value={promo.expires} onChange={(v) => set('expires', v)} />
          <NumberField
            label="Segundos hasta mostrarlo"
            step="1"
            min="1"
            value={promo.triggerSeconds}
            onChange={(v) => set('triggerSeconds', v)}
          />
          <TextField label="Texto del botón" value={promo.ctaLabel} onChange={(v) => set('ctaLabel', v)} />
          <TextField label="Destino del botón" value={promo.ctaHref} onChange={(v) => set('ctaHref', v)} />
        </Row>

        <Toggle
          label="Mostrar también al hacer scroll"
          hint="Aparece al pasar la mitad de la primera pantalla, sin esperar al temporizador."
          checked={promo.triggerOnScroll}
          onChange={(v) => set('triggerOnScroll', v)}
        />

        <button
          onClick={() => {
            localStorage.removeItem(DISMISS_KEY)
            alert(
              'Preferencia "no volver a mostrar" borrada en este navegador.\n\n' +
                'Sal del modo edición (botón "Vista cliente") para ver el popup.',
            )
          }}
          className="btn-ghost btn-sm w-full py-2.5"
        >
          <Eye size={13} />
          Reiniciar «no volver a mostrar» en este navegador
        </button>
      </PanelSection>

      <PanelSection
        title="Código aplicado en el carrito"
        description="Se añade como &promocode= a todas las URLs de contratación."
      >
        <TextField
          label="Promocode enviado a WHMCS"
          value={promocode}
          onChange={(v) => setField('whmcs.promocode', v.toUpperCase())}
          placeholder="Vacío = no se envía ningún código"
          hint="Debe coincidir con un promocode existente en WHMCS para que se aplique de verdad."
        />
      </PanelSection>
    </div>
  )
}
