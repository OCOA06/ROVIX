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

  /* 
     Justificación del uso de colores en PhotoFilter:
     - Volver y textos (text-ods-brown-medium hover:text-ods-brown-dark):
       Proporciona una lectura descansada y empática, representativa de los temas de concientización social.
     - Botón principal de "Aplicar Filtro" y "Descargar" (bg-ods-red hover:bg-ods-red-vibrant):
       El Rojo ODS 5 incentiva a la acción decisiva y destaca las herramientas clave de seguridad.
     - Área de carga y previsualización (bg-ods-beige/25 border-ods-brown-light/40 hover:border-ods-red):
       Utiliza tonos de base beige/tierra para brindar descanso visual y guiar las interacciones mediante micro-animaciones.
     - Caja explicativa "¿Cómo funciona?" (bg-ods-beige/50 border-ods-brown-light/30):
       Armoniza con el entorno, dando seriedad y compromiso.
  */

  return (
    <div className="max-w-5xl mx-auto">
      {/* Botón superior de retorno con alto contraste */}
      <button 
        onClick={onBack} 
        className="flex items-center text-ods-beige hover:text-white mb-6 font-extrabold transition-colors cursor-pointer"
      >
        <ArrowLeft size={20} className="mr-2 stroke-[2.5]" /> Volver al inicio
      </button>

      {/* Tarjeta del Módulo de Protección de Imágenes en Naranja Sólido y Borde Rojo */}
      <div className="bg-ods-orange border-4 border-ods-red rounded-[2.8rem] p-8 mb-8 shadow-2xl">
        
        {/* Cabecera del Panel en Rojo ODS 5 */}
        <div className="flex items-center gap-4 mb-6 bg-ods-red border border-ods-orange/45 p-5 rounded-3xl shadow-md">
          <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-md flex-shrink-0">
            <Lock size={24} className="text-ods-red" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-white uppercase tracking-wide">Filtro Antirobo de Imágenes</h2>
            <p className="text-xs text-ods-beige font-bold mt-0.5">Protección adversarial invisible contra Inteligencias Artificiales</p>
          </div>
        </div>

        {/* Panel Explicativo del Funcionamiento Técnico en Melocotón con Borde Rojo */}
        <div className="bg-ods-beige border-4 border-ods-red rounded-3xl p-5 mb-8 mt-4 leading-relaxed text-ods-brown-dark shadow-inner">
          <h3 className="font-extrabold text-ods-brown-dark text-sm mb-2 flex items-center gap-2 select-none">
            <Zap size={16} className="text-ods-red stroke-[2.5] animate-pulse" /> ¿Cómo funciona?
          </h3>
          <p className="text-sm leading-relaxed font-semibold">
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
            <p className="text-sm font-extrabold text-white mb-2 flex items-center gap-2 select-none">📁 Imagen original</p>
            <div
              className="border-4 border-dashed border-ods-red rounded-[2rem] h-72 flex flex-col items-center justify-center bg-ods-beige cursor-pointer hover:bg-white transition-all relative overflow-hidden group shadow-inner"
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
                  <Upload size={40} className="text-ods-red mb-4 group-hover:scale-110 transition-transform duration-200 stroke-[2.5]" />
                  <span className="text-ods-brown-dark font-extrabold text-sm">Haz clic para subir una foto</span>
                  <span className="text-xs text-ods-brown-dark/80 font-bold mt-2">JPG, PNG, WEBP — cualquier tamaño</span>
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

            {/* Fila dinámica de acciones según el estado de la foto */}
            {selectedFile && (
              <div className="mt-4 flex gap-3">
                {filterApplied ? (
                  <>
                    <button
                      onClick={handleReset}
                      className="flex-1 py-3 bg-ods-beige border-2 border-ods-red text-ods-brown-dark hover:bg-white transition-all duration-200 rounded-xl font-extrabold flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] shadow-md"
                    >
                      <Upload size={18} className="stroke-[2.5]" /> Proteger otra foto
                    </button>
                    <button
                      onClick={handleReset}
                      className="flex-1 py-3 bg-ods-red text-white border-2 border-white hover:bg-ods-red-vibrant transition-all duration-200 rounded-xl font-extrabold flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] shadow-md"
                    >
                      <Trash2 size={18} /> Borrar foto
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleProcessImage}
                      disabled={loading}
                      className="flex-[2] py-3.5 bg-ods-red text-white border-2 border-white hover:bg-ods-red-vibrant transition-all duration-200 rounded-xl font-extrabold flex items-center justify-center gap-2 cursor-pointer disabled:bg-ods-beige/50 disabled:text-ods-brown-dark/40 disabled:border-ods-red disabled:cursor-not-allowed active:scale-[0.98] shadow-md hover:shadow-lg"
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
                      className="flex-1 py-3.5 bg-ods-red text-white border-2 border-white hover:bg-ods-red-vibrant transition-all duration-200 rounded-xl font-extrabold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-[0.98] shadow-md"
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
            <p className="text-sm font-extrabold text-white mb-2 flex items-center gap-2 select-none">🛡️ Imagen protegida</p>
            <div className="border-4 border-dashed border-ods-red rounded-[2rem] h-72 flex flex-col items-center justify-center bg-ods-beige overflow-hidden relative shadow-inner">
              {processedUrl ? (
                <>
                  <img src={processedUrl} alt="Protegida" className="w-full h-full object-contain" />
                  <div className="absolute top-2 right-2 bg-emerald-600 border border-white/20 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                    <ShieldCheck size={10} /> PROTEGIDA
                  </div>
                </>
              ) : (
                <div className="text-center p-6 text-ods-brown-dark/70">
                  <ImageIcon size={40} className="mx-auto mb-4 text-ods-red stroke-[2.5]" />
                  <p className="text-sm font-extrabold text-ods-brown-dark">Aquí aparecerá tu foto protegida</p>
                  <p className="text-xs mt-1 font-semibold">Visualmente idéntica, pero con perturbaciones invisibles</p>
                </div>
              )}
            </div>

            {/* Acciones de Descarga y Copiado */}
            {processedUrl && (
              <div className="mt-4 flex gap-3">
                <button
                  onClick={handleDownload}
                  className="flex-1 py-3 rounded-xl font-extrabold text-white bg-ods-red border-2 border-white hover:bg-ods-red-vibrant transition-all hover:shadow-lg active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <Download size={18} /> Descargar
                </button>
                <button
                  onClick={handleCopy}
                  className="flex-1 py-3 rounded-xl font-extrabold bg-ods-beige border-2 border-ods-red text-ods-brown-dark hover:bg-white transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  {copied ? <><CheckCircle size={18} className="text-green-600" /> Copiada</> : <><Copy size={18} /> Copiar</>}
                </button>
              </div>
            )}
          </div>

        </div>

        {/* Notificación Informativa de Inmunización Exitosa */}
        {filterApplied && (
          <div className="mt-8 bg-ods-brown-dark border-4 border-emerald-500 p-5 rounded-[1.8rem] flex items-start gap-4 animate-fadeIn shadow-2xl text-white">
            <ShieldCheck className="text-emerald-400 flex-shrink-0 mt-0.5" size={24} />
            <div>
              <h3 className="text-emerald-400 font-extrabold text-lg">Protección aplicada exitosamente</h3>
              <p className="text-white/90 mt-1 text-sm leading-relaxed font-semibold">
                Tu imagen ahora cuenta con <strong>perturbación adversarial cromática invisible</strong> y una
                <strong>firma esteganográfica cifrada</strong>. La variación cromática máxima por píxel se ha restringido a un rango
                matemático extremadamente bajo, haciendo que sea <strong>totalmente invisible al ojo humano</strong>.
                Sin embargo, la interferencia inducida a nivel de bits creará graves artefactos de ruido cuando cualquier 
                Inteligencia Artificial generativa intente manipular tu retrato, protegiendo tu identidad y privacidad en internet.
              </p>
              <button
                onClick={handleReset}
                className="mt-3 text-xs font-extrabold text-ods-beige hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
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
