import { LifeBuoy, Mail, Clock, ExternalLink } from 'lucide-react'
import { useSite } from '../store/useSite.js'
import { safeUrl } from '../lib/utils.js'
import { ticketUrl } from '../lib/whmcs.js'
import Editable from '../components/ui/Editable.jsx'
import { Icon, DiscordIcon } from '../components/ui/icons.jsx'

/**
 * Página «Soporte»: una tarjeta con el botón de abrir ticket (que lleva a WHMCS)
 * y las mismas vías de contacto que la portada.
 *
 * El correo y el Discord no se duplican en el documento: si `support.email` está
 * vacío se usa el de `contact`, para que cambiarlo en un sitio valga para todos.
 */
export default function SupportPage() {
  const support = useSite((s) => s.site.support)
  const contact = useSite((s) => s.site.contact)
  const whmcs = useSite((s) => s.site.whmcs)
  const editMode = useSite((s) => s.editMode)

  const email = support.email || contact.email
  const tickets = ticketUrl(whmcs, support.ticketUrl)

  return (
    <main className="pt-28 pb-8 sm:pt-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Cabecera */}
        <header className="mx-auto max-w-3xl text-center">
          <div className="eyebrow mb-3">{support.eyebrow}</div>
          <Editable
            path="support.title"
            as="h1"
            multiline
            className="display text-3xl font-bold text-balance text-white sm:text-4xl lg:text-5xl"
          />
          <Editable
            path="support.subtitle"
            as="p"
            multiline
            className="mt-5 text-base leading-relaxed text-pretty text-slate-400 sm:text-lg"
          />
        </header>

        {/* ---------------------------- Tarjeta del ticket ------------------------- */}
        <section className="glass relative mx-auto mt-14 max-w-3xl overflow-hidden p-8 sm:p-10">
          <div
            className="glow-blue pointer-events-none absolute -top-24 -right-20 size-80 opacity-50"
            aria-hidden="true"
          />

          <div className="relative flex flex-col items-start gap-6 sm:flex-row sm:items-center">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl border border-white/10 bg-gradient-to-br from-hex-500/25 to-plasma-500/20 text-hex-200">
              <LifeBuoy size={22} />
            </span>

            <div className="min-w-0 flex-1">
              <Editable
                path="support.cardTitle"
                as="h2"
                className="display text-xl font-bold text-white sm:text-2xl"
              />
              <Editable
                path="support.cardText"
                as="p"
                multiline
                className="mt-2 text-sm leading-relaxed text-pretty text-slate-400"
              />
            </div>
          </div>

          <div className="relative mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
            {tickets ? (
              <a
                href={tickets}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary px-6 py-3"
              >
                <LifeBuoy size={16} />
                {support.ticketLabel}
                <ExternalLink size={13} className="opacity-70" />
              </a>
            ) : (
              <span className="btn-primary pointer-events-none px-6 py-3 opacity-45">
                <LifeBuoy size={16} />
                {support.ticketLabel}
              </span>
            )}
            <p className="text-xs leading-snug text-slate-500">{support.ticketHint}</p>
          </div>

          {/* Sólo el admin ve por qué el botón no lleva a ninguna parte. */}
          {editMode && !tickets && (
            <p className="relative mt-4 rounded-xl border border-amber-400/25 bg-amber-400/[0.07] p-3 text-[11px] leading-relaxed text-amber-200">
              El botón está apagado porque no hay a dónde ir: rellena la URL del portal en el panel
              → WHMCS, o una URL de tickets propia en el panel → Hub.
            </p>
          )}

          <p className="relative mt-6 inline-flex items-center gap-2 border-t border-white/8 pt-5 text-xs text-slate-500">
            <Clock size={13} className="text-hex-400" />
            {support.responseTime}
          </p>
        </section>

        {/* ------------------------------- Contacto -------------------------------- */}
        <section className="mx-auto mt-6 grid max-w-3xl gap-4 sm:grid-cols-2">
          <article className="glass glass-hover flex flex-col p-6">
            <span className="mb-4 grid size-10 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-hex-300">
              <Mail size={18} />
            </span>
            <h3 className="display text-base font-bold text-white">Correo de contacto</h3>
            <p className="mt-1.5 flex-1 text-sm leading-relaxed text-slate-400">
              {support.emailHint}
            </p>
            <a
              href={`mailto:${email}`}
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold break-all text-hex-300 transition hover:text-hex-200"
            >
              <Mail size={14} className="shrink-0" />
              {email}
            </a>
          </article>

          <article className="glass glass-hover flex flex-col p-6">
            <span className="mb-4 grid size-10 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-hex-300">
              <DiscordIcon size={18} />
            </span>
            <h3 className="display text-base font-bold text-white">Discord</h3>
            <p className="mt-1.5 flex-1 text-sm leading-relaxed text-slate-400">
              Para dudas rápidas y avisos de incidencias. Es lo más ágil si ya eres cliente.
            </p>
            <a
              href={safeUrl(contact.discord)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-hex-300 transition hover:text-hex-200"
            >
              <DiscordIcon size={14} />
              Entrar al servidor
              <ExternalLink size={12} className="opacity-70" />
            </a>
          </article>
        </section>

        {/* ------------------------- Apuntes antes de escribir --------------------- */}
        {support.notes?.length > 0 && (
          <section className="mx-auto mt-14 max-w-3xl">
            <div className="grid gap-4 sm:grid-cols-3">
              {support.notes.map((note, index) => (
                <article key={note.id} className="glass-soft p-5">
                  <Icon name={note.icon} size={17} className="text-hex-300" />
                  <Editable
                    path={`support.notes.${index}.title`}
                    as="h3"
                    className="display mt-3 text-sm font-bold text-white"
                  />
                  <Editable
                    path={`support.notes.${index}.description`}
                    as="p"
                    multiline
                    className="mt-1.5 text-xs leading-relaxed text-slate-400"
                  />
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  )
}
