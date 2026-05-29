/**
 * Componente MainContent (Vista de inicio).
 * Renderiza las tarjetas de soluciones destacadas para la seguridad digital
 * y vincula la navegación del usuario hacia los diferentes módulos de la aplicación.
 */

import { MessageCircle, Shield, Download } from 'lucide-react'

export default function MainContent({ setActiveView }) {
  return (
    <div className="max-w-5xl mx-auto mt-4">
      {/* Encabezado principal de la sección de soluciones */}
      <h2 className="text-2xl font-bold text-gray-800 mb-8 border-b pb-2">Soluciones Destacadas para tu Seguridad</h2>

      {/* Grid de 3 columnas para mostrar los accesos directos a las herramientas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Módulo 1: Simulador de Chat IA */}
        <div
          onClick={() => setActiveView('chat')}
          className="bg-white rounded-lg border-2 border-gray-200 p-6 flex flex-col items-center text-center cursor-pointer hover:border-gray-500 hover:shadow-lg transition-all"
        >
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-700">
            <MessageCircle size={32} />
          </div>
          <h3 className="font-bold text-gray-800 text-lg mb-2">Simulador de Chat IA</h3>
          <p className="text-sm text-gray-600">Analiza mensajes de acoso con nuestra IA experta y obtén recomendaciones personalizadas.</p>
        </div>

        {/* Módulo 2: Filtro Antirobo de Imágenes */}
        <div
          onClick={() => setActiveView('photo')}
          className="bg-white rounded-lg border-2 border-gray-200 p-6 flex flex-col items-center text-center cursor-pointer hover:border-gray-500 hover:shadow-lg transition-all"
        >
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-700 relative">
            <Shield size={32} />
            <span className="absolute -top-2 -right-2 bg-gray-880 bg-gray-800 text-white text-[10px] font-bold px-2 py-1 rounded-full animate-pulse">¡Nuevo!</span>
          </div>
          <h3 className="font-bold text-gray-800 text-lg mb-2">Filtro Antirobo</h3>
          <p className="text-sm text-gray-600">Protege tus imágenes con marca digital invisible. Bloquea modificaciones por IA sin alterar la foto.</p>
        </div>

        {/* Módulo 3: Extensión de Navegador */}
        <div
          onClick={() => setActiveView('extension')}
          className="bg-white rounded-lg border-2 border-gray-200 p-6 flex flex-col items-center text-center cursor-pointer hover:border-gray-500 hover:shadow-lg transition-all"
        >
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-700">
            <Download size={32} />
          </div>
          <h3 className="font-bold text-gray-800 text-lg mb-2">Extensión de Navegador</h3>
          <p className="text-sm text-gray-600">Descarga nuestra guía de instalación para proteger tu navegación diaria.</p>
        </div>

      </div>
    </div>
  )
}
