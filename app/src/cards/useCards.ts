import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from './api'
import { replaceCachedCards, getCachedCards } from '../lib/db'
import { useAuth } from '../auth/useAuth'

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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CARDS_KEY }),
  })
}

export function useUpdateCard() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: api.CardUpdateInput }) => api.updateCard(id, patch),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CARDS_KEY }),
  })
}

export function useDeleteCard() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.deleteCard(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CARDS_KEY }),
  })
}
