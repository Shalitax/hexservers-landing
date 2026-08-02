import Hero from '../components/Hero.jsx'
import Showcase from '../components/Showcase.jsx'
import Features from '../components/Features.jsx'
import Locations from '../components/Locations.jsx'
import Payments from '../components/Payments.jsx'
import Contact from '../components/Contact.jsx'

/**
 * Portada: bienvenida y demostración de lo que ofrecemos. Aquí no se venden
 * planes — el catálogo vive en su propia página (#/productos).
 */
export default function HomePage() {
  return (
    <main>
      <Hero />
      <Showcase />
      <Features />
      <Locations />
      <Payments />
      <Contact />
    </main>
  )
}
