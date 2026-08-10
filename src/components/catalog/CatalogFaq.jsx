import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useSite } from '../../store/useSite.js'
import { cx } from '../../lib/utils.js'
import Editable from '../ui/Editable.jsx'

/**
 * Preguntas frecuentes al pie del catálogo.
 *
 * La página terminaba en seco después de la última tarjeta. Esto es lo que hacen
 * las tres webs de referencia, y no sólo por rellenar: son las dudas que llegan
 * siempre justo antes de pagar, así que contestarlas aquí cierra ventas y quita
 * tickets a la vez.
 *
 * Plegado por defecto. Un muro de respuestas abiertas ocupa tres pantallas y se
 * salta entero; plegado, las preguntas se leen de un vistazo y sólo se abre la que
 * a cada uno le importa. Se permite tener varias abiertas a la vez —comparar dos
 * respuestas es un caso real— en lugar de cerrar la anterior al abrir otra.
 *
 * Sin `<details>` nativo a propósito: no se puede animar el desplegado ni encajar
 * la flecha con el resto de la interfaz sin pelearse con el marcador por defecto
 * de cada navegador.
 */
export default function CatalogFaq() {
  const catalog = useSite((s) => s.site.catalog)
  const editMode = useSite((s) => s.editMode)
  const [open, setOpen] = useState(() => new Set())

  const items = catalog.faq || []
  if (items.length === 0) return null

  const toggle = (id) =>
    setOpen((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  return (
    <section className="section">
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <Editable
            path="catalog.faqTitle"
            as="h2"
            className="display text-2xl font-bold text-balance text-white sm:text-3xl"
          />
          {catalog.faqSubtitle && (
            <Editable
              path="catalog.faqSubtitle"
              as="p"
              multiline
              className="mt-3 text-base leading-relaxed text-pretty text-slate-400"
            />
          )}
        </div>

        <div className="mt-8 space-y-2">
          {items.map((item, index) => {
            const expanded = open.has(item.id)
            return (
              <article key={item.id} className="glass overflow-hidden">
                <h3>
                  <button
                    onClick={() => toggle(item.id)}
                    aria-expanded={expanded}
                    className="flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-surface-1"
                  >
                    <span className="min-w-0 flex-1 text-sm font-semibold text-white sm:text-base">
                      {item.question}
                    </span>
                    {/* Un «+» que gira a «×»: dice a la vez que se abre y que se cierra. */}
                    <Plus
                      size={18}
                      className={cx(
                        'shrink-0 text-hex-400 transition-transform duration-300',
                        expanded && 'rotate-45',
                      )}
                    />
                  </button>
                </h3>

                {expanded && (
                  <div className="anim-up border-t border-line-soft px-5 py-4">
                    <Editable
                      path={`catalog.faq.${index}.answer`}
                      as="p"
                      multiline
                      className="text-sm leading-relaxed text-slate-400"
                    />
                  </div>
                )}
              </article>
            )
          })}
        </div>

        {editMode && (
          <p className="mt-4 text-center text-xs text-slate-600">
            Las preguntas se añaden y se ordenan desde el panel → Catálogo → Preguntas frecuentes.
            La respuesta se puede editar aquí mismo abriéndola.
          </p>
        )}
      </div>
    </section>
  )
}
