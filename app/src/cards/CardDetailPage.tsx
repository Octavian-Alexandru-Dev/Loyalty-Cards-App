import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Pencil, Share2, Trash2, X, QrCode, History } from 'lucide-react'
import { useCards, useDeleteCard } from './useCards'
import { logCardUsage } from './api'
import { BarcodeDisplay } from './BarcodeDisplay'
import { useAuth } from '../auth/useAuth'
import { Button } from '../components/Button'
import { TextField } from '../components/TextField'
import { Spinner } from '../components/Spinner'
import {
  useCardShares,
  useUsageLog,
  useShareWithUser,
  useShareWithGroup,
  useRevokeShare,
  useCreateInvite,
} from '../share/useShares'
import { useMyGroups } from '../groups/useGroups'
import type { SharePermission } from '../types'

export default function CardDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { session } = useAuth()
  const { data: cards, isLoading } = useCards()
  const deleteCard = useDeleteCard()
  const [shareOpen, setShareOpen] = useState(false)

  const card = useMemo(() => cards?.find((c) => c.id === id), [cards, id])
  const isOwner = card?.access === 'owner'
  const canReshare = card?.access === 'owner' || card?.access === 'reshare'

  useEffect(() => {
    if (card && !isOwner && session) {
      void logCardUsage(card.id, session.user.id)
    }
  }, [card, isOwner, session])

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    )
  }

  if (!card) {
    return (
      <div className="mx-auto max-w-lg px-4 pt-8 text-center text-slate-500">
        <p>Carta non trovata.</p>
        <Button className="mt-4" onClick={() => navigate('/cards')}>
          Torna alle carte
        </Button>
      </div>
    )
  }

  async function handleDelete() {
    if (!id) return
    if (!confirm("Eliminare questa carta? L'azione non è reversibile.")) return
    await deleteCard.mutateAsync(id)
    navigate('/cards', { replace: true })
  }

  return (
    <div className="mx-auto max-w-lg px-4 pt-4 pb-8">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="rounded-lg p-1.5 hover:bg-slate-100" aria-label="Indietro">
            <ArrowLeft size={20} />
          </button>
          <h1 className="truncate text-lg font-semibold text-slate-900">{card.label}</h1>
        </div>
        {isOwner && (
          <button
            onClick={() => navigate(`/cards/${card.id}/edit`)}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            aria-label="Modifica"
          >
            <Pencil size={18} />
          </button>
        )}
      </div>

      <BarcodeDisplay value={card.code_value} format={card.code_format} />

      {card.category && (
        <p className="mt-3 text-center text-sm capitalize text-slate-500">{card.category}</p>
      )}

      <div className="mt-6 flex gap-2">
        {canReshare && (
          <Button variant="secondary" fullWidth onClick={() => setShareOpen((v) => !v)}>
            <Share2 size={16} />
            Condividi
          </Button>
        )}
        {isOwner && (
          <Button variant="danger" onClick={handleDelete}>
            <Trash2 size={16} />
          </Button>
        )}
      </div>

      {shareOpen && <ShareSection cardId={card.id} onClose={() => setShareOpen(false)} />}

      {isOwner && <UsageLogSection cardId={card.id} />}
    </div>
  )
}

function ShareSection({ cardId, onClose }: { cardId: string; onClose: () => void }) {
  const { data: shares } = useCardShares(cardId)
  const { data: groups } = useMyGroups()
  const shareWithUser = useShareWithUser(cardId)
  const shareWithGroup = useShareWithGroup(cardId)
  const revokeShare = useRevokeShare(cardId)
  const createInvite = useCreateInvite(cardId)

  const [username, setUsername] = useState('')
  const [permission, setPermission] = useState<SharePermission>('view')
  const [groupId, setGroupId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)

  async function handleShareUser(e: FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      await shareWithUser.mutateAsync({ username: username.trim(), permission })
      setUsername('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Condivisione non riuscita')
    }
  }

  async function handleShareGroup(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (!groupId) return
    try {
      await shareWithGroup.mutateAsync({ groupId, permission })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Condivisione non riuscita')
    }
  }

  async function handleCreateInvite() {
    setError(null)
    try {
      const invite = await createInvite.mutateAsync({ permission, expiresInHours: 72 })
      setInviteUrl(`${window.location.origin}/invite/${invite.token}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossibile creare invito')
    }
  }

  return (
    <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="font-medium text-slate-900">Condividi carta</p>
        <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100" aria-label="Chiudi">
          <X size={16} />
        </button>
      </div>

      <div className="mb-3 flex gap-2">
        {(['view', 'reshare'] as SharePermission[]).map((p) => (
          <button
            key={p}
            onClick={() => setPermission(p)}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              permission === p ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {p === 'view' ? 'Sola visualizzazione' : 'Può ri-condividere'}
          </button>
        ))}
      </div>

      <form onSubmit={handleShareUser} className="mb-2 flex items-end gap-2">
        <div className="flex-1">
          <TextField
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase())}
          />
        </div>
        <Button type="submit" disabled={shareWithUser.isPending}>
          Invia
        </Button>
      </form>

      {groups && groups.length > 0 && (
        <form onSubmit={handleShareGroup} className="mb-2 flex items-end gap-2">
          <div className="flex-1">
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Oppure un gruppo</label>
            <select
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-base focus:border-brand-500 focus:outline-none"
            >
              <option value="">Seleziona gruppo…</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>
          <Button type="submit" variant="secondary" disabled={!groupId || shareWithGroup.isPending}>
            Invia
          </Button>
        </form>
      )}

      <Button variant="ghost" fullWidth onClick={handleCreateInvite} disabled={createInvite.isPending}>
        <QrCode size={16} />
        Genera invito QR (valido 72h)
      </Button>

      {inviteUrl && (
        <p className="mt-2 break-all rounded-xl bg-slate-50 p-3 text-xs text-slate-600">{inviteUrl}</p>
      )}

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      {shares && shares.length > 0 && (
        <div className="mt-4 flex flex-col gap-2 border-t border-slate-100 pt-3">
          {shares.map((s) => (
            <div key={s.id} className="flex items-center justify-between text-sm">
              <span className="text-slate-700">
                {s.shared_with_username ? `@${s.shared_with_username}` : s.shared_with_group_name}{' '}
                <span className="text-xs text-slate-400">({s.permission})</span>
              </span>
              <button
                onClick={() => revokeShare.mutate(s.id)}
                className="text-xs font-medium text-red-600 hover:underline"
              >
                Revoca
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function UsageLogSection({ cardId }: { cardId: string }) {
  const { data: log } = useUsageLog(cardId)
  if (!log || log.length === 0) return null

  return (
    <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
      <div className="mb-2 flex items-center gap-2 text-slate-700">
        <History size={16} />
        <p className="font-medium">Utilizzi recenti</p>
      </div>
      <div className="flex flex-col gap-1.5">
        {log.map((entry) => (
          <div key={entry.id} className="flex justify-between text-sm text-slate-600">
            <span>@{entry.used_by_username ?? '—'}</span>
            <span className="text-slate-400">{new Date(entry.used_at).toLocaleString('it-IT')}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
