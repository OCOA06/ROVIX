/**
 * Componente Sidebar (Barra Lateral de Navegación y Recursos).
 * 
 * Este componente proporciona una barra lateral de navegación fija que permite regresar a la pantalla de inicio
 * y expone una colección organizada de tarjetas informativas clasificadas en dos secciones:
 * "Portales de Apoyo" (institucionales) y "Noticias y Recursos" (educativos).
 * Al hacer clic en cualquier tarjeta, se previene la redirección inmediata y en su lugar se despliega
 * un modal enriquecido con pautas clave de acción directa y un enlace seguro al sitio oficial.
 */

import { useState } from 'react'
import { AlertCircle, Home, X } from 'lucide-react'

// ============================================================================
// DICCIONARIO INFORMATIVO DE PORTALES Y NOTICIAS (INFO_DETAILS)
// ============================================================================
/**
 * Almacena el contenido educativo y legal desplegado por los modales informativos.
 * Cada clave representa un panel de información específico y cuenta con:
 * - agency: Nombre del portal o tipo de recurso.
 * - title: Título del recurso o noticia.
 * - subtitle: Subtítulo descriptivo.
 * - emoji: Emoji representativo para enriquecimiento visual.
 * - content: Texto explicativo de base sobre la temática.
 * - keyPoints: Listado de pautas clave de acción o hechos legales.
 * - link: URL segura y de alta estabilidad (.gob.mx) para ampliación de información.
 */
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

