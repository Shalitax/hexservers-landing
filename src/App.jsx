import { useEffect, useState } from 'react'
import { useSite, useEffectiveTheme } from './store/useSite.js'
import { useRoute } from './lib/router.js'
import { applyTheme } from './lib/theme.js'

import Backdrop from './components/Backdrop.jsx'
import Navbar from './components/Navbar.jsx'
import Footer from './components/Footer.jsx'
import PromoPopup from './components/PromoPopup.jsx'

import HomePage from './pages/HomePage.jsx'
import AboutPage from './pages/AboutPage.jsx'
import HubPage from './pages/HubPage.jsx'
import SupportPage from './pages/SupportPage.jsx'
import ProductsPage from './pages/ProductsPage.jsx'
import ProductPage, { NotFound } from './pages/ProductPage.jsx'

import AdminLogin from './admin/AdminLogin.jsx'
import AdminBar from './admin/AdminBar.jsx'
import AdminPanel from './admin/AdminPanel.jsx'
import ProductEditor from './admin/ProductEditor.jsx'
import PlanEditor from './admin/PlanEditor.jsx'

export default function App() {
  const init = useSite((s) => s.init)
  const ready = useSite((s) => s.ready)
  const isAdmin = useSite((s) => s.isAdmin)
  const editMode = useSite((s) => s.editMode)
  const openLogin = useSite((s) => s.openLogin)
  const theme = useEffectiveTheme()
  const route = useRoute()

  const [editingProductId, setEditingProductId] = useState(null)
  const [editingPlanId, setEditingPlanId] = useState(null)

  useEffect(() => {
    init()
  }, [init])

  /* Paleta: escribe las variables CSS en <html> cada vez que cambia (la del sitio
     o la que el visitante haya elegido en el selector del navbar). */
  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  /* Accesos ocultos al panel: Ctrl+Shift+A y la ruta #admin. */
  useEffect(() => {
    const onKey = (event) => {
      if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'a') {
        event.preventDefault()
        if (!useSite.getState().isAdmin) openLogin()
        else useSite.getState().setPanelOpen(true)
      }
    }
    const onHash = () => {
      if (window.location.hash === '#admin' && !useSite.getState().isAdmin) openLogin()
    }
    document.addEventListener('keydown', onKey)
    window.addEventListener('hashchange', onHash)
    onHash()
    return () => {
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('hashchange', onHash)
    }
  }, [openLogin])

  /* Cambio de página: arriba. Ancla (#features): a la sección. */
  useEffect(() => {
    if (route.anchor) {
      const target = document.getElementById(route.anchor)
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' })
        return
      }
    }
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [route.path, route.anchor])

  if (!ready) {
    return (
      <div className="grid min-h-dvh place-items-center bg-void">
        <div className="pixel animate-pulse text-xs text-hex-400">CARGANDO…</div>
      </div>
    )
  }

  return (
    <div className={editMode ? 'pb-24' : undefined}>
      <Backdrop />
      <Navbar route={route} />

      {route.name === 'home' && <HomePage />}
      {route.name === 'about' && <AboutPage />}
      {route.name === 'hub' && <HubPage />}
      {route.name === 'support' && <SupportPage />}
      {route.name === 'products' && (
        <ProductsPage route={route} onEditProduct={setEditingProductId} />
      )}
      {route.name === 'product' && (
        <ProductPage
          route={route}
          onEditProduct={setEditingProductId}
          onEditPlan={setEditingPlanId}
        />
      )}
      {route.name === 'notfound' && <NotFound />}

      <Footer />
      <PromoPopup />

      <AdminLogin />
      {isAdmin && (
        <>
          <AdminBar />
          <AdminPanel onEditProduct={setEditingProductId} onEditPlan={setEditingPlanId} />
          {editingProductId && (
            <ProductEditor
              productId={editingProductId}
              onClose={() => setEditingProductId(null)}
              onEditPlan={setEditingPlanId}
            />
          )}
          {editingPlanId && (
            <PlanEditor planId={editingPlanId} onClose={() => setEditingPlanId(null)} />
          )}
        </>
      )}
    </div>
  )
}
