/**
 * Componente principal de la aplicación (App).
 * Gestiona el estado de la navegación principal, la distribución de la pantalla completa
 * y define el contenedor central y el pie de página condicional.
 */

import { useState } from 'react'
import { Shield } from 'lucide-react'
import Sidebar from './components/Sidebar'
import MainContent from './components/MainContent'
import ChatSimulator from './components/ChatSimulator'
import PhotoFilter from './components/PhotoFilter'
import ExtensionGuide from './components/ExtensionGuide'

function App() {
  // Estado para controlar la vista activa en el panel principal ('home', 'chat', 'photo', 'extension')
  const [activeView, setActiveView] = useState('home')

  return (
    // Contenedor principal ajustado al alto de la pantalla (100vh) con la paleta de descanso beige
    <div className="flex flex-col h-screen bg-ods-beige-light overflow-hidden">
      
      {/* Sección intermedia que agrupa la barra lateral y el contenido de la vista activa */}
      <div className="flex flex-1 overflow-hidden">
        {/* Barra lateral de navegación y paneles informativos oficiales */}
        <Sidebar activeView={activeView} setActiveView={setActiveView} />
        
        {/* Panel derecho del contenido */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Cabecera superior fija con estilo ODS 5 y logo oficial */}
          <header className="bg-white border-b border-ods-brown-light/35 h-16 flex items-center px-8 shadow-sm flex-shrink-0 gap-3">
            <img src="/Rovix_logo.png" alt="ROVIX Logo" className="w-8 h-8 object-contain" />
            <h1 className="text-xl font-extrabold text-ods-brown-dark tracking-tight">
              ROVIX <span className="text-ods-red font-semibold">|</span> <span className="text-xs uppercase font-bold tracking-wider text-ods-brown-medium bg-ods-beige px-2.5 py-1 rounded-md border border-ods-brown-light/20">Plataforma de Prevención</span>
            </h1>
          </header>
          
          {/* Área dinámica de despliegue de componentes */}
          <main className={`flex-1 p-8 ${activeView === 'chat' ? 'overflow-hidden flex flex-col' : 'overflow-y-auto'}`}>
            {activeView === 'home' && <MainContent setActiveView={setActiveView} />}
            {activeView === 'chat' && <ChatSimulator onBack={() => setActiveView('home')} />}
            {activeView === 'photo' && <PhotoFilter onBack={() => setActiveView('home')} />}
            {activeView === 'extension' && <ExtensionGuide onBack={() => setActiveView('home')} />}
          </main>
        </div>
      </div>
      
      {/* Pie de página (Banner largo institucional). Se renderiza únicamente en la pantalla de inicio */}
      {activeView === 'home' && (
        <footer className="bg-ods-beige border-t border-ods-brown-light/30 py-4 px-8 text-xs text-center text-ods-brown-medium font-semibold flex items-center justify-center gap-2 select-none shadow-inner flex-shrink-0">
          <Shield size={14} className="text-ods-orange stroke-[2.5]" />
          <span>ROVIX &copy; 2026</span>
          <span className="mx-2 text-ods-brown-light/40">|</span>
          <span className="text-ods-brown-medium font-normal">Plataforma Educativa para la Prevención del Ciberacoso y la Violencia Digital — Alineada con el ODS 5</span>
        </footer>
      )}
    </div>
  )
}

export default App
