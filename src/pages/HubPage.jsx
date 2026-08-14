import { useMemo } from 'react'
import { AlertTriangle, CheckCircle2, CircleDot, Clock, Check, ExternalLink, Ticket } from 'lucide-react'
import { useSite } from '../store/useSite.js'
import { cx, safeUrl } from '../lib/utils.js'
import { ticketUrl } from '../lib/whmcs.js'
import Editable from '../components/ui/Editable.jsx'
import Flag from '../components/ui/Flag.jsx'
import { Icon, DiscordIcon } from '../components/ui/icons.jsx'
import CountUp from '../components/ui/CountUp.jsx'
import { stagger } from '../lib/reveal.js'

/**
 * Página «Hub»: el núcleo de la operación contado sin marketing.
 *
 * El orden a propósito — el hierro que hay debajo, quién lo atiende y qué falta
 * por hacer. Es la página que se enseña cuando alguien pregunta «¿pero qué
 * máquinas tenéis?» o «¿esto lo lleva alguien?».
 *
 * Todo lo que se pinta sale de los datos que ya edita el panel (nodos, equipo,
 * cambios): los avisos se derivan de los nodos en mantenimiento y de los cambios
 * en curso, y el resumen cuenta los nodos, las ubicaciones y las personas. No
 * hay una segunda fuente de verdad que mantener.
 */
