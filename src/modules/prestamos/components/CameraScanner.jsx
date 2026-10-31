import React, { useRef, useState } from 'react'
import { X, Camera, AlertCircle, ImagePlus, RefreshCw } from 'lucide-react'

const MAX_DECODE_WIDTH = 1200

function imageToCanvas(img, cropFactor) {
  const canvas = document.createElement('canvas')
  const srcW = img.naturalWidth * cropFactor
  const srcH = img.naturalHeight * cropFactor
  const srcX = (img.naturalWidth - srcW) / 2
  const srcY = (img.naturalHeight - srcH) / 2
  const scale = Math.min(1, MAX_DECODE_WIDTH / srcW)
  canvas.width = Math.round(srcW * scale)
  canvas.height = Math.round(srcH * scale)
  canvas.getContext('2d').drawImage(img, srcX, srcY, srcW, srcH, 0, 0, canvas.width, canvas.height)
  return canvas
}

async function decodeFromCanvasZxing(img) {
  const { BrowserMultiFormatReader } = await import('@zxing/browser')
  const reader = new BrowserMultiFormatReader()
  for (const crop of [1.0, 0.6, 0.4]) {
    const canvas = imageToCanvas(img, crop)
    try {
      // decodeFromCanvas es público y síncrono — sin blob URL
      return reader.decodeFromCanvas(canvas).getText()
    } catch (_e) {
      // NotFoundException — prueba siguiente crop
    }
  }
  return null
}

async function decodeFromCanvasBarcodeDetector(img) {
  const detector = new window.BarcodeDetector()
  for (const crop of [1.0, 0.6, 0.4]) {
    const canvas = imageToCanvas(img, crop)
    const barcodes = await detector.detect(canvas)
    if (barcodes.length > 0) return barcodes[0].rawValue
  }
  return null
}

export default function CameraScanner({ onScan, onClose }) {
  const fileInputRef = useRef(null)
  const [photoError, setPhotoError] = useState(null)
  const [photoLoading, setPhotoLoading] = useState(false)

  async function handlePhotoCapture(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoError(null)
    setPhotoLoading(true)

    const url = URL.createObjectURL(file)
    try {
      const img = new window.Image()
      img.src = url
      await img.decode()

      let result = null

      if ('BarcodeDetector' in window) {
        result = await decodeFromCanvasBarcodeDetector(img)
      }

      if (!result) {
        result = await decodeFromCanvasZxing(img)
      }

      if (result) {
        onScan(result)
      } else {
        setPhotoError(
          'No se detectó ningún código. Acércate más al código y asegúrate de que quede bien enfocado.'
        )
      }
    } catch (_e) {
      setPhotoError('Error al procesar la foto. Intenta de nuevo.')
    } finally {
      URL.revokeObjectURL(url)
      setPhotoLoading(false)
      e.target.value = ''
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm bg-[#1a1a1a] rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-2 text-white">
            <Camera className="w-5 h-5 text-emerald-400" />
            <span className="font-bold text-sm">Escanear código</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-white/60 text-sm text-center">
            Acércate al código de barras para que ocupe la mayor parte del encuadre.
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handlePhotoCapture}
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={photoLoading}
            className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            {photoLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Procesando...
              </>
            ) : (
              <>
                <ImagePlus className="w-5 h-5" /> Abrir cámara
              </>
            )}
          </button>

          {photoError && (
            <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <p className="text-red-300 text-xs font-semibold">{photoError}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
