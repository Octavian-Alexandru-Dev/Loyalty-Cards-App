import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Users } from 'lucide-react'
import { useMyGroups, useCreateGroup } from './useGroups'
import { EmptyState } from '../components/EmptyState'
import { Spinner } from '../components/Spinner'
import { Button } from '../components/Button'
import { TextField } from '../components/TextField'

export default function GroupsPage() {
  const { data: groups, isLoading } = useMyGroups()
  const createGroup = useCreateGroup()
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    await createGroup.mutateAsync(name.trim())
    setName('')
    setCreating(false)
  }

  return (
    <div className="mx-auto max-w-lg px-4 pt-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-900">Gruppi</h1>
        <Button variant="secondary" className="!px-3" onClick={() => setCreating((v) => !v)}>
          <Plus size={18} />
        </Button>
      </div>

      {creating && (
        <form onSubmit={handleCreate} className="mb-4 flex items-end gap-2 rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex-1">
            <TextField label="Nome gruppo" placeholder="Famiglia Rossi" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <Button type="submit" disabled={createGroup.isPending}>
            Crea
          </Button>
        </form>
      )}

      {isLoading && (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      )}

      {!isLoading && groups?.length === 0 && (
        <EmptyState
          icon={Users}
          title="Nessun gruppo ancora"
          description="Crea un gruppo per condividere automaticamente le carte con famiglia o coinquilini."
        />
      )}

      <div className="flex flex-col gap-2">
        {groups?.map((group) => (
          <Link
            key={group.id}
            to={`/groups/${group.id}`}
            className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm hover:border-slate-300"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <Users size={20} />
            </div>
            <p className="font-medium text-slate-900">{group.name}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
