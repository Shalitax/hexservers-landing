import { Component } from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'

/**
 * Red de seguridad para errores de renderizado.
 *
 * Sin esto, cualquier excepción durante el render deja **la página en blanco**:
 * React desmonta el árbol entero y el visitante se queda mirando el fondo, sin
 * saber si la web se cayó o si es su conexión. Con un contenido editable desde un
 * panel —donde un campo puede acabar con una forma que ningún componente
 * esperaba— eso deja de ser hipotético.
 *
 * Tiene que ser un componente de clase: `componentDidCatch` no existe en hooks.
 *
 * El fallback se escribe con estilos en línea a propósito. Si lo que falló fue la
 * hoja de estilos o el tema, las clases de Tailwind no pintarían nada y volvemos
 * a la pantalla en blanco que intentamos evitar.
 */
export default class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    // Queda en la consola para poder diagnosticarlo desde el navegador del cliente.
    console.error('[hexservers] error de renderizado:', error, info?.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div
        role="alert"
        style={{
          minHeight: '100dvh',
          display: 'grid',
          placeItems: 'center',
          padding: '1.5rem',
          background: '#07070a',
          color: '#e4e6ee',
          fontFamily: 'ui-sans-serif, system-ui, sans-serif',
        }}
      >
        <div style={{ maxWidth: '32rem', textAlign: 'center' }}>
          <AlertTriangle size={34} style={{ color: '#fbbf24', margin: '0 auto' }} />
          <h1 style={{ margin: '1.25rem 0 0', fontSize: '1.35rem', fontWeight: 700 }}>
            Algo se rompió al dibujar esta página
          </h1>
          <p style={{ margin: '0.75rem 0 0', fontSize: '0.9rem', lineHeight: 1.6, color: '#9aa1b1' }}>
            No es culpa tuya. Recargar suele bastar; si vuelve a pasar, escríbenos y lo miramos.
          </p>

          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '1.75rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.7rem 1.4rem',
              fontSize: '0.9rem',
              fontWeight: 600,
              color: '#fff',
              background: '#3b5ef0',
              border: 'none',
              borderRadius: '0.75rem',
              cursor: 'pointer',
            }}
          >
            <RotateCcw size={16} />
            Recargar la página
          </button>

          {/* El detalle sólo en desarrollo: al visitante no le dice nada útil. */}
          {import.meta.env.DEV && (
            <pre
              style={{
                marginTop: '1.75rem',
                padding: '1rem',
                textAlign: 'left',
                fontSize: '0.72rem',
                lineHeight: 1.5,
                color: '#f4a4a4',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '0.75rem',
                overflowX: 'auto',
              }}
            >
              {String(this.state.error?.stack || this.state.error)}
            </pre>
          )}
        </div>
      </div>
    )
  }
}
