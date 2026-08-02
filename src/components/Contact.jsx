import { Mail, Clock } from 'lucide-react'
import { useSite } from '../store/useSite.js'
import { safeUrl } from '../lib/utils.js'
import Editable from './ui/Editable.jsx'
import { DiscordIcon } from './ui/icons.jsx'

export default function Contact() {
  const contact = useSite((s) => s.site.contact)

  return (
    <section id="contacto" className="section">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="glass relative overflow-hidden p-8 sm:p-12">
          <div
            className="glow-blue pointer-events-none absolute -top-24 -right-24 size-96 opacity-50"
            aria-hidden="true"
          />

          <div className="relative flex flex-col items-start gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-xl">
              <div className="eyebrow mb-3">Contacto</div>
              <Editable
                path="contact.title"
                as="h2"
                className="display text-2xl font-bold text-balance text-white sm:text-3xl"
              />
              <Editable
                path="contact.subtitle"
                as="p"
                multiline
                className="mt-3 text-sm leading-relaxed text-pretty text-slate-400"
              />
              <p className="mt-4 inline-flex items-center gap-2 text-xs text-slate-500">
                <Clock size={13} className="text-hex-400" />
                {contact.responseTime}
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto lg:shrink-0 lg:flex-col">
              <a href={`mailto:${contact.email}`} className="btn-primary px-6 py-3">
                <Mail size={16} />
                {contact.email}
              </a>
              <a
                href={safeUrl(contact.discord)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost px-6 py-3"
              >
                <DiscordIcon size={16} />
                Comunidad en Discord
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
