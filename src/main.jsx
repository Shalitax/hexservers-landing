import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import './index.css'

// Con router por hash, el navegador restauraría el scroll de la página anterior.
if ('scrollRestoration' in history) history.scrollRestoration = 'manual'

/* La red va por fuera de <App/> para que también atrape lo que falle en el propio
   arranque: dentro no serviría de nada si el que revienta es App. */
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
