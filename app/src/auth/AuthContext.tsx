import { useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Profile } from '../types'
import { AuthContext } from './context'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })

    return () => sub.subscription.unsubscribe()
  }, [])

  // Sincronizza il profilo con la sessione Supabase (sistema esterno): non è
  // stato derivabile da altro stato del componente durante il render.
  useEffect(() => {
    if (!session) {
      setProfile(null)
      return
    }
    let cancelled = false
    fetchProfile(session.user.id).then((data) => {
      if (!cancelled) setProfile(data)
    })
    return () => {
      cancelled = true
    }
  }, [session])

  async function fetchProfile(userId: string): Promise<Profile | null> {
    const { data } = await supabase.from('profiles').select('id, username, created_at').eq('id', userId).single()
    return data
  }

  async function refreshProfile() {
    if (!session) return
    setProfile(await fetchProfile(session.user.id))
  }

  async function signUp(email: string, password: string, username: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    })
    if (error) throw error
    // Con "Confirm email" disattivato, Supabase restituisce subito una
    // sessione attiva e non invia nessuna email di conferma.
    return { requiresEmailConfirmation: data.session === null }
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  async function signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    if (error) throw error
    // Nessun return: signInWithOAuth reindirizza il browser al provider,
    // la sessione viene stabilita al ritorno (vedi detectSessionInUrl).
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider
      value={{ session, profile, loading, signUp, signIn, signInWithGoogle, signOut, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  )
}
