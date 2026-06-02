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
      {/* Botón de retorno a la vista de inicio con alto contraste */}
      <button 
        onClick={onBack} 
        className="flex items-center text-ods-beige hover:text-white mb-6 font-extrabold transition-colors cursor-pointer"
      >
        <ArrowLeft size={20} className="mr-2 stroke-[2.5]" /> Volver
      </button>

      {/* Contenedor principal de la guía en Naranja Sólido y Borde Rojo */}
      <div className="bg-ods-orange border-4 border-ods-red rounded-[2.8rem] p-8 mb-8 relative overflow-hidden shadow-2xl">
        
        {/* Escudo de seguridad decorativo en segundo plano con baja opacidad */}
        <div className="absolute top-0 right-0 p-8 opacity-10 text-white select-none pointer-events-none">
          <ShieldCheck size={200} />
        </div>

        <div className="relative z-10">
          {/* Cabecera de la guía en Rojo ODS 5 */}
          <div className="bg-ods-red border border-ods-orange/45 p-5 rounded-3xl mb-8 shadow-md">
            <h2 className="text-2xl font-extrabold text-white uppercase tracking-wide">Guía de Extensión Segura</h2>
            <p className="text-sm text-ods-beige font-bold mt-1 leading-relaxed">
              Esta extensión de navegador actuará como un escudo en tiempo real, bloqueando rastreadores de IA y alertándote de perfiles sospechosos en redes sociales antes de que interactúes con ellos.
            </p>
          </div>
          
          {/* Tarjeta de instructivo estructurado paso a paso en Marrón Profundo */}
          <div className="bg-ods-brown-dark border-4 border-ods-red rounded-3xl p-6 mb-8 max-w-xl shadow-2xl text-white">
            <h3 className="font-extrabold text-ods-beige text-lg mb-6 select-none uppercase tracking-wide border-b border-white/20 pb-2">Pasos de Instalación:</h3>
            
            <ul className="space-y-5">
              {/* Paso 1: Descarga */}
              <li className="flex items-start">
                <CheckCircle className="text-ods-orange mt-1 mr-3 flex-shrink-0 stroke-[2.5]" size={20} />
                <div>
                  <strong className="block text-white font-extrabold text-sm">Paso 1: Descarga el archivo</strong>
                  <span className="text-sm text-ods-beige font-semibold leading-relaxed">Haz clic en el botón de abajo para descargar el archivo ZIP de la extensión.</span>
                </div>
              </li>
              
              {/* Paso 2: Descomprimir */}
              <li className="flex items-start">
                <CheckCircle className="text-ods-orange mt-1 mr-3 flex-shrink-0 stroke-[2.5]" size={20} />
                <div>
                  <strong className="block text-white font-extrabold text-sm">Paso 2: Descomprime</strong>
                  <span className="text-sm text-ods-beige font-semibold leading-relaxed">Extrae el contenido del archivo en una carpeta segura de tu computadora.</span>
                </div>
              </li>
              
              {/* Paso 3: Modo Desarrollador */}
              <li className="flex items-start">
                <CheckCircle className="text-ods-orange mt-1 mr-3 flex-shrink-0 stroke-[2.5]" size={20} />
                <div>
                  <strong className="block text-white font-extrabold text-sm">Paso 3: Modo Desarrollador</strong>
                  <span className="text-sm text-ods-beige font-semibold leading-relaxed">Ve a las extensiones de tu navegador (ej. chrome://extensions) y activa el "Modo Desarrollador".</span>
                </div>
              </li>
              
              {/* Paso 4: Carga sin empaquetar */}
              <li className="flex items-start">
                <CheckCircle className="text-ods-orange mt-1 mr-3 flex-shrink-0 stroke-[2.5]" size={20} />
                <div>
                  <strong className="block text-white font-extrabold text-sm">Paso 4: Cargar sin empaquetar</strong>
                  <span className="text-sm text-ods-beige font-semibold leading-relaxed">Haz clic en "Cargar extensión sin empaquetar" y selecciona la carpeta que extrajiste. ¡Listo!</span>
                </div>
              </li>
            </ul>
          </div>

          {/* Enlace estático para descarga directa de la carpeta de extensión compresa */}
          <a
            href="/rovix_extension.zip"
            download="rovix_extension.zip"
            className="bg-ods-red text-white border-2 border-white px-8 py-3.5 rounded-xl font-extrabold inline-flex items-center gap-2 hover:bg-ods-red-vibrant transition-all hover:scale-[1.01] active:scale-95 shadow-md hover:shadow-lg cursor-pointer"
          >
            <Download size={20} className="stroke-[2.5]" />
            Descargar Extensión
          </a>
        </div>
      </div>
    </div>
  )
}
