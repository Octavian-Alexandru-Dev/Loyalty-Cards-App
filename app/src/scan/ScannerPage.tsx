import { useEffect, useRef, useState, type FormEvent } from 'react'
import clsx from 'clsx'
import { Check, X, ScanLine } from 'lucide-react'
import { BarcodeScanner } from './BarcodeScanner'
import { useCreateCard } from '../cards/useCards'
import { Button } from '../components/Button'
import { TextField } from '../components/TextField'
import { BRAND_PRESETS, guessCategory, type BrandPreset } from '../lib/brands'
import { CARD_COLORS, CARD_ICONS, type CodeFormat } from '../types'

interface Detection {
  value: string
  format: CodeFormat
}

export default function ScannerPage() {
  const createCard = useCreateCard()
  const [detection, setDetection] = useState<Detection | null>(null)
  const [cardName, setCardName] = useState('')
  const [selectedPreset, setSelectedPreset] = useState<BrandPreset | null>(null)
  const [savedCount, setSavedCount] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const nameInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (detection) nameInputRef.current?.focus()
  }, [detection])

  function handleDetected(value: string, format: CodeFormat) {
    setDetection((current) => current ?? { value, format })
  }

  function handlePickPreset(preset: BrandPreset) {
    setSelectedPreset(preset)
    setCardName(preset.name)
  }

  function reset() {
    setDetection(null)
    setCardName('')
    setSelectedPreset(null)
    setError(null)
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault()
    if (!detection) return
    const label = cardName.trim()
    if (!label) {
      setError('Inserisci un nome per la carta.')
      return
    }
    setError(null)
    const category = selectedPreset?.category ?? guessCategory(detection.format, detection.value)
    try {
      await createCard.mutateAsync({
        label,
        brand_key: selectedPreset?.key ?? null,
        code_value: detection.value,
        code_format: detection.format,
        color: selectedPreset?.color ?? CARD_COLORS[0],
        icon: selectedPreset?.icon ?? CARD_ICONS[0],
        category: category ?? null,
      })
      setSavedCount((n) => n + 1)
      reset()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Salvataggio non riuscito')
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 pt-4 pb-8">
      <div className="mb-4 flex items-center gap-2">
        <ScanLine size={20} className="text-brand-600" />
        <h1 className="text-lg font-semibold text-slate-900">Scansiona una carta</h1>
      </div>

      <BarcodeScanner active={!detection} onDetected={handleDetected} />

      <p className="mt-3 text-center text-sm text-slate-500">
        Inquadra il codice della carta nel riquadro e tocca il pulsante per scattare.
      </p>

      {savedCount > 0 && (
        <p className="mt-2 text-center text-sm font-medium text-emerald-600">
          {savedCount} carta{savedCount > 1 ? 'e' : ''} salvata{savedCount > 1 ? 'e' : ''} in questa sessione.
        </p>
      )}

      {detection && (
        <div className="fixed inset-x-0 bottom-20 z-20 mx-auto max-w-lg px-4">
          <form onSubmit={handleSave} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-lg">
            <p className="mb-3 text-sm font-medium text-emerald-600">✓ Codice rilevato</p>

            <p className="mb-2 text-xs font-medium text-slate-500">Catena nota? (opzionale)</p>
            <div className="mb-3 flex flex-wrap gap-2">
              {BRAND_PRESETS.slice(0, 6).map((preset) => (
                <button
                  key={preset.key}
                  type="button"
                  onClick={() => handlePickPreset(preset)}
                  className={clsx(
                    'rounded-full border px-3 py-1 text-xs font-medium',
                    selectedPreset?.key === preset.key
                      ? 'border-brand-500 bg-brand-50 text-brand-700'
                      : 'border-slate-200 text-slate-700 hover:border-slate-300',
                  )}
                >
                  {preset.name}
                </button>
              ))}
            </div>

            <TextField
              ref={nameInputRef}
              label="Nome carta"
              placeholder="Es. Esselunga Fidaty"
              value={cardName}
              onChange={(e) => setCardName(e.target.value)}
            />

            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

            <div className="mt-3 flex gap-2">
              <Button type="button" variant="secondary" onClick={reset} aria-label="Ignora">
                <X size={16} />
              </Button>
              <Button type="submit" fullWidth disabled={createCard.isPending || !cardName.trim()}>
                <Check size={16} />
                Salva carta
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
