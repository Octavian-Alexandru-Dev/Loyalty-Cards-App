import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { CheckCircle2, XCircle } from 'lucide-react'
import { useAuth } from '../auth/useAuth'
import { useRedeemGroupInvite } from './useGroups'
import { Spinner } from '../components/Spinner'
import { Button } from '../components/Button'

export default function GroupInviteRedeemPage() {
  const { token } = useParams<{ token: string }>()
  const { session, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const redeemInvite = useRedeemGroupInvite()
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [groupId, setGroupId] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading || !token) return
    if (!session) {
      navigate('/login', { replace: true, state: { redirectTo: `/groups/join/${token}` } })
      return
    }
    if (redeemInvite.status !== 'idle') return

    redeemInvite
      .mutateAsync(token)
      .then(([row]) => {
        setGroupId(row?.joined_group_id ?? null)
        setStatus('success')
      })
      .catch((err) => {
        setStatus('error')
        setMessage(err instanceof Error ? err.message : 'Invito non valido')
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, session, token])

  if (authLoading || redeemInvite.status === 'pending' || status === 'idle') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3">
        <Spinner />
        <p className="text-sm text-slate-500">Verifica dell'invito in corso…</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      {status === 'success' ? (
        <>
          <CheckCircle2 size={40} className="text-emerald-500" />
          <p className="text-lg font-medium text-slate-900">Sei entrato nel gruppo!</p>
          <p className="text-sm text-slate-500">Ora vedi le carte condivise con questo gruppo.</p>
        </>
      ) : (
        <>
          <XCircle size={40} className="text-red-500" />
          <p className="text-lg font-medium text-slate-900">Invito non valido</p>
          <p className="text-sm text-slate-500">{message}</p>
        </>
      )}
      <Button onClick={() => navigate(groupId ? `/groups/${groupId}` : '/groups')}>
        {groupId ? 'Vai al gruppo' : 'Vai ai miei gruppi'}
      </Button>
    </div>
  )
}
