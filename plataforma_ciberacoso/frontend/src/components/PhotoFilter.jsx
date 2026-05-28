import { useState, useRef } from 'react'
import { ArrowLeft, Upload, Image as ImageIcon, Download, Copy, CheckCircle, Eye, ShieldCheck, ShieldAlert, Zap, Lock } from 'lucide-react'
import axios from 'axios'

export default function PhotoFilter({ onBack }) {
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [processedBlob, setProcessedBlob] = useState(null)
  const [processedUrl, setProcessedUrl] = useState(null)
  const [loading, setLoading] = useState(false)
  const [verifyLoading, setVerifyLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [verifyResult, setVerifyResult] = useState(null)
  const [filterApplied, setFilterApplied] = useState(false)
  const fileInputRef = useRef(null)
  const verifyInputRef = useRef(null)

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setSelectedFile(file)
      setPreviewUrl(URL.createObjectURL(file))
      setProcessedUrl(null)
      setProcessedBlob(null)
      setVerifyResult(null)
      setFilterApplied(false)
    }
  }

  const handleProcessImage = async () => {
    if (!selectedFile) return
    setLoading(true)
    setFilterApplied(false)

    const formData = new FormData()
    formData.append('file', selectedFile)

    try {
      const response = await axios.post('http://localhost:8000/api/filter', formData, {
        responseType: 'blob'
      })
      const blob = response.data
      const url = URL.createObjectURL(blob)
      setProcessedBlob(blob)
      setProcessedUrl(url)
      setFilterApplied(true)
    } catch (error) {
      console.error(error)
    }
    setLoading(false)
  }

  const handleDownload = () => {
    if (!processedBlob) return
    const a = document.createElement('a')
    a.href = processedUrl
    a.download = `protegida_${selectedFile?.name || 'imagen'}.png`
    a.click()
  }

  const handleCopy = async () => {
    if (!processedBlob) return
    try {
      const arrayBuffer = await processedBlob.arrayBuffer()
      const clipboardItem = new ClipboardItem({ 'image/png': new Blob([arrayBuffer], { type: 'image/png' }) })
      await navigator.clipboard.write([clipboardItem])
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      handleDownload()
    }
  }

  const handleVerifyChange = async (e) => {
    if (!e.target.files || !e.target.files[0]) return
    setVerifyLoading(true)
    setVerifyResult(null)
    const formData = new FormData()
    formData.append('file', e.target.files[0])
    try {
      const res = await axios.post('http://localhost:8000/api/verify', formData)
      setVerifyResult(res.data)
    } catch {
      setVerifyResult({ protected: false, message: 'Error al verificar la imagen.' })
    }
    setVerifyLoading(false)
  }

  return (
    <div className="max-w-5xl mx-auto">
      <button onClick={onBack} className="flex items-center text-gray-600 hover:text-gray-900 mb-6 font-semibold transition-colors">
        <ArrowLeft size={20} className="mr-2" /> Volver al inicio
      </button>

      <div className="bg-white border-2 border-gray-200 rounded-xl p-8 mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center">
            <Lock size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Filtro Antirobo de Imágenes</h2>
            <p className="text-xs text-gray-500">Protección adversarial contra IA</p>
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-8 mt-4">
          <h3 className="font-semibold text-gray-700 text-sm mb-2 flex items-center gap-2">
            <Zap size={14} /> ¿Cómo funciona?
          </h3>
          <p className="text-gray-600 text-sm leading-relaxed">
            Aplicamos <strong>perturbación adversarial de alta intensidad</strong> a tu imagen:
            patrones de ruido de alta frecuencia, rejillas de interferencia y ruido aleatorio a nivel de píxeles.
            Estos patrones son <strong>casi invisibles al ojo humano</strong> pero confunden los modelos de IA
            (Stable Diffusion, DALL·E, Midjourney) haciendo que generen resultados distorsionados o irreconocibles
            cuando intentan modificar tu foto. También añadimos una <strong>marca steganográfica</strong> para verificar protección.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

          <div className="flex flex-col">
            <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">📁 Imagen original</p>
            <div
              className="border-2 border-dashed border-gray-300 rounded-xl h-72 flex flex-col items-center justify-center bg-gray-50 cursor-pointer hover:bg-gray-100 hover:border-gray-400 transition-all relative overflow-hidden group"
              onClick={() => fileInputRef.current.click()}
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
              />
            </div>

            <button
              onClick={handleProcessImage}
              disabled={!selectedFile || loading}
              className={`mt-4 py-3.5 rounded-lg font-bold text-white transition-all duration-200 flex items-center justify-center gap-2 ${!selectedFile || loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-gray-800 hover:bg-gray-900 hover:shadow-lg active:scale-[0.98]'}`}
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
          </div>

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
                  <p className="text-xs mt-1 text-gray-400">Visualmente similar, pero con protección invisible</p>
                </div>
              )}
            </div>

            {processedUrl && (
              <div className="mt-4 flex gap-3">
                <button
                  onClick={handleDownload}
                  className="flex-1 py-3 rounded-lg font-bold text-white bg-gray-800 hover:bg-gray-900 transition-all hover:shadow-lg active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <Download size={18} /> Descargar
                </button>
                <button
                  onClick={handleCopy}
                  className="flex-1 py-3 rounded-lg font-bold border-2 border-gray-800 text-gray-800 hover:bg-gray-100 transition-all flex items-center justify-center gap-2"
                >
                  {copied ? <><CheckCircle size={18} className="text-green-600" /> Copiada</> : <><Copy size={18} /> Copiar</>}
                </button>
              </div>
            )}
          </div>

        </div>

        {filterApplied && (
          <div className="mt-8 bg-green-50 border-l-4 border-green-500 p-5 rounded-lg flex items-start gap-4">
            <ShieldCheck className="text-green-600 flex-shrink-0 mt-0.5" size={24} />
            <div>
              <h3 className="text-green-800 font-bold text-lg">Protección aplicada exitosamente</h3>
              <p className="text-green-700 mt-1 text-sm leading-relaxed">
                Tu imagen ahora tiene <strong>perturbación adversarial de alta intensidad</strong> y una
                <strong> marca steganográfica invisible</strong>. Cuando una IA intente modificar esta imagen,
                los patrones de interferencia causarán artefactos y distorsiones en el resultado, haciendo
                inútil la edición automática. Descárgala y úsala normalmente — la protección es invisible al ojo humano.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white border-2 border-gray-200 rounded-xl p-8">
        <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center gap-2">
          <Eye size={20} /> Verificar protección de una imagen
        </h3>
        <p className="text-gray-600 text-sm mb-4">¿Tienes una imagen y quieres saber si ya tiene protección ROVIX? Súbela aquí para verificar su marca digital.</p>

        <button
          onClick={() => verifyInputRef.current.click()}
          disabled={verifyLoading}
          className="py-2.5 px-6 rounded-lg font-bold border-2 border-gray-700 text-gray-700 hover:bg-gray-100 transition-all flex items-center gap-2"
        >
          {verifyLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-gray-400 border-t-gray-700 rounded-full animate-spin"></div>
              Verificando...
            </>
          ) : (
            <><Eye size={16} /> Subir imagen a verificar</>
          )}
        </button>
        <input type="file" ref={verifyInputRef} onChange={handleVerifyChange} accept="image/*" className="hidden" />

        {verifyResult && (
          <div className={`mt-4 p-5 rounded-lg border-l-4 flex items-start gap-3 ${verifyResult.protected ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'}`}>
            {verifyResult.protected ? (
              <ShieldCheck className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
            ) : (
              <ShieldAlert className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
            )}
            <p className={`font-semibold text-sm ${verifyResult.protected ? 'text-green-800' : 'text-red-800'}`}>
              {verifyResult.message}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
