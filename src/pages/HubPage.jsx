import { useMemo } from 'react'
import { CircleDot, Clock, Check } from 'lucide-react'
import { useSite } from '../store/useSite.js'
import { cx } from '../lib/utils.js'
import Editable from '../components/ui/Editable.jsx'
import Flag from '../components/ui/Flag.jsx'
import { Icon } from '../components/ui/icons.jsx'

/**
 * Página «Hub»: el núcleo de la operación contado sin marketing.
 *
 * Tres bloques y en este orden a propósito — el hierro que hay debajo, quién lo
 * atiende y qué falta por hacer. Es la página que se enseña cuando alguien
 * pregunta «¿pero qué máquinas tenéis?» o «¿esto lo lleva alguien?».
 *
 * Los nodos se agrupan por `locationId` contra `locations.items`: la ubicación
 * es la fuente de verdad, así que añadir un datacenter en el panel hace aparecer
 * su bloque aquí sin tocar nada más.
 */
export default function HubPage() {
  const hub = useSite((s) => s.site.hub)
  const locations = useSite((s) => s.site.locations.items)

  const groups = useMemo(() => groupNodes(hub.nodes, locations), [hub.nodes, locations])

  return (
    <main className="pt-28 pb-8 sm:pt-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Cabecera */}
        <header className="mx-auto max-w-3xl text-center">
          <div className="eyebrow mb-3">{hub.eyebrow}</div>
          <Editable
            path="hub.title"
            as="h1"
            multiline
            className="display text-3xl font-bold text-balance text-white sm:text-4xl lg:text-5xl"
          />
          <Editable
            path="hub.subtitle"
            as="p"
            multiline
            className="mt-5 text-base leading-relaxed text-pretty text-slate-400 sm:text-lg"
          />
        </header>

        {/* ------------------------------- Hardware ------------------------------- */}
        <section id="hardware" className="mt-20 scroll-mt-24">
          <Editable
            path="hub.hardwareTitle"
            as="h2"
            className="display text-2xl font-bold text-white sm:text-3xl"
          />
          <Editable
            path="hub.hardwareSubtitle"
            as="p"
            multiline
            className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400"
          />

          <div className="mt-8 space-y-6">
            {groups.map((group) => (
              <article key={group.id} className="glass overflow-hidden">
                <header className="flex items-center gap-3 border-b border-white/8 px-5 py-4">
                  {group.location ? (
                    <Flag flag={group.location.flag} size={26} />
                  ) : (
                    <Icon name="server" size={20} className="text-slate-500" />
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="display truncate text-base font-bold text-white">
                      {group.city}
                    </h3>
                    {group.country && (
                      <p className="truncate text-xs text-slate-500">{group.country}</p>
                    )}
                  </div>
                  <span className="chip shrink-0">
                    {group.nodes.length} {group.nodes.length === 1 ? 'nodo' : 'nodos'}
                  </span>
                </header>

                <div className="divide-y divide-white/[0.06]">
                  {group.nodes.map((node) => (
                    <NodeRow key={node.id} node={node} />
                  ))}
                </div>
              </article>
            ))}

            {groups.length === 0 && (
              <p className="glass-soft p-6 text-center text-sm text-slate-500">
                Todavía no hay nodos declarados. Se añaden desde el panel → Hub.
              </p>
            )}
          </div>
        </section>

        {/* ----------------------------- Equipo de soporte ------------------------- */}
        <section id="equipo" className="mt-20 scroll-mt-24">
          <Editable
            path="hub.teamTitle"
            as="h2"
            className="display text-2xl font-bold text-white sm:text-3xl"
          />
          <Editable
            path="hub.teamSubtitle"
            as="p"
            multiline
            className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400"
          />

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {hub.team.map((member) => (
              <article key={member.id} className="glass glass-hover flex items-start gap-4 p-5">
                {/* Único sitio donde la imagen se recorta en vez de ajustarse: es la
                    foto de una persona, y un avatar con bandas a los lados queda peor
                    que uno bien encuadrado. */}
                {member.image ? (
                  <img
                    src={member.image}
                    alt=""
                    loading="lazy"
                    className="size-11 shrink-0 rounded-xl border border-white/10 object-cover"
                  />
                ) : (
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-white/10 bg-gradient-to-br from-hex-500/20 to-plasma-500/15 text-hex-300">
                    <Icon name={member.icon} size={19} />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="display truncate text-base font-bold text-white">
                      {member.name}
                    </h3>
                    <MemberStatus status={member.status} />
                  </div>
                  <p className="mt-0.5 text-sm leading-snug text-slate-400">{member.role}</p>
                  {member.handle && (
                    <p className="mt-2 font-mono text-[11px] text-hex-300">{member.handle}</p>
                  )}
                  {member.schedule && (
                    <p className="mt-1 inline-flex items-center gap-1.5 text-[11px] text-slate-500">
                      <Clock size={11} />
                      {member.schedule}
                    </p>
                  )}
                </div>
              </article>
            ))}

            {hub.team.length === 0 && (
              <p className="glass-soft p-6 text-center text-sm text-slate-500 sm:col-span-2 lg:col-span-3">
                Todavía no hay miembros de soporte declarados.
              </p>
            )}
          </div>
        </section>

        {/* ----------------------------- Próximos cambios -------------------------- */}
        <section id="proximos-cambios" className="mt-20 scroll-mt-24">
          <Editable
            path="hub.roadmapTitle"
            as="h2"
            className="display text-2xl font-bold text-white sm:text-3xl"
          />
          <Editable
            path="hub.roadmapSubtitle"
            as="p"
            multiline
            className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400"
          />

          <ol className="mt-8 space-y-3">
            {hub.changes.map((change) => (
              <ChangeRow key={change.id} change={change} />
            ))}
          </ol>

          {hub.changes.length === 0 && (
            <p className="glass-soft mt-8 p-6 text-center text-sm text-slate-500">
              Nada anunciado por ahora.
            </p>
          )}
        </section>
      </div>
    </main>
  )
}

/* ---------------------------------- nodos ---------------------------------- */

const NODE_STATUS = {
  online: { label: 'Operativo', chip: 'border-emerald-400/20 bg-emerald-400/10 !text-emerald-300' },
  maintenance: { label: 'En mantenimiento', chip: 'border-amber-400/20 bg-amber-400/10 !text-amber-300' },
  soon: { label: 'Próximamente', chip: 'border-white/10 bg-white/[0.05] !text-slate-400' },
}

/** Una fila de hardware: qué máquina es y qué lleva dentro. */
function NodeRow({ node }) {
  const status = NODE_STATUS[node.status] || NODE_STATUS.online
  const specs = [
    ['cpu', node.cpu],
    ['database', node.ram],
    ['disk', node.disk],
    ['network', node.network],
  ].filter(([, value]) => value)

  return (
    <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center">
      <div className="min-w-0 sm:w-52 sm:shrink-0">
        <div className="flex items-center gap-2">
          <span className="pixel text-xs text-hex-300">{node.name}</span>
          <span className={cx('chip shrink-0 !px-2 !py-0.5 !text-[10px]', status.chip)}>
            {status.label}
          </span>
        </div>
        {node.role && <p className="mt-1 text-xs text-slate-500">{node.role}</p>}
      </div>

      <dl className="grid min-w-0 flex-1 gap-x-4 gap-y-1.5 sm:grid-cols-2">
        {specs.map(([icon, value]) => (
          <div key={icon} className="flex items-start gap-2 text-xs text-slate-400">
            <Icon name={icon} size={13} className="mt-0.5 shrink-0 text-slate-600" />
            <dd className="min-w-0">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

/** Agrupa los nodos por ubicación, en el orden en que están las ubicaciones. */
function groupNodes(nodes = [], locations = []) {
  const groups = locations.map((location) => ({
    id: location.id,
    location,
    city: location.city,
    country: location.country,
    nodes: nodes.filter((node) => node.locationId === location.id),
  }))

  // Nodos cuya ubicación se borró: se enseñan igual, no se pierden por el camino.
  const known = new Set(locations.map((location) => location.id))
  const orphans = nodes.filter((node) => !known.has(node.locationId))
  if (orphans.length) {
    groups.push({ id: '_sin_ubicacion', location: null, city: 'Sin ubicación asignada', country: '', nodes: orphans })
  }

  return groups.filter((group) => group.nodes.length > 0)
}

/* -------------------------------- miembros --------------------------------- */

function MemberStatus({ status }) {
  if (status === 'away') {
    return <span className="chip shrink-0 !px-2 !py-0.5 !text-[10px] !text-amber-300">Ausente</span>
  }
  return (
    <span className="inline-flex shrink-0 items-center gap-1 text-[10px] font-medium text-emerald-400">
      <span className="size-1.5 rounded-full bg-emerald-400" />
      Activo
    </span>
  )
}

/* --------------------------------- cambios --------------------------------- */

const CHANGE_STATUS = {
  planned: { label: 'Planificado', icon: CircleDot, tone: 'text-slate-400', ring: 'border-white/12 bg-white/[0.04]' },
  progress: { label: 'En curso', icon: Clock, tone: 'text-hex-300', ring: 'border-hex-500/35 bg-hex-500/12' },
  done: { label: 'Hecho', icon: Check, tone: 'text-emerald-300', ring: 'border-emerald-400/30 bg-emerald-400/10' },
}

/** Una entrada del listado de cambios: qué es, en qué estado está y cuándo. */
function ChangeRow({ change }) {
  const status = CHANGE_STATUS[change.status] || CHANGE_STATUS.planned
  const StatusIcon = status.icon

  return (
    <li className={cx('glass glass-hover flex gap-4 p-5', change.status === 'done' && 'opacity-75')}>
      <span
        className={cx(
          'grid size-9 shrink-0 place-items-center rounded-xl border',
          status.ring,
          status.tone,
        )}
        title={status.label}
      >
        <StatusIcon size={16} />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <h3 className="display text-base font-bold text-white">{change.title}</h3>
          <span className={cx('text-[11px] font-semibold', status.tone)}>{status.label}</span>
          {change.tag && <span className="chip !py-0.5 !text-[10px]">{change.tag}</span>}
        </div>
        {change.description && (
          <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{change.description}</p>
        )}
      </div>

      {change.date && (
        <span className="hidden shrink-0 self-start text-[11px] whitespace-nowrap text-slate-500 sm:block">
          {change.date}
        </span>
      )}
    </li>
  )
}