// ============================================================================
// COMPONENTE EXPORTADO PRINCIPAL (SIDEBAR CON DISEÑO ODS 5)
// ============================================================================
export default function Sidebar({ activeView, setActiveView }) {
  // Estado local para almacenar qué modal informativo está activo en pantalla (null por defecto)
  const [activeModal, setActiveModal] = useState(null)

  /* 
     Justificación del uso de colores en Sidebar:
     - Fondo bg-ods-beige y border-ods-brown-light/35: Brindan claridad, transparencia y descanso visual (base beige/blanco).
     - Logotipo Rovix_logo.png integrado: Reemplaza iconos genéricos, aportando profesionalismo y consolidando la marca.
     - Hover en tarjetas (hover:border-ods-red-vibrant): El rojo (ODS 5) invita a la acción y destaca el portal.
     - Títulos de tarjeta en hover (group-hover:text-ods-orange): El naranja simboliza cambio positivo y esperanza.
  */

  return (
    // Contenedor de la barra lateral ajustado a la pantalla, con fondo beige cálido y scroll vertical independiente
    <div className="w-64 bg-ods-beige border-r border-ods-brown-light/35 flex flex-col h-full overflow-hidden">
      
      {/* Botón superior fijo de Retorno a Inicio con Logotipo Integrado */}
      <div 
        className="p-6 border-b border-ods-brown-light/25 flex items-center gap-3 cursor-pointer flex-shrink-0 hover:bg-ods-brown-light/15 transition-colors" 
        onClick={() => setActiveView('home')}
      >
        <img 
          src="/Rovix_logo.png" 
          alt="ROVIX" 
          className="w-10 h-10 object-contain rounded-xl bg-white p-1 border border-ods-brown-light/20 shadow-sm"
        />
        <div>
          <h2 className="font-extrabold text-ods-brown-dark text-lg tracking-tight">ROVIX</h2>
          <p className="text-xs text-ods-brown-medium font-semibold">Menú Principal</p>
        </div>
      </div>
      
      {/* Panel intermedio desplazable para las tarjetas informativas */}
      <div className="p-4 flex-1 overflow-y-auto">
        <div className="flex items-center gap-2 mb-4 mt-2">
          <AlertCircle className="text-ods-orange" size={20} />
          <h3 className="font-extrabold text-ods-brown-medium uppercase tracking-wider text-xs">Lo + Nuevo</h3>
        </div>
        
        <div className="space-y-3">
          
          {/* SECCIÓN 1: Portales Oficiales de Apoyo Institucional */}
          <div className="text-[10px] font-extrabold text-ods-brown-medium/60 uppercase tracking-wider mb-2 select-none">Portales de Apoyo</div>
          
          {/* Tarjeta 1: INMUJERES */}
          <a
            href="https://www.gob.mx/inmujeres"
            onClick={(e) => { e.preventDefault(); setActiveModal('inmujeres'); }}
            className="block bg-white p-3 rounded shadow-sm border border-ods-brown-light/30 hover:shadow-md transition-all hover:border-ods-red-vibrant group cursor-pointer"
          >
            <h4 className="font-bold text-ods-brown-dark text-sm mb-1 group-hover:text-ods-orange transition-colors flex items-center justify-between">
              <span>Inst. Nacional de las Mujeres</span>
              <span className="text-[10px] text-ods-brown-medium font-normal">inmujeres.gob.mx ↗</span>
            </h4>
            <p className="text-xs text-ods-brown-medium/90">Consulta el portal oficial de INMUJERES para acceder a programas de equidad, derechos digitales y erradicación de la violencia.</p>
          </a>
          
          {/* Tarjeta 2: CONAVIM */}
          <a
            href="https://www.gob.mx/conavim"
            onClick={(e) => { e.preventDefault(); setActiveModal('conavim'); }}
            className="block bg-white p-3 rounded shadow-sm border border-ods-brown-light/30 hover:shadow-md transition-all hover:border-ods-red-vibrant group cursor-pointer"
          >
            <h4 className="font-bold text-ods-brown-dark text-sm mb-1 group-hover:text-ods-orange transition-colors flex items-center justify-between">
              <span>Portal de la CONAVIM</span>
              <span className="text-[10px] text-ods-brown-medium font-normal">conavim.gob.mx ↗</span>
            </h4>
            <p className="text-xs text-ods-brown-medium/90">Revisa las campañas nacionales, recursos y mecanismos de prevención contra la violencia digital y de género.</p>
          </a>
          
          {/* Tarjeta 3: SSPC */}
          <a
            href="https://www.gob.mx/sspc"
            onClick={(e) => { e.preventDefault(); setActiveModal('sspc'); }}
            className="block bg-white p-3 rounded shadow-sm border border-ods-brown-light/30 hover:shadow-md transition-all hover:border-ods-red-vibrant group cursor-pointer"
          >
            <h4 className="font-bold text-ods-brown-dark text-sm mb-1 group-hover:text-ods-orange transition-colors flex items-center justify-between">
              <span>Sec. de Seguridad (SSPC)</span>
              <span className="text-[10px] text-ods-brown-medium font-normal">sspc.gob.mx ↗</span>
            </h4>
            <p className="text-xs text-ods-brown-medium/90">Explora el sitio de la SSPC para informarte sobre ciberseguridad nacional y canales de reporte ciudadano.</p>
          </a>
  
          {/* Tarjeta 4: Guardia Nacional */}
          <a
            href="https://www.gob.mx/guardianacional"
            onClick={(e) => { e.preventDefault(); setActiveModal('guardianacional'); }}
            className="block bg-white p-3 rounded shadow-sm border border-ods-brown-light/30 hover:shadow-md transition-all hover:border-ods-red-vibrant group cursor-pointer"
          >
            <h4 className="font-bold text-ods-brown-dark text-sm mb-1 group-hover:text-ods-orange transition-colors flex items-center justify-between">
              <span>Guardia Nacional de México</span>
              <span className="text-[10px] text-ods-brown-medium font-normal">gob.mx/gn ↗</span>
            </h4>
            <p className="text-xs text-ods-brown-medium/90">Conoce las recomendaciones de la Guardia Nacional para prevenir ciberdelitos y proteger a la familia en internet.</p>
          </a>
  
          {/* SECCIÓN 2: Noticias e Informes Educativos */}
          <div className="text-[10px] font-extrabold text-ods-brown-medium/60 uppercase tracking-wider pt-3 pb-1 select-none border-t border-ods-brown-light/25">Noticias y Recursos</div>
  
          {/* Tarjeta 5: Salud Mental */}
          <a
            href="https://www.gob.mx/salud"
            onClick={(e) => { e.preventDefault(); setActiveModal('salud_mental'); }}
            className="block bg-white p-3 rounded shadow-sm border border-ods-brown-light/30 hover:shadow-md transition-all hover:border-ods-red-vibrant group cursor-pointer"
          >
            <h4 className="font-bold text-ods-brown-dark text-sm mb-1 group-hover:text-ods-orange transition-colors flex items-center justify-between">
              <span>Ciberacoso y Salud Mental</span>
              <span className="text-[10px] text-ods-brown-medium font-normal">salud.gob.mx ↗</span>
            </h4>
            <p className="text-xs text-ods-brown-medium/90">Efectos emocionales del hostigamiento cibernético persistente y pautas de autocuidado digital.</p>
          </a>
  
          {/* Tarjeta 6: Homologación Penal */}
          <a
            href="https://www.gob.mx/segob"
            onClick={(e) => { e.preventDefault(); setActiveModal('leyes_mexico'); }}
            className="block bg-white p-3 rounded shadow-sm border border-ods-brown-light/30 hover:shadow-md transition-all hover:border-ods-red-vibrant group cursor-pointer"
          >
            <h4 className="font-bold text-ods-brown-dark text-sm mb-1 group-hover:text-ods-orange transition-colors flex items-center justify-between">
              <span>Avances Legales en México</span>
              <span className="text-[10px] text-ods-brown-medium font-normal">segob.gob.mx ↗</span>
            </h4>
            <p className="text-xs text-ods-brown-medium/90">La violencia digital ha sido homologada penalmente en los 32 estados de la República Mexicana.</p>
          </a>
  
          {/* Tarjeta 7: Deepfakes e IA */}
          <a
            href="https://www.gob.mx/sspc"
            onClick={(e) => { e.preventDefault(); setActiveModal('ciber_ia'); }}
            className="block bg-white p-3 rounded shadow-sm border border-ods-brown-light/30 hover:shadow-md transition-all hover:border-ods-red-vibrant group cursor-pointer"
          >
            <h4 className="font-bold text-ods-brown-dark text-sm mb-1 group-hover:text-ods-orange transition-colors flex items-center justify-between">
              <span>Riesgos de IA y Deepfakes</span>
              <span className="text-[10px] text-ods-brown-medium font-normal">sspc.gob.mx ↗</span>
            </h4>
            <p className="text-xs text-ods-brown-medium/90">Uso no consentido de software generativo de Inteligencia Artificial para alterar y simular imágenes íntimas.</p>
          </a>
        </div>
      </div>
  
      {/* ============================================================================
          MODAL INTERACTIVO FLOTANTE CON COLORES PREMIUM
          ============================================================================ */}
      {activeModal && (() => {
        const info = INFO_DETAILS[activeModal];
        return (
          // Contenedor principal con fondo oscuro traslúcido y desenfoque
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-ods-brown-dark/70 backdrop-blur-sm">
            
            {/* Cuerpo del Modal con restricciones de altura e interfaz cálida */}
            <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-ods-brown-light/25 flex flex-col max-h-[90vh] animate-fadeIn">
              
              {/* Encabezado del Modal con degradado de estabilidad y empatía */}
              <div className="bg-gradient-to-r from-ods-brown-dark to-ods-brown-medium px-6 py-5 flex items-center justify-between text-white flex-shrink-0">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{info.emoji}</span>
                  <div>
                    <h3 className="font-extrabold text-[10px] text-ods-brown-light uppercase tracking-widest">{info.agency}</h3>
                    <h2 className="font-extrabold text-base leading-tight mt-0.5">{info.title}</h2>
                  </div>
                </div>
                {/* Botón de cierre superior */}
                <button
                  onClick={() => setActiveModal(null)}
                  className="text-ods-beige hover:text-white transition-colors p-1 bg-white/10 rounded-lg cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
              
              {/* Contenido Desplazable del Modal */}
              <div className="p-6 overflow-y-auto space-y-4">
                <div>
                  <h4 className="font-extrabold text-ods-brown-dark text-sm mb-1">{info.subtitle}</h4>
                  <p className="text-xs text-ods-brown-medium/95 leading-relaxed">{info.content}</p>
                </div>
                
                {/* Panel de Pautas Clave de Acción con tonos de estabilidad y cambio */}
                <div className="bg-ods-beige/40 border border-ods-brown-light/20 rounded-xl p-4">
                  <h4 className="font-extrabold text-ods-brown-dark text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <span className="text-ods-orange">💡</span> Pautas Clave de Acción:
                  </h4>
                  <ul className="space-y-2">
                    {info.keyPoints.map((point, index) => (
                      <li key={index} className="text-xs text-ods-brown-medium/95 flex items-start gap-2">
                        <span className="text-ods-orange font-bold select-none mt-0.5">•</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              
              {/* Pie de página con botones de cierre y redirección externa en Rojo ODS 5 */}
              <div className="px-6 py-4 bg-ods-beige/70 border-t border-ods-brown-light/20 flex items-center justify-end gap-3 flex-shrink-0">
                <button
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 border border-ods-brown-light rounded-xl text-xs font-bold text-ods-brown-dark hover:bg-ods-beige transition-colors cursor-pointer"
                >
                  Cerrar
                </button>
                <a
                  href={info.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-ods-red text-white rounded-xl text-xs font-bold hover:bg-ods-red-vibrant transition-all flex items-center gap-1 cursor-pointer shadow-md hover:shadow-lg active:scale-95"
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
