/**
 * Punto de entrada principal de la aplicación React.
 * Inicializa el árbol de componentes de la interfaz de usuario.
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Selecciona el contenedor raíz en el HTML y renderiza el componente principal de la aplicación (App)
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
