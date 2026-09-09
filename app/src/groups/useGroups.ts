import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from './api'
import { useAuth } from '../auth/useAuth'

export function useMyGroups() {
  return useQuery({ queryKey: ['groups'], queryFn: api.listMyGroups })
}

export function useGroupMembers(groupId: string) {
  return useQuery({
    queryKey: ['group-members', groupId],
    queryFn: () => api.listGroupMembers(groupId),
    enabled: !!groupId,
  })
}

export function useCreateGroup() {
  const { session } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (name: string) => {
      if (!session) throw new Error('Non autenticato')
      return api.createGroup(name, session.user.id)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['groups'] }),
  })
}

export function useDeleteGroup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (groupId: string) => api.deleteGroup(groupId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['groups'] }),
  })
}

export function useAddGroupMember(groupId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (username: string) => api.addGroupMember(groupId, username),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['group-members', groupId] }),
  })
}

export function useRemoveGroupMember(groupId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (userId: string) => api.removeGroupMember(groupId, userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['group-members', groupId] }),
  })
}

export function useCreateGroupInvite(groupId: string) {
  const { session } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (expiresInHours?: number) => {
      if (!session) throw new Error('Non autenticato')
      return api.createGroupInvite(groupId, session.user.id, expiresInHours)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['group-invites', groupId] }),
  })
}

export function useGroupInvites(groupId: string) {
  return useQuery({
    queryKey: ['group-invites', groupId],
    queryFn: () => api.listGroupInvites(groupId),
    enabled: !!groupId,
  })
}

export function useDeleteGroupInvite(groupId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (inviteId: string) => api.deleteGroupInvite(inviteId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['group-invites', groupId] }),
  })
}

export function useRedeemGroupInvite() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (token: string) => api.redeemGroupInvite(token),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['groups'] }),
  })
}
