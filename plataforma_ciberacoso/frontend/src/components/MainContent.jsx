/**
 * Componente MainContent (Vista de inicio).
 * Renderiza las tarjetas de soluciones destacadas para la seguridad digital
 * y vincula la navegación del usuario hacia los diferentes módulos de la aplicación.
 */

import { MessageCircle, Shield, Download } from 'lucide-react'

export default function MainContent({ setActiveView }) {
  /* 
     Justificación del uso de colores en MainContent:
     - hover:border-ods-red / hover:shadow-lg: El rojo ODS 5 representa la fuerza y atrae el enfoque sobre las soluciones interactivas.
     - bg-ods-beige / text-ods-brown-dark en iconos: Provee estabilidad, calidez y seriedad.
     - bg-ods-red-vibrant en badge "¡Nuevo!": Transmite urgencia, vitalidad y dinamismo, destacando la nueva funcionalidad.
  */
  return (
    <div className="max-w-5xl mx-auto mt-4">
      {/* Encabezado principal de la sección de soluciones */}
      <h2 className="text-2xl font-extrabold text-ods-brown-dark mb-8 border-b border-ods-brown-light/30 pb-2">
        Soluciones Destacadas para tu Seguridad Digital
      </h2>

      {/* Grid de 3 columnas para mostrar los accesos directos a las herramientas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Módulo 1: Simulador de Chat IA */}
        <div
          onClick={() => setActiveView('chat')}
          className="bg-white rounded-xl border-2 border-ods-brown-light/20 p-6 flex flex-col items-center text-center cursor-pointer hover:border-ods-red hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
        >
          <div className="w-16 h-16 bg-ods-beige rounded-full flex items-center justify-center mb-4 text-ods-brown-dark shadow-sm">
            <MessageCircle size={32} className="text-ods-red" />
          </div>
          <h3 className="font-extrabold text-ods-brown-dark text-lg mb-2">Simulador de Chat IA</h3>
          <p className="text-sm text-ods-brown-medium leading-relaxed">
            Analiza mensajes de acoso con nuestra IA experta y obtén recomendaciones de acción inmediatas.
          </p>
        </div>

        {/* Módulo 2: Filtro Antirobo de Imágenes */}
        <div
          onClick={() => setActiveView('photo')}
          className="bg-white rounded-xl border-2 border-ods-brown-light/20 p-6 flex flex-col items-center text-center cursor-pointer hover:border-ods-red hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
        >
          <div className="w-16 h-16 bg-ods-beige rounded-full flex items-center justify-center mb-4 text-ods-brown-dark relative shadow-sm">
            <Shield size={32} className="text-ods-orange" />
            <span className="absolute -top-2 -right-2 bg-ods-red-vibrant text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow-md animate-pulse">¡Nuevo!</span>
          </div>
          <h3 className="font-extrabold text-ods-brown-dark text-lg mb-2">Filtro Antirobo</h3>
          <p className="text-sm text-ods-brown-medium leading-relaxed">
            Protege tus imágenes con marca digital invisible. Bloquea modificaciones maliciosas por IA.
          </p>
        </div>

        {/* Módulo 3: Extensión de Navegador */}
        <div
          onClick={() => setActiveView('extension')}
          className="bg-white rounded-xl border-2 border-ods-brown-light/20 p-6 flex flex-col items-center text-center cursor-pointer hover:border-ods-red hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
        >
          <div className="w-16 h-16 bg-ods-beige rounded-full flex items-center justify-center mb-4 text-ods-brown-dark shadow-sm">
            <Download size={32} className="text-ods-brown-medium" />
          </div>
          <h3 className="font-extrabold text-ods-brown-dark text-lg mb-2">Extensión de Navegador</h3>
          <p className="text-sm text-ods-brown-medium leading-relaxed">
            Descarga nuestra guía de instalación paso a paso para proteger tu navegación diaria y redes sociales.
          </p>
        </div>

      </div>
    </div>
  )
}
