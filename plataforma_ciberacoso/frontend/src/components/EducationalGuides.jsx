/**
 * Componente EducationalGuides (Guías Educativas de Prevención).
 * Proporciona acceso interactivo y descarga directa a guías y manuales
 * oficiales de prevención de ciberacoso y concientización sobre el ODS 5.
 */

import { ArrowLeft, BookOpen, Download, FileText, Sparkles } from 'lucide-react'

export default function EducationalGuides({ onBack }) {
  /* 
     Justificación del uso de colores en EducationalGuides:
     - Cabecera en Rojo ODS 5 (bg-ods-red): Representa el empoderamiento y capta la atención hacia el material educativo crítico.
     - Tarjetas en Marrón Profundo (bg-ods-brown-dark): Aportan una base de seriedad y estabilidad, haciendo que los textos contrasten con facilidad.
     - Botón de descarga en Naranja (bg-ods-orange hover:bg-ods-red-vibrant):
       Invita a la acción e interactividad bajo la estética oficial de la campaña de erradicación de violencia.
  */

  const guides = [
    {
      title: "Guía Práctica ODS 5: Igualdad de Género",
      filename: "Guia_practica_ODS_5_Igualdad_de_Genero.pdf",
      description: "Esta guía práctica detalla las acciones y metas del Objetivo de Desarrollo Sostenible 5 (Igualdad de Género) de la ONU, enfocado en empoderar a mujeres y niñas, y eliminar todo tipo de violencia y discriminación en entornos físicos y digitales.",
      badge: "ODS 5 ONU",
      icon: BookOpen,
    },
    {
      title: "Guía Práctica: Qué hacer si sufres ciberacoso",
      filename: "Guia_practica_Que_hacer_si_sufres_ciberacoso.pdf",
      description: "Un manual detallado de acción rápida que te guiará paso a paso sobre cómo documentar evidencia digital de manera segura, bloquear agresores en redes sociales, buscar apoyo psicológico especializado y proceder legalmente en México.",
      badge: "Protocolo de Acción",
      icon: FileText,
    }
  ]

  return (
    <div className="max-w-4xl mx-auto">
      {/* Botón de retorno a la vista de inicio */}
      <button 
        onClick={onBack} 
        className="flex items-center text-ods-beige hover:text-white mb-6 font-extrabold transition-colors cursor-pointer"
      >
        <ArrowLeft size={20} className="mr-2 stroke-[2.5]" /> Volver
      </button>

      {/* Contenedor principal */}
      <div className="bg-ods-orange border-4 border-ods-red rounded-[2.8rem] p-8 mb-8 relative overflow-hidden shadow-2xl">
        
        {/* Decorativo en segundo plano */}
        <div className="absolute top-0 right-0 p-8 opacity-10 text-white select-none pointer-events-none">
          <Sparkles size={200} />
        </div>

        <div className="relative z-10">
          {/* Cabecera en Rojo ODS 5 */}
          <div className="bg-ods-red border border-ods-orange/45 p-5 rounded-3xl mb-8 shadow-md">
            <h2 className="text-2xl font-extrabold text-white uppercase tracking-wide">Guías Educativas y de Apoyo</h2>
            <p className="text-sm text-ods-beige font-bold mt-1 leading-relaxed">
              Descarga recursos educativos oficiales y guías prácticas para informarte sobre tus derechos digitales, prevenir situaciones de riesgo y saber cómo actuar frente a la violencia digital.
            </p>
          </div>
          
          {/* Grid de Guías */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {guides.map((guide, index) => {
              const IconComponent = guide.icon;
              return (
                <div 
                  key={index} 
                  className="bg-ods-brown-dark border-4 border-ods-red rounded-3xl p-6 flex flex-col justify-between shadow-2xl text-white hover:scale-[1.02] transition-transform duration-300"
                >
                  <div>
                    {/* Badge e Icono */}
                    <div className="flex justify-between items-start mb-4">
                      <span className="bg-ods-orange text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow-md">
                        {guide.badge}
                      </span>
                      <div className="w-12 h-12 bg-ods-beige rounded-full flex items-center justify-center text-ods-red shadow-sm flex-shrink-0">
                        <IconComponent size={24} className="stroke-[2.5]" />
                      </div>
                    </div>

                    <h3 className="font-extrabold text-white text-lg mb-3 leading-snug">
                      {guide.title}
                    </h3>
                    
                    <p className="text-xs text-ods-beige font-semibold leading-relaxed mb-6">
                      {guide.description}
                    </p>
                  </div>

                  {/* Botón de descarga */}
                  <a
                    href={`/${guide.filename}`}
                    download={guide.filename}
                    className="w-full text-center bg-ods-red text-white border-2 border-white px-5 py-3 rounded-xl font-extrabold flex items-center justify-center gap-2 hover:bg-ods-red-vibrant transition-all active:scale-95 shadow-md hover:shadow-lg cursor-pointer text-sm"
                  >
                    <Download size={18} className="stroke-[2.5]" />
                    Descargar PDF
                  </a>
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </div>
  )
}
