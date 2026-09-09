import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Pencil, ScanLine } from 'lucide-react'
import { BarcodeScanner } from './BarcodeScanner'
import { useCreateCard } from '../cards/useCards'
import { Button } from '../components/Button'
import { BRAND_PRESETS, guessCategory } from '../lib/brands'
import type { CodeFormat } from '../types'

interface Detection {
  value: string
  format: CodeFormat
}

export default function ScannerPage() {
  const navigate = useNavigate()
  const createCard = useCreateCard()
  const [detection, setDetection] = useState<Detection | null>(null)
  const [savedCount, setSavedCount] = useState(0)
  const [error, setError] = useState<string | null>(null)

  function handleDetected(value: string, format: CodeFormat) {
    setDetection((current) => current ?? { value, format })
  }

  // Il nome della carta è sempre scelto esplicitamente dall'utente: qui si
  // salva subito solo quando corrisponde a una catena nota (il nome non è
  // ambiguo), altrimenti si passa dalla schermata "Assegna nome e salva".
  async function handleQuickSave(presetKey: string) {
    if (!detection) return
    setError(null)
    const preset = BRAND_PRESETS.find((p) => p.key === presetKey)
    if (!preset) return
    const category = preset.category ?? guessCategory(detection.format, detection.value)
    try {
      await createCard.mutateAsync({
        label: preset.name,
        brand_key: preset.key,
        code_value: detection.value,
        code_format: detection.format,
        color: preset.color,
        icon: preset.icon,
        category: category ?? null,
      })
      setSavedCount((n) => n + 1)
      setDetection(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Salvataggio non riuscito')
    }
  }

  function handleEditDetails() {
    if (!detection) return
    navigate('/cards/new', { state: { scan: detection } })
  }

  function handleDiscard() {
    setDetection(null)
  }

  return (
    <div className="mx-auto max-w-lg px-4 pt-4 pb-8">
      <div className="mb-4 flex items-center gap-2">
        <ScanLine size={20} className="text-brand-600" />
        <h1 className="text-lg font-semibold text-slate-900">Scansiona una carta</h1>
      </div>

      <BarcodeScanner active={!detection} onDetected={handleDetected} />

      <p className="mt-3 text-center text-sm text-slate-500">
        Inquadra il codice della carta nel riquadro e tocca il pulsante per scattare. Puoi
        scansionarne più di una di seguito: dopo aver salvato, la fotocamera resta attiva.
      </p>

      {savedCount > 0 && (
        <p className="mt-2 text-center text-sm font-medium text-emerald-600">
          {savedCount} carta{savedCount > 1 ? 'e' : ''} salvata{savedCount > 1 ? 'e' : ''} in questa sessione.
        </p>
      )}

      {detection && (
        <div className="fixed inset-x-0 bottom-20 z-20 mx-auto max-w-lg px-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-lg">
            <p className="mb-3 truncate text-sm font-medium text-emerald-600">✓ Codice rilevato</p>

            <p className="mb-2 text-xs font-medium text-slate-500">È una di queste catene? Salva subito:</p>
            <div className="mb-3 flex flex-wrap gap-2">
              {BRAND_PRESETS.slice(0, 6).map((preset) => (
                <button
                  key={preset.key}
                  onClick={() => handleQuickSave(preset.key)}
                  disabled={createCard.isPending}
                  className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-700 hover:border-slate-300 disabled:opacity-60"
                >
                  {preset.name}
                </button>
              ))}
            </div>

            {error && <p className="mb-2 text-sm text-red-600">{error}</p>}

            <div className="flex gap-2">
              <Button variant="secondary" onClick={handleDiscard} aria-label="Ignora">
                <X size={16} />
              </Button>
              <Button fullWidth onClick={handleEditDetails}>
                <Pencil size={16} />
                Assegna nome e salva
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
