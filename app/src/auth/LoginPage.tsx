import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CreditCard } from 'lucide-react'
import { useAuth } from './useAuth'
import { TextField } from '../components/TextField'
import { Button } from '../components/Button'

export default function LoginPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await signIn(email, password)
      navigate('/cards', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Accesso non riuscito')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-white">
            <CreditCard size={24} />
          </div>
          <h1 className="text-xl font-semibold text-slate-900">Carte Fedeltà</h1>
          <p className="text-sm text-slate-500">Accedi al tuo account</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" fullWidth disabled={loading}>
            {loading ? 'Accesso in corso…' : 'Accedi'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Non hai un account?{' '}
          <Link to="/signup" className="font-medium text-brand-600 hover:underline">
            Registrati
          </Link>
        </p>
      </div>
    </div>
  )
}
