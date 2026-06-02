/**
 * Componente ChatSimulator (Simulador Educativo de Chat y Análisis de Intenciones).
 * 
 * Proporciona un entorno interactivo dividido en tres secciones responsivas y dinámicas:
 * 1. Simulador de Teléfono (Phone Simulator): Muestra una conversación de práctica con globos de texto interactivos.
 *    Al pulsar un mensaje sospechoso, se dispara el análisis automatizado de intenciones mediante IA.
 * 2. Panel de Análisis de Intenciones (Analysis Panel): Despliega el diagnóstico de riesgo del mensaje seleccionado,
 *    clasificando la intención (chantaje, acoso, grooming), explicando el peligro y sugiriendo pautas de acción.
 * 3. Chat de Consulta con ROVIX (Chatbot Panel): Un chatbot con el que el usuario puede dialogar libremente
 *    para despejar dudas sobre seguridad digital y privacidad en redes sociales.
 */

import { useState, useRef, useEffect } from 'react'
import { ArrowLeft, Send, Shield, Bot, Sparkles, AlertTriangle, MessageSquareText, Loader2, X } from 'lucide-react'
import axios from 'axios'

// ============================================================================
// MENSAJES DE SIMULACIÓN DE PRÁCTICA (MALICIOUS_MESSAGES)
// ============================================================================
/**
 * Colección estática de mensajes simulados.
 * Aquellos con la propiedad 'risk' definida son interactivos y permiten al usuario
 * comprender cómo la IA detecta conductas peligrosas (acoso, sextorsión, grooming, etc.).
 */
const MALICIOUS_MESSAGES = [
  { id: 1, text: "Si no me mandas tus fotos, le digo a todos tu secreto 😈", sender: 'other', risk: 'alto' },
  { id: 2, text: "Eres una imbécil, todos te odian en la escuela", sender: 'other', risk: 'alto' },
  { id: 3, text: "Hola, tienes cara muy bonita 😍 no le cuentes a nadie que hablamos", sender: 'other', risk: 'critico' },
  { id: 4, text: "Claro, mañana te veo en el recreo 👍", sender: 'user', risk: null },
  { id: 5, text: "Si no vienes hoy te va a ir muy mal, te lo juro", sender: 'other', risk: 'critico' },
  { id: 6, text: "¿Puedes compartirme tu ubicación? Es para saber dónde estás siempre 😊", sender: 'other', risk: 'alto' },
  { id: 7, text: "Okay, ¿a qué hora?", sender: 'user', risk: null },
  { id: 8, text: "Eres un fracasado, nunca vas a ser nadie", sender: 'other', risk: 'medio' },
  { id: 9, text: "Tengo tus fotos y las voy a publicar si no me obedeces", sender: 'other', risk: 'critico' },
]

// ============================================================================
// MAPEO ESTÉTICO DE COLORES SEGÚN EL NIVEL DE RIESGO (RISK_COLORS)
// ============================================================================
/**
 * Asigna una paleta de color armónica HSL, badges e íconos específicos a cada nivel de riesgo.
 */
const RISK_COLORS = {
  bajo:    { dot: 'bg-emerald-400', badge: 'bg-emerald-500', panel: 'bg-emerald-50 border-emerald-300', title: 'text-emerald-700', icon: '🟢' },
  medio:   { dot: 'bg-yellow-400',  badge: 'bg-yellow-500',  panel: 'bg-yellow-50 border-yellow-300',  title: 'text-yellow-700',  icon: '🟡' },
  alto:    { dot: 'bg-orange-400',  badge: 'bg-orange-500',  panel: 'bg-orange-50 border-orange-300',  title: 'text-orange-700',  icon: '🟠' },
  critico: { dot: 'bg-red-500',     badge: 'bg-red-600',     panel: 'bg-red-50 border-red-300',        title: 'text-red-700',     icon: '🔴' },
  info:    { dot: 'bg-blue-400',    badge: 'bg-blue-500',    panel: 'bg-blue-50 border-blue-300',      title: 'text-blue-700',    icon: '🔵' },
  error:   { dot: 'bg-gray-400',    badge: 'bg-gray-500',    panel: 'bg-gray-100 border-gray-300',     title: 'text-gray-700',    icon: '⚪' },
}

