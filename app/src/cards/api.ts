import { supabase } from '../lib/supabase'
import type { AccessibleCard, CodeFormat } from '../types'

export interface NewCardInput {
  label: string
  brand_key: string | null
  code_value: string
  code_format: CodeFormat
  color: string
  icon: string
  category: string | null
}

export type CardUpdateInput = Partial<NewCardInput>

export async function fetchAccessibleCards(): Promise<AccessibleCard[]> {
  const { data, error } = await supabase
    .from('accessible_cards')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as AccessibleCard[]
}

export async function createCard(ownerId: string, input: NewCardInput) {
  const { data, error } = await supabase
    .from('cards')
    .insert({ ...input, owner_id: ownerId })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateCard(id: string, patch: CardUpdateInput) {
  const { data, error } = await supabase.from('cards').update(patch).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteCard(id: string) {
  const { error } = await supabase.from('cards').delete().eq('id', id)
  if (error) throw error
}

export async function logCardUsage(cardId: string, userId: string) {
  // Best-effort: se fallisce (es. offline) non blocca la visualizzazione della carta.
  await supabase.from('card_usage_log').insert({ card_id: cardId, used_by: userId }).select().maybeSingle()
}

export async function hideCard(userId: string, cardId: string) {
  const { error } = await supabase.from('hidden_cards').insert({ user_id: userId, card_id: cardId })
  if (error) throw error
}

export async function unhideCard(userId: string, cardId: string) {
  const { error } = await supabase
    .from('hidden_cards')
    .delete()
    .eq('user_id', userId)
    .eq('card_id', cardId)
  if (error) throw error
}