export default function HubPage() {
  const site = useSite((s) => s.site)
  const hub = site.hub
  const locations = site.locations.items

  const groups = useMemo(() => groupNodes(hub.nodes, locations), [hub.nodes, locations])

  /* Avisos: nodos en mantenimiento + cambios en curso. */
  const maintenance = hub.nodes.filter((node) => node.status === 'maintenance')
  const inProgress = hub.changes.filter((change) => change.status === 'progress')

  const alerts = [
    ...maintenance.map((node) => ({
      id: `alert-node-${node.id}`,
      icon: 'server',
      title: `${node.name}${node.role ? ` · ${node.role}` : ''}`,
      description: 'Nodo en mantenimiento programado.',
      meta: locations.find((location) => location.id === node.locationId)?.city,
    })),
    ...inProgress.map((change) => ({
      id: `alert-change-${change.id}`,
      icon: 'refresh',
      title: change.title,
      description: change.description,
      meta: change.date,
    })),
  ]

  const stats = [
    { id: 'hs_nodes', value: hub.nodes.length, label: 'Nodos' },
    { id: 'hs_locs', value: groups.length, label: 'Ubicaciones' },
    { id: 'hs_team', value: hub.team.length, label: 'Personas en soporte' },
    { id: 'hs_prog', value: inProgress.length, label: 'Cambios en marcha' },
  ]

  const resolvedTicketUrl = ticketUrl(site.whmcs, site.support?.ticketUrl)

  return (
    <main className="pb-8">
      {/* Cabecera, al ritmo de la portada. */}
      <header className="pt-32 sm:pt-44">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <div className="eyebrow mb-3">{hub.eyebrow}</div>
          <Editable
            path="hub.title"
            as="h1"
            multiline
            className="display text-4xl leading-[1.06] font-extrabold text-balance text-white sm:text-5xl lg:text-6xl"
          />
          <Editable
            path="hub.subtitle"
            as="p"
            multiline
            className="anim-up mx-auto mt-6 max-w-2xl text-base leading-relaxed text-pretty text-slate-400 sm:text-lg"
          />

          {/* Estado de la red de un vistazo, sin sección entera. */}
          <div
            className={cx(
              'anim-up mt-8 inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 [animation-delay:160ms]',
              maintenance.length === 0
                ? 'border-emerald-400/25 bg-emerald-400/[0.08]'
                : 'border-amber-400/25 bg-amber-400/[0.08]',
            )}
          >
            {maintenance.length === 0 ? (
              <>
                <CheckCircle2 size={15} className="text-emerald-400" />
                <span className="text-sm font-medium text-emerald-300">
                  Todos los nodos operativos
                </span>
              </>
            ) : (
              <>
                <AlertTriangle size={15} className="text-amber-400" />
                <span className="text-sm font-medium text-amber-300">
                  {maintenance.length} {maintenance.length === 1 ? 'nodo en' : 'nodos en'}{' '}
                  mantenimiento
                </span>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ------------------------------ Resumen ------------------------------ */}
      <section className="section">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, index) => (
              <div
                key={stat.id}
                data-reveal
                style={stagger(index)}
                className={cx(
                  'px-5 py-8 text-center sm:py-10',
                  index % 2 === 1 && 'max-lg:border-l max-lg:border-line-soft',
                  index >= 2 && 'max-lg:border-t max-lg:border-line-soft',
                  index > 0 && 'lg:border-l lg:border-line-soft',
                )}
              >
                <CountUp
                  value={String(stat.value)}
                  className="display block text-3xl font-bold text-white sm:text-4xl"
                />
                <div className="mt-2 text-micro font-medium tracking-wider text-slate-500 uppercase">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------- Avisos ------------------------------ */}
      {alerts.length > 0 && (
        <section id="avisos" className="section">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div data-reveal>
              <div className="eyebrow mb-3">Estado</div>
              <h2 className="display text-2xl font-bold text-white sm:text-3xl">
                Avisos activos
              </h2>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {alerts.map((alert, index) => (
                <article
                  key={alert.id}
                  data-reveal
                  style={stagger(index)}
                  className="glass glass-hover flex gap-4 p-5"
                >
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-amber-400/25 bg-amber-400/10 text-amber-300">
                    <Icon name={alert.icon} size={18} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="display text-base font-bold text-white">{alert.title}</h3>
                    {alert.description && (
                      <p className="mt-1 text-sm leading-relaxed text-slate-400">
                        {alert.description}
                      </p>
                    )}
                    {alert.meta && (
                      <span className="mt-2 inline-flex items-center gap-1.5 text-micro font-medium text-amber-300/90">
                        {alert.meta}
                      </span>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ------------------------------- Hardware ------------------------------- */}
      <section id="hardware" className="section">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl" data-reveal>
            <Editable
              path="hub.hardwareTitle"
              as="h2"
              className="display text-3xl font-bold text-white sm:text-4xl"
            />
            <Editable
              path="hub.hardwareSubtitle"
              as="p"
              multiline
              className="mt-3 text-base leading-relaxed text-pretty text-slate-400"
            />
          </div>

          <div className="mt-10 space-y-6">
            {groups.map((group) => (
              <article key={group.id} className="glass overflow-hidden" data-reveal>
                <header className="flex items-center gap-3 border-b border-line-soft px-5 py-4">
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

                  {/* LEDs del rack: uno por nodo, en su color de estado. */}
                  <div className="flex items-center gap-1.5" aria-hidden="true">
                    {group.nodes.map((node) => (
                      <span
                        key={node.id}
                        className={cx(
                          'size-1.5 rounded-full',
                          NODE_STATUS[node.status]?.led || 'bg-slate-600',
                        )}
                      />
                    ))}
                  </div>

                  <span className="chip shrink-0">
                    {group.nodes.length} {group.nodes.length === 1 ? 'nodo' : 'nodos'}
                  </span>
                </header>

                <div className="space-y-3 p-4 sm:p-5">
                  {group.nodes.map((node) => (
                    <NodeUnit key={node.id} node={node} />
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
        </div>
      </section>

      {/* ----------------------------- Equipo de soporte ------------------------- */}
      <section id="equipo" className="section">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-2xl" data-reveal>
              <Editable
                path="hub.teamTitle"
                as="h2"
                className="display text-3xl font-bold text-white sm:text-4xl"
              />
              <Editable
                path="hub.teamSubtitle"
                as="p"
                multiline
                className="mt-3 text-base leading-relaxed text-pretty text-slate-400"
              />
            </div>

            {/* Acciones: del «quiénes son» al «háblales». */}
            <div className="flex flex-wrap gap-3" data-reveal>
              {resolvedTicketUrl && (
                <a href={resolvedTicketUrl} className="btn-ghost px-5 py-2.5">
                  <Ticket size={15} />
                  Abrir ticket
                </a>
              )}
              <a
                href={safeUrl(site.contact.discord)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary px-5 py-2.5"
              >
                <DiscordIcon size={15} />
                Discord
              </a>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {hub.team.map((member, index) => (
              <article
                key={member.id}
                className="glass glass-hover flex items-start gap-4 p-5"
                data-reveal
                style={stagger(index)}
              >
                {/* Único sitio donde la imagen se recorta en vez de ajustarse: es la
                    foto de una persona, y un avatar con bandas a los lados queda peor
                    que uno bien encuadrado. */}
                {member.image ? (
                  <img
                    src={member.image}
                    alt=""
                    loading="lazy"
                    className="size-11 shrink-0 rounded-xl border border-line object-cover"
                  />
                ) : (
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-line bg-gradient-to-br from-hex-500/20 to-plasma-500/15 text-hex-300">
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
                    <a
                      href={safeUrl(site.contact.discord)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1 font-mono text-micro text-hex-300 transition hover:text-hex-200"
                    >
                      {member.handle}
                      <ExternalLink size={10} className="text-slate-600" />
                    </a>
                  )}
                  {member.schedule && (
                    <p className="mt-1 inline-flex items-center gap-1.5 text-micro text-slate-500">
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
        </div>
      </section>

      {/* ----------------------------- Próximos cambios -------------------------- */}
      <section id="proximos-cambios" className="section">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl" data-reveal>
            <Editable
              path="hub.roadmapTitle"
              as="h2"
              className="display text-3xl font-bold text-white sm:text-4xl"
            />
            <Editable
              path="hub.roadmapSubtitle"
              as="p"
              multiline
              className="mt-3 text-base leading-relaxed text-pretty text-slate-400"
            />
          </div>

          <ol className="mt-8 space-y-3">
            {hub.changes.map((change, index) => (
              <ChangeRow key={change.id} change={change} data-reveal style={stagger(index)} />
            ))}
          </ol>

          {hub.changes.length === 0 && (
            <p className="glass-soft mt-8 p-6 text-center text-sm text-slate-500">
              Nada anunciado por ahora.
            </p>
          )}
        </div>
      </section>
    </main>
  )
}

/* ---------------------------------- nodos ---------------------------------- */

const NODE_STATUS = {
  online: {
    label: 'Operativo',
    chip: 'border-emerald-400/20 bg-emerald-400/10 !text-emerald-300',
    led: 'bg-emerald-400',
  },
  maintenance: {
    label: 'En mantenimiento',
    chip: 'border-amber-400/20 bg-amber-400/10 !text-amber-300',
    led: 'bg-amber-400',
  },
  soon: {
    label: 'Próximamente',
    chip: 'border-line bg-surface-2 !text-slate-400',
    led: 'bg-slate-500',
  },
}

/**
 * Una unidad del rack: qué máquina es y qué lleva dentro.
 *
 * El frente imita a una caja de 1U — LED de estado, nombre en tipografía de
 * máquina y el estado a la derecha — y el cuerpo son las especificaciones con su
 * etiqueta. Es adorno, no dato: nada de esto se mantiene a mano más allá de lo
 * que ya se edita en el panel.
 */
function NodeUnit({ node }) {
  const status = NODE_STATUS[node.status] || NODE_STATUS.online
  const specs = [
    ['CPU', 'cpu', node.cpu],
    ['RAM', 'database', node.ram],
    ['Disco', 'disk', node.disk],
    ['Red', 'network', node.network],
  ].filter(([, , value]) => value)

  return (
    <div className="overflow-hidden rounded-xl border border-line-soft bg-surface-1 transition hover:border-line-strong">
      {/* Frente de la unidad */}
      <div className="flex items-center gap-2.5 border-b border-line-soft bg-black/25 px-4 py-2.5">
        <span className="relative flex size-2">
          {node.status === 'online' && (
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60" />
          )}
          <span className={cx('relative inline-flex size-2 rounded-full', status.led)} />
        </span>
        <span className="pixel text-xs text-hex-300">{node.name}</span>
        {node.role && (
          <span className="truncate text-micro text-slate-500">{node.role}</span>
        )}
        <span className={cx('chip ml-auto shrink-0 !px-2 !py-0.5 !text-micro', status.chip)}>
          {status.label}
        </span>
      </div>

      {/* Especificaciones con etiqueta: se leen sin preguntar qué es cada dato. */}
      <dl className="grid gap-x-6 gap-y-3 px-4 py-4 sm:grid-cols-2 lg:grid-cols-4">
        {specs.map(([label, icon, value]) => (
          <div key={label} className="flex min-w-0 items-start gap-2.5">
            <Icon name={icon} size={14} className="mt-0.5 shrink-0 text-slate-600" />
            <div className="min-w-0">
              <dt className="text-micro font-semibold tracking-wider text-slate-600 uppercase">
                {label}
              </dt>
              <dd className="mt-0.5 truncate text-sm text-slate-300" title={value}>
                {value}
              </dd>
            </div>
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
    return <span className="chip shrink-0 !px-2 !py-0.5 !text-micro !text-amber-300">Ausente</span>
  }
  return (
    <span className="inline-flex shrink-0 items-center gap-1 text-micro font-medium text-emerald-400">
      <span className="size-1.5 rounded-full bg-emerald-400" />
      Activo
    </span>
  )
}

/* --------------------------------- cambios --------------------------------- */

const CHANGE_STATUS = {
  planned: { label: 'Planificado', icon: CircleDot, tone: 'text-slate-400', ring: 'border-line bg-surface-2' },
  progress: { label: 'En curso', icon: Clock, tone: 'text-hex-300', ring: 'border-hex-500/35 bg-hex-500/12' },
  done: { label: 'Hecho', icon: Check, tone: 'text-emerald-300', ring: 'border-emerald-400/30 bg-emerald-400/10' },
}

/** Una entrada del listado de cambios: qué es, en qué estado está y cuándo. */
function ChangeRow({ change, ...reveal }) {
  const status = CHANGE_STATUS[change.status] || CHANGE_STATUS.planned
  const StatusIcon = status.icon

  return (
    <li className={cx('glass glass-hover flex gap-4 p-5', change.status === 'done' && 'opacity-75')} {...reveal}>
      <span
        className={cx(
          'grid size-11 shrink-0 place-items-center rounded-xl border',
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
          <span className={cx('text-micro font-semibold', status.tone)}>{status.label}</span>
          {change.tag && <span className="chip !py-0.5 !text-micro">{change.tag}</span>}
        </div>
        {change.description && (
          <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{change.description}</p>
        )}
      </div>

      {change.date && (
        <span className="hidden shrink-0 self-start text-micro whitespace-nowrap text-slate-500 sm:block">
          {change.date}
        </span>
      )}
    </li>
  )
}
