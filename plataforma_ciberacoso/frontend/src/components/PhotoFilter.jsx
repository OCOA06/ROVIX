/**
 * Componente PhotoFilter (Filtro Antirobo de Imágenes).
 * 
 * Provee herramientas de seguridad de vanguardia para la inmunización adversarial de imágenes
 * contra modelos de Inteligencia Artificial generativa, inyectando perturbaciones cromáticas
 * invisibles al ojo humano pero destructivas para los algoritmos de entrenamiento y edición sintética.
 */

import { useState, useRef } from 'react'
import { ArrowLeft, Upload, Image as ImageIcon, Download, Copy, CheckCircle, ShieldCheck, Zap, Lock, Trash2 } from 'lucide-react'
import axios from 'axios'

export default function PhotoFilter({ onBack }) {
  // ─── ESTADOS LOCALES DE ARCHIVOS Y PREVISUALIZACIÓN ────────────────────────
  const [selectedFile, setSelectedFile] = useState(null)       // Archivo de imagen seleccionado por el usuario
  const [previewUrl, setPreviewUrl] = useState(null)           // URL local provisional de previsualización original

  // ─── ESTADOS LOCALES DE ARCHIVOS PROCESADOS E INMUNIZADOS ──────────────────
  const [processedBlob, setProcessedBlob] = useState(null)     // Blob binario retornado por el backend
  const [processedUrl, setProcessedUrl] = useState(null)       // URL local provisional del archivo inmunizado

  // ─── ESTADOS DE CARGA Y CONFIRMACIÓN DE ACCIONES ──────────────────────────
  const [loading, setLoading] = useState(false)                 // Estado de carga al procesar la imagen
  const [copied, setCopied] = useState(false)                   // Indicador visual de copiado al portapapeles
  const [filterApplied, setFilterApplied] = useState(false)     // Bandera de éxito tras la aplicación del filtro

  // ─── REFERENCIAS AL DOM (REFS) ────────────────────────────────────────────
  const fileInputRef = useRef(null)                             // Referencia al input nativo de archivos para disparo por clic

  // ============================================================================
  // MANEJADOR DE CAMBIO DE ARCHIVO (CARGA)
  // ============================================================================
  /**
   * Captura la imagen provista, limpia estados previos y crea una previsualización.
   */
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setSelectedFile(file)
      setPreviewUrl(URL.createObjectURL(file))
      setProcessedUrl(null)
      setProcessedBlob(null)
      setFilterApplied(false)
    }
  }

  // ============================================================================
  // RESTABLECER ESTADO (UX - LIMPIEZA Y CARGA NUEVA)
  // ============================================================================
  /**
   * Limpia todo el estado de selección y procesamiento para permitir al usuario
   * proteger una nueva imagen de forma fluida y clara.
   */
  const handleReset = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    setProcessedBlob(null)
    setProcessedUrl(null)
    setFilterApplied(false)
    // Limpia el valor en el input file nativo para permitir cargar la misma foto de nuevo si se desea
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  // ============================================================================
  // PROCESAMIENTO Y LLAMADA A LA API DE INMUNIZACIÓN
  // ============================================================================
  /**
   * Envía la imagen mediante un FormData multiparte al backend local.
   * Solicita el tipo de retorno Blob para recibir la imagen procesada en formato PNG
   * e inicializa las URLs de descarga del lado del cliente.
   */
  const handleProcessImage = async () => {
    if (!selectedFile) return
    setLoading(true)
    setFilterApplied(false)

    const formData = new FormData()
    formData.append('file', selectedFile)

    try {
      // Petición POST al endpoint del filtro local de ROVIX
      const response = await axios.post('http://localhost:8000/api/filter', formData, {
        responseType: 'blob' // Exige la respuesta binaria de tipo archivo (blob)
      })
      const blob = response.data
      const url = URL.createObjectURL(blob)
      setProcessedBlob(blob)
      setProcessedUrl(url)
      setFilterApplied(true)
    } catch (error) {
      console.error("Error al procesar el filtro de imagen:", error)
    }
    setLoading(false)
  }

  // ============================================================================
  // DESCARGA E INTERACCIÓN CON PORTAPAPELES
  // ============================================================================
  /**
   * Simula un enlace de descarga en el navegador para bajar la imagen localmente.
   */
  const handleDownload = () => {
    if (!processedBlob) return
    const a = document.createElement('a')
    a.href = processedUrl
    a.download = `protegida_${selectedFile?.name || 'imagen'}.png`
    a.click()
  }

  /**
   * Utiliza la API ClipboardItem para copiar el Blob directamente como imagen PNG
   * al portapapeles del sistema operativo, permitiendo pegar (Ctrl+V) de forma inmediata.
   */
  const handleCopy = async () => {
    if (!processedBlob) return
    try {
      const arrayBuffer = await processedBlob.arrayBuffer()
      const clipboardItem = new ClipboardItem({ 'image/png': new Blob([arrayBuffer], { type: 'image/png' }) })
      await navigator.clipboard.write([clipboardItem])
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // Fallback: Ejecuta descarga directa si el navegador no provee ClipboardItem
      handleDownload()
    }
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Botón superior de retorno */}
      <button onClick={onBack} className="flex items-center text-gray-600 hover:text-gray-900 mb-6 font-semibold transition-colors cursor-pointer">
        <ArrowLeft size={20} className="mr-2" /> Volver al inicio
      </button>

      {/* Tarjeta del Módulo de Protección de Imágenes */}
      <div className="bg-white border-2 border-gray-200 rounded-xl p-8 mb-8">
        
        {/* Cabecera del Panel */}
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center">
            <Lock size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Filtro Antirobo de Imágenes</h2>
            <p className="text-xs text-gray-500">Protección adversarial invisible contra IA</p>
          </div>
        </div>

        {/* Panel Explicativo del Funcionamiento Técnico */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-8 mt-4">
          <h3 className="font-semibold text-gray-700 text-sm mb-2 flex items-center gap-2">
            <Zap size={14} /> ¿Cómo funciona?
          </h3>
          <p className="text-gray-600 text-sm leading-relaxed">
            Aplicamos <strong>perturbación adversarial matemática</strong> a los canales de color de tu imagen de forma
            extremadamente sutil. Mediante frecuencias de onda complejas y ruido por bloques restringidos
            a un rango imperceptible, logramos un blindaje <strong>100% invisible para el ojo humano</strong>.
            Aunque tu foto luzca completamente idéntica en pantalla, la alteración a nivel de bits desorienta y confunde
            las redes generativas de IA (Stable Diffusion, DALL·E, Midjourney), impidiendo la edición o simulación no consentida.
            También inyectamos una <strong>firma esteganográfica invisible</strong> para consolidar su seguridad.
          </p>
        </div>

        {/* Sección de visualización de doble columna (Original vs Protegida) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

          {/* Columna Izquierda: Imagen Original */}
          <div className="flex flex-col">
            <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">📁 Imagen original</p>
            <div
              className="border-2 border-dashed border-gray-300 rounded-xl h-72 flex flex-col items-center justify-center bg-gray-50 cursor-pointer hover:bg-gray-100 hover:border-gray-400 transition-all relative overflow-hidden group"
              onClick={() => {
                // Solo dispara la carga si no se ha aplicado el filtro aún para evitar confusiones
                if (!filterApplied) {
                  fileInputRef.current.click()
                }
              }}
            >
              {previewUrl ? (
                <img src={previewUrl} alt="Original" className="w-full h-full object-contain" />
              ) : (
                <>
                  <Upload size={40} className="text-gray-400 mb-4 group-hover:scale-110 transition-transform" />
                  <span className="text-gray-600 font-semibold">Haz clic para subir una foto</span>
                  <span className="text-xs text-gray-400 mt-2">JPG, PNG, WEBP — cualquier tamaño</span>
                </>
              )}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
                disabled={filterApplied}
              />
            </div>

            {/* Fila dinámica de acciones según el estado de la foto (UX Avanzada) */}
            {selectedFile && (
              <div className="mt-4 flex gap-3">
                {filterApplied ? (
                  <>
                    <button
                      onClick={handleReset}
                      className="flex-1 py-3 border-2 border-gray-800 text-gray-800 hover:bg-gray-100 transition-all duration-200 rounded-lg font-bold flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                    >
                      <Upload size={18} /> Proteger otra foto
                    </button>
                    <button
                      onClick={handleReset}
                      className="flex-1 py-3 border-2 border-red-500 text-red-500 hover:bg-red-50 transition-all duration-200 rounded-lg font-bold flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                    >
                      <Trash2 size={18} /> Borrar foto
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleProcessImage}
                      disabled={loading}
                      className="flex-[2] py-3.5 bg-gray-800 text-white hover:bg-gray-900 transition-all duration-200 rounded-lg font-bold flex items-center justify-center gap-2 cursor-pointer disabled:bg-gray-400 disabled:cursor-not-allowed active:scale-[0.98]"
                    >
                      {loading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          Aplicando protección...
                        </>
                      ) : (
                        <><Lock size={18} /> Aplicar Filtro Antirobo</>
                      )}
                    </button>
                    <button
                      onClick={handleReset}
                      disabled={loading}
                      className="flex-1 py-3.5 border-2 border-red-500 text-red-500 hover:bg-red-50 transition-all duration-200 rounded-lg font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-[0.98]"
                    >
                      <Trash2 size={18} /> Quitar foto
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Columna Derecha: Imagen Protegida e Inmunizada */}
          <div className="flex flex-col">
            <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">🛡️ Imagen protegida</p>
            <div className="border-2 border-gray-200 rounded-xl h-72 flex flex-col items-center justify-center bg-gray-50 overflow-hidden relative">
              {processedUrl ? (
                <>
                  <img src={processedUrl} alt="Protegida" className="w-full h-full object-contain" />
                  <div className="absolute top-2 right-2 bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
                    <ShieldCheck size={10} /> PROTEGIDA
                  </div>
                </>
              ) : (
                <div className="text-center p-6 text-gray-400">
                  <ImageIcon size={40} className="mx-auto mb-4 opacity-50" />
                  <p className="text-sm font-semibold">Aquí aparecerá tu foto protegida</p>
                  <p className="text-xs mt-1 text-gray-400">Visualmente idéntica, pero con protección invisible</p>
                </div>
              )}
            </div>

            {/* Acciones de Descarga y Copiado */}
            {processedUrl && (
              <div className="mt-4 flex gap-3">
                <button
                  onClick={handleDownload}
                  className="flex-1 py-3 rounded-lg font-bold text-white bg-gray-800 hover:bg-gray-900 transition-all hover:shadow-lg active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download size={18} /> Descargar
                </button>
                <button
                  onClick={handleCopy}
                  className="flex-1 py-3 rounded-lg font-bold border-2 border-gray-800 text-gray-800 hover:bg-gray-100 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {copied ? <><CheckCircle size={18} className="text-green-600" /> Copiada</> : <><Copy size={18} /> Copiar</>}
                </button>
              </div>
            )}
          </div>

        </div>

        {/* Notificación Informativa de Inmunización Exitosa */}
        {filterApplied && (
          <div className="mt-8 bg-green-50 border-l-4 border-green-500 p-5 rounded-lg flex items-start gap-4 animate-fadeIn">
            <ShieldCheck className="text-green-600 flex-shrink-0 mt-0.5" size={24} />
            <div>
              <h3 className="text-green-800 font-bold text-lg">Protección aplicada exitosamente</h3>
              <p className="text-green-700 mt-1 text-sm leading-relaxed">
                Tu imagen ahora cuenta con <strong>perturbación adversarial cromática invisible</strong> y una
                <strong>firma esteganográfica cifrada</strong>. La variación cromática máxima por píxel se ha restringido a un rango
                matemático extremadamente bajo, haciendo que sea <strong>totalmente invisible al ojo humano</strong>.
                Sin embargo, la interferencia inducida a nivel de bits creará graves artefactos de ruido cuando cualquier 
                Inteligencia Artificial generativa intente manipular tu retrato, protegiendo tu identidad y privacidad en internet.
              </p>
              <button
                onClick={handleReset}
                className="mt-3 text-xs font-bold text-green-700 hover:text-green-900 transition-colors flex items-center gap-1 cursor-pointer"
              >
                ¿Quieres proteger otra foto? Haz clic aquí para comenzar de nuevo.
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
