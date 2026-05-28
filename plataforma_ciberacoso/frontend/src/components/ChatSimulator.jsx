import { useState, useRef, useEffect } from 'react'
import { ArrowLeft, Send, Shield, Bot, Sparkles, AlertTriangle, MessageSquareText, Loader2, X } from 'lucide-react'
import axios from 'axios'

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

const RISK_COLORS = {
  bajo:    { dot: 'bg-emerald-400', badge: 'bg-emerald-500', panel: 'bg-emerald-50 border-emerald-300', title: 'text-emerald-700', icon: '🟢' },
  medio:   { dot: 'bg-yellow-400',  badge: 'bg-yellow-500',  panel: 'bg-yellow-50 border-yellow-300',  title: 'text-yellow-700',  icon: '🟡' },
  alto:    { dot: 'bg-orange-400',  badge: 'bg-orange-500',  panel: 'bg-orange-50 border-orange-300',  title: 'text-orange-700',  icon: '🟠' },
  critico: { dot: 'bg-red-500',     badge: 'bg-red-600',     panel: 'bg-red-50 border-red-300',        title: 'text-red-700',     icon: '🔴' },
  info:    { dot: 'bg-blue-400',    badge: 'bg-blue-500',    panel: 'bg-blue-50 border-blue-300',      title: 'text-blue-700',    icon: '🔵' },
  error:   { dot: 'bg-gray-400',    badge: 'bg-gray-500',    panel: 'bg-gray-100 border-gray-300',     title: 'text-gray-700',    icon: '⚪' },
}

function getRiskStyle(level) {
  const key = (level || 'info').toLowerCase().replace('í', 'i')
  return RISK_COLORS[key] || RISK_COLORS.info
}

