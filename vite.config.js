import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/* Puerto donde escucha `npm run dev:server`. Se puede mover con HEX_API_PORT sin
   tocar el PORT de Vite, que es otro. */
const API_PORT = Number(process.env.HEX_API_PORT) || 8080

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: Number(process.env.PORT) || 5173,
    strictPort: false,

    /**
     * `/api` al servidor de Node.
     *
     * Sin esto, en desarrollo el panel no encuentra servidor **nunca**. Vite
     * responde cualquier ruta desconocida con el `index.html` de la aplicación,
     * así que `/api/content` devolvía un 200 de tipo `text/html`; el cliente lo
     * lee —correctamente— como «esto no es una API, es la web contestándose a
     * sí misma» y cae al modo local, con su login de usuario y contraseña y su
     * aviso de que lo editado no lo verán los visitantes.
     *
     * Es decir: el mismo síntoma exacto que un despliegue mal configurado, pero
     * por un motivo completamente distinto. Con el proxy, `npm run dev` se
     * comporta como producción y deja de haber esa confusión.
     *
     * Si el servidor no está levantado, el proxy falla y el panel vuelve al modo
     * local, que es lo correcto: efectivamente no hay servidor detrás.
     */
    proxy: {
      '/api': {
        target: `http://127.0.0.1:${API_PORT}`,
        changeOrigin: false,
      },
    },
  },
})
