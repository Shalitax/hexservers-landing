import { useSite } from '../../store/useSite.js'
import { TextField, SelectField, ImageField, Row, PanelSection } from '../controls.jsx'
import { DEFAULT_SEO } from '../../../shared/seo.js'

/**
 * Pestaña «SEO y marca».
 *
 * Junta tres cosas que parecen distintas y son la misma: qué enseña tu web
 * cuando la mira alguien que no es una persona. Un buscador, el rastreador de
 * Discord que pinta la tarjeta al pegar un enlace, o el iPhone que guarda el
 * icono en la pantalla de inicio.
 *
 * Todo lo de aquí lo escribe el servidor en el HTML antes de mandarlo, porque
 * ninguno de esos ejecuta JavaScript. Ver `shared/seo.js`.
 */
export default function SeoPanel() {
  const site = useSite((s) => s.site)
  const setField = useSite((s) => s.setField)
  const seo = { ...DEFAULT_SEO, ...site.seo }
  const analytics = { ...DEFAULT_SEO.analytics, ...seo.analytics }

  /* Las páginas fijas. Las de producto y familia sacan su título y su
     descripción del propio producto, así que no se listan aquí. */
  const pages = [
    ['home', 'Portada', 'El título de la portada va tal cual, sin la plantilla.'],
    ['products', 'Productos', ''],
    ['hub', 'Hub', ''],
    ['about', 'Nosotros', ''],
    ['support', 'Soporte', ''],
  ]

  return (
    <div className="space-y-8">
      <p className="rounded-xl border border-hex-500/20 bg-hex-500/[0.06] p-3 text-micro leading-relaxed text-hex-200/90">
        Todo esto lo escribe el <strong>servidor</strong> en la página antes de enviarla. Sin
        servidor detrás (la barra dice «Sólo local») se guarda igual, pero no llega a verse: haz
        los cambios y publícalos.
      </p>

      {/* -------------------------------- Dirección ------------------------------- */}
      <PanelSection
        title="Dirección del sitio"
        description="Lo primero que hay que rellenar: sin esto no hay tarjetas de enlace ni sitemap."
      >
        <TextField
          label="URL pública"
          value={seo.siteUrl}
          onChange={(v) => setField('seo.siteUrl', v)}
          placeholder="https://hexservers.com"
          hint="Con https:// y sin barra al final. Se usa para el canonical, la tarjeta de enlace y el sitemap, que necesitan direcciones absolutas. Si lo dejas vacío se deduce de cada petición, lo que suele acertar pero falla detrás de algunos proxys."
        />
      </PanelSection>

      {/* ---------------------------------- Marca --------------------------------- */}
      <PanelSection
        title="Imágenes de marca"
        description="Puedes subir un archivo o pegar la dirección de una imagen ya alojada."
      >
        <ImageField
          label="Imagen de la tarjeta de enlace (og:image)"
          value={site.brand.ogImage}
          onChange={(v) => setField('brand.ogImage', v)}
          hint="La imagen grande que sale al pegar un enlace tuyo en Discord, WhatsApp o X. 1200 × 630 px. Es la que más se nota de esta pestaña: sin ella el enlace sale como una línea de texto."
        />
        <ImageField
          label="Favicon"
          value={site.brand.favicon}
          onChange={(v) => setField('brand.favicon', v)}
          hint="El icono de la pestaña del navegador. Cuadrado, PNG o SVG, a partir de 32 × 32 px. Vacío usa el favicon.svg del proyecto."
        />
        <ImageField
          label="Icono de iOS (apple-touch-icon)"
          value={site.brand.appleIcon}
          onChange={(v) => setField('brand.appleIcon', v)}
          hint="Para cuando alguien añade la web a la pantalla de inicio del iPhone. 180 × 180 px, PNG sin transparencia — iOS la pinta en negro."
        />
        <ImageField
          label="Logo"
          value={site.brand.logo}
          onChange={(v) => setField('brand.logo', v)}
          hint="Sustituye al logo dibujado en código del navbar y el pie. Se escala a la altura de cada sitio, así que conviene que sea horizontal y con fondo transparente."
        />
      </PanelSection>

      {/* --------------------------------- Textos --------------------------------- */}
      <PanelSection
        title="Título y descripción"
        description="Lo que se lee en el resultado de búsqueda y en la tarjeta del enlace."
      >
        <TextField
          label="Plantilla del título"
          value={seo.titleTemplate}
          onChange={(v) => setField('seo.titleTemplate', v)}
          placeholder="%s · HexServers"
          hint="%s es el título de cada página. La portada no pasa por aquí: usa el suyo entero."
        />
        <TextField
          label="Descripción por defecto"
          value={seo.description}
          onChange={(v) => setField('seo.description', v)}
          textarea
          hint="Se usa donde no haya una propia. Google corta alrededor de los 155 caracteres, así que lo importante va al principio."
        />
        <Row>
          <TextField
            label="Cuenta de X"
            value={seo.twitterSite}
            onChange={(v) => setField('seo.twitterSite', v)}
            placeholder="@hexservers"
            hint="Sale como atribución en la tarjeta. Opcional."
          />
          <TextField
            label="Idioma y país"
            value={seo.locale}
            onChange={(v) => setField('seo.locale', v)}
            placeholder="es_CL"
          />
        </Row>
      </PanelSection>

      {/* ------------------------------ Página a página --------------------------- */}
      <PanelSection
        title="Por página"
        description="Vacío = se calcula del contenido de cada página. Los productos y las familias sacan el suyo de su propia ficha."
      >
        {pages.map(([key, label, note]) => (
          <div key={key} className="rounded-xl border border-line-soft p-4">
            <h4 className="mb-3 text-sm font-semibold text-white">{label}</h4>
            <TextField
              label="Título"
              value={seo.pages?.[key]?.title || ''}
              onChange={(v) => setField(`seo.pages.${key}.title`, v)}
              hint={note || undefined}
            />
            <TextField
              label="Descripción"
              value={seo.pages?.[key]?.description || ''}
              onChange={(v) => setField(`seo.pages.${key}.description`, v)}
              textarea
              className="mt-3"
            />
          </div>
        ))}
      </PanelSection>

      {/* -------------------------------- Buscadores ------------------------------ */}
      <PanelSection title="Buscadores">
        <SelectField
          label="Permitir la indexación"
          value={seo.robots}
          onChange={(v) => setField('seo.robots', v)}
          options={[
            { value: 'index,follow', label: 'Sí — que la indexen (normal)' },
            { value: 'noindex,follow', label: 'No — sitio en construcción' },
          ]}
          hint="«No» tapa la web entera: pone noindex en todas las páginas y un robots.txt que lo prohíbe todo. Úsalo mientras la montas, y acuérdate de quitarlo."
        />
        <TextField
          label="Verificación de Google Search Console"
          value={seo.googleVerification}
          onChange={(v) => setField('seo.googleVerification', v)}
          placeholder="Sólo el content=… de la etiqueta que te da Google"
          hint="Search Console te da una etiqueta meta; pega aquí únicamente el valor. Es lo que te deja ver qué búsquedas te traen gente."
        />
        <p className="text-micro leading-relaxed text-slate-500">
          El <code className="text-slate-400">sitemap.xml</code> y el{' '}
          <code className="text-slate-400">robots.txt</code> se generan solos con el catálogo: un
          producto nuevo aparece sin tocar nada. Los productos ocultos y los archivados se quedan
          fuera.
        </p>
      </PanelSection>

      {/* -------------------------------- Analítica ------------------------------- */}
      <PanelSection
        title="Analítica"
        description="Plausible y Umami no usan cookies, así que no necesitas banner de consentimiento."
      >
        <SelectField
          label="Servicio"
          value={analytics.provider}
          onChange={(v) => setField('seo.analytics.provider', v)}
          options={[
            { value: 'none', label: 'Ninguno' },
            { value: 'plausible', label: 'Plausible' },
            { value: 'umami', label: 'Umami' },
          ]}
        />
        {analytics.provider !== 'none' && (
          <>
            <TextField
              label="URL del script"
              value={analytics.scriptUrl}
              onChange={(v) => setField('seo.analytics.scriptUrl', v)}
              placeholder={
                analytics.provider === 'plausible'
                  ? 'https://analitica.tudominio.com/js/script.js'
                  : 'https://analitica.tudominio.com/script.js'
              }
              hint="La de tu propia instalación, tal como te la da su panel."
            />
            <TextField
              label={analytics.provider === 'plausible' ? 'Dominio dado de alta' : 'Website ID'}
              value={analytics.siteId}
              onChange={(v) => setField('seo.analytics.siteId', v)}
              placeholder={analytics.provider === 'plausible' ? 'hexservers.com' : 'a1b2c3d4-…'}
              hint={
                analytics.provider === 'plausible'
                  ? 'Exactamente como lo escribiste al crear el sitio en Plausible.'
                  : 'El identificador que Umami asigna al sitio.'
              }
            />
            <p className="text-micro leading-relaxed text-slate-500">
              Faltando cualquiera de los dos, no se inserta nada: un script a medias mide mal y
              cuesta igual de caro de cargar.
            </p>
          </>
        )}
      </PanelSection>
    </div>
  )
}
