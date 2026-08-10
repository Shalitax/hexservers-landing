import { Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react'
import { useSite } from '../store/useSite.js'
import { CompactGlyphPicker, PanelSection, TextField, Row } from './controls.jsx'
import { IconButton } from './ProductEditor.jsx'

/**
 * Gamas del catálogo: el segundo eje.
 *
 * Mismo trato que las CPUs y las ubicaciones, porque son la misma clase de cosa —
 * una dimensión que el plan referencia por id. Lo que las distingue es para qué
 * sirven: la subcategoría dice *qué* se vende y la gama *en qué liga juega*, y
 * mezclarlas en la misma lista de pestañas es lo que acaba duplicando productos.
 *
 * El orden importa: es el que ve el cliente en el configurador, así que la gama
 * buena va primero.
 */
export default function TierSection() {
  const tiers = useSite((s) => s.site.tiers)
  const plans = useSite((s) => s.site.plans)
  const addTier = useSite((s) => s.addTier)
  const updateTier = useSite((s) => s.updateTier)
  const removeTier = useSite((s) => s.removeTier)
  const reorderTier = useSite((s) => s.reorderTier)

  return (
    <PanelSection
      title="Gamas"
      description="El mismo producto en distintas ligas de hardware: estándar, económica, premium… El cliente la elige antes que la ubicación."
      action={
        <button onClick={() => addTier()} className="btn-primary btn-sm">
          <Plus size={13} />
          Nueva
        </button>
      }
    >
      <p className="rounded-xl border border-line bg-surface-1 p-3 text-micro leading-relaxed text-slate-500">
        Un producto sólo enseña el paso de gama si sus planes usan más de una. La gama se asigna
        plan a plan desde su editor, y para juntar dos productos duplicados en uno con dos gamas
        está <strong>Fusionar productos como gamas</strong>, aquí abajo.
      </p>

      <div className="space-y-2">
        {tiers.map((tier, index) => {
          const used = plans.filter((plan) => plan.tierId === tier.id).length

          return (
            <div key={tier.id} className="space-y-2 rounded-xl border border-line bg-surface-1 p-3">
              <div className="flex items-center gap-2">
                <CompactGlyphPicker
                  icon={tier.icon}
                  image={tier.image}
                  onIcon={(v) => updateTier(tier.id, { icon: v })}
                  onImage={(v) => updateTier(tier.id, { image: v })}
                />
                <input
                  className="input"
                  placeholder="Estándar"
                  value={tier.name}
                  onChange={(event) => updateTier(tier.id, { name: event.target.value })}
                />
                <span className="chip shrink-0 !text-micro">{used} planes</span>
                <div className="flex shrink-0 items-center">
                  <IconButton
                    icon={ChevronUp}
                    label="Subir"
                    disabled={index === 0}
                    onClick={() => reorderTier(tier.id, -1)}
                  />
                  <IconButton
                    icon={ChevronDown}
                    label="Bajar"
                    disabled={index === tiers.length - 1}
                    onClick={() => reorderTier(tier.id, 1)}
                  />
                  <IconButton
                    icon={Trash2}
                    label="Eliminar gama"
                    danger
                    onClick={() => {
                      const aviso = used
                        ? `«${tier.name}» la usan ${used} planes, que se quedarán sin gama (válidos para cualquiera). ¿Eliminarla?`
                        : `¿Eliminar la gama «${tier.name}»?`
                      if (confirm(aviso)) removeTier(tier.id)
                    }}
                  />
                </div>
              </div>

              <Row>
                <TextField
                  label="Frase corta"
                  value={tier.tagline}
                  placeholder="Hardware dedicado"
                  onChange={(v) => updateTier(tier.id, { tagline: v })}
                />
                <TextField
                  label="Etiqueta"
                  value={tier.badge}
                  placeholder="Recomendada"
                  hint="Opcional: la píldora sobre la tarjeta."
                  onChange={(v) => updateTier(tier.id, { badge: v })}
                />
              </Row>
              <TextField
                label="Descripción"
                textarea
                value={tier.description}
                placeholder="Qué cambia respecto a las demás gamas. Lo lee el cliente al elegir."
                onChange={(v) => updateTier(tier.id, { description: v })}
              />
            </div>
          )
        })}

        {tiers.length === 0 && (
          <p className="rounded-xl border border-dashed border-line p-6 text-center text-xs text-slate-600">
            Sin gamas. El catálogo funciona igual: el paso de gama simplemente no aparece.
          </p>
        )}
      </div>
    </PanelSection>
  )
}
