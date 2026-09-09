import { useEffect, useRef, useState } from 'react'
import { BrowserCodeReader, BrowserMultiFormatReader } from '@zxing/browser'
import { BarcodeFormat, ChecksumException, FormatException, type Result } from '@zxing/library'
import { Camera, Check } from 'lucide-react'
import type { CodeFormat } from '../types'

const KNOWN_FORMATS = new Set<string>([
  'QR_CODE',
  'EAN_13',
  'EAN_8',
  'CODE_128',
  'CODE_39',
  'ITF',
  'CODABAR',
  'UPC_A',
  'UPC_E',
  'PDF_417',
  'AZTEC',
  'DATA_MATRIX',
])

function resultToCodeFormat(result: Result): CodeFormat {
  const name = BarcodeFormat[result.getBarcodeFormat()]
  return KNOWN_FORMATS.has(name) ? (name as CodeFormat) : 'UNKNOWN'
}

type CaptureState = 'idle' | 'processing' | 'success' | 'not-found' | 'unreadable' | 'low-light'

const CAPTURE_MESSAGES: Partial<Record<CaptureState, string>> = {
  'not-found': 'Nessun codice individuato: avvicinati e inquadra bene il codice.',
  unreadable: 'Codice individuato ma non leggibile: tieni fermo il telefono e mettilo a fuoco.',
  'low-light': 'Poca luce: illumina meglio il codice.',
}

const LOW_LIGHT_THRESHOLD = 55 // luminanza media 0-255 di un fotogramma "buio"

/**
 * Stima la luminosità media del fotogramma corrente campionando un canvas
 * ridotto (non serve leggere ogni pixel a piena risoluzione): utile per
 * distinguere "troppo buio per leggere qualsiasi codice" da "nessun codice
 * nell'inquadratura", cosa che ZXing da solo non segnala.
 */
function estimateBrightness(video: HTMLVideoElement): number | null {
  const probe = document.createElement('canvas')
  probe.width = 32
  probe.height = 24
  const ctx = probe.getContext('2d', { willReadFrequently: true })
  if (!ctx) return null
  ctx.drawImage(video, 0, 0, probe.width, probe.height)
  const { data } = ctx.getImageData(0, 0, probe.width, probe.height)
  let total = 0
  for (let i = 0; i < data.length; i += 4) {
    total += 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]
  }
  return total / (data.length / 4)
}

interface BarcodeScannerProps {
  /** Se false, la fotocamera resta accesa ma il pulsante di scatto è nascosto (usato mentre l'utente conferma un risultato). */
  active: boolean
  onDetected: (value: string, format: CodeFormat) => void
}

/**
 * Mostra l'anteprima della fotocamera e decodifica un solo fotogramma alla
 * volta, su richiesta esplicita dell'utente (pulsante di scatto), invece di
 * analizzare continuamente lo stream in background: così ogni tentativo ha
 * un esito visibile (successo/nessun codice trovato) invece di richiedere
 * di "tenere ferma la carta" senza nessun riscontro a schermo.
 */
export function BarcodeScanner({ active, onDetected }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [reader] = useState(() => new BrowserMultiFormatReader())
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [captureState, setCaptureState] = useState<CaptureState>('idle')

  useEffect(() => {
    let cancelled = false
    let stream: MediaStream | null = null

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment' } })
      .then((s) => {
        if (cancelled) {
          s.getTracks().forEach((t) => t.stop())
          return
        }
        stream = s
        if (videoRef.current) {
          videoRef.current.srcObject = s
          void videoRef.current.play()
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setCameraError(
            err instanceof Error
              ? `Impossibile accedere alla fotocamera: ${err.message}`
              : 'Impossibile accedere alla fotocamera.',
          )
        }
      })

    return () => {
      cancelled = true
      stream?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  function handleCapture() {
    if (!videoRef.current || captureState === 'processing' || captureState === 'success') return
    setCaptureState('processing')

    const brightness = estimateBrightness(videoRef.current)
    if (brightness !== null && brightness < LOW_LIGHT_THRESHOLD) {
      setCaptureState('low-light')
      window.setTimeout(() => setCaptureState('idle'), 1800)
      return
    }

    try {
      const canvas = BrowserCodeReader.createCanvasFromMediaElement(videoRef.current)
      const result = reader.decodeFromCanvas(canvas)
      setCaptureState('success')
      navigator.vibrate?.(80)
      window.setTimeout(() => {
        onDetected(result.getText(), resultToCodeFormat(result))
      }, 250)
    } catch (err) {
      // ZXing distingue "nessun pattern trovato" da "pattern trovato ma
      // checksum/formato non validi": quest'ultimo caso è quasi sempre
      // sfocatura, angolazione o distanza sbagliate, non assenza di codice,
      // quindi merita un messaggio diverso e più utile.
      const unreadable = err instanceof ChecksumException || err instanceof FormatException
      setCaptureState(unreadable ? 'unreadable' : 'not-found')
      window.setTimeout(() => setCaptureState('idle'), 1800)
    }
  }

  const frameColor =
    captureState === 'success'
      ? 'border-emerald-400'
      : captureState === 'not-found'
        ? 'border-red-400'
        : captureState === 'unreadable' || captureState === 'low-light'
          ? 'border-amber-400'
          : 'border-white/70'

  return (
    <div className="relative overflow-hidden rounded-2xl bg-black">
      <video ref={videoRef} className="aspect-[3/4] w-full object-cover" muted playsInline />
      {!active && <div className="absolute inset-0 bg-black/60" />}
      <div className={`pointer-events-none absolute inset-8 rounded-2xl border-2 transition-colors ${frameColor}`} />

      {active && !cameraError && (
        <div className="absolute inset-x-0 bottom-4 flex flex-col items-center gap-2">
          {CAPTURE_MESSAGES[captureState] && (
            <p
              className={`mx-4 rounded-xl px-3 py-1.5 text-center text-xs font-medium text-white ${
                captureState === 'not-found' ? 'bg-red-600/90' : 'bg-amber-600/90'
              }`}
            >
              {CAPTURE_MESSAGES[captureState]}
            </p>
          )}
          <button
            type="button"
            onClick={handleCapture}
            disabled={captureState === 'processing' || captureState === 'success'}
            aria-label="Scatta e rileva il codice"
            className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-white bg-white/20 text-white backdrop-blur-sm transition disabled:opacity-70"
          >
            {captureState === 'processing' ? (
              <span className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : captureState === 'success' ? (
              <Check size={28} />
            ) : (
              <Camera size={28} />
            )}
          </button>
        </div>
      )}

      {cameraError && (
        <div className="absolute inset-x-4 bottom-4 rounded-xl bg-red-600/90 p-3 text-center text-sm text-white">
          {cameraError}
        </div>
      )}
    </div>
  )
}