export default function ChatSimulator({ onBack }) {
  const [selectedMsg, setSelectedMsg] = useState(null)
  const [analysisResult, setAnalysisResult] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)

  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      text: "¡Hola! Soy ROVIX 🛡️\n\nToca cualquier globo de texto del teléfono para que lo analice, o pregúntame lo que quieras sobre ciberseguridad.",
      sender: 'ai',
      timestamp: new Date()
    }
  ])
  const [inputText, setInputText] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  useEffect(() => {
    if (!chatLoading && inputRef.current) inputRef.current.focus()
  }, [chatLoading])

  const handleSelectMessage = async (msg) => {
    if (!msg.risk) return
    setSelectedMsg(msg)
    setAnalysisResult(null)
    setAnalyzing(true)

    try {
      const res = await axios.post('http://localhost:8000/api/analyze', { message: msg.text }, { timeout: 35000 })
      setAnalysisResult(res.data)
    } catch {
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

  const sendChat = async (text) => {
    if (!text.trim() || chatLoading) return
    const userMsg = { id: Date.now(), text: text.trim(), sender: 'user', timestamp: new Date() }
    setChatMessages(prev => [...prev, userMsg])
    setInputText('')
    setChatLoading(true)
    try {
      const history = chatMessages.map(m => ({ role: m.sender === 'user' ? 'user' : 'assistant', content: m.text }))
      const res = await axios.post('http://localhost:8000/api/chat', { message: text.trim(), history }, { timeout: 35000 })
      setChatMessages(prev => [...prev, { id: Date.now() + 1, text: res.data.response, sender: 'ai', timestamp: new Date() }])
    } catch {
      try {
        const res = await axios.post('http://localhost:8000/api/chat', { message: text.trim(), history: [] }, { timeout: 35000 })
        setChatMessages(prev => [...prev, { id: Date.now() + 1, text: res.data.response, sender: 'ai', timestamp: new Date() }])
      } catch {
        setChatMessages(prev => [...prev, { id: Date.now() + 1, text: "Error de conexión. Asegúrate de que el servidor esté corriendo en http://localhost:8000.", sender: 'ai', timestamp: new Date() }])
      }
    }
    setChatLoading(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat(inputText) }
  }

  const formatTime = (date) => date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })

  const quickQuestions = [
    { emoji: "🆘", text: "¿Qué hago si me acosan?" },
    { emoji: "🔒", text: "¿Cómo protejo mis fotos?" },
    { emoji: "⚠️", text: "Alguien me amenaza, ¿qué hago?" },
    { emoji: "🧠", text: "¿Qué es el grooming?" },
  ]

  return (
    <div className="max-w-7xl mx-auto">
      <button onClick={onBack} className="flex items-center text-gray-600 hover:text-gray-900 mb-6 font-semibold transition-colors">
        <ArrowLeft size={20} className="mr-2" /> Volver al inicio
      </button>

      <div className="flex gap-6 items-start">

        {/* PHONE SIMULATOR */}
        <div className="flex flex-col items-center flex-shrink-0">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1">
            <span>📱</span> Toca un mensaje para analizarlo
          </p>
          <div
            className="w-[320px] border-[12px] border-gray-900 rounded-[2.8rem] bg-gray-100 relative overflow-hidden shadow-2xl flex flex-col"
            style={{ height: '600px', boxShadow: '0 25px 60px rgba(0,0,0,0.35), inset 0 0 0 2px rgba(255,255,255,0.1)' }}
          >
            {/* Notch */}
            <div className="absolute top-0 inset-x-0 flex justify-center z-10">
              <div className="w-28 h-6 bg-gray-900 rounded-b-2xl" />
            </div>

            {/* Header */}
            <div className="bg-gradient-to-r from-gray-800 to-gray-900 pt-8 pb-3 px-4 flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                <Shield size={14} className="text-white" />
              </div>
              <div>
                <div className="text-white text-xs font-bold">Chat de práctica</div>
                <div className="text-gray-400 text-[10px]">Mensajes de ejemplo</div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-gradient-to-b from-gray-100 to-gray-50">
              {MALICIOUS_MESSAGES.map(msg => {
                const isUser = msg.sender === 'user'
                const isSelected = selectedMsg?.id === msg.id
                const style = msg.risk ? getRiskStyle(msg.risk) : null
                return (
                  <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                    <div className="relative">

                      <div
                        onClick={() => handleSelectMessage(msg)}
                        className={`max-w-[220px] p-2.5 rounded-2xl text-xs leading-relaxed transition-all duration-200 ${
                          isUser
                            ? 'bg-gray-700 text-white rounded-br-sm'
                            : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm shadow-sm'
                        } ${msg.risk ? 'cursor-pointer hover:scale-[1.02] hover:shadow-md active:scale-95' : ''} ${
                          isSelected ? 'ring-2 ring-offset-1 ring-gray-800 scale-[1.02] shadow-lg' : ''
                        }`}
                      >
                        {msg.text}
                      </div>
                      {msg.risk && !isUser && (
                        <p className="text-[9px] text-gray-400 mt-0.5 ml-1">Toca para analizar</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Bottom bar */}
            <div className="h-10 bg-gray-900" />
          </div>

          <div className="mt-3 flex gap-2 flex-wrap justify-center">
            {[{ color: 'bg-red-500', label: 'Crítico' }, { color: 'bg-orange-400', label: 'Alto' }, { color: 'bg-yellow-400', label: 'Medio' }].map(r => (
              <span key={r.label} className="flex items-center gap-1 text-xs text-gray-600">
                <span className={`w-2 h-2 rounded-full ${r.color}`} /> {r.label}
              </span>
            ))}
          </div>
        </div>

        {/* ANALYSIS PANEL */}
        <div className="flex-1 flex flex-col gap-4" style={{ minWidth: 0 }}>
          <div className="bg-white border-2 border-gray-200 rounded-2xl overflow-hidden shadow-lg">
            <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-5 py-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
                <AlertTriangle size={18} className="text-white" />
              </div>
              <div>
                <h2 className="text-white font-bold">Análisis de Intenciones IA</h2>
                <p className="text-gray-300 text-xs">Toca un globo del teléfono para ver el análisis</p>
              </div>
            </div>

            <div className="p-5 min-h-[180px]">
              {!selectedMsg && !analyzing && (
                <div className="flex flex-col items-center justify-center h-32 text-gray-400">
                  <AlertTriangle size={32} className="mb-2 opacity-30" />
                  <p className="text-sm text-center">Selecciona un mensaje del teléfono<br />para ver el análisis de intenciones</p>
                </div>
              )}

              {analyzing && (
                <div className="flex flex-col items-center justify-center h-32 text-gray-500">
                  <Loader2 size={32} className="animate-spin mb-2 text-gray-400" />
                  <p className="text-sm">Analizando con IA...</p>
                </div>
              )}

              {!analyzing && selectedMsg && analysisResult && (() => {
                const style = getRiskStyle(analysisResult.risk_level)
                return (
                  <div>
                    <div className={`rounded-xl border-2 p-4 ${style.panel} transition-all`}>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${style.badge}`}>
                            {style.icon} {(analysisResult.risk_level || '').toUpperCase()}
                          </span>
                          <span className={`text-sm font-semibold ${style.title}`}>
                            {analysisResult.intention}
                          </span>
                        </div>
                        <button onClick={() => { setSelectedMsg(null); setAnalysisResult(null) }}
                          className="text-gray-400 hover:text-gray-600 flex-shrink-0">
                          <X size={16} />
                        </button>
                      </div>

                      <div className={`text-xs italic mb-3 px-3 py-2 rounded-lg bg-white/60 border ${style.panel.split(' ')[2]}`}>
                        "{selectedMsg.text}"
                      </div>

                      <p className="text-sm text-gray-700 leading-relaxed mb-3">{analysisResult.explanation}</p>

                      {analysisResult.recommendation && (
                        <div className="bg-white/70 rounded-lg px-3 py-2 border border-white">
                          <p className="text-xs font-bold text-gray-500 mb-1">💡 ¿Qué hacer?</p>
                          <p className="text-sm text-gray-700">{analysisResult.recommendation}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })()}
            </div>
          </div>

          {/* QUICK QUESTIONS */}
          <div className="bg-white border-2 border-gray-200 rounded-2xl p-4 shadow-sm">
            <h3 className="font-bold text-gray-700 mb-3 text-xs uppercase tracking-wider flex items-center gap-2">
              <Sparkles size={14} /> Pregúntale a ROVIX
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {quickQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => sendChat(q.text)}
                  disabled={chatLoading}
                  className="text-left p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-700 hover:bg-gray-100 hover:border-gray-400 transition-all disabled:opacity-50 flex items-center gap-2 group"
                >
                  <span className="text-base group-hover:scale-110 transition-transform">{q.emoji}</span>
                  <span>{q.text}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* CHATBOT PANEL */}
        <div
          className="w-[340px] flex-shrink-0 bg-white border-2 border-gray-200 rounded-2xl overflow-hidden shadow-lg flex flex-col"
          style={{ height: '640px' }}
        >
          <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-5 py-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
              <MessageSquareText size={18} className="text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-white font-bold">Chat con ROVIX</h2>
              <p className="text-gray-300 text-xs">{chatLoading ? '● Escribiendo...' : '● En línea'}</p>
            </div>
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gradient-to-b from-gray-50 to-white">
            {chatMessages.map(msg => (
              <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] ${msg.sender === 'user' ? '' : 'flex gap-2'}`}>
                  {msg.sender === 'ai' && (
                    <div className="w-6 h-6 rounded-lg bg-gray-800 flex items-center justify-center flex-shrink-0 mt-1">
                      <Bot size={12} className="text-white" />
                    </div>
                  )}
                  <div>
                    <div className={`p-2.5 rounded-2xl text-xs ${
                      msg.sender === 'user'
                        ? 'bg-gray-800 text-white rounded-br-sm'
                        : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm shadow-sm'
                    }`}>
                      <p className="whitespace-pre-line leading-relaxed">{msg.text}</p>
                    </div>
                    <p className={`text-[10px] mt-1 ${msg.sender === 'user' ? 'text-right text-gray-400' : 'text-gray-400 ml-1'}`}>
                      {formatTime(msg.timestamp)}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {chatLoading && (
              <div className="flex justify-start">
                <div className="flex gap-2">
                  <div className="w-6 h-6 rounded-lg bg-gray-800 flex items-center justify-center flex-shrink-0 mt-1">
                    <Bot size={12} className="text-white" />
                  </div>
                  <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm p-2.5 shadow-sm">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}} />
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 bg-white border-t border-gray-200 flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Pregúntame algo..."
              className="flex-1 bg-gray-100 rounded-xl px-3 py-2.5 text-xs outline-none focus:ring-2 focus:ring-gray-400 focus:bg-white transition-all border border-transparent"
              disabled={chatLoading}
            />
            <button
              onClick={() => sendChat(inputText)}
              disabled={chatLoading || !inputText.trim()}
              className={`p-2.5 rounded-xl transition-all duration-200 ${
                chatLoading || !inputText.trim()
                  ? 'bg-gray-200 text-gray-400'
                  : 'bg-gray-800 text-white hover:bg-gray-900 hover:scale-105 active:scale-95'
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
