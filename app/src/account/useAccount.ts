import { useMutation } from '@tanstack/react-query'
import * as api from './api'
import { useAuth } from '../auth/useAuth'

export function useUpdateUsername() {
  const { session, refreshProfile } = useAuth()
  return useMutation({
    mutationFn: (username: string) => {
      if (!session) throw new Error('Non autenticato')
      return api.updateUsername(session.user.id, username)
    },
    onSuccess: () => refreshProfile(),
  })
}

export function useUpdateEmail() {
  return useMutation({
    mutationFn: (email: string) => api.updateEmail(email),
  })
}

export function useUpdatePassword() {
  return useMutation({
    mutationFn: (password: string) => api.updatePassword(password),
  })
}

export function useDeleteAccount() {
  const { signOut } = useAuth()
  return useMutation({
    mutationFn: () => api.deleteOwnAccount(),
    onSuccess: () => signOut(),
  })
}
