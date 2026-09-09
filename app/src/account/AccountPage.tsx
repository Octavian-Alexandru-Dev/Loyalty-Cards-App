import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, HelpCircle, Trash2 } from 'lucide-react'
import { useAuth } from '../auth/useAuth'
import { useUpdateUsername, useUpdateEmail, useUpdatePassword, useDeleteAccount } from './useAccount'
import { Button } from '../components/Button'
import { TextField } from '../components/TextField'

const USERNAME_PATTERN = /^[a-z0-9_]{3,24}$/

export default function AccountPage() {
  const navigate = useNavigate()
  const { session, profile } = useAuth()

  return (
    <div className="mx-auto max-w-lg px-4 pt-4 pb-8">
      <div className="mb-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="rounded-lg p-1.5 hover:bg-slate-100" aria-label="Indietro">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-semibold text-slate-900">Account</h1>
      </div>

      <button
        onClick={() => navigate('/guide')}
        className="mb-4 flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left hover:bg-slate-50"
      >
        <HelpCircle size={20} className="text-brand-600" />
        <div>
          <p className="text-sm font-medium text-slate-900">Installa l'app sulla schermata Home</p>
          <p className="text-xs text-slate-500">Guida per iPhone e Android</p>
        </div>
      </button>

      <UsernameSection currentUsername={profile?.username ?? ''} />
      <EmailSection currentEmail={session?.user.email ?? ''} />
      <PasswordSection />
      <DangerZone username={profile?.username ?? ''} />
    </div>
  )
}

function UsernameSection({ currentUsername }: { currentUsername: string }) {
  const updateUsername = useUpdateUsername()
  const [username, setUsername] = useState(currentUsername)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSaved(false)
    if (!USERNAME_PATTERN.test(username)) {
      setError('Lo username deve avere 3-24 caratteri: lettere minuscole, numeri o underscore.')
      return
    }
    try {
      await updateUsername.mutateAsync(username)
      setSaved(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossibile aggiornare lo username')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mb-4 rounded-2xl border border-slate-200 bg-white p-4">
      <p className="mb-3 text-sm font-medium text-slate-900">Nome utente</p>
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <TextField
            label="Username"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value.toLowerCase())
              setSaved(false)
            }}
          />
        </div>
        <Button type="submit" disabled={updateUsername.isPending || username === currentUsername}>
          Salva
        </Button>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      {saved && <p className="mt-2 text-sm text-emerald-600">Username aggiornato.</p>}
    </form>
  )
}

function EmailSection({ currentEmail }: { currentEmail: string }) {
  const updateEmail = useUpdateEmail()
  const [email, setEmail] = useState(currentEmail)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSent(false)
    try {
      await updateEmail.mutateAsync(email)
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossibile aggiornare l’email')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mb-4 rounded-2xl border border-slate-200 bg-white p-4">
      <p className="mb-3 text-sm font-medium text-slate-900">Email</p>
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              setSent(false)
            }}
          />
        </div>
        <Button type="submit" disabled={updateEmail.isPending || email === currentEmail || !email}>
          Salva
        </Button>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      {sent && (
        <p className="mt-2 text-sm text-emerald-600">
          Controlla la nuova casella email: dovrai confermare il cambio prima che diventi effettivo.
        </p>
      )}
    </form>
  )
}

function PasswordSection() {
  const updatePassword = useUpdatePassword()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSaved(false)
    if (password.length < 8) {
      setError('La password deve avere almeno 8 caratteri.')
      return
    }
    if (password !== confirm) {
      setError('Le due password non coincidono.')
      return
    }
    try {
      await updatePassword.mutateAsync(password)
      setPassword('')
      setConfirm('')
      setSaved(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossibile aggiornare la password')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mb-4 rounded-2xl border border-slate-200 bg-white p-4">
      <p className="mb-3 text-sm font-medium text-slate-900">Password</p>
      <div className="flex flex-col gap-3">
        <TextField
          label="Nuova password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <TextField
          label="Conferma password"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
        <Button type="submit" disabled={updatePassword.isPending || !password}>
          Aggiorna password
        </Button>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      {saved && <p className="mt-2 text-sm text-emerald-600">Password aggiornata.</p>}
    </form>
  )
}

function DangerZone({ username }: { username: string }) {
  const navigate = useNavigate()
  const deleteAccount = useDeleteAccount()
  const [confirmText, setConfirmText] = useState('')
  const [error, setError] = useState<string | null>(null)

  const canDelete = username !== '' && confirmText === username

  async function handleDelete() {
    if (!canDelete) return
    if (
      !confirm(
        'Questa azione è irreversibile: verranno eliminati account, carte, condivisioni e gruppi di cui sei proprietario. Continuare?',
      )
    ) {
      return
    }
    setError(null)
    try {
      await deleteAccount.mutateAsync()
      navigate('/login', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossibile eliminare l’account')
    }
  }

  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
      <p className="mb-1 text-sm font-medium text-red-800">Elimina account</p>
      <p className="mb-3 text-xs text-red-700">
        Elimina definitivamente il tuo account e tutti i dati associati (carte, gruppi di cui sei
        proprietario, condivisioni). L'azione non è reversibile.
      </p>
      <TextField
        label={`Digita "${username}" per confermare`}
        value={confirmText}
        onChange={(e) => setConfirmText(e.target.value)}
      />
      <Button
        variant="danger"
        fullWidth
        className="mt-3"
        onClick={handleDelete}
        disabled={!canDelete || deleteAccount.isPending}
      >
        <Trash2 size={16} />
        Elimina account
      </Button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  )
}
