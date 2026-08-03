import { useRef } from 'react'
import { useSite } from '../store/useSite.js'
import { safeUrl } from '../lib/utils.js'
import Logo from './ui/Logo.jsx'
import Editable from './ui/Editable.jsx'
import { Glyph } from './ui/icons.jsx'

export default function Footer() {
  const site = useSite((s) => s.site)
  const openLogin = useSite((s) => s.openLogin)
  const isAdmin = useSite((s) => s.isAdmin)
  const clicks = useRef({ count: 0, timer: null })

  /** Acceso oculto al panel: 5 clicks seguidos en el punto del copyright. */
  const secretClick = () => {
    if (isAdmin) return
    clearTimeout(clicks.current.timer)
    clicks.current.count += 1
    if (clicks.current.count >= 5) {
      clicks.current.count = 0
      openLogin()
      return
    }
    clicks.current.timer = setTimeout(() => (clicks.current.count = 0), 1200)
  }

  const { footer, brand } = site

  return (
    <footer className="border-t border-white/8 bg-black/30 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
          {/* Marca */}
          <div className="max-w-sm">
            <Logo name={brand.name} size={30} />
            <Editable
              path="footer.description"
              as="p"
              multiline
              className="mt-4 text-sm leading-relaxed text-slate-500"
            />
            <div className="mt-5 flex gap-2">
              {footer.social.map((social) => (
                <a
                  key={social.id}
                  href={safeUrl(social.url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  title={social.label}
                  className="grid size-9 place-items-center rounded-lg border border-white/10 bg-white/[0.03] text-slate-400 transition hover:border-hex-500/40 hover:bg-hex-500/10 hover:text-hex-300"
                >
                  <Glyph name={social.icon} image={social.image} size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Columnas de enlaces */}
          {footer.columns.map((column) => (
            <div key={column.id}>
              <h3 className="pixel mb-4 text-[10px] text-slate-300 uppercase">{column.title}</h3>
              <ul className="space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.id}>
                    <a
                      href={safeUrl(link.href)}
                      {...(/^https?:/i.test(link.href)
                        ? { target: '_blank', rel: 'noopener noreferrer' }
                        : {})}
                      className="text-sm text-slate-500 transition hover:text-white"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/8 pt-6 sm:flex-row">
          <p className="flex items-center gap-1.5 text-xs text-slate-600">
            <button
              onClick={secretClick}
              aria-label="HexServers"
              title=""
              className="size-1.5 rounded-full bg-slate-700 transition hover:bg-hex-500"
            />
            {footer.legal}
          </p>
          {brand.poweredBy && (
            <p className="pixel text-[9px] text-slate-500 uppercase">{brand.poweredBy}</p>
          )}
        </div>
      </div>
    </footer>
  )
}
