import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { useCards, useCreateCard, useUpdateCard, useDeleteCard } from './useCards'
import { TextField } from '../components/TextField'
import { Button } from '../components/Button'
import { IconGlyph } from '../components/IconGlyph'
import { BRAND_PRESETS, guessFormatFromValue } from '../lib/brands'
import { CARD_CATEGORIES, CARD_COLORS, CARD_ICONS, type CodeFormat } from '../types'

export default function CardFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id
  const navigate = useNavigate()
  const { data: cards } = useCards()
  const createCard = useCreateCard()
  const updateCard = useUpdateCard()
  const deleteCard = useDeleteCard()

  const existing = useMemo(() => cards?.find((c) => c.id === id), [cards, id])
  // Il formato è noto solo quando si modifica una carta esistente: in
  // inserimento (sempre manuale: la scansione salva direttamente dal
  // banner in ScannerPage) viene indovinato dal valore digitato, senza
  // chiedere all'utente di scegliere un formato tecnico.
  const formatIsAuto = !isEdit

  const [label, setLabel] = useState('')
  const [codeValue, setCodeValue] = useState('')
  const [codeFormat, setCodeFormat] = useState<CodeFormat>('QR_CODE')
  const [color, setColor] = useState<string>(CARD_COLORS[0])
  const [icon, setIcon] = useState<string>(CARD_ICONS[0])
  const [category, setCategory] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  // Precompila il form quando arriva la carta da modificare (fetch React
  // Query asincrono).
  useEffect(() => {
    if (isEdit && existing) {
      setLabel(existing.label)
      setCodeValue(existing.code_value)
      setCodeFormat(existing.code_format)
      setColor(existing.color)
      setIcon(existing.icon)
      setCategory(existing.category ?? '')
    }
  }, [isEdit, existing])

  useEffect(() => {
    if (!formatIsAuto) return
    setCodeFormat(guessFormatFromValue(codeValue))
  }, [formatIsAuto, codeValue])

  function applyPreset(presetKey: string) {
    const preset = BRAND_PRESETS.find((p) => p.key === presetKey)
    if (!preset) return
    setLabel(preset.name)
    setColor(preset.color)
    setIcon(preset.icon)
    setCategory(preset.category)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (!label.trim()) {
      setError('Inserisci un nome per la carta.')
      return
    }
    if (!codeValue.trim()) {
      setError('Inserisci il valore del codice (o scansionalo).')
      return
    }

    const payload = {
      label: label.trim(),
      brand_key: null,
      code_value: codeValue.trim(),
      code_format: codeFormat,
      color,
      icon,
      category: category || null,
    }

    try {
      if (isEdit && id) {
        await updateCard.mutateAsync({ id, patch: payload })
        navigate(`/cards/${id}`, { replace: true })
      } else {
        const created = await createCard.mutateAsync(payload)
        navigate(`/cards/${created.id}`, { replace: true })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Salvataggio non riuscito')
    }
  }

  async function handleDelete() {
    if (!id) return
    if (!confirm('Eliminare questa carta? L\'azione non è reversibile.')) return
    await deleteCard.mutateAsync(id)
    navigate('/cards', { replace: true })
  }

  const saving = createCard.isPending || updateCard.isPending

  return (
    <div className="mx-auto max-w-lg px-4 pt-4 pb-8">
      <div className="mb-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="rounded-lg p-1.5 hover:bg-slate-100" aria-label="Indietro">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-semibold text-slate-900">
          {isEdit ? 'Modifica carta' : 'Nuova carta'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {!isEdit && (
          <div>
            <p className="mb-2 text-sm font-medium text-slate-700">Catena nota (opzionale)</p>
            <div className="flex flex-wrap gap-2">
              {BRAND_PRESETS.map((preset) => (
                <button
                  key={preset.key}
                  type="button"
                  onClick={() => applyPreset(preset.key)}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-slate-300"
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <TextField label="Nome carta" required value={label} onChange={(e) => setLabel(e.target.value)} />

        <div>
          <TextField
            label="Codice"
            required
            value={codeValue}
            onChange={(e) => setCodeValue(e.target.value)}
          />
          {formatIsAuto && (
            <p className="mt-1.5 text-xs text-slate-400">
              Il numero stampato sotto il codice a barre della carta.
            </p>
          )}
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-slate-700">Colore</p>
          <div className="flex flex-wrap gap-2">
            {CARD_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                aria-label={`Colore ${c}`}
                className="h-9 w-9 rounded-full ring-offset-2"
                style={{ backgroundColor: c, boxShadow: color === c ? `0 0 0 2px white, 0 0 0 4px ${c}` : undefined }}
              />
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-slate-700">Icona</p>
          <div className="grid grid-cols-5 gap-2">
            {CARD_ICONS.map((ic) => (
              <button
                key={ic}
                type="button"
                onClick={() => setIcon(ic)}
                className={`flex h-11 items-center justify-center rounded-xl border ${
                  icon === ic ? 'border-brand-500 bg-brand-50 text-brand-600' : 'border-slate-200 text-slate-500'
                }`}
              >
                <IconGlyph icon={ic} />
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700" htmlFor="category">
            Categoria
          </label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-2.5 text-base capitalize focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          >
            <option value="">Nessuna categoria</option>
            {CARD_CATEGORIES.map((cat) => (
              <option key={cat} value={cat} className="capitalize">
                {cat}
              </option>
            ))}
          </select>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button type="submit" fullWidth disabled={saving}>
          {saving ? 'Salvataggio…' : isEdit ? 'Salva modifiche' : 'Aggiungi carta'}
        </Button>

        {isEdit && (
          <Button type="button" variant="danger" fullWidth onClick={handleDelete}>
            <Trash2 size={16} />
            Elimina carta
          </Button>
        )}
      </form>
    </div>
  )
}
