import { Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react'
import { useSite } from '../../store/useSite.js'
import Flag from '../../components/ui/Flag.jsx'
import {
  TextField,
  CompactGlyphPicker,
  GlyphField,
  ImageField,
  Toggle,
  Row,
  PanelSection,
} from '../controls.jsx'

/** Pestaña "Contenido": todo lo que no es catálogo (hero, features, footer…). */
export default function ContentPanel() {
  const site = useSite((s) => s.site)
  const setField = useSite((s) => s.setField)
  const addListItem = useSite((s) => s.addListItem)
  const removeListItem = useSite((s) => s.removeListItem)
  const moveListItem = useSite((s) => s.moveListItem)
  const updateListItem = useSite((s) => s.updateListItem)

  return (
    <div className="space-y-8">
      <p className="rounded-xl border border-hex-500/20 bg-hex-500/[0.06] p-3 text-micro leading-relaxed text-hex-200/90">
        Los títulos y descripciones también se editan haciendo click directamente sobre ellos en la
        página (recuadro punteado). Aquí están los campos que no tienen edición inline.
      </p>

      {/* --------------------------------- Marca --------------------------------- */}
      <PanelSection title="Marca">
        <Row>
          <TextField
            label="Nombre"
            value={site.brand.name}
            onChange={(v) => setField('brand.name', v)}
            hint="Si termina en «servers», esa parte se pinta en violeta en el logo."
          />
          <TextField
            label="Claim"
            value={site.brand.claim}
            onChange={(v) => setField('brand.claim', v)}
          />
        </Row>
        <TextField
          label="Sello «powered by» del footer"
          value={site.brand.poweredBy}
          onChange={(v) => setField('brand.poweredBy', v)}
          placeholder="Powered by HexServers"
          hint="Se muestra en tipografía pixel junto al aviso legal. Déjalo vacío para ocultarlo."
        />
      </PanelSection>

      {/* ---------------------------------- Hero --------------------------------- */}
      <PanelSection title="Hero" description="Botones y métricas de la portada.">
        <Row>
          <TextField
            label="CTA principal — texto"
            value={site.hero.primaryCta.label}
            onChange={(v) => setField('hero.primaryCta.label', v)}
          />
          <TextField
            label="CTA principal — destino"
            value={site.hero.primaryCta.href}
            onChange={(v) => setField('hero.primaryCta.href', v)}
          />
          <TextField
            label="CTA secundario — texto"
            value={site.hero.secondaryCta.label}
            onChange={(v) => setField('hero.secondaryCta.label', v)}
          />
          <TextField
            label="CTA secundario — destino"
            value={site.hero.secondaryCta.href}
            onChange={(v) => setField('hero.secondaryCta.href', v)}
          />
        </Row>

        <TextField
          label="Fragmento resaltado del titular"
          value={site.hero.highlight}
          onChange={(v) => setField('hero.highlight', v)}
          hint="Debe aparecer literalmente en el titular para pintarse con degradado."
        />

        <ListEditor
          title="Métricas"
          path="hero.stats"
          items={site.hero.stats}
          columns={[
            { key: 'value', placeholder: '99.9%', width: 'w-28' },
            { key: 'label', placeholder: 'Uptime medido' },
          ]}
          onAdd={() => addListItem('hero.stats', { value: '0', label: 'Nueva métrica' })}
          onUpdate={updateListItem}
          onRemove={removeListItem}
          onMove={moveListItem}
        />
      </PanelSection>

      {/* ---------------------- Portada: bloque de subcategorías ------------------ */}
      <PanelSection
        title="Portada · Catálogo"
        description="Las tarjetas de subcategoría de la portada. Sus nombres y descripciones se editan en la pestaña Catálogo."
      >
        <Row>
          <TextField
            label="Eyebrow"
            value={site.showcase.eyebrow}
            onChange={(v) => setField('showcase.eyebrow', v)}
          />
          <TextField
            label="Texto del botón"
            value={site.showcase.ctaLabel}
            onChange={(v) => setField('showcase.ctaLabel', v)}
          />
        </Row>
      </PanelSection>

      {/* ------------------------ Página de productos ---------------------------- */}
      <PanelSection
        title="Página de productos"
        description="Textos del catálogo y del recorrido de compra. Título y subtítulo se editan inline en la propia página."
      >
        {/* Las pestañas y la forma de listar se ajustan en la pestaña Catálogo, juntas. */}
        <Row>
          <TextField
            label="Eyebrow"
            value={site.catalog.eyebrow}
            onChange={(v) => setField('catalog.eyebrow', v)}
          />
          <TextField
            label="Mensaje de subcategoría vacía"
            value={site.catalog.emptyLabel}
            onChange={(v) => setField('catalog.emptyLabel', v)}
          />
        </Row>

        <div>
          <p className="mb-2 text-micro leading-relaxed text-slate-500">
            Bloques del configurador de la ficha de producto. Los de ubicación y CPU sólo aparecen
            en los productos cuyos planes tienen más de una opción; el de planes puede llevar su
            propio título por producto (editor del producto).
          </p>
          <Row>
            <TextField
              label="Ubicación — título"
              value={site.catalog.sections.location}
              onChange={(v) => setField('catalog.sections.location', v)}
            />
            <TextField
              label="Ubicación — apunte"
              value={site.catalog.sections.locationHint}
              onChange={(v) => setField('catalog.sections.locationHint', v)}
            />
            <TextField
              label="CPU — título"
              value={site.catalog.sections.cpu}
              onChange={(v) => setField('catalog.sections.cpu', v)}
            />
            <TextField
              label="CPU — apunte"
              value={site.catalog.sections.cpuHint}
              onChange={(v) => setField('catalog.sections.cpuHint', v)}
            />
            <TextField
              label="Planes — título"
              value={site.catalog.sections.plans}
              onChange={(v) => setField('catalog.sections.plans', v)}
            />
            <TextField
              label="Planes — apunte"
              value={site.catalog.sections.plansHint}
              onChange={(v) => setField('catalog.sections.plansHint', v)}
            />
          </Row>
        </div>

        <Row>
          <TextField
            label="Título del «qué incluye»"
            value={site.catalog.detailTitle}
            onChange={(v) => setField('catalog.detailTitle', v)}
          />
          <TextField
            label="Botón de compra"
            value={site.catalog.checkoutLabel}
            onChange={(v) => setField('catalog.checkoutLabel', v)}
          />
        </Row>
        <TextField
          label="Aviso bajo el botón de compra"
          value={site.catalog.checkoutHint}
          onChange={(v) => setField('catalog.checkoutHint', v)}
        />
      </PanelSection>

      {/* -------------------------------- Features ------------------------------- */}
      <PanelSection
        title="Features"
        description="Complementos incluidos. El texto se edita inline en la página."
        action={
          <button
            onClick={() =>
              addListItem('features.items', {
                icon: 'sparkles',
                title: 'Nueva ventaja',
                description: 'Descripción.',
              })
            }
            className="btn-ghost btn-sm"
          >
            <Plus size={13} />
            Añadir
          </button>
        }
      >
        <div className="space-y-2">
          {site.features.items.map((item, index) => (
            <div key={item.id} className="rounded-xl border border-line bg-surface-1 p-3">
              <div className="mb-2 flex items-center gap-2">
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-200">
                  {item.title}
                </span>
                <MoveButtons
                  onUp={() => moveListItem('features.items', item.id, -1)}
                  onDown={() => moveListItem('features.items', item.id, 1)}
                  disableUp={index === 0}
                  disableDown={index === site.features.items.length - 1}
                  onRemove={() => removeListItem('features.items', item.id)}
                />
              </div>
              <GlyphField
                icon={item.icon}
                image={item.image}
                onIcon={(v) => updateListItem('features.items', item.id, { icon: v })}
                onImage={(v) => updateListItem('features.items', item.id, { image: v })}
              />
            </div>
          ))}
        </div>
      </PanelSection>

      {/* ------------------------------ Ubicaciones ------------------------------ */}
      <PanelSection
        title="Ubicaciones"
        description="La latencia se mide de verdad desde el navegador del visitante, contra el endpoint de cada ubicación."
        action={
          <button
            onClick={() =>
              addListItem('locations.items', {
                flag: '🏳️',
                city: 'Ciudad',
                country: 'País',
                ping: '— ms',
                status: 'soon',
                pingUrl: '',
              })
            }
            className="btn-ghost btn-sm"
          >
            <Plus size={13} />
            Añadir
          </button>
        }
      >
        <Toggle
          label="Medir la latencia en vivo"
          hint="Desactivado, se muestra siempre el valor fijo de cada ubicación."
          checked={site.locations.liveLatency !== false}
          onChange={(v) => setField('locations.liveLatency', v)}
        />

        <div className="space-y-2">
          {site.locations.items.map((item, index) => (
            <div key={item.id} className="space-y-2 rounded-xl border border-line bg-surface-1 p-3">
              <div className="flex gap-2">
                {/* Vista previa: así se ve qué bandera va a dibujar la web. */}
                <span
                  className="grid size-11 shrink-0 place-items-center rounded-lg border border-line bg-black/40"
                  title="Bandera que se mostrará"
                >
                  <Flag flag={item.flag} size={22} />
                </span>
                <input
                  className="input w-16 shrink-0"
                  placeholder="🇨🇱 o CL"
                  title="Emoji de la bandera, o el código de dos letras del país"
                  value={item.flag ?? ''}
                  onChange={(event) =>
                    updateListItem('locations.items', item.id, { flag: event.target.value })
                  }
                />
                <input
                  className="input"
                  placeholder="Santiago"
                  value={item.city ?? ''}
                  onChange={(event) =>
                    updateListItem('locations.items', item.id, { city: event.target.value })
                  }
                />
                <input
                  className="input"
                  placeholder="Chile"
                  value={item.country ?? ''}
                  onChange={(event) =>
                    updateListItem('locations.items', item.id, { country: event.target.value })
                  }
                />
                <MoveButtons
                  onUp={() => moveListItem('locations.items', item.id, -1)}
                  onDown={() => moveListItem('locations.items', item.id, 1)}
                  disableUp={index === 0}
                  disableDown={index === site.locations.items.length - 1}
                  onRemove={() => removeListItem('locations.items', item.id)}
                />
              </div>

              <div className="flex gap-2">
                <input
                  className="input w-20 shrink-0"
                  placeholder="4 ms"
                  title="Valor fijo: se muestra si no hay endpoint o si la medición está desactivada"
                  value={item.ping ?? ''}
                  onChange={(event) =>
                    updateListItem('locations.items', item.id, { ping: event.target.value })
                  }
                />
                <input
                  className="input"
                  placeholder="https://scl.tudominio.com/ping"
                  title="Endpoint a medir en vivo"
                  value={item.pingUrl ?? ''}
                  onChange={(event) =>
                    updateListItem('locations.items', item.id, { pingUrl: event.target.value })
                  }
                />
                <select
                  className="input w-32 shrink-0"
                  value={item.status}
                  onChange={(event) =>
                    updateListItem('locations.items', item.id, { status: event.target.value })
                  }
                >
                  <option value="online">Online</option>
                  <option value="soon">Próximamente</option>
                </select>
              </div>
            </div>
          ))}
        </div>

        <TextField
          label="Aviso bajo las ubicaciones"
          value={site.locations.latencyNote}
          onChange={(v) => setField('locations.latencyNote', v)}
        />

        <p className="rounded-xl border border-amber-400/25 bg-amber-400/[0.07] p-3 text-micro leading-relaxed text-amber-200">
          El endpoint debe ser un archivo diminuto servido por HTTPS desde{' '}
          <strong>esa</strong> ubicación (por ejemplo un <code>204 No Content</code> en{' '}
          <code>/ping</code>). No apuntes a servicios ajenos: estarías mostrando la latencia de
          otro como si fuera la tuya. Si la web va por HTTPS, el endpoint también debe ir por
          HTTPS o el navegador lo bloqueará.
        </p>
      </PanelSection>

      {/* ------------------------------ Formas de pago --------------------------- */}
      <PanelSection
        title="Formas de pago"
        description="La sección de la portada. Nombres y descripciones también se editan inline en la página; si borras todas, la sección desaparece."
        action={
          <button
            onClick={() =>
              addListItem('payments.items', {
                name: 'Nuevo método',
                icon: 'card',
                image: '',
                description: 'Cómo funciona y cuándo se activa el servicio.',
                badge: '',
              })
            }
            className="btn-ghost btn-sm"
          >
            <Plus size={13} />
            Añadir
          </button>
        }
      >
        <div className="space-y-2">
          {site.payments.items.map((item, index) => (
            <div key={item.id} className="space-y-2 rounded-xl border border-line bg-surface-1 p-3">
              <div className="flex items-center gap-2">
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-200">
                  {item.name || 'Sin nombre'}
                </span>
                <MoveButtons
                  onUp={() => moveListItem('payments.items', item.id, -1)}
                  onDown={() => moveListItem('payments.items', item.id, 1)}
                  disableUp={index === 0}
                  disableDown={index === site.payments.items.length - 1}
                  onRemove={() => removeListItem('payments.items', item.id)}
                />
              </div>
              <Row>
                <TextField
                  label="Nombre"
                  value={item.name}
                  placeholder="PayPal"
                  onChange={(v) => updateListItem('payments.items', item.id, { name: v })}
                />
                <TextField
                  label="Etiqueta"
                  value={item.badge}
                  placeholder="Activación inmediata"
                  hint="Opcional: la píldora bajo la descripción."
                  onChange={(v) => updateListItem('payments.items', item.id, { badge: v })}
                />
              </Row>
              <GlyphField
                icon={item.icon}
                image={item.image}
                onIcon={(v) => updateListItem('payments.items', item.id, { icon: v })}
                onImage={(v) => updateListItem('payments.items', item.id, { image: v })}
                hint="Sube el logo de la pasarela (PayPal, Mercado Pago…) para usarlo en lugar del icono."
              />
            </div>
          ))}
          {site.payments.items.length === 0 && (
            <p className="text-xs text-slate-600">
              Sin métodos de pago: la sección no se muestra en la portada.
            </p>
          )}
        </div>

        <TextField
          label="Aviso bajo las tarjetas"
          value={site.payments.note}
          onChange={(v) => setField('payments.note', v)}
          hint="Déjalo vacío para ocultarlo."
        />
      </PanelSection>

      {/* -------------------------------- Accesos -------------------------------- */}
      <PanelSection
        title="Accesos del navbar"
        description="El desplegable «Acceder». Portal de clientes, panel de juegos y los que quieras añadir."
        action={
          <button
            onClick={() =>
              addListItem('nav.logins', {
                label: 'Nuevo acceso',
                hint: '',
                url: 'https://',
                icon: 'globe',
              })
            }
            className="btn-ghost btn-sm"
          >
            <Plus size={13} />
            Añadir
          </button>
        }
      >
        {site.nav.logins.map((login, index) => (
          <div key={login.id} className="space-y-2 rounded-xl border border-line bg-surface-1 p-3">
            <div className="flex items-center gap-2">
              <CompactGlyphPicker
                icon={login.icon}
                image={login.image}
                onIcon={(v) => updateListItem('nav.logins', login.id, { icon: v })}
                onImage={(v) => updateListItem('nav.logins', login.id, { image: v })}
              />
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-200">
                {login.label || 'Sin nombre'}
              </span>
              <MoveButtons
                onUp={() => moveListItem('nav.logins', login.id, -1)}
                onDown={() => moveListItem('nav.logins', login.id, 1)}
                disableUp={index === 0}
                disableDown={index === site.nav.logins.length - 1}
                onRemove={() => removeListItem('nav.logins', login.id)}
              />
            </div>
            <Row>
              <TextField
                label="Etiqueta"
                value={login.label}
                onChange={(v) => updateListItem('nav.logins', login.id, { label: v })}
              />
              <TextField
                label="URL"
                value={login.url}
                onChange={(v) => updateListItem('nav.logins', login.id, { url: v })}
              />
            </Row>
            <TextField
              label="Descripción"
              value={login.hint}
              onChange={(v) => updateListItem('nav.logins', login.id, { hint: v })}
            />
          </div>
        ))}
        {site.nav.logins.length === 0 && (
          <p className="text-xs text-slate-600">
            Sin accesos: el botón «Acceder» desaparece del navbar.
          </p>
        )}
      </PanelSection>

      {/* ---------------------------- Enlaces del navbar -------------------------- */}
      <ListEditor
        title="Enlaces del navbar"
        description="Rutas internas: #/ (portada), /productos, /productos/{slug}, /producto/{slug}. Las anclas de la portada siguen valiendo (#features, #contacto)."
        path="nav.links"
        items={site.nav.links}
        columns={[
          { key: 'label', placeholder: 'Inicio' },
          { key: 'href', placeholder: '/productos' },
        ]}
        onAdd={() => addListItem('nav.links', { label: 'Nuevo', href: '/productos' })}
        onUpdate={updateListItem}
        onRemove={removeListItem}
        onMove={moveListItem}
      />

      {/* -------------------------------- Contacto ------------------------------- */}
      <PanelSection title="Contacto">
        <Row>
          <TextField
            label="Email"
            value={site.contact.email}
            onChange={(v) => setField('contact.email', v)}
          />
          <TextField
            label="Discord"
            value={site.contact.discord}
            onChange={(v) => setField('contact.discord', v)}
          />
        </Row>
        <TextField
          label="Tiempo de respuesta"
          value={site.contact.responseTime}
          onChange={(v) => setField('contact.responseTime', v)}
        />
      </PanelSection>

      {/* -------------------------------- Nosotros ------------------------------- */}
      <PanelSection
        title="Página Nosotros"
        description="Titular, párrafos y pilares se editan inline en la propia página (/nosotros)."
      >
        <TextField
          label="Eyebrow"
          value={site.about.eyebrow}
          onChange={(v) => setField('about.eyebrow', v)}
        />

        <ImageField
          label="Imagen (equipo, rack…)"
          value={site.about.image}
          onChange={(v) => setField('about.image', v)}
          hint="Si la dejas vacía se muestra una tarjeta con las ubicaciones."
        />

        {/* Historia */}
        <div className="space-y-2">
          <header className="flex items-center justify-between gap-3">
            <h4 className="text-micro font-semibold tracking-wider text-slate-500 uppercase">
              Historia — {site.about.story.length} párrafos
            </h4>
            <button
              onClick={() => addListItem('about.story', { text: '' })}
              className="btn-ghost btn-sm"
            >
              <Plus size={13} />
              Párrafo
            </button>
          </header>
          {site.about.story.map((paragraph, index) => (
            <div key={paragraph.id} className="flex items-start gap-2">
              <textarea
                className="input min-h-20 resize-y"
                value={paragraph.text}
                placeholder="Un párrafo de la historia."
                onChange={(event) =>
                  updateListItem('about.story', paragraph.id, { text: event.target.value })
                }
              />
              <MoveButtons
                onUp={() => moveListItem('about.story', paragraph.id, -1)}
                onDown={() => moveListItem('about.story', paragraph.id, 1)}
                disableUp={index === 0}
                disableDown={index === site.about.story.length - 1}
                onRemove={() => removeListItem('about.story', paragraph.id)}
              />
            </div>
          ))}
        </div>

        {/* Pilares */}
        <div className="space-y-2">
          <header className="flex items-center justify-between gap-3">
            <h4 className="text-micro font-semibold tracking-wider text-slate-500 uppercase">
              Cómo trabajamos — {site.about.pillars.length} pilares
            </h4>
            <button
              onClick={() =>
                addListItem('about.pillars', {
                  icon: 'sparkles',
                  title: 'Nuevo pilar',
                  description: 'Descripción.',
                })
              }
              className="btn-ghost btn-sm"
            >
              <Plus size={13} />
              Pilar
            </button>
          </header>
          {site.about.pillars.map((pillar, index) => (
            <div key={pillar.id} className="rounded-xl border border-line bg-surface-1 p-3">
              <div className="mb-2 flex items-center gap-2">
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-200">
                  {pillar.title}
                </span>
                <MoveButtons
                  onUp={() => moveListItem('about.pillars', pillar.id, -1)}
                  onDown={() => moveListItem('about.pillars', pillar.id, 1)}
                  disableUp={index === 0}
                  disableDown={index === site.about.pillars.length - 1}
                  onRemove={() => removeListItem('about.pillars', pillar.id)}
                />
              </div>
              <GlyphField
                icon={pillar.icon}
                image={pillar.image}
                onIcon={(v) => updateListItem('about.pillars', pillar.id, { icon: v })}
                onImage={(v) => updateListItem('about.pillars', pillar.id, { image: v })}
              />
            </div>
          ))}
        </div>

        <Row>
          <TextField
            label="Botón de cierre — texto"
            value={site.about.ctaLabel}
            onChange={(v) => setField('about.ctaLabel', v)}
          />
          <TextField
            label="Botón de cierre — destino"
            value={site.about.ctaHref}
            onChange={(v) => setField('about.ctaHref', v)}
          />
        </Row>
      </PanelSection>

      <ListEditor
        title="Nosotros · Cifras"
        path="about.stats"
        items={site.about.stats}
        columns={[
          { key: 'value', placeholder: '2019', width: 'w-28' },
          { key: 'label', placeholder: 'Desde' },
        ]}
        onAdd={() => addListItem('about.stats', { value: '0', label: 'Nueva cifra' })}
        onUpdate={updateListItem}
        onRemove={removeListItem}
        onMove={moveListItem}
      />

      {/* --------------------------------- Footer -------------------------------- */}
      <PanelSection title="Footer">
        <TextField
          label="Aviso legal"
          value={site.footer.legal}
          onChange={(v) => setField('footer.legal', v)}
        />

        {site.footer.columns.map((column, columnIndex) => (
          <div key={column.id} className="space-y-2 rounded-xl border border-line bg-surface-1 p-3">
            <TextField
              label={`Columna ${columnIndex + 1} — título`}
              value={column.title}
              onChange={(v) => updateListItem('footer.columns', column.id, { title: v })}
            />
            {column.links.map((link, linkIndex) => (
              <div key={link.id} className="flex gap-2">
                <input
                  className="input"
                  value={link.label}
                  placeholder="Texto"
                  onChange={(event) => {
                    const links = column.links.slice()
                    links[linkIndex] = { ...link, label: event.target.value }
                    updateListItem('footer.columns', column.id, { links })
                  }}
                />
                <input
                  className="input"
                  value={link.href}
                  placeholder="#destino"
                  onChange={(event) => {
                    const links = column.links.slice()
                    links[linkIndex] = { ...link, href: event.target.value }
                    updateListItem('footer.columns', column.id, { links })
                  }}
                />
                <button
                  onClick={() =>
                    updateListItem('footer.columns', column.id, {
                      links: column.links.filter((l) => l.id !== link.id),
                    })
                  }
                  aria-label="Eliminar enlace"
                  className="btn btn-sm shrink-0 p-2 text-slate-500 hover:bg-rose-500/15 hover:text-rose-400"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            <button
              onClick={() =>
                updateListItem('footer.columns', column.id, {
                  links: [
                    ...column.links,
                    { id: `fl_${Date.now().toString(36)}`, label: 'Nuevo enlace', href: '#' },
                  ],
                })
              }
              className="btn-ghost btn-sm w-full border-dashed py-1.5"
            >
              <Plus size={12} />
              Enlace
            </button>
          </div>
        ))}

        <ListEditor
          title="Redes sociales"
          description="El icono se elige con el botón de cada fila, que también admite subir un logo."
          path="footer.social"
          items={site.footer.social}
          columns={[
            { key: 'label', placeholder: 'Discord' },
            { key: 'url', placeholder: 'https://…' },
          ]}
          extra={(item) => (
            <CompactGlyphPicker
              icon={item.icon}
              image={item.image}
              onIcon={(v) => updateListItem('footer.social', item.id, { icon: v })}
              onImage={(v) => updateListItem('footer.social', item.id, { image: v })}
            />
          )}
          onAdd={() => addListItem('footer.social', { label: 'Red', url: '', icon: 'globe' })}
          onUpdate={updateListItem}
          onRemove={removeListItem}
          onMove={moveListItem}
        />
      </PanelSection>
    </div>
  )
}

/* ------------------------------ helpers de lista ----------------------------- */

function ListEditor({
  title,
  description,
  path,
  items,
  columns,
  extra,
  onAdd,
  onUpdate,
  onRemove,
  onMove,
}) {
  return (
    <PanelSection
      title={title}
      description={description}
      action={
        <button onClick={onAdd} className="btn-ghost btn-sm">
          <Plus size={13} />
          Añadir
        </button>
      }
    >
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={item.id} className="flex items-center gap-2">
            {columns.map((column) => (
              <input
                key={column.key}
                className={`input ${column.width || ''}`}
                value={item[column.key] ?? ''}
                placeholder={column.placeholder}
                onChange={(event) => onUpdate(path, item.id, { [column.key]: event.target.value })}
              />
            ))}
            {extra?.(item)}
            <MoveButtons
              onUp={() => onMove(path, item.id, -1)}
              onDown={() => onMove(path, item.id, 1)}
              disableUp={index === 0}
              disableDown={index === items.length - 1}
              onRemove={() => onRemove(path, item.id)}
            />
          </div>
        ))}
        {items.length === 0 && <p className="text-xs text-slate-600">Lista vacía.</p>}
      </div>
    </PanelSection>
  )
}

function MoveButtons({ onUp, onDown, disableUp, disableDown, onRemove }) {
  const base =
    'rounded-md p-1 text-slate-500 transition hover:bg-surface-3 hover:text-white disabled:opacity-25'
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
