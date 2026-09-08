import { supabase } from '../lib/supabase'
import type { CardShare, ShareInvite, CardUsageLogEntry, SharePermission } from '../types'

async function usernamesByIds(ids: string[]): Promise<Map<string, string>> {
  if (ids.length === 0) return new Map()
  const { data, error } = await supabase.from('profiles').select('id, username').in('id', ids)
  if (error) throw error
  return new Map(data.map((p) => [p.id, p.username]))
}

async function groupNamesByIds(ids: string[]): Promise<Map<string, string>> {
  if (ids.length === 0) return new Map()
  const { data, error } = await supabase.from('groups').select('id, name').in('id', ids)
  if (error) throw error
  return new Map(data.map((g) => [g.id, g.name]))
}

export async function findProfileByUsername(username: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username')
    .eq('username', username.trim().toLowerCase())
    .maybeSingle()
  if (error) throw error
  return data
}

export async function listCardShares(cardId: string): Promise<CardShare[]> {
  const { data, error } = await supabase
    .from('card_shares')
    .select('*')
    .eq('card_id', cardId)
    .order('created_at', { ascending: false })
  if (error) throw error

  const userIds = data.filter((s) => s.shared_with_user).map((s) => s.shared_with_user as string)
  const groupIds = data.filter((s) => s.shared_with_group).map((s) => s.shared_with_group as string)
  const [usernames, groupNames] = await Promise.all([usernamesByIds(userIds), groupNamesByIds(groupIds)])

  return data.map((s) => ({
    ...s,
    shared_with_username: s.shared_with_user ? usernames.get(s.shared_with_user) ?? null : null,
    shared_with_group_name: s.shared_with_group ? groupNames.get(s.shared_with_group) ?? null : null,
  }))
}

export async function shareCardWithUser(
  cardId: string,
  sharedBy: string,
  username: string,
  permission: SharePermission,
) {
  const profile = await findProfileByUsername(username)
  if (!profile) throw new Error(`Nessun utente con username "${username}"`)
  const { error } = await supabase
    .from('card_shares')
    .insert({ card_id: cardId, shared_by: sharedBy, shared_with_user: profile.id, permission })
  if (error) throw error
}

export async function shareCardWithGroup(
  cardId: string,
  sharedBy: string,
  groupId: string,
  permission: SharePermission,
) {
  const { error } = await supabase
    .from('card_shares')
    .insert({ card_id: cardId, shared_by: sharedBy, shared_with_group: groupId, permission })
  if (error) throw error
}

export async function revokeShare(shareId: string) {
  const { error } = await supabase.from('card_shares').delete().eq('id', shareId)
  if (error) throw error
}

export async function createInvite(cardId: string, createdBy: string, permission: SharePermission, expiresInHours?: number) {
  const expires_at = expiresInHours
    ? new Date(Date.now() + expiresInHours * 3_600_000).toISOString()
    : null
  const { data, error } = await supabase
    .from('share_invites')
    .insert({ card_id: cardId, created_by: createdBy, permission, expires_at })
    .select()
    .single()
  if (error) throw error
  return data as ShareInvite
}

export async function redeemInvite(token: string) {
  const { data, error } = await supabase.rpc('redeem_card_invite', { p_token: token })
  if (error) throw error
  return data as { redeemed_card_id: string }[]
}

export async function listUsageLog(cardId: string): Promise<CardUsageLogEntry[]> {
  const { data, error } = await supabase
    .from('card_usage_log')
    .select('*')
    .eq('card_id', cardId)
    .order('used_at', { ascending: false })
    .limit(50)
  if (error) throw error

  const usernames = await usernamesByIds(data.map((e) => e.used_by))
  return data.map((e) => ({ ...e, used_by_username: usernames.get(e.used_by) }))
}
