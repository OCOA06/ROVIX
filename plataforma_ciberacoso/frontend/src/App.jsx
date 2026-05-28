import { useState } from 'react'
import Sidebar from './components/Sidebar'
import MainContent from './components/MainContent'
import ChatSimulator from './components/ChatSimulator'
import PhotoFilter from './components/PhotoFilter'
import ExtensionGuide from './components/ExtensionGuide'

function App() {
  const [activeView, setActiveView] = useState('home')

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar activeView={activeView} setActiveView={setActiveView} />
      <div className="flex-1 flex flex-col">
        <header className="bg-white border-b border-gray-200 h-16 flex items-center px-8 shadow-sm">
          <h1 className="text-xl font-bold text-gray-700">Plataforma de Prevención</h1>
        </header>
        <main className="flex-1 p-8 overflow-y-auto">
          {activeView === 'home' && <MainContent setActiveView={setActiveView} />}
          {activeView === 'chat' && <ChatSimulator onBack={() => setActiveView('home')} />}
          {activeView === 'photo' && <PhotoFilter onBack={() => setActiveView('home')} />}
          {activeView === 'extension' && <ExtensionGuide onBack={() => setActiveView('home')} />}
        </main>
      </div>
    </div>
  )
}

export default App