/**
 * Retorna de forma segura la configuración estética correspondiente al nivel de riesgo provisto,
 * con fallbacks en caso de valores nulos o caracteres especiales de acentuación.
 */
function getRiskStyle(level) {
  const key = (level || 'info').toLowerCase().replace('í', 'i')
  return RISK_COLORS[key] || RISK_COLORS.info
}

// ============================================================================
// COMPONENTE EXPORTADO PRINCIPAL
// ============================================================================
export default function ChatSimulator({ onBack }) {
  // ─── ESTADOS LOCALES DE INTERFAZ ──────────────────────────────────────────
  const [selectedMsg, setSelectedMsg] = useState(null)       // Globo de texto activo para análisis
  const [analysisResult, setAnalysisResult] = useState(null)   // Objeto de respuesta diagnóstica
  const [analyzing, setAnalyzing] = useState(false)           // Indicador de carga (loader) para el análisis

  // Historial de mensajes en el chat de conversación con ROVIX
  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      text: "¡Hola! Soy ROVIX 🛡️\n\nToca cualquier globo de texto del teléfono para que lo analice, o pregúntame lo que quieras sobre ciberseguridad.",
      sender: 'ai',
      timestamp: new Date()
    }
  ])
  const [inputText, setInputText] = useState('')              // Texto del input del chat
  const [chatLoading, setChatLoading] = useState(false)       // Loader para el chatbot

  // ─── REFERENCIAS DOM (REFS) ───────────────────────────────────────────────
  const messagesEndRef = useRef(null)                         // Elemento de anclaje para auto-scroll inferior del chat
  const inputRef = useRef(null)                               // Input de escritura para control automático de enfoque

  // ─── EFECTOS DE CONTROL DE COMPORTAMIENTO ─────────────────────────────────
  // Desplaza la vista del chat automáticamente al fondo cada vez que se agrega un mensaje
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  // Devuelve automáticamente el foco del cursor al input de texto tras completarse una respuesta de la IA
  useEffect(() => {
    if (!chatLoading && inputRef.current) inputRef.current.focus()
  }, [chatLoading])

  // ─── MANEJADOR: SELECCIÓN Y ANÁLISIS DE INTENCIONES IA ───────────────────
  /**
   * Envía un mensaje sospechoso al backend local para determinar su nivel de riesgo y recomendación.
   * Si el backend está apagado o la red falla, ejecuta un analizador heurístico de fallback
   * del lado del cliente para garantizar que el usuario reciba un diagnóstico preciso.
   */
  const handleSelectMessage = async (msg) => {
    if (!msg.risk) return
    setSelectedMsg(msg)
    setAnalysisResult(null)
    setAnalyzing(true)

    try {
      // Intenta POST multiparte a la API local de análisis
      const res = await axios.post('http://localhost:8000/api/analyze', { message: msg.text }, { timeout: 35000 })
      setAnalysisResult(res.data)
    } catch {
      // ANALIZADOR DE COMPORTAMIENTO LOCAL DE FALLBACK (CLIENTE)
      // Ejecutado en caso de fallos de red o servidor apagado
      const msgLower = msg.text.toLowerCase()
      if (msg.risk === 'critico') {
        if (msgLower.includes('foto') || msgLower.includes('secreto') || msgLower.includes('obedece')) {
          setAnalysisResult({
            risk_level: 'critico',
            intention: 'Chantaje / Sextorsión',
            explanation: 'Este mensaje es un intento de chantaje o sextorsión. El agresor intenta manipularte usando amenazas de revelar información privada para obligarte a hacer algo.',
            recommendation: 'Nunca cedas ante este tipo de amenazas. Guarda capturas, bloquea al contacto y habla inmediatamente con un adulto de confianza o autoridades.'
          })
        } else if (msgLower.includes('bonita') || msgLower.includes('cuentes')) {
          setAnalysisResult({
            risk_level: 'critico',
            intention: 'Grooming / Manipulación',
            explanation: 'Este mensaje muestra señales claras de grooming: halagos para ganarse tu confianza y secretismo para aislarte de tus seres queridos.',
            recommendation: 'No sigas la conversación. Cuéntale a un adulto de confianza de inmediato. Esta persona puede ser un depredador.'
          })
        } else {
          setAnalysisResult({
            risk_level: 'critico',
            intention: 'Amenaza directa',
            explanation: 'Este mensaje contiene una amenaza explícita. El agresor intenta intimidarte para que hagas algo en contra de tu voluntad.',
            recommendation: 'No respondas. Guarda la evidencia y reporta a las autoridades (911) o a un adulto de confianza inmediatamente.'
          })
        }
      } else if (msg.risk === 'alto') {
        setAnalysisResult({
          risk_level: 'alto',
          intention: 'Acoso / Intimidación',
          explanation: 'Este mensaje contiene lenguaje intimidatorio o solicitudes inapropiadas que constituyen ciberacoso.',
          recommendation: 'Bloquea al remitente, reporta en la plataforma y guarda capturas como evidencia.'
        })
      } else {
        setAnalysisResult({
          risk_level: 'medio',
          intention: 'Lenguaje ofensivo',
          explanation: 'Este mensaje contiene lenguaje ofensivo o degradante. Aunque no es una amenaza directa, es una forma de acoso.',
          recommendation: 'No respondas al insulto. Bloquea a la persona y reporta el mensaje a la plataforma.'
        })
      }
    }
    setAnalyzing(false)
  }

  // ─── MANEJADOR: ENVÍO DE CONSULTAS AL CHATBOT ROVIX ─────────────────────
  /**
   * Envía la consulta escrita al endpoint del chatbot.
   * Envía el historial de mensajes de forma dinámica para proveer memoria contextual a la IA.
   * Si la consulta remota falla, intenta enviar una petición simple sin historial y,
   * en última instancia, advierte de la falta de conexión local con el backend.
   */
  const sendChat = async (text) => {
    if (!text.trim() || chatLoading) return
    const userMsg = { id: Date.now(), text: text.trim(), sender: 'user', timestamp: new Date() }
    setChatMessages(prev => [...prev, userMsg])
    setInputText('')
    setChatLoading(true)
    try {
      // 1. Envía el texto con el historial contextual reciente (últimas interacciones)
      const history = chatMessages.map(m => ({ role: m.sender === 'user' ? 'user' : 'assistant', content: m.text }))
      const res = await axios.post('http://localhost:8000/api/chat', { message: text.trim(), history }, { timeout: 35000 })
      setChatMessages(prev => [...prev, { id: Date.now() + 1, text: res.data.response, sender: 'ai', timestamp: new Date() }])
    } catch {
      try {
        // Fallback: Intenta una solicitud directa libre de historial
        const res = await axios.post('http://localhost:8000/api/chat', { message: text.trim(), history: [] }, { timeout: 35000 })
        setChatMessages(prev => [...prev, { id: Date.now() + 1, text: res.data.response, sender: 'ai', timestamp: new Date() }])
      } catch {
        // Fallback final: Alerta de falta de comunicación con el puerto local 8000
        setChatMessages(prev => [...prev, { id: Date.now() + 1, text: "Error de conexión. Asegúrate de que el servidor esté corriendo en http://localhost:8000.", sender: 'ai', timestamp: new Date() }])
      }
    }
    setChatLoading(false)
  }

  // Captura el enter del teclado para disparar el mensaje sin añadir saltos de línea (shift+enter sí lo permite)
  // Captura el enter del teclado para disparar el mensaje sin añadir saltos de línea (shift+enter sí lo permite)
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat(inputText) }
  }

  const formatTime = (date) => date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })

  // Preguntas sugeridas preestablecidas para facilitación e interacción del usuario
  const quickQuestions = [
    { emoji: "🆘", text: "¿Qué hago si me acosan?" },
    { emoji: "🔒", text: "¿Cómo protejo mis fotos?" },
    { emoji: "⚠️", text: "Alguien me amenaza, ¿qué hago?" },
    { emoji: "🧠", text: "¿Qué es el grooming?" },
  ]

  /* 
     Justificación del uso de colores en ChatSimulator:
     - Dispositivo móvil (border-ods-brown-dark / Cabecera bg-gradient-to-r from-ods-brown-dark to-ods-brown-medium):
       Establece una base de diseño seria, sobria y profesional usando tonos tierra que representan estabilidad.
     - Burbujas de usuario en bg-ods-brown-dark y robot en bg-ods-red / bg-white border-ods-brown-light/30:
       Armoniza con el sistema de color de la marca, asegurando una lectura clara y descansada.
     - Botón de envío (bg-ods-red): Representa fuerza y acción en ODS 5.
     - Botones de preguntas rápidas (hover:border-ods-red / hover:bg-ods-beige): El rojo ODS 5 guía al usuario.
  */

  return (
    <div className="w-full h-full flex flex-col overflow-hidden max-w-7xl mx-auto">
      {/* Botón de retorno al panel principal con alto contraste */}
      <button 
        onClick={onBack} 
        className="flex items-center text-ods-beige hover:text-white mb-6 font-extrabold transition-colors flex-shrink-0 cursor-pointer"
      >
        <ArrowLeft size={20} className="mr-2 stroke-[2.5]" /> Volver al inicio
      </button>

      {/* Grid Interactivo Principal de Tres Columnas Flexibles */}
      <div className="flex-1 flex gap-6 items-start min-h-0 overflow-hidden w-full">

        {/* COLUMNA 1: SIMULADOR DE TELÉFONO MÓVIL (IZQUIERDA) */}
        <div className="flex flex-col items-center flex-shrink-0 h-full overflow-hidden">
          <p className="text-xs font-extrabold text-ods-beige uppercase tracking-wider mb-3 flex items-center gap-1.5 flex-shrink-0 select-none">
            <span className="text-ods-orange animate-pulse">📱</span> Toca un mensaje para analizarlo
          </p>
          
          {/* Estructura del Dispositivo Móvil en contorno Naranja y pantalla Negra */}
          <div
            className="w-[320px] border-[12px] border-ods-orange rounded-[2.8rem] bg-black relative overflow-hidden shadow-2xl flex flex-col flex-1"
            style={{ boxShadow: '0 25px 60px rgba(62,42,31,0.25), inset 0 0 0 2px rgba(255,255,255,0.1)' }}
          >
            {/* Notch superior simulador en Naranja */}
            <div className="absolute top-0 inset-x-0 flex justify-center z-10">
              <div className="w-28 h-6 bg-ods-orange rounded-b-2xl" />
            </div>

            {/* Cabecera del chat simulado en Rojo ODS 5 */}
            <div className="bg-ods-red border-b border-ods-orange/40 pt-8 pb-3 px-4 flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                <Shield size={14} className="text-white" />
              </div>
              <div>
                <div className="text-white text-xs font-extrabold">Chat de práctica</div>
                <div className="text-ods-beige/90 text-[10px] font-bold">Mensajes de ejemplo</div>
              </div>
            </div>

            {/* Lista Desplazable de Mensajes de Simulación en fondo Negro */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-black">
              {MALICIOUS_MESSAGES.map(msg => {
                const isUser = msg.sender === 'user'
                const isSelected = selectedMsg?.id === msg.id
                return (
                  <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                    <div className="relative">
                      {/* Globo de texto interactivo con animaciones sutiles al interactuar */}
                      <div
                        onClick={() => handleSelectMessage(msg)}
                        className={`max-w-[220px] p-2.5 rounded-2xl text-xs leading-relaxed transition-all duration-200 ${
                          isUser
                            ? 'bg-ods-orange text-white rounded-br-sm shadow-md font-bold'
                            : 'bg-ods-beige text-ods-brown-dark rounded-bl-sm shadow-md font-extrabold'
                        } ${msg.risk ? 'cursor-pointer hover:scale-[1.02] hover:shadow-lg active:scale-95' : ''} ${
                          isSelected ? 'ring-4 ring-offset-2 ring-ods-red-vibrant scale-[1.02] shadow-2xl' : ''
                        }`}
                      >
                        {msg.text}
                      </div>
                      {/* Indicador de acción para los mensajes susceptibles a análisis */}
                      {msg.risk && !isUser && (
                        <p className="text-[9px] text-ods-beige/70 mt-0.5 ml-1 font-bold">Toca para analizar</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Margen inferior del simulador de teléfono en Negro */}
            <div className="h-10 bg-black" />
          </div>
        </div>

        {/* COLUMNA 2: PANEL DE ANÁLISIS DE INTENCIONES Y ACCIONES RÁPIDAS (CENTRO) */}
        <div className="flex-1 flex flex-col gap-4 h-full min-h-0" style={{ minWidth: 0 }}>
          
          {/* Contenedor del Diagnóstico de la IA en Naranja Sólido y Borde Rojo */}
          <div className="bg-ods-orange border-4 border-ods-red rounded-[2.8rem] overflow-hidden shadow-2xl flex-1 flex flex-col min-h-0">
            <div className="bg-ods-red border-b border-ods-orange/40 px-5 py-4 flex items-center gap-3 flex-shrink-0">
              <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
                <AlertTriangle size={18} className="text-white animate-pulse" />
              </div>
              <div>
                <h2 className="text-white font-extrabold text-base">Análisis de Intenciones IA</h2>
                <p className="text-white/80 text-xs font-bold">Toca un globo del teléfono para ver el análisis</p>
              </div>
            </div>

            {/* Visualización del Resultado del Análisis */}
            <div className="p-5 flex-1 overflow-y-auto bg-ods-orange">
              {!selectedMsg && !analyzing && (
                <div className="flex flex-col items-center justify-center h-full text-white/90">
                  <AlertTriangle size={32} className="mb-2 opacity-80 animate-bounce" />
                  <p className="text-sm text-center font-extrabold">
                    Selecciona un mensaje del teléfono<br />para ver el análisis de intenciones
                  </p>
                </div>
              )}

              {analyzing && (
                <div className="flex flex-col items-center justify-center h-full text-white">
                  <Loader2 size={32} className="animate-spin mb-2 text-white" />
                  <p className="text-sm font-extrabold">Analizando con IA experta...</p>
                </div>
              )}

              {!analyzing && selectedMsg && analysisResult && (() => {
                return (
                  <div className="animate-fadeIn">
                    {/* Caja de Análisis en Marrón Profundo */}
                    <div className="rounded-[1.8rem] border-4 border-ods-red p-5 bg-ods-brown-dark text-white shadow-2xl">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-extrabold text-white">
                            Intención detectada: <span className="text-ods-orange font-extrabold uppercase tracking-wide">{analysisResult.intention}</span>
                          </span>
                        </div>
                        <button 
                          onClick={() => { setSelectedMsg(null); setAnalysisResult(null) }}
                          className="text-ods-beige hover:text-white flex-shrink-0 cursor-pointer p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition-all"
                        >
                          <X size={16} />
                        </button>
                      </div>

                      {/* Visualización del mensaje analizado en cursiva */}
                      <div className="text-xs italic mb-3 px-3 py-2 rounded-xl bg-ods-orange/20 border border-ods-orange/40 text-ods-beige font-bold leading-relaxed">
                        "{selectedMsg.text}"
                      </div>

                      {/* Explicación de la IA */}
                      <p className="text-sm text-white/95 leading-relaxed font-semibold mb-4">{analysisResult.explanation}</p>

                      {/* Recomendación de acción */}
                      {analysisResult.recommendation && (
                        <div className="bg-ods-orange border-2 border-ods-red rounded-xl p-3 shadow-inner text-white">
                          <p className="text-xs font-extrabold text-ods-beige mb-1 flex items-center gap-1">
                            <span>💡</span> ¿Qué hacer?
                          </p>
                          <p className="text-sm text-white font-semibold leading-relaxed">{analysisResult.recommendation}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })()}
            </div>
          </div>

          {/* Tarjeta de Sugerencias y Preguntas de Acción Rápida en Naranja Sólido y Borde Rojo */}
          <div className="bg-ods-orange border-4 border-ods-red rounded-[2rem] p-4 shadow-xl flex-shrink-0">
            <h3 className="font-extrabold text-white mb-3 text-xs uppercase tracking-wider flex items-center gap-2 select-none">
              <Sparkles size={14} className="text-ods-beige" /> Pregúntale a ROVIX
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {quickQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => sendChat(q.text)}
                  disabled={chatLoading}
                  className="text-left p-2.5 bg-ods-beige border-2 border-ods-red rounded-xl text-xs text-ods-brown-dark hover:bg-white hover:scale-[1.02] transition-all disabled:opacity-50 flex items-center gap-2 group cursor-pointer font-extrabold shadow-md"
                >
                  <span className="text-base group-hover:scale-110 transition-transform">{q.emoji}</span>
                  <span>{q.text}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* COLUMNA 3: CHATBOT DE ASISTENCIA ROVIX (DERECHA) */}
        <div className="w-[340px] flex-shrink-0 bg-ods-orange border-4 border-ods-red rounded-[2.8rem] overflow-hidden shadow-2xl flex flex-col h-full">
          {/* Cabecera del Chat en Rojo ODS 5 */}
          <div className="bg-ods-red border-b border-ods-orange/40 px-5 py-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
              <MessageSquareText size={18} className="text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-white font-extrabold text-base">Chat con ROVIX</h2>
              <p className="text-white/80 text-xs font-bold">{chatLoading ? '● Escribiendo...' : '● En línea'}</p>
            </div>
            {/* Indicador de estado luminoso pulsante */}
            <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
          </div>

          {/* Área de Visualización del Diálogo en fondo Naranja de Canva */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-ods-orange">
            {chatMessages.map(msg => (
              <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] ${msg.sender === 'user' ? '' : 'flex gap-2'}`}>
                  {msg.sender === 'ai' && (
                    <div className="w-6 h-6 rounded-lg bg-ods-red flex items-center justify-center flex-shrink-0 mt-1 shadow-sm border border-white/20">
                      <Bot size={12} className="text-white" />
                    </div>
                  )}
                  <div>
                    {/* Burbuja del mensaje del chatbot en alto contraste y Canva-style */}
                    <div className={`p-2.5 rounded-2xl text-xs leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-ods-brown-dark text-white rounded-br-sm shadow-md font-bold'
                        : 'bg-ods-beige text-ods-brown-dark rounded-bl-sm shadow-md font-extrabold'
                    }`}>
                      <p className="whitespace-pre-line leading-relaxed">{msg.text}</p>
                    </div>
                    <p className={`text-[10px] mt-1 font-bold ${msg.sender === 'user' ? 'text-right text-ods-brown-dark/70' : 'text-ods-brown-dark/70 ml-1'}`}>
                      {formatTime(msg.timestamp)}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {/* Burbuja animada tipo escritura activa en fondo melocotón */}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="flex gap-2">
                  <div className="w-6 h-6 rounded-lg bg-ods-red flex items-center justify-center flex-shrink-0 mt-1 shadow-sm border border-white/20">
                    <Bot size={12} className="text-white" />
                  </div>
                  <div className="bg-ods-beige text-ods-brown-dark rounded-2xl rounded-bl-sm p-2.5 shadow-md">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 bg-ods-brown-dark rounded-full animate-bounce" style={{animationDelay: '0ms'}} />
                      <div className="w-2 h-2 bg-ods-brown-dark rounded-full animate-bounce" style={{animationDelay: '150ms'}} />
                      <div className="w-2 h-2 bg-ods-brown-dark rounded-full animate-bounce" style={{animationDelay: '300ms'}} />
                    </div>
                  </div>
                </div>
              </div>
            )}
            {/* Punto de anclaje para auto-scroll */}
            <div ref={messagesEndRef} />
          </div>

          {/* Barra inferior de envío de mensajes en fondo Naranja y Borde Rojo */}
          <div className="p-3 bg-ods-orange border-t-2 border-ods-red flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Pregúntame algo..."
              className="flex-1 bg-ods-beige border-2 border-ods-red rounded-xl px-3 py-2.5 text-xs outline-none focus:ring-2 focus:ring-white focus:bg-white transition-all text-ods-brown-dark font-extrabold"
              disabled={chatLoading}
            />
            <button
              onClick={() => sendChat(inputText)}
              disabled={chatLoading || !inputText.trim()}
              className={`p-2.5 rounded-xl border-2 border-white transition-all duration-200 cursor-pointer ${
                chatLoading || !inputText.trim()
                  ? 'bg-ods-beige/50 text-ods-brown-dark/40 border-ods-red cursor-not-allowed'
                  : 'bg-ods-red text-white hover:bg-ods-red-vibrant hover:scale-105 active:scale-95 shadow-md hover:shadow-lg'
              }`}
            >
              <Send size={16} />
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
