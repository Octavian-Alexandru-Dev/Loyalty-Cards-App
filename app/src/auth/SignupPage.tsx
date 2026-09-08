import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CreditCard } from 'lucide-react'
import { useAuth } from './useAuth'
import { TextField } from '../components/TextField'
import { Button } from '../components/Button'

const USERNAME_PATTERN = /^[a-z0-9_]{3,24}$/

export default function SignupPage() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (!USERNAME_PATTERN.test(username)) {
      setError('Lo username deve avere 3-24 caratteri: lettere minuscole, numeri o underscore.')
      return
    }
    if (password.length < 8) {
      setError('La password deve avere almeno 8 caratteri.')
      return
    }

    setLoading(true)
    try {
      await signUp(email, password, username)
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registrazione non riuscita')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 text-center">
        <p className="text-lg font-medium text-slate-900">Controlla la tua email</p>
        <p className="mt-2 max-w-sm text-sm text-slate-500">
          Abbiamo inviato un link di conferma a {email}. Confermalo e poi torna qui per accedere.
        </p>
        <Button className="mt-6" onClick={() => navigate('/login')}>
          Vai al login
        </Button>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-white">
            <CreditCard size={24} />
          </div>
          <h1 className="text-xl font-semibold text-slate-900">Crea il tuo account</h1>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <TextField
            label="Username"
            placeholder="mario_rossi"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase())}
          />
          <TextField
            label="Email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            label="Password"
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" fullWidth disabled={loading}>
            {loading ? 'Creazione account…' : 'Registrati'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Hai già un account?{' '}
          <Link to="/login" className="font-medium text-brand-600 hover:underline">
            Accedi
          </Link>
        </p>
      </div>
    </div>
  )
}
