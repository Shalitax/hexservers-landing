import { useEffect, useRef, useState } from 'react'
import { ChevronDown, LogIn, Menu, X, ExternalLink } from 'lucide-react'
import { useSite } from '../store/useSite.js'
import { cx, safeUrl } from '../lib/utils.js'
import Logo from './ui/Logo.jsx'
import CurrencyPicker from './ui/CurrencyPicker.jsx'
import AppearancePicker from './ui/AppearancePicker.jsx'
import { Glyph, glyphBox } from './ui/icons.jsx'

export default function Navbar({ route }) {
  const site = useSite((s) => s.site)
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [loginsOpen, setLoginsOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Cierra el desplegable al hacer click fuera o pulsar Escape.
  useEffect(() => {
    if (!loginsOpen) return
    const onClick = (event) => {
      if (!dropdownRef.current?.contains(event.target)) setLoginsOpen(false)
    }
    const onKey = (event) => event.key === 'Escape' && setLoginsOpen(false)
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [loginsOpen])

  const { links, logins } = site.nav

  /**
   * Un enlace está activo si su ruta coincide con la actual (o la contiene).
   *
   * Se admite todavía la forma antigua con hash (`#/productos`): los enlaces del
   * menú los escribe el administrador y pueden llevar años guardados en su
   * `content.json`. La migración los reescribe, pero uno tecleado a mano en el
   * panel puede seguir llegando así.
   */
  const isActive = (link) => {
    const target = String(link.href || '').replace(/^#(?=\/)/, '')
    if (!target.startsWith('/')) return false
    if (target === '/') return route?.path === '/'
    const path = target.split('?')[0].replace(/\/$/, '')
    return route?.path === path || route?.path?.startsWith(`${path}/`)
  }

  return (
    <header
      className={cx(
        'fixed inset-x-0 top-0 z-50 transition-all duration-300',
        scrolled
          ? 'border-b border-line-soft bg-void/70 backdrop-blur-xl shadow-[0_8px_32px_-16px_rgba(0,0,0,0.9)]'
          : 'border-b border-transparent bg-transparent',
      )}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <a href="/" className="group shrink-0" aria-label={site.brand.name}>
          <Logo name={site.brand.name} image={site.brand.logo} size={32} />
        </a>

        {/* Navegación central */}
        <ul className="mx-auto hidden items-center gap-1 lg:flex">
          {links.map((link) => (
            <li key={link.id}>
              <a
                href={safeUrl(link.href)}
                aria-current={isActive(link) ? 'page' : undefined}
                className={cx(
                  'rounded-lg px-3 py-2 text-sm font-medium transition',
                  isActive(link)
                    ? 'bg-hex-500/15 text-white ring-1 ring-hex-500/30'
                    : 'text-slate-400 hover:bg-surface-2 hover:text-white',
                )}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        {/* Apariencia + divisa + accesos */}
        <div className="ml-auto hidden items-center gap-1 lg:flex">
          <AppearancePicker />
          <CurrencyPicker />
        </div>

        {/* Sin accesos configurados no hay botón: abriría un desplegable vacío. */}
        <div className={cx('relative hidden', logins.length > 0 && 'lg:block')} ref={dropdownRef}>
          <button
            onClick={() => setLoginsOpen((open) => !open)}
            aria-expanded={loginsOpen}
            aria-haspopup="true"
            className="btn-ghost btn-sm py-2"
          >
            <LogIn size={15} />
            Acceder
            <ChevronDown
              size={14}
              className={cx('transition-transform duration-200', loginsOpen && 'rotate-180')}
            />
          </button>

          {loginsOpen && (
            <div className="glass anim-pop absolute right-0 mt-2 w-80 overflow-hidden bg-void-2/90 p-1.5">
              {logins.map((login) => (
                <a
                  key={login.id}
                  href={safeUrl(login.url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setLoginsOpen(false)}
                  className="group flex items-start gap-3 rounded-xl p-3 transition hover:bg-surface-3"
                >
                  <span
                    className={cx(
                      'mt-0.5 grid size-11 shrink-0 place-items-center rounded-lg border border-line',
                      glyphBox(login.image),
                    )}
                  >
                    <Glyph name={login.icon} image={login.image} size={login.image ? 22 : 17} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5 text-sm font-semibold text-white">
                      {login.label}
                      <ExternalLink
                        size={12}
                        className="text-slate-500 opacity-0 transition group-hover:opacity-100"
                      />
                    </span>
                    <span className="mt-0.5 block text-xs leading-snug text-slate-500">
                      {login.hint}
                    </span>
                  </span>
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Botón móvil */}
        <button
          onClick={() => setMobileOpen((open) => !open)}
          className="btn-ghost btn-sm ml-auto p-2 lg:hidden"
          aria-label={mobileOpen ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </nav>

      {/* Menú móvil */}
      {mobileOpen && (
        <div className="anim-pop border-t border-line-soft bg-void/95 backdrop-blur-xl lg:hidden">
          <div className="space-y-1 px-4 py-4">
            {links.map((link) => (
              <a
                key={link.id}
                href={safeUrl(link.href)}
                onClick={() => setMobileOpen(false)}
                aria-current={isActive(link) ? 'page' : undefined}
                className={cx(
                  'block rounded-lg px-3 py-2.5 text-sm font-medium transition',
                  isActive(link)
                    ? 'bg-hex-500/15 text-white'
                    : 'text-slate-400 hover:bg-surface-2 hover:text-white',
                )}
              >
                {link.label}
              </a>
            ))}

            <div className="!mt-4 space-y-2 border-t border-line-soft pt-4">
              <span className="label !mb-2">Divisa</span>
              <CurrencyPicker variant="inline" />
            </div>

            <div className="!mt-4 border-t border-line-soft pt-4">
              <AppearancePicker variant="inline" />
            </div>

            <div
              className={cx(
                '!mt-4 space-y-2 border-t border-line-soft pt-4',
                logins.length === 0 && 'hidden',
              )}
            >
              {logins.map((login) => (
                <a
                  key={login.id}
                  href={safeUrl(login.url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glass-soft flex items-center gap-3 p-3"
                >
                  <Glyph name={login.icon} image={login.image} size={16} className="text-hex-300" />
                  <span className="text-sm font-semibold text-white">{login.label}</span>
                  <ExternalLink size={13} className="ml-auto text-slate-500" />
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
