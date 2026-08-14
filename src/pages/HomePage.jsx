import Hero from '../components/Hero.jsx'
import Showcase from '../components/Showcase.jsx'
import Features from '../components/Features.jsx'
import StatsBand from '../components/StatsBand.jsx'
import Locations from '../components/Locations.jsx'
import Payments from '../components/Payments.jsx'
import CatalogFaq from '../components/catalog/CatalogFaq.jsx'
import Contact from '../components/Contact.jsx'

/**
 * Portada: bienvenida y demostración de lo que ofrecemos. Aquí no se venden
 * planes — el catálogo vive en su propia página (#/productos).
 *
 * El orden sigue el guion de los hosts de referencia: titular → productos →
 * motivos → métricas → ubicaciones → pagos → dudas frecuentes → cierre CTA.
 * Las dudas frecuentes son las mismas del catálogo (`catalog.faq`), editables
 * desde el panel → Catálogo → Preguntas frecuentes.
 */
export default function HomePage() {
  return (
    <main>
      <Hero />
      <Showcase />
      <Features />
      <StatsBand />
      <Locations />
      <Payments />
      <CatalogFaq />
      <Contact />
    </main>
  )
}
