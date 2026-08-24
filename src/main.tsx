import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
// 1. IMPORTA LA FUNCIÓN DE REGISTRO
import { registerSW } from 'virtual:pwa-register' 

// 2. EJECUTA EL REGISTRO
registerSW({ immediate: true })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)