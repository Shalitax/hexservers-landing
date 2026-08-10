import { ShieldCheck } from 'lucide-react'
import { useSite } from '../store/useSite.js'
import { cx } from '../lib/utils.js'
import SectionHeading from './SectionHeading.jsx'
import Editable from './ui/Editable.jsx'
import { Glyph } from './ui/icons.jsx'
import { stagger } from '../lib/reveal.js'

/**
 * Formas de pago aceptadas.
 *
 * Es información y no un formulario: el cobro ocurre en el carrito de WHMCS, con
 * su pasarela. Está en la portada porque «¿cómo se paga esto?» es una pregunta que
 * aparece antes de llegar al carrito, y responderla antes evita un abandono.
 */
export default function Payments() {
  const payments = useSite((s) => s.site.payments)

  if (!payments?.items?.length) return null

  return (
    <section id="pagos" className="section">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Pagos"
          titlePath="payments.title"
          subtitlePath="payments.subtitle"
        />

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {payments.items.map((item, index) => (
            <article
              key={item.id}
              className="glass glass-hover group flex flex-col p-5"
              data-reveal
              style={stagger(index)}
            >
              <div className="flex items-center gap-3">
                {/* Con logo propio el hueco se deja neutro: un degradado de marca
                    ajena encima del suyo queda mal y confunde de quién es. */}
                <span
                  className={cx(
                    'grid size-11 shrink-0 place-items-center rounded-xl border border-line transition',
                    item.image
                      ? 'bg-surface-2 p-1.5'
                      : 'bg-gradient-to-br from-hex-500/20 to-plasma-500/15 text-hex-300 group-hover:from-hex-500/30 group-hover:text-hex-200',
                  )}
                >
                  <Glyph name={item.icon} image={item.image} size={item.image ? 28 : 19} alt="" />
                </span>
                <Editable
                  path={`payments.items.${index}.name`}
                  as="h3"
                  className="display min-w-0 flex-1 text-base font-bold text-white"
                />
              </div>

              <Editable
                path={`payments.items.${index}.description`}
                as="p"
                multiline
                className="mt-3 flex-1 text-sm leading-relaxed text-slate-400"
              />

              {item.badge && <span className="chip mt-4 self-start">{item.badge}</span>}
            </article>
          ))}
        </div>

        {payments.note && (
          <p className="mt-6 flex items-start justify-center gap-2 text-center text-xs leading-relaxed text-slate-500">
            <ShieldCheck size={13} className="mt-0.5 shrink-0 text-hex-400" />
            <Editable path="payments.note" as="span" multiline />
          </p>
        )}
      </div>
    </section>
  )
}
