import { useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, UserPlus, X, Trash2 } from 'lucide-react'
import { useMyGroups, useGroupMembers, useAddGroupMember, useRemoveGroupMember, useDeleteGroup } from './useGroups'
import { useAuth } from '../auth/useAuth'
import { Button } from '../components/Button'
import { TextField } from '../components/TextField'
import { Spinner } from '../components/Spinner'

export default function GroupDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { session } = useAuth()
  const { data: groups } = useMyGroups()
  const { data: members, isLoading } = useGroupMembers(id!)
  const addMember = useAddGroupMember(id!)
  const removeMember = useRemoveGroupMember(id!)
  const deleteGroup = useDeleteGroup()

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
