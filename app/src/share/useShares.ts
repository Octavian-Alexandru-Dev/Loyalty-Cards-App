import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from './api'
import type { SharePermission } from '../types'
import { useAuth } from '../auth/useAuth'

export function useCardShares(cardId: string) {
  return useQuery({
    queryKey: ['card-shares', cardId],
    queryFn: () => api.listCardShares(cardId),
    enabled: !!cardId,
  })
}

export function useUsageLog(cardId: string) {
  return useQuery({
    queryKey: ['card-usage-log', cardId],
    queryFn: () => api.listUsageLog(cardId),
    enabled: !!cardId,
  })
}

export function useShareWithUser(cardId: string) {
  const { session } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ username, permission }: { username: string; permission: SharePermission }) => {
      if (!session) throw new Error('Non autenticato')
      return api.shareCardWithUser(cardId, session.user.id, username, permission)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['card-shares', cardId] }),
  })
}

export function useShareWithGroup(cardId: string) {
  const { session } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ groupId, permission }: { groupId: string; permission: SharePermission }) => {
      if (!session) throw new Error('Non autenticato')
      return api.shareCardWithGroup(cardId, session.user.id, groupId, permission)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['card-shares', cardId] }),
  })
}

export function useRevokeShare(cardId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (shareId: string) => api.revokeShare(shareId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['card-shares', cardId] }),
  })
}

export function useCreateInvite(cardId: string) {
  const { session } = useAuth()
  return useMutation({
    mutationFn: ({ permission, expiresInHours }: { permission: SharePermission; expiresInHours?: number }) => {
      if (!session) throw new Error('Non autenticato')
      return api.createInvite(cardId, session.user.id, permission, expiresInHours)
    },
  })
}

export function useRedeemInvite() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (token: string) => api.redeemInvite(token),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cards'] }),
  })
}
