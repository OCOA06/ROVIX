import { AlertCircle, ChevronRight, Home } from 'lucide-react'

export default function Sidebar({ activeView, setActiveView }) {
  return (
    <div className="w-64 bg-gray-100 border-r border-gray-300 flex flex-col">
      <div className="p-6 border-b border-gray-300 flex items-center gap-3 cursor-pointer" onClick={() => setActiveView('home')}>
        <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center text-white font-bold">
          <Home size={20} />
        </div>
        <div>
          <h2 className="font-bold text-gray-800 text-lg">Inicio</h2>
          <p className="text-xs text-gray-500">Panel Principal</p>
        </div>
      </div>
      
      <div className="p-4 flex-1">
        <div className="flex items-center gap-2 mb-4 mt-2">
          <AlertCircle className="text-gray-700" size={20} />
          <h3 className="font-bold text-gray-700 uppercase tracking-wider text-sm">Lo + Nuevo</h3>
        </div>
        
        <div className="space-y-3">
          <div className="bg-white p-3 rounded shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <h4 className="font-semibold text-gray-800 text-sm mb-1">Nueva ley de protección digital</h4>
            <p className="text-xs text-gray-600">Se aprueban medidas más estrictas contra el ciberacoso en redes sociales.</p>
          </div>
          
          <div className="bg-white p-3 rounded shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <h4 className="font-semibold text-gray-800 text-sm mb-1">Cifras de acoso en 2026</h4>
            <p className="text-xs text-gray-600">Reporte anual sobre el impacto del ciberacoso en mujeres jóvenes.</p>
          </div>
          
          <div className="bg-white p-3 rounded shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <h4 className="font-semibold text-gray-800 text-sm mb-1">Herramientas de bloqueo</h4>
            <p className="text-xs text-gray-600">Aprende a configurar tu privacidad para evitar mensajes no deseados.</p>
          </div>
        </div>
        
        <button className="mt-6 w-full bg-gray-700 text-white py-2 px-4 rounded text-sm font-semibold flex items-center justify-between hover:bg-gray-800 transition-colors">
          <span>Suscríbete al boletín</span>
          <ChevronRight size={16} />
        </button>
      </div>
      
      <div className="p-4 bg-gray-200 text-xs text-center text-gray-600 border-t border-gray-300">
        Plataforma de Apoyo &copy; 2026
      </div>
    </div>
  )
}
