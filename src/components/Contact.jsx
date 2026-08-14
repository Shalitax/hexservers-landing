import { Mail, Clock } from 'lucide-react'
import { useSite } from '../store/useSite.js'
import { safeUrl } from '../lib/utils.js'
import Editable from './ui/Editable.jsx'
import { DiscordIcon } from './ui/icons.jsx'

/**
 * Cierre de la portada, a la manera de los hosts de referencia: una banda CTA
 * centrada y grande, sin tarjeta alrededor — el titular y dos botones, y nada
 * más que leer.
 */
export default function Contact() {
  const contact = useSite((s) => s.site.contact)

  return (
    <section id="contacto" className="section">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="text-center" data-reveal>
          <div className="eyebrow mb-3">Contacto</div>
          <Editable
            path="contact.title"
            as="h2"
            className="display text-3xl font-bold text-balance text-white sm:text-5xl"
          />
          <Editable
            path="contact.subtitle"
            as="p"
            multiline
            className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-pretty text-slate-400"
          />

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href={safeUrl(contact.discord)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary w-full px-7 py-3.5 sm:w-auto"
            >
              <DiscordIcon size={16} />
              Comunidad en Discord
            </a>
            <a href={`mailto:${contact.email}`} className="btn-ghost w-full px-7 py-3.5 sm:w-auto">
              <Mail size={16} />
              {contact.email}
            </a>
          </div>

          {contact.responseTime && (
            <p className="mt-6 inline-flex items-center gap-2 text-xs text-slate-500">
              <Clock size={13} className="text-hex-400" />
              {contact.responseTime}
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
