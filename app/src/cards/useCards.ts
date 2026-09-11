import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from './api'
import { replaceCachedCards, getCachedCards } from '../lib/db'
import { useAuth } from '../auth/useAuth'
import type { AccessibleCard } from '../types'

const CARDS_KEY = ['cards'] as const

export function useCards() {
  const query = useQuery({
    queryKey: CARDS_KEY,
    queryFn: async () => {
      try {
        const cards = await api.fetchAccessibleCards()
        void replaceCachedCards(cards)
        return cards
      } catch (err) {
        // Offline o Supabase irraggiungibile: usa lo specchio locale.
        const cached = await getCachedCards()
        if (cached.length > 0) return cached
        throw err
      }
    },
  })

  return query
}

export function useCreateCard() {
  const { session } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: api.NewCardInput) => {
      if (!session) throw new Error('Non autenticato')
      return api.createCard(session.user.id, input)
    },
    // Scrive subito la carta appena creata nella cache, invece di limitarsi
    // a invalidare la query e aspettare il refetch: chi chiama questa
    // mutation naviga tipicamente alla vista di dettaglio della carta
    // appena creata subito dopo, e senza questo la carta non risulta
    // ancora nella cache in quel momento (mostra "Carta non trovata" finché
    // il refetch in background non completa).
    onSuccess: (created) => {
      queryClient.setQueryData<AccessibleCard[]>(CARDS_KEY, (current) => [
        { ...created, access: 'owner' },
        ...(current ?? []).filter((c) => c.id !== created.id),
      ])
      void queryClient.invalidateQueries({ queryKey: CARDS_KEY })
    },
  })
}

export function useUpdateCard() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: api.CardUpdateInput }) => api.updateCard(id, patch),
    onSuccess: (updated) => {
      queryClient.setQueryData<AccessibleCard[]>(CARDS_KEY, (current) =>
        current?.map((c) => (c.id === updated.id ? { ...c, ...updated } : c)),
      )
      void queryClient.invalidateQueries({ queryKey: CARDS_KEY })
    },
  })
}

export function useDeleteCard() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.deleteCard(id),
    onSuccess: (_data, id) => {
      queryClient.setQueryData<AccessibleCard[]>(CARDS_KEY, (current) => current?.filter((c) => c.id !== id))
      void queryClient.invalidateQueries({ queryKey: CARDS_KEY })
    },
  })
}

function setCardHidden(queryClient: ReturnType<typeof useQueryClient>, cardId: string, hidden: boolean) {
  queryClient.setQueryData<AccessibleCard[]>(CARDS_KEY, (current) =>
    current?.map((c) => (c.id === cardId ? { ...c, is_hidden: hidden } : c)),
  )
}

export function useHideCard() {
  const { session } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (cardId: string) => {
      if (!session) throw new Error('Non autenticato')
      return api.hideCard(session.user.id, cardId)
    },
    onSuccess: (_data, cardId) => setCardHidden(queryClient, cardId, true),
  })
}

export function useUnhideCard() {
  const { session } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (cardId: string) => {
      if (!session) throw new Error('Non autenticato')
      return api.unhideCard(session.user.id, cardId)
    },
    onSuccess: (_data, cardId) => setCardHidden(queryClient, cardId, false),
  })
}
