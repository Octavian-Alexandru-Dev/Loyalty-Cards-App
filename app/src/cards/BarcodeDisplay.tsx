import { useEffect, useRef } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import JsBarcode from 'jsbarcode'
import type { CodeFormat } from '../types'

const JSBARCODE_FORMAT: Partial<Record<CodeFormat, string>> = {
  CODE_128: 'CODE128',
  CODE_39: 'CODE39',
  EAN_13: 'EAN13',
  EAN_8: 'EAN8',
  ITF: 'ITF',
  CODABAR: 'codabar',
  UPC_A: 'UPC',
  UPC_E: 'UPCE',
}

/**
 * Rigenera a schermo, lato client, il codice a partire dal solo valore
 * decodificato salvato nel database (mai un'immagine). QR e i formati 1D
 * più comuni sono renderizzati nel loro formato originale; per i formati 2D
 * meno diffusi (Aztec, Data Matrix, PDF417) — non supportati dalle librerie
 * di generazione usate in questo progetto — mostriamo un QR di fallback
 * che codifica lo stesso valore testuale, dichiarandolo esplicitamente.
 */
export function BarcodeDisplay({ value, format }: { value: string; format: CodeFormat }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const jsBarcodeFormat = JSBARCODE_FORMAT[format]

  useEffect(() => {
    if (jsBarcodeFormat && canvasRef.current) {
      try {
        JsBarcode(canvasRef.current, value, {
          format: jsBarcodeFormat,
          width: 2,
          height: 90,
          displayValue: true,
          margin: 8,
        })
      } catch {
        // Valore non valido per il formato selezionato: nessun crash, il
        // canvas resta vuoto e il valore testuale sotto resta comunque leggibile.
      }
    }
  }, [value, jsBarcodeFormat])

  if (format === 'QR_CODE') {
    return (
      <div className="flex justify-center rounded-2xl bg-white p-6">
        <QRCodeSVG value={value} size={220} level="M" />
      </div>
    )
  }

  if (jsBarcodeFormat) {
    return (
      <div className="flex justify-center overflow-x-auto rounded-2xl bg-white p-4">
        <canvas ref={canvasRef} />
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl bg-white p-6">
      <QRCodeSVG value={value} size={180} level="M" />
      <p className="text-center text-xs text-slate-400">
        Formato {format} non renderizzabile nativamente: QR di fallback con lo stesso valore.
      </p>
    </div>
  )
}
