import { useState } from 'react'
import { Merge, ArrowRight } from 'lucide-react'
import { useSite, plansOfProduct } from '../store/useSite.js'
import { PanelSection, SelectField, Row } from './controls.jsx'

/**
 * Fusionar dos productos, convirtiendo uno en una gama del otro.
 *
 * Existe por un caso muy concreto y muy común: haber usado las subcategorías para
 * dos cosas a la vez. Cuando en el árbol hay «Minecraft» dentro de Juegos y
 * «Minecraft Económico» dentro de Económicos, no son dos productos — son el mismo
 * producto en dos gamas, y el cliente que entra por uno nunca se entera de que
 * existe el otro. Arreglarlo a mano significa reasignar los planes de uno en uno.
 *
 * La operación borra el producto absorbido, así que pide confirmación y enseña
 * antes, con números, exactamente lo que va a pasar.
 */
export default function MergeProducts() {
  const site = useSite((s) => s.site)
  const mergeProductAsTier = useSite((s) => s.mergeProductAsTier)

  const [sourceId, setSourceId] = useState('')
  const [targetId, setTargetId] = useState('')
  const [sourceTier, setSourceTier] = useState(site.tiers[1]?.id || '')
  const [targetTier, setTargetTier] = useState(site.tiers[0]?.id || '')

  const source = site.products.find((p) => p.id === sourceId)
  const target = site.products.find((p) => p.id === targetId)
  const sourcePlans = source ? plansOfProduct(site, source.id).length : 0
  const targetPlans = target ? plansOfProduct(site, target.id).length : 0
  const listo = Boolean(source && target && sourceId !== targetId && sourceTier)

  const nombreGama = (id) => site.tiers.find((t) => t.id === id)?.name || '—'

  const opciones = (excluir) => [
    { value: '', label: 'Elegir producto…' },
    ...site.products
      .filter((p) => p.id !== excluir)
      .map((p) => {
        const grupo = site.groups.find((g) => g.id === p.groupId)?.name || 'sin subcategoría'
        return { value: p.id, label: `${p.name} · ${grupo}` }
      }),
  ]

  const fusionar = () => {
    const mensaje =
      `Se van a mover los ${sourcePlans} planes de «${source.name}» a «${target.name}» ` +
      `con la gama «${nombreGama(sourceTier)}», y «${source.name}» se eliminará.\n\n` +
      `Esto no se puede deshacer. ¿Continuar?`
    if (!confirm(mensaje)) return
    mergeProductAsTier(sourceId, targetId, sourceTier, targetTier)
    setSourceId('')
    setTargetId('')
  }

  if (site.products.length < 2) return null

  return (
    <PanelSection
      title="Fusionar productos como gamas"
      description="Si el mismo producto está duplicado en dos subcategorías (uno normal y otro «económico»), aquí se juntan en uno solo con dos gamas."
    >
      <Row>
        <SelectField
          label="Producto que se disuelve"
          value={sourceId}
          onChange={setSourceId}
          options={opciones(targetId)}
          hint="Sus planes se mudan y el producto desaparece."
        />
        <SelectField
          label="Producto que se queda"
          value={targetId}
          onChange={setTargetId}
          options={opciones(sourceId)}
          hint="Recibe todos los planes."
        />
      </Row>

      {site.tiers.length > 0 && (
        <Row>
          <SelectField
            label="Gama para los planes que llegan"
            value={sourceTier}
            onChange={setSourceTier}
            options={site.tiers.map((t) => ({ value: t.id, label: t.name }))}
          />
          <SelectField
            label="Gama para los planes que ya había"
            value={targetTier}
            onChange={setTargetTier}
            options={[
              { value: '', label: 'No tocarlos' },
              ...site.tiers.map((t) => ({ value: t.id, label: t.name })),
            ]}
            hint="Sólo se les pone a los que no tengan gama todavía."
          />
        </Row>
      )}

      {/* Vista previa con números: nadie debería pulsar sin saber qué se lleva. */}
      {listo && (
        <div className="glass-soft space-y-2 p-3 text-micro leading-relaxed text-slate-400">
          <p className="flex flex-wrap items-center gap-1.5">
            <strong className="text-white">{source.name}</strong>
            <span className="chip !text-micro">{sourcePlans} planes</span>
            <ArrowRight size={12} className="text-hex-400" />
            <strong className="text-white">{target.name}</strong>
            <span className="chip !text-micro">gama {nombreGama(sourceTier)}</span>
          </p>
          <p>
            Al terminar, <strong className="text-white">{target.name}</strong> tendrá{' '}
            <strong className="text-white">{sourcePlans + targetPlans} planes</strong> repartidos en
            {targetTier ? ` dos gamas (${nombreGama(targetTier)} y ${nombreGama(sourceTier)})` : ' sus gamas'}
            , y <strong className="text-white">{source.name}</strong> dejará de existir.
          </p>
        </div>
      )}

      <button onClick={fusionar} disabled={!listo} className="btn-primary btn-sm w-full py-2.5">
        <Merge size={13} />
        Fusionar
      </button>
    </PanelSection>
  )
}
