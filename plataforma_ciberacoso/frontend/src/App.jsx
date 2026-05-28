import { useState } from 'react'
import { Shield } from 'lucide-react'
import Sidebar from './components/Sidebar'
import MainContent from './components/MainContent'
import ChatSimulator from './components/ChatSimulator'
import PhotoFilter from './components/PhotoFilter'
import ExtensionGuide from './components/ExtensionGuide'

function App() {
  const [activeView, setActiveView] = useState('home')

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
      <div className="flex flex-1 overflow-hidden">
        <Sidebar activeView={activeView} setActiveView={setActiveView} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="bg-white border-b border-gray-200 h-16 flex items-center px-8 shadow-sm flex-shrink-0">
            <h1 className="text-xl font-bold text-gray-700">Plataforma de Prevención</h1>
          </header>
          <main className={`flex-1 p-8 ${activeView === 'chat' ? 'overflow-hidden flex flex-col' : 'overflow-y-auto'}`}>
            {activeView === 'home' && <MainContent setActiveView={setActiveView} />}
            {activeView === 'chat' && <ChatSimulator onBack={() => setActiveView('home')} />}
            {activeView === 'photo' && <PhotoFilter onBack={() => setActiveView('home')} />}
            {activeView === 'extension' && <ExtensionGuide onBack={() => setActiveView('home')} />}
          </main>
        </div>
      </div>
      
      {/* Footer banner largo en toda la pagina - Solo en la pantalla de inicio */}
      {activeView === 'home' && (
        <footer className="bg-gray-100 border-t border-gray-200 py-4 px-8 text-xs text-center text-gray-400 font-semibold flex items-center justify-center gap-2 select-none shadow-inner flex-shrink-0">
          <Shield size={14} className="text-gray-400 stroke-[2.5]" />
          <span>Rovix &copy; 2026</span>
          <span className="mx-2 text-gray-300">|</span>
          <span className="text-gray-400 font-normal">Plataforma Educativa para la Prevención del Ciberacoso y la Violencia Digital</span>
        </footer>
      )}
    </div>
  )
}

export default App
