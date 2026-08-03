import { Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react'
import { useSite } from '../../store/useSite.js'
import { ticketUrl } from '../../lib/whmcs.js'
import { TextField, SelectField, GlyphField, Row, PanelSection } from '../controls.jsx'

const NODE_STATUS = [
  { value: 'online', label: 'Operativo' },
  { value: 'maintenance', label: 'En mantenimiento' },
  { value: 'soon', label: 'Próximamente' },
]

const MEMBER_STATUS = [
  { value: 'active', label: 'Activo' },
  { value: 'away', label: 'Ausente' },
]

const CHANGE_STATUS = [
  { value: 'planned', label: 'Planificado' },
  { value: 'progress', label: 'En curso' },
  { value: 'done', label: 'Hecho' },
]

/**
 * Pestaña "Hub": el contenido de #/hub (hardware, equipo y próximos cambios) y el
 * de #/soporte. Van juntos porque son la misma historia contada dos veces —qué hay
 * detrás y a quién escribir— y se editan a la vez.
 *
 * Los títulos y textos largos se editan inline en las propias páginas; aquí están
 * las listas y los campos que no tienen edición inline.
 */
export default function HubPanel() {
  const site = useSite((s) => s.site)
  const setField = useSite((s) => s.setField)
  const addListItem = useSite((s) => s.addListItem)
  const removeListItem = useSite((s) => s.removeListItem)
  const moveListItem = useSite((s) => s.moveListItem)
  const updateListItem = useSite((s) => s.updateListItem)

  const { hub, support } = site
  const locationOptions = [
    { value: '', label: 'Sin ubicación' },
    ...site.locations.items.map((item) => ({ value: item.id, label: item.city })),
  ]
  const resolvedTicketUrl = ticketUrl(site.whmcs, support.ticketUrl)

  return (
    <div className="space-y-8">
      <p className="rounded-xl border border-hex-500/20 bg-hex-500/[0.06] p-3 text-[11px] leading-relaxed text-hex-200/90">
        Los titulares y las descripciones de estas dos páginas se editan haciendo click sobre ellos
        en <code>#/hub</code> y <code>#/soporte</code>. Aquí están las listas y los ajustes.
      </p>

      {/* ------------------------------- Hardware -------------------------------- */}
      <PanelSection
        title="Hub · Hardware"
        description="Los nodos de cada ubicación. Se agrupan solos por la ubicación que elijas; las ubicaciones se gestionan en la pestaña Contenido."
        action={
          <button
            onClick={() =>
              addListItem('hub.nodes', {
                locationId: site.locations.items[0]?.id || '',
                name: 'NODO-00',
                role: '',
                cpu: '',
                ram: '',
                disk: '',
                network: '',
                status: 'online',
              })
            }
            className="btn-ghost btn-sm"
          >
            <Plus size={13} />
            Nodo
          </button>
        }
      >
        <div className="space-y-2">
          {hub.nodes.map((node, index) => (
            <div key={node.id} className="space-y-2 rounded-xl border border-white/10 bg-white/[0.025] p-3">
              <div className="flex items-center gap-2">
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-200">
                  {node.name || 'Nodo sin nombre'}
                </span>
                <MoveButtons
                  onUp={() => moveListItem('hub.nodes', node.id, -1)}
                  onDown={() => moveListItem('hub.nodes', node.id, 1)}
                  disableUp={index === 0}
                  disableDown={index === hub.nodes.length - 1}
                  onRemove={() => removeListItem('hub.nodes', node.id)}
                />
              </div>

              <Row>
                <TextField
                  label="Nombre"
                  value={node.name}
                  placeholder="SCL-01"
                  onChange={(v) => updateListItem('hub.nodes', node.id, { name: v })}
                />
                <TextField
                  label="Para qué se usa"
                  value={node.role}
                  placeholder="Juegos · gama rendimiento"
                  onChange={(v) => updateListItem('hub.nodes', node.id, { role: v })}
                />
                <SelectField
                  label="Ubicación"
                  value={node.locationId || ''}
                  options={locationOptions}
                  onChange={(v) => updateListItem('hub.nodes', node.id, { locationId: v })}
                />
                <SelectField
                  label="Estado"
                  value={node.status || 'online'}
                  options={NODE_STATUS}
                  onChange={(v) => updateListItem('hub.nodes', node.id, { status: v })}
                />
                <TextField
                  label="CPU"
                  value={node.cpu}
                  placeholder="Ryzen 9 7950X · 16c/32t"
                  onChange={(v) => updateListItem('hub.nodes', node.id, { cpu: v })}
                />
                <TextField
                  label="RAM"
                  value={node.ram}
                  placeholder="128 GB DDR5 ECC"
                  onChange={(v) => updateListItem('hub.nodes', node.id, { ram: v })}
                />
                <TextField
                  label="Disco"
                  value={node.disk}
                  placeholder="2 × 2 TB NVMe (RAID10)"
                  onChange={(v) => updateListItem('hub.nodes', node.id, { disk: v })}
                />
                <TextField
                  label="Red"
                  value={node.network}
                  placeholder="1 Gbps · anti-DDoS 1 Tbps"
                  onChange={(v) => updateListItem('hub.nodes', node.id, { network: v })}
                />
              </Row>
            </div>
          ))}
          {hub.nodes.length === 0 && <p className="text-xs text-slate-600">Sin nodos declarados.</p>}
        </div>
      </PanelSection>

      {/* ----------------------------- Equipo de soporte -------------------------- */}
      <PanelSection
        title="Hub · Miembros de soporte"
        description="Quién atiende los tickets. Sale tal cual en la página del Hub."
        action={
          <button
            onClick={() =>
              addListItem('hub.team', {
                name: 'Nombre',
                role: 'Qué lleva',
                handle: '@usuario',
                icon: 'headset',
                schedule: '',
                status: 'active',
              })
            }
            className="btn-ghost btn-sm"
          >
            <Plus size={13} />
            Miembro
          </button>
        }
      >
        <div className="space-y-2">
          {hub.team.map((member, index) => (
            <div key={member.id} className="space-y-2 rounded-xl border border-white/10 bg-white/[0.025] p-3">
              <div className="flex items-center gap-2">
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-200">
                  {member.name || 'Sin nombre'}
                </span>
                <MoveButtons
                  onUp={() => moveListItem('hub.team', member.id, -1)}
                  onDown={() => moveListItem('hub.team', member.id, 1)}
                  disableUp={index === 0}
                  disableDown={index === hub.team.length - 1}
                  onRemove={() => removeListItem('hub.team', member.id)}
                />
              </div>

              <Row>
                <TextField
                  label="Nombre"
                  value={member.name}
                  onChange={(v) => updateListItem('hub.team', member.id, { name: v })}
                />
                <TextField
                  label="Rol"
                  value={member.role}
                  placeholder="Infraestructura y guardias"
                  onChange={(v) => updateListItem('hub.team', member.id, { role: v })}
                />
                <TextField
                  label="Usuario (Discord…)"
                  value={member.handle}
                  placeholder="@matias"
                  onChange={(v) => updateListItem('hub.team', member.id, { handle: v })}
                />
                <TextField
                  label="Horario"
                  value={member.schedule}
                  placeholder="L–V · 10:00–19:00 (CLT)"
                  onChange={(v) => updateListItem('hub.team', member.id, { schedule: v })}
                />
                <SelectField
                  label="Estado"
                  value={member.status || 'active'}
                  options={MEMBER_STATUS}
                  onChange={(v) => updateListItem('hub.team', member.id, { status: v })}
                />
              </Row>

              <GlyphField
                icon={member.icon}
                image={member.image}
                onIcon={(v) => updateListItem('hub.team', member.id, { icon: v })}
                onImage={(v) => updateListItem('hub.team', member.id, { image: v })}
                hint="Sube una foto o un avatar para usarlo en lugar del icono."
              />
            </div>
          ))}
          {hub.team.length === 0 && <p className="text-xs text-slate-600">Sin miembros.</p>}
        </div>
      </PanelSection>

      {/* ----------------------------- Próximos cambios --------------------------- */}
      <PanelSection
        title="Hub · Próximos cambios"
        description="Lo que se va a integrar y lo que ya entró. Lo hecho se sigue mostrando, más apagado: es el historial."
        action={
          <button
            onClick={() =>
              addListItem('hub.changes', {
                title: 'Nuevo cambio',
                description: '',
                status: 'planned',
                date: 'Sin fecha',
                tag: '',
              })
            }
            className="btn-ghost btn-sm"
          >
            <Plus size={13} />
            Cambio
          </button>
        }
      >
        <div className="space-y-2">
          {hub.changes.map((change, index) => (
            <div key={change.id} className="space-y-2 rounded-xl border border-white/10 bg-white/[0.025] p-3">
              <div className="flex items-center gap-2">
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-200">
                  {change.title || 'Sin título'}
                </span>
                <MoveButtons
                  onUp={() => moveListItem('hub.changes', change.id, -1)}
                  onDown={() => moveListItem('hub.changes', change.id, 1)}
                  disableUp={index === 0}
                  disableDown={index === hub.changes.length - 1}
                  onRemove={() => removeListItem('hub.changes', change.id)}
                />
              </div>

              <TextField
                label="Título"
                value={change.title}
                onChange={(v) => updateListItem('hub.changes', change.id, { title: v })}
              />
              <TextField
                label="Descripción"
                textarea
                value={change.description}
                placeholder="Qué cambia y por qué importa."
                onChange={(v) => updateListItem('hub.changes', change.id, { description: v })}
              />
              <Row cols={3}>
                <SelectField
                  label="Estado"
                  value={change.status || 'planned'}
                  options={CHANGE_STATUS}
                  onChange={(v) => updateListItem('hub.changes', change.id, { status: v })}
                />
                <TextField
                  label="Fecha o plazo"
                  value={change.date}
                  placeholder="Próximo trimestre"
                  onChange={(v) => updateListItem('hub.changes', change.id, { date: v })}
                />
                <TextField
                  label="Etiqueta"
                  value={change.tag}
                  placeholder="Infraestructura"
                  onChange={(v) => updateListItem('hub.changes', change.id, { tag: v })}
                />
              </Row>
            </div>
          ))}
          {hub.changes.length === 0 && <p className="text-xs text-slate-600">Nada anunciado.</p>}
        </div>
      </PanelSection>

      {/* -------------------------------- Soporte -------------------------------- */}
      <PanelSection
        title="Soporte · Ticket"
        description="El botón de la página #/soporte. Se abre en una pestaña nueva."
      >
        <Row>
          <TextField
            label="Texto del botón"
            value={support.ticketLabel}
            onChange={(v) => setField('support.ticketLabel', v)}
          />
          <TextField
            label="URL de los tickets"
            value={support.ticketUrl}
            placeholder="(se deriva del portal de WHMCS)"
            onChange={(v) => setField('support.ticketUrl', v)}
            hint="Déjala vacía para usar el portal configurado en la pestaña WHMCS."
          />
        </Row>
        <TextField
          label="Aviso bajo el botón"
          value={support.ticketHint}
          onChange={(v) => setField('support.ticketHint', v)}
        />

        <p
          className={
            resolvedTicketUrl
              ? 'rounded-xl border border-white/10 bg-white/[0.03] p-3 text-[11px] break-all text-slate-400'
              : 'rounded-xl border border-amber-400/25 bg-amber-400/[0.07] p-3 text-[11px] leading-relaxed text-amber-200'
          }
        >
          {resolvedTicketUrl ? (
            <>
              El botón abre: <code className="text-hex-300">{resolvedTicketUrl}</code>
            </>
          ) : (
            'No hay ni URL propia ni portal de WHMCS configurado: el botón se muestra apagado.'
          )}
        </p>
      </PanelSection>

      <PanelSection
        title="Soporte · Contacto"
        description="Los apuntes de la parte de abajo se editan inline en la página."
      >
        <Row>
          <TextField
            label="Email"
            value={support.email}
            placeholder={site.contact.email}
            onChange={(v) => setField('support.email', v)}
            hint="Vacío = se usa el correo de la sección Contacto."
          />
          <TextField
            label="Eyebrow"
            value={support.eyebrow}
            onChange={(v) => setField('support.eyebrow', v)}
          />
        </Row>
        <TextField
          label="Texto sobre el correo"
          value={support.emailHint}
          onChange={(v) => setField('support.emailHint', v)}
        />
        <TextField
          label="Tiempo de respuesta"
          value={support.responseTime}
          onChange={(v) => setField('support.responseTime', v)}
        />
      </PanelSection>

      <PanelSection title="Hub · Eyebrow">
        <TextField
          label="Eyebrow de la página Hub"
          value={hub.eyebrow}
          onChange={(v) => setField('hub.eyebrow', v)}
        />
      </PanelSection>
    </div>
  )
}

/* ------------------------------ helpers de lista ----------------------------- */

function MoveButtons({ onUp, onDown, disableUp, disableDown, onRemove }) {
  const base =
    'rounded-md p-1 text-slate-500 transition hover:bg-white/10 hover:text-white disabled:opacity-25'
  return (
    <div className="flex shrink-0 items-center">
      <button onClick={onUp} disabled={disableUp} aria-label="Subir" className={base}>
        <ChevronUp size={13} />
      </button>
      <button onClick={onDown} disabled={disableDown} aria-label="Bajar" className={base}>
        <ChevronDown size={13} />
      </button>
      <button
        onClick={onRemove}
        aria-label="Eliminar"
        className="rounded-md p-1 text-slate-500 transition hover:bg-rose-500/15 hover:text-rose-400"
      >
        <Trash2 size={13} />
      </button>
    </div>
  )
}
