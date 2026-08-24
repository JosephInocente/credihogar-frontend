import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Habilitamos el modo de desarrollo para que puedas probar la instalación en localhost
      devOptions: {
        enabled: true
      },
      manifest: {
        name: 'Credi Hogar - Gestión Logística',
        short_name: 'Credi Hogar',
        description: 'Sistema Web de Gestión de Abarrotes, Inventario y Distribución',
        theme_color: '#0a348a', // El azul corporativo de tu sistema
        background_color: '#f4f7fe',
        display: 'standalone', // Hace que se abra como app nativa, sin barra de navegador
        orientation: 'portrait',
        icons: [
          {
            src: '/vite.svg', // Temporamente usamos este ícono que ya tienes en public/
            sizes: '192x192',
            type: 'image/svg+xml'
          },
          {
            src: '/vite.svg',
            sizes: '512x512',
            type: 'image/svg+xml'
          }
        ]
      }
    })
  ],
})