/**
 * Componente ExtensionGuide (Guía de instalación de la extensión).
 * Provee un instructivo paso a paso detallado para realizar la carga local
 * de la extensión de navegador Rovix, incluyendo su botón de descarga de binarios ZIP.
 */

import { ArrowLeft, CheckCircle, Download, ShieldCheck } from 'lucide-react'

export default function ExtensionGuide({ onBack }) {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Botón de retorno a la vista de inicio */}
      <button onClick={onBack} className="flex items-center text-gray-600 hover:text-gray-900 mb-6 font-semibold transition-colors cursor-pointer">
        <ArrowLeft size={20} className="mr-2" /> Volver
      </button>

      {/* Contenedor principal de la guía con fondo decorativo de escudo */}
      <div className="bg-white border-2 border-gray-200 rounded-xl p-8 mb-8 relative overflow-hidden">
        
        {/* Escudo de seguridad decorativo en segundo plano con baja opacidad */}
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <ShieldCheck size={200} />
        </div>

        <div className="relative z-10">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Guía de Extensión Segura</h2>
          <p className="text-gray-600 mb-8 max-w-2xl">Esta extensión de navegador actuará como un escudo en tiempo real, bloqueando rastreadores de IA y alertándote de perfiles sospechosos en redes sociales antes de que interactúes con ellos.</p>
          
          {/* Tarjeta de instructivo estructurado paso a paso */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-8 max-w-xl">
            <h3 className="font-bold text-gray-800 text-lg mb-4">Pasos de Instalación:</h3>
            
            <ul className="space-y-4">
              {/* Paso 1: Descarga */}
              <li className="flex items-start">
                <CheckCircle className="text-gray-600 mt-1 mr-3 flex-shrink-0" size={20} />
                <div>
                  <strong className="block text-gray-800">Paso 1: Descarga el archivo</strong>
                  <span className="text-sm text-gray-600">Haz clic en el botón de abajo para descargar el archivo ZIP de la extensión.</span>
                </div>
              </li>
              
              {/* Paso 2: Descomprimir */}
              <li className="flex items-start">
                <CheckCircle className="text-gray-600 mt-1 mr-3 flex-shrink-0" size={20} />
                <div>
                  <strong className="block text-gray-800">Paso 2: Descomprime</strong>
                  <span className="text-sm text-gray-600">Extrae el contenido del archivo en una carpeta segura de tu computadora.</span>
                </div>
              </li>
              
              {/* Paso 3: Modo Desarrollador */}
              <li className="flex items-start">
                <CheckCircle className="text-gray-600 mt-1 mr-3 flex-shrink-0" size={20} />
                <div>
                  <strong className="block text-gray-800">Paso 3: Modo Desarrollador</strong>
                  <span className="text-sm text-gray-600">Ve a las extensiones de tu navegador (ej. chrome://extensions) y activa el "Modo Desarrollador".</span>
                </div>
              </li>
              
              {/* Paso 4: Carga sin empaquetar */}
              <li className="flex items-start">
                <CheckCircle className="text-gray-600 mt-1 mr-3 flex-shrink-0" size={20} />
                <div>
                  <strong className="block text-gray-800">Paso 4: Cargar sin empaquetar</strong>
                  <span className="text-sm text-gray-600">Haz clic en "Cargar extensión sin empaquetar" y selecciona la carpeta que extrajiste. ¡Listo!</span>
                </div>
              </li>
            </ul>
          </div>

          {/* Enlace estático para descarga directa de la carpeta de extensión compresa */}
          <a
            href="/rovix_extension.zip"
            download="rovix_extension.zip"
            className="bg-gray-800 text-white px-8 py-3 rounded-lg font-bold inline-flex items-center gap-2 hover:bg-gray-900 transition-colors cursor-pointer"
          >
            <Download size={20} />
            Descargar Extensión
          </a>
        </div>
      </div>
    </div>
  )
}
