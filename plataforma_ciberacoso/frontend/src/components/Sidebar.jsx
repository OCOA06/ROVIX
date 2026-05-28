import { useState } from 'react'
import { AlertCircle, Home, X } from 'lucide-react'

const INFO_DETAILS = {
  inmujeres: {
    agency: "Inst. Nacional de las Mujeres",
    title: "Violencia Digital y Ley Olimpia",
    subtitle: "Marco legal para la protección de la intimidad sexual",
    emoji: "⚖️",
    content: "La Ley Olimpia es un conjunto de reformas legislativas en México diseñadas para reconocer la violencia digital y sancionar penalmente los delitos que violen la intimidad sexual de las personas a través de medios digitales. Esta ley protege la dignidad e integridad digital de las personas, sancionando la difusión de material íntimo sin consentimiento.",
    keyPoints: [
      "Sanciona la difusión, publicación o distribución de imágenes, videos o audios de contenido sexual íntimo sin consentimiento.",
      "Aplica tanto para material real como simulado o alterado (por ejemplo, mediante Inteligencia Artificial).",
      "Las penas federales oscilan entre los 3 y 6 años de prisión, más multas económicas significativas.",
      "Se agrava la sanción si el agresor tiene una relación de confianza, laboral o afectiva con la víctima."
    ],
    link: "https://www.gob.mx/inmujeres"
  },
  conavim: {
    agency: "Comisión Nacional para Prevenir y Erradicar la Violencia Contra las Mujeres",
    title: "Prevención de Violencia Digital",
    subtitle: "Mecanismos de atención y campañas de concientización",
    emoji: "🛡️",
    content: "La CONAVIM implementa estrategias nacionales para combatir la violencia de género y digital en México. El acoso digital afecta desproporcionadamente a mujeres jóvenes y menores de edad, generando graves secuelas emocionales y psicológicas.",
    keyPoints: [
      "Detección oportuna: Identifica señales de hostigamiento, amenazas indirectas o solicitudes incómodas en redes sociales.",
      "No respondas a agresiones: Ignorar la provocación detiene la escalada de violencia digital.",
      "Registro de evidencia: Guarda capturas de pantalla completas, URLs y nombres de usuario para facilitar una posible denuncia.",
      "Apoyo y acompañamiento: Habla de inmediato con una persona adulta de confianza o solicita asistencia psicológica."
    ],
    link: "https://www.gob.mx/conavim"
  },
  sspc: {
    agency: "Secretaría de Seguridad y Protección Ciudadana",
    title: "Guía de Ciberseguridad Familiar",
    subtitle: "Buenas prácticas para proteger tu integridad en línea",
    emoji: "🔒",
    content: "La SSPC coordina los esfuerzos nacionales de seguridad en entornos virtuales. La prevención es la herramienta más eficaz para evitar ser víctima de extorsiones digitales, phishing o ciberacoso de menores.",
    keyPoints: [
      "Configura tu privacidad: Mantén tus perfiles de redes sociales en modo privado y no aceptes a desconocidos.",
      "Doble factor de autenticación (2FA): Actívalo en todas tus cuentas para evitar hackeos e intrusiones.",
      "Control de cámara y galería: Revisa qué permisos tienen las aplicaciones instaladas en tus dispositivos móviles.",
      "Filtros de contenido: Utiliza herramientas de blindaje de imágenes frente a software espía y de análisis."
    ],
    link: "https://www.gob.mx/sspc"
  },
  guardianacional: {
    agency: "Guardia Nacional de México",
    title: "Prevención de Ciberdelitos y Reportes",
    subtitle: "Canales oficiales de denuncia ante la policía cibernética",
    emoji: "👮",
    content: "La Dirección Científica de la Guardia Nacional monitorea las redes para prevenir delitos digitales como el ciberacoso escolar, robo de identidad y grooming. Cuenta con un centro de atención especializado disponible las 24 horas del día.",
    keyPoints: [
      "Denuncia inmediata: Reporta cualquier ciberdelito o comportamiento delictivo en línea de forma segura y confidencial.",
      "Sextorsión y Chantaje: Si eres víctima de extorsión con imágenes privadas, no borres nada y busca apoyo policial inmediato.",
      "Campaña Internet Seguro: Participa en los talleres y pláticas oficiales dirigidas a la concientización juvenil.",
      "Canal de reporte directo: La GN cuenta con ingenieros especialistas para dar seguimiento y retirar material dañino."
    ],
    link: "https://www.gob.mx/guardianacional"
  },
  salud_mental: {
    agency: "Noticia • Salud Digital",
    title: "Ciberacoso y su impacto en la salud mental",
    subtitle: "Efectos emocionales del hostigamiento en entornos virtuales",
    emoji: "🧠",
    content: "El ciberacoso constante en plataformas de redes sociales e internet genera graves afecciones psicológicas. Estudios nacionales de salud reportan que el acoso cibernético persistente está directamente correlacionado con cuadros clínicos de depresión, ansiedad severa, fobia social e insomnio, afectando principalmente a adolescentes y jóvenes en México.",
    keyPoints: [
      "Autocuidado digital: Silencia o bloquea de inmediato cuentas agresoras; no te expongas a leer comentarios hostiles.",
      "Redes de apoyo: No vivas el acoso en secreto; el aislamiento agrava los síntomas de ansiedad y depresión.",
      "Apoyo psicológico: Buscar ayuda profesional es fundamental si el acoso interfiere con tus actividades cotidianas.",
      "Desconexión temporal: Considera suspender el uso de tus redes sociales durante periodos de crisis para recuperar la calma."
    ],
    link: "https://www.gob.mx/salud"
  },
  leyes_mexico: {
    agency: "Noticia • Marco Jurídico",
    title: "Avances legales contra el acoso digital",
    subtitle: "Homologación del delito de violencia digital en el país",
    emoji: "⚖️",
    content: "La violencia digital ha sido formalmente homologada en el Código Penal Federal y en las constituciones locales de los 32 estados de la República Mexicana. Esto significa que la fiscalía de cualquier estado tiene la obligación y competencia de abrir carpetas de investigación por hostigamiento en línea y difusión de material íntimo sin consentimiento.",
    keyPoints: [
      "Obligación de atender: Cualquier Ministerio Público en el país debe recibir tu denuncia por delitos digitales.",
      "Medidas cautelares: Tienes derecho a solicitar que las plataformas eliminen el contenido agresor en un plazo máximo de 24 horas.",
      "Resguardo de evidencia: La policía cibernética local realiza dictámenes periciales informáticos con las capturas provistas.",
      "Asesoría jurídica gratuita: El Instituto de la Defensoría Pública ofrece acompañamiento legal sin costo."
    ],
    link: "https://www.gob.mx/segob"
  },
  ciber_ia: {
    agency: "Alerta Tecnológica • IA",
    title: "El riesgo de los Deepfakes y la IA",
    subtitle: "Manipulación de imágenes con Inteligencia Artificial para ciberacoso",
    emoji: "🤖",
    content: "El desarrollo acelerado de la Inteligencia Artificial generativa ha facilitado la creación de 'deepfakes' (imágenes o videos falsos hiperrealistas). Lamentablemente, los agresores están utilizando estas tecnologías para simular rostros y crear contenido íntimo alterado sin el consentimiento de las personas con fines de acoso o chantaje.",
    keyPoints: [
      "Amparo de la Ley: La Ley Olimpia sanciona penalmente de igual manera la difusión de material íntimo simulado o editado con IA.",
      "Inmunización digital: Utiliza herramientas de perturbación adversarial (como el filtro de fotos de ROVIX) para evitar que la IA manipule tus retratos.",
      "Identificación de anomalías: Revisa si la imagen tiene texturas borrosas en las uniones, sombras extrañas o deformaciones de simetría.",
      "Reporte técnico: Presenta la evidencia a la policía cibernética señalando el uso indebido de herramientas sintéticas."
    ],
    link: "https://www.gob.mx/sspc"
  }
}

