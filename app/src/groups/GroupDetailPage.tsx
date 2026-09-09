import { useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, UserPlus, X, Trash2, Link2, Copy, Check } from 'lucide-react'
import {
  useMyGroups,
  useGroupMembers,
  useAddGroupMember,
  useRemoveGroupMember,
  useDeleteGroup,
  useCreateGroupInvite,
  useGroupInvites,
  useDeleteGroupInvite,
} from './useGroups'
import { useAuth } from '../auth/useAuth'
import { Button } from '../components/Button'
import { TextField } from '../components/TextField'
import { Spinner } from '../components/Spinner'
import type { GroupInvite } from '../types'

export default function GroupDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { session } = useAuth()
  const { data: groups } = useMyGroups()
  const { data: members, isLoading } = useGroupMembers(id!)
  const addMember = useAddGroupMember(id!)
  const removeMember = useRemoveGroupMember(id!)
  const deleteGroup = useDeleteGroup()
  const createInvite = useCreateGroupInvite(id!)

  const [username, setUsername] = useState('')
  const [error, setError] = useState<string | null>(null)

  const group = groups?.find((g) => g.id === id)
  const isOwner = !!session && group?.owner_id === session.user.id

  async function handleAdd(e: FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      await addMember.mutateAsync(username.trim())
      setUsername('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossibile aggiungere il membro')
    }
  }

  async function handleDeleteGroup() {
    if (!id) return
    if (!confirm('Eliminare il gruppo? Le carte condivise con il gruppo non saranno più visibili ai membri.')) return
    await deleteGroup.mutateAsync(id)
    navigate('/groups', { replace: true })
  }

  async function handleGenerateInvite() {
    setError(null)
    try {
      await createInvite.mutateAsync(undefined)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossibile creare il link di invito')
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 pt-4 pb-8">
      <div className="mb-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="rounded-lg p-1.5 hover:bg-slate-100" aria-label="Indietro">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-semibold text-slate-900">{group?.name ?? 'Gruppo'}</h1>
      </div>

      <form onSubmit={handleAdd} className="mb-4 flex items-end gap-2">
        <div className="flex-1">
          <TextField
            label="Aggiungi membro (username)"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase())}
          />
        </div>
        <Button type="submit" disabled={addMember.isPending}>
          <UserPlus size={16} />
        </Button>
      </form>
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {isOwner && (
        <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-4">
          <p className="mb-2 text-sm font-medium text-slate-700">Invita con un link</p>
          <p className="mb-3 text-xs text-slate-500">
            Chiunque apra un link qui sotto, da autenticato, entra automaticamente nel gruppo: non
            serve conoscerne lo username. Un link resta valido finché non lo revochi.
          </p>

          <InviteList groupId={id!} />

          <Button
            type="button"
            variant="secondary"
            fullWidth
            className="mt-3"
            onClick={handleGenerateInvite}
            disabled={createInvite.isPending}
          >
            <Link2 size={16} />
            Genera nuovo link
          </Button>
        </div>
      )}

      {isLoading && (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      )}

      <div className="flex flex-col gap-2">
        {members?.map((member) => (
          <div key={member.user_id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-3.5">
            <div>
              <p className="font-medium text-slate-900">@{member.username}</p>
              <p className="text-xs uppercase tracking-wide text-slate-400">{member.role}</p>
            </div>
            {member.role !== 'owner' && (
              <button
                onClick={() => removeMember.mutate(member.user_id)}
                className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                aria-label="Rimuovi membro"
              >
                <X size={16} />
              </button>
            )}
          </div>
        ))}
      </div>

      {isOwner && (
        <Button variant="danger" fullWidth className="mt-8" onClick={handleDeleteGroup}>
          <Trash2 size={16} />
          Elimina gruppo
        </Button>
      )}
    </div>
  )
}

function InviteList({ groupId }: { groupId: string }) {
  const { data: invites, isLoading } = useGroupInvites(groupId)
  const deleteInvite = useDeleteGroupInvite(groupId)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  async function handleCopy(invite: GroupInvite) {
    const url = `${window.location.origin}/groups/join/${invite.token}`
    try {
      await navigator.clipboard.writeText(url)
      setCopiedId(invite.id)
    } catch {
      // clipboard non disponibile (es. contesto non sicuro): l'utente può
      // comunque selezionare e copiare manualmente il link dalla riga.
    }
  }

  function handleRevoke(invite: GroupInvite) {
    if (!confirm('Revocare questo link? Chi lo ha già non potrà più usarlo per entrare nel gruppo.')) return
    deleteInvite.mutate(invite.id)
  }

  if (isLoading) return null
  if (!invites || invites.length === 0) {
    return <p className="text-xs text-slate-400">Nessun link attivo al momento.</p>
  }

  return (
    <div className="flex flex-col gap-2">
      {invites.map((invite) => {
        const expired = !!invite.expires_at && new Date(invite.expires_at) < new Date()
        return (
          <div key={invite.id} className="flex items-center gap-2 rounded-xl bg-slate-50 p-2.5">
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs text-slate-600">
                {window.location.origin}/groups/join/{invite.token}
              </p>
              <p className={`text-[11px] ${expired ? 'text-red-500' : 'text-slate-400'}`}>
                {expired
                  ? 'Scaduto'
                  : invite.expires_at
                    ? `Scade il ${new Date(invite.expires_at).toLocaleDateString('it-IT')}`
                    : 'Non scade'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleCopy(invite)}
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-200"
              aria-label="Copia link"
            >
              {copiedId === invite.id ? <Check size={16} /> : <Copy size={16} />}
            </button>
            <button
              type="button"
              onClick={() => handleRevoke(invite)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
              aria-label="Revoca link"
            >
              <X size={16} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
