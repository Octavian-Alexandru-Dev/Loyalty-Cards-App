import { createContext } from 'react'
import type { Session } from '@supabase/supabase-js'
import type { Profile } from '../types'

export interface AuthState {
  session: Session | null
  profile: Profile | null
  loading: boolean
  signUp: (
    email: string,
    password: string,
    username: string,
  ) => Promise<{ requiresEmailConfirmation: boolean }>
  signIn: (email: string, password: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

export const AuthContext = createContext<AuthState | null>(null)
