import { useEffect, useState } from 'react'
import { X, RotateCw } from 'lucide-react'
import { BarcodeDisplay } from './BarcodeDisplay'
import type { CodeFormat } from '../types'

interface CardCodeViewerProps {
  value: string
  format: CodeFormat
  onClose: () => void
}

/**
 * Mostra il codice a schermo intero, ingrandito e su sfondo bianco, per
 * facilitarne la lettura dallo scanner alla cassa. La rotazione a 90° serve
 * per i lettori a barre orizzontali (banco cassa), dove il codice va
 * presentato in orizzontale anche se il telefono resta in verticale.
 */
export function CardCodeViewer({ value, format, onClose }: CardCodeViewerProps) {
  const [rotated, setRotated] = useState(false)

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white">
      <button
        type="button"
        onClick={onClose}
        aria-label="Chiudi"
        className="absolute right-4 top-4 rounded-full p-2 text-slate-500 hover:bg-slate-100"
      >
        <X size={24} />
      </button>

      <button
        type="button"
        onClick={() => setRotated((r) => !r)}
        aria-label="Ruota il codice"
        aria-pressed={rotated}
        className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
      >
        <RotateCw size={18} />
        Ruota
      </button>

      <div
        className="flex items-center justify-center transition-transform duration-300"
        style={{
          transform: rotated ? 'rotate(90deg)' : undefined,
          width: rotated ? 'min(85vh, 92vw)' : 'min(92vw, 380px)',
        }}
      >
        <BarcodeDisplay value={value} format={format} size="large" />
      </div>
    </div>
  )
}
