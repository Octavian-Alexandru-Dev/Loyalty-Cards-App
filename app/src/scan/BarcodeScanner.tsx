import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader } from '@zxing/browser'
import { BarcodeFormat, NotFoundException, type Result } from '@zxing/library'
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

interface BarcodeScannerProps {
  /** Se false, la fotocamera resta accesa ma la decodifica è sospesa (usato mentre l'utente conferma un risultato). */
  active: boolean
  onDetected: (value: string, format: CodeFormat) => void
}

export function BarcodeScanner({ active, onDetected }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [error, setError] = useState<string | null>(null)
  const onDetectedRef = useRef(onDetected)
  useLayoutEffect(() => {
    onDetectedRef.current = onDetected
  })

  useEffect(() => {
    const reader = new BrowserMultiFormatReader()
    let controls: { stop: () => void } | undefined
    let cancelled = false

    reader
      .decodeFromConstraints(
        { video: { facingMode: 'environment' } },
        videoRef.current!,
        (result, err) => {
          if (cancelled) return
          if (result) {
            onDetectedRef.current(result.getText(), resultToCodeFormat(result))
          } else if (err && !(err instanceof NotFoundException)) {
            // NotFoundException è normale: significa "nessun codice in questo frame".
            setError(err.message)
          }
        },
      )
      .then((c) => {
        if (cancelled) c.stop()
        else controls = c
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? `Impossibile accedere alla fotocamera: ${err.message}`
              : 'Impossibile accedere alla fotocamera.',
          )
        }
      })

    return () => {
      cancelled = true
      controls?.stop()
    }
  }, [])

  return (
    <div className="relative overflow-hidden rounded-2xl bg-black">
      <video ref={videoRef} className="aspect-[3/4] w-full object-cover" muted playsInline />
      {!active && <div className="absolute inset-0 bg-black/60" />}
      <div className="pointer-events-none absolute inset-8 rounded-2xl border-2 border-white/70" />
      {error && (
        <div className="absolute inset-x-4 bottom-4 rounded-xl bg-red-600/90 p-3 text-center text-sm text-white">
          {error}
        </div>
      )}
    </div>
  )
}