export default function Sidebar({ activeView, setActiveView }) {
  const [activeModal, setActiveModal] = useState(null)

  return (
    <div className="w-64 bg-gray-100 border-r border-gray-300 flex flex-col h-full overflow-hidden">
      <div className="p-6 border-b border-gray-300 flex items-center gap-3 cursor-pointer flex-shrink-0" onClick={() => setActiveView('home')}>
        <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center text-white font-bold">
          <Home size={20} />
        </div>
        <div>
          <h2 className="font-bold text-gray-800 text-lg">Inicio</h2>
          <p className="text-xs text-gray-500">Panel Principal</p>
        </div>
      </div>
      
      <div className="p-4 flex-1 overflow-y-auto">
        <div className="flex items-center gap-2 mb-4 mt-2">
          <AlertCircle className="text-gray-700" size={20} />
          <h3 className="font-bold text-gray-700 uppercase tracking-wider text-sm">Lo + Nuevo</h3>
        </div>
        
        <div className="space-y-3">
          {/* Seccion 1: Portales Oficiales */}
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 select-none">Portales de Apoyo</div>
          
          <a
            href="https://www.gob.mx/inmujeres"
            onClick={(e) => { e.preventDefault(); setActiveModal('inmujeres'); }}
            className="block bg-white p-3 rounded shadow-sm border border-gray-200 hover:shadow-md transition-all hover:border-gray-400 group cursor-pointer"
          >
            <h4 className="font-semibold text-gray-800 text-sm mb-1 group-hover:text-blue-600 transition-colors flex items-center justify-between">
              <span>Inst. Nacional de las Mujeres</span>
              <span className="text-[10px] text-gray-400 font-normal">inmujeres.gob.mx ↗</span>
            </h4>
            <p className="text-xs text-gray-600">Consulta el portal oficial de INMUJERES para acceder a programas de equidad, derechos digitales y erradicación de la violencia.</p>
          </a>
          
          <a
            href="https://www.gob.mx/conavim"
            onClick={(e) => { e.preventDefault(); setActiveModal('conavim'); }}
            className="block bg-white p-3 rounded shadow-sm border border-gray-200 hover:shadow-md transition-all hover:border-gray-400 group cursor-pointer"
          >
            <h4 className="font-semibold text-gray-800 text-sm mb-1 group-hover:text-blue-600 transition-colors flex items-center justify-between">
              <span>Portal de la CONAVIM</span>
              <span className="text-[10px] text-gray-400 font-normal">conavim.gob.mx ↗</span>
            </h4>
            <p className="text-xs text-gray-600">Revisa las campañas nacionales, recursos y mecanismos de prevención contra la violencia digital y de género.</p>
          </a>
          
          <a
            href="https://www.gob.mx/sspc"
            onClick={(e) => { e.preventDefault(); setActiveModal('sspc'); }}
            className="block bg-white p-3 rounded shadow-sm border border-gray-200 hover:shadow-md transition-all hover:border-gray-400 group cursor-pointer"
          >
            <h4 className="font-semibold text-gray-800 text-sm mb-1 group-hover:text-blue-600 transition-colors flex items-center justify-between">
              <span>Sec. de Seguridad (SSPC)</span>
              <span className="text-[10px] text-gray-400 font-normal">sspc.gob.mx ↗</span>
            </h4>
            <p className="text-xs text-gray-600">Explora el sitio de la SSPC para informarte sobre ciberseguridad nacional y canales de reporte ciudadano.</p>
          </a>

          <a
            href="https://www.gob.mx/guardianacional"
            onClick={(e) => { e.preventDefault(); setActiveModal('guardianacional'); }}
            className="block bg-white p-3 rounded shadow-sm border border-gray-200 hover:shadow-md transition-all hover:border-gray-400 group cursor-pointer"
          >
            <h4 className="font-semibold text-gray-800 text-sm mb-1 group-hover:text-blue-600 transition-colors flex items-center justify-between">
              <span>Guardia Nacional de México</span>
              <span className="text-[10px] text-gray-400 font-normal">gob.mx/gn ↗</span>
            </h4>
            <p className="text-xs text-gray-600">Conoce las recomendaciones de la Guardia Nacional para prevenir ciberdelitos y proteger a la familia en internet.</p>
          </a>

          {/* Seccion 2: Noticias e Informes */}
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider pt-3 pb-1 select-none border-t border-gray-200">Noticias y Recursos</div>

          <a
            href="https://www.gob.mx/salud"
            onClick={(e) => { e.preventDefault(); setActiveModal('salud_mental'); }}
            className="block bg-white p-3 rounded shadow-sm border border-gray-200 hover:shadow-md transition-all hover:border-gray-400 group cursor-pointer"
          >
            <h4 className="font-semibold text-gray-800 text-sm mb-1 group-hover:text-blue-600 transition-colors flex items-center justify-between">
              <span>Ciberacoso y Salud Mental</span>
              <span className="text-[10px] text-gray-400 font-normal">salud.gob.mx ↗</span>
            </h4>
            <p className="text-xs text-gray-600">Efectos emocionales del hostigamiento cibernético persistente y pautas de autocuidado digital.</p>
          </a>

          <a
            href="https://www.gob.mx/segob"
            onClick={(e) => { e.preventDefault(); setActiveModal('leyes_mexico'); }}
            className="block bg-white p-3 rounded shadow-sm border border-gray-200 hover:shadow-md transition-all hover:border-gray-400 group cursor-pointer"
          >
            <h4 className="font-semibold text-gray-800 text-sm mb-1 group-hover:text-blue-600 transition-colors flex items-center justify-between">
              <span>Avances Legales en México</span>
              <span className="text-[10px] text-gray-400 font-normal">segob.gob.mx ↗</span>
            </h4>
            <p className="text-xs text-gray-600">La violencia digital ha sido homologada penalmente en los 32 estados de la República Mexicana.</p>
          </a>

          <a
            href="https://www.gob.mx/sspc"
            onClick={(e) => { e.preventDefault(); setActiveModal('ciber_ia'); }}
            className="block bg-white p-3 rounded shadow-sm border border-gray-200 hover:shadow-md transition-all hover:border-gray-400 group cursor-pointer"
          >
            <h4 className="font-semibold text-gray-800 text-sm mb-1 group-hover:text-blue-600 transition-colors flex items-center justify-between">
              <span>Riesgos de IA y Deepfakes</span>
              <span className="text-[10px] text-gray-400 font-normal">sspc.gob.mx ↗</span>
            </h4>
            <p className="text-xs text-gray-600">Uso no consentido de software generativo de Inteligencia Artificial para alterar y simular imágenes íntimas.</p>
          </a>
        </div>
      </div>

      {/* Info Modal */}
      {activeModal && (() => {
        const info = INFO_DETAILS[activeModal];
        return (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-gray-200 flex flex-col max-h-[90vh]">
              {/* Header */}
              <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-6 py-5 flex items-center justify-between text-white flex-shrink-0">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{info.emoji}</span>
                  <div>
                    <h3 className="font-bold text-[10px] text-gray-400 uppercase tracking-wide">{info.agency}</h3>
                    <h2 className="font-extrabold text-base leading-tight mt-0.5">{info.title}</h2>
                  </div>
                </div>
                <button
                  onClick={() => setActiveModal(null)}
                  className="text-gray-300 hover:text-white transition-colors p-1 bg-white/10 rounded-lg cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
              
              {/* Content */}
              <div className="p-6 overflow-y-auto space-y-4">
                <div>
                  <h4 className="font-bold text-gray-800 text-sm mb-1">{info.subtitle}</h4>
                  <p className="text-xs text-gray-600 leading-relaxed">{info.content}</p>
                </div>
                
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                  <h4 className="font-bold text-gray-800 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <span>💡</span> Pautas Clave de Acción:
                  </h4>
                  <ul className="space-y-2">
                    {info.keyPoints.map((point, index) => (
                      <li key={index} className="text-xs text-gray-600 flex items-start gap-2">
                        <span className="text-emerald-500 font-bold select-none mt-0.5">•</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              
              {/* Footer */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3 flex-shrink-0">
                <button
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 border border-gray-300 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  Cerrar
                </button>
                <a
                  href={info.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-gray-800 text-white rounded-xl text-xs font-bold hover:bg-gray-900 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span>Visitar Sitio Oficial</span>
                  <span>↗</span>
                </a>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
