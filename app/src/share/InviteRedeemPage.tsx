import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { CheckCircle2, XCircle } from 'lucide-react'
import { useAuth } from '../auth/useAuth'
import { useRedeemInvite } from './useShares'
import { Spinner } from '../components/Spinner'
import { Button } from '../components/Button'

export default function InviteRedeemPage() {
  const { token } = useParams<{ token: string }>()
  const { session, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const redeemInvite = useRedeemInvite()
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (authLoading || !token) return
    if (!session) {
      navigate('/login', { replace: true, state: { redirectTo: `/invite/${token}` } })
      return
    }
    if (redeemInvite.status !== 'idle') return

    redeemInvite
      .mutateAsync(token)
      .then(() => setStatus('success'))
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
          <p className="text-lg font-medium text-slate-900">Carta aggiunta!</p>
          <p className="text-sm text-slate-500">La carta condivisa è ora disponibile tra le tue carte.</p>
        </>
      ) : (
        <>
          <XCircle size={40} className="text-red-500" />
          <p className="text-lg font-medium text-slate-900">Invito non valido</p>
          <p className="text-sm text-slate-500">{message}</p>
        </>
      )}
      <Button onClick={() => navigate('/cards')}>Vai alle mie carte</Button>
    </div>
  )
}
