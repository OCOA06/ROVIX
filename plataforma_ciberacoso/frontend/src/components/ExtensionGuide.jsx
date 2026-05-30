/**
 * Componente ExtensionGuide (Guía de instalación de la extensión).
 * Provee un instructivo paso a paso detallado para realizar la carga local
 * de la extensión de navegador Rovix, incluyendo su botón de descarga de binarios ZIP.
 */

import { ArrowLeft, CheckCircle, Download, ShieldCheck } from 'lucide-react'

export default function ExtensionGuide({ onBack }) {
  /* 
     Justificación del uso de colores en ExtensionGuide:
     - Botón de descarga (bg-ods-red hover:bg-ods-red-vibrant):
       El rojo ODS 5 incentiva a la acción y resalta la descarga segura de la extensión.
     - Viñetas de pasos (text-ods-orange):
       El naranja de la campaña "Pinta el mundo de naranja" guía el proceso de instalación como símbolo de esperanza y cambio positivo.
     - Tarjeta de instructivo (bg-ods-beige/50 border-ods-brown-light/25):
       Utiliza tonos tierra neutrales y beige de descanso visual para estructurar el instructivo de manera amigable y clara.
  */

  return (
    <div className="max-w-4xl mx-auto">
      {/* Botón de retorno a la vista de inicio */}
      <button 
        onClick={onBack} 
        className="flex items-center text-ods-brown-medium hover:text-ods-brown-dark mb-6 font-semibold transition-colors cursor-pointer"
      >
        <ArrowLeft size={20} className="mr-2" /> Volver
      </button>

      {/* Contenedor principal de la guía con fondo decorativo de escudo */}
      <div className="bg-white border-2 border-ods-brown-light/30 rounded-2xl p-8 mb-8 relative overflow-hidden shadow-md">
        
        {/* Escudo de seguridad decorativo en segundo plano con baja opacidad */}
        <div className="absolute top-0 right-0 p-8 opacity-5 text-ods-brown-medium select-none pointer-events-none">
          <ShieldCheck size={200} />
        </div>

        <div className="relative z-10">
          <h2 className="text-2xl font-extrabold text-ods-brown-dark mb-2">Guía de Extensión Segura</h2>
          <p className="text-ods-brown-medium mb-8 max-w-2xl font-semibold leading-relaxed">
            Esta extensión de navegador actuará como un escudo en tiempo real, bloqueando rastreadores de IA y alertándote de perfiles sospechosos en redes sociales antes de que interactúes con ellos.
          </p>
          
          {/* Tarjeta de instructivo estructurado paso a paso */}
          <div className="bg-ods-beige/50 border border-ods-brown-light/25 rounded-2xl p-6 mb-8 max-w-xl shadow-sm">
            <h3 className="font-extrabold text-ods-brown-dark text-lg mb-4 select-none">Pasos de Instalación:</h3>
            
            <ul className="space-y-4">
              {/* Paso 1: Descarga */}
              <li className="flex items-start">
                <CheckCircle className="text-ods-orange mt-1 mr-3 flex-shrink-0" size={20} />
                <div>
                  <strong className="block text-ods-brown-dark font-extrabold text-sm">Paso 1: Descarga el archivo</strong>
                  <span className="text-sm text-ods-brown-medium leading-relaxed">Haz clic en el botón de abajo para descargar el archivo ZIP de la extensión.</span>
                </div>
              </li>
              
              {/* Paso 2: Descomprimir */}
              <li className="flex items-start">
                <CheckCircle className="text-ods-orange mt-1 mr-3 flex-shrink-0" size={20} />
                <div>
                  <strong className="block text-ods-brown-dark font-extrabold text-sm">Paso 2: Descomprime</strong>
                  <span className="text-sm text-ods-brown-medium leading-relaxed">Extrae el contenido del archivo en una carpeta segura de tu computadora.</span>
                </div>
              </li>
              
              {/* Paso 3: Modo Desarrollador */}
              <li className="flex items-start">
                <CheckCircle className="text-ods-orange mt-1 mr-3 flex-shrink-0" size={20} />
                <div>
                  <strong className="block text-ods-brown-dark font-extrabold text-sm">Paso 3: Modo Desarrollador</strong>
                  <span className="text-sm text-ods-brown-medium leading-relaxed">Ve a las extensiones de tu navegador (ej. chrome://extensions) y activa el "Modo Desarrollador".</span>
                </div>
              </li>
              
              {/* Paso 4: Carga sin empaquetar */}
              <li className="flex items-start">
                <CheckCircle className="text-ods-orange mt-1 mr-3 flex-shrink-0" size={20} />
                <div>
                  <strong className="block text-ods-brown-dark font-extrabold text-sm">Paso 4: Cargar sin empaquetar</strong>
                  <span className="text-sm text-ods-brown-medium leading-relaxed">Haz clic en "Cargar extensión sin empaquetar" y selecciona la carpeta que extrajiste. ¡Listo!</span>
                </div>
              </li>
            </ul>
          </div>

          {/* Enlace estático para descarga directa de la carpeta de extensión compresa */}
          <a
            href="/rovix_extension.zip"
            download="rovix_extension.zip"
            className="bg-ods-red text-white px-8 py-3.5 rounded-xl font-bold inline-flex items-center gap-2 hover:bg-ods-red-vibrant transition-all hover:scale-[1.01] active:scale-95 shadow-md hover:shadow-lg cursor-pointer"
          >
            <Download size={20} />
            Descargar Extensión
          </a>
        </div>
      </div>
    </div>
  )
}
