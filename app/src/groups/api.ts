import { supabase } from '../lib/supabase'
import { findProfileByUsername } from '../share/api'
import type { Group, GroupMember, GroupInvite } from '../types'

export async function listMyGroups(): Promise<Group[]> {
  const { data, error } = await supabase.from('groups').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function createGroup(name: string, ownerId: string): Promise<Group> {
  const { data: group, error } = await supabase
    .from('groups')
    .insert({ name, owner_id: ownerId })
    .select()
    .single()
  if (error) throw error

  const { error: memberError } = await supabase
    .from('group_members')
    .insert({ group_id: group.id, user_id: ownerId, role: 'owner' })
  if (memberError) throw memberError

  return group
}

export async function deleteGroup(groupId: string) {
  const { error } = await supabase.from('groups').delete().eq('id', groupId)
  if (error) throw error
}

export async function listGroupMembers(groupId: string): Promise<GroupMember[]> {
  const { data, error } = await supabase
    .from('group_members')
    .select('*')
    .eq('group_id', groupId)
    .order('joined_at', { ascending: true })
  if (error) throw error

  const ids = data.map((m) => m.user_id)
  if (ids.length === 0) return []
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id, username')
    .in('id', ids)
  if (profileError) throw profileError
  const usernames = new Map(profiles.map((p) => [p.id, p.username]))

  return data.map((m) => ({ ...m, username: usernames.get(m.user_id) ?? '?' }))
}

export async function addGroupMember(groupId: string, username: string) {
  const profile = await findProfileByUsername(username)
  if (!profile) throw new Error(`Nessun utente con username "${username}"`)
  const { error } = await supabase.from('group_members').insert({ group_id: groupId, user_id: profile.id })
  if (error) throw error
}

export async function removeGroupMember(groupId: string, userId: string) {
  const { error } = await supabase.from('group_members').delete().eq('group_id', groupId).eq('user_id', userId)
  if (error) throw error
}

export async function createGroupInvite(
  groupId: string,
  createdBy: string,
  expiresInHours?: number,
): Promise<GroupInvite> {
  const expires_at = expiresInHours
    ? new Date(Date.now() + expiresInHours * 3_600_000).toISOString()
    : null
  const { data, error } = await supabase
    .from('group_invites')
    .insert({ group_id: groupId, created_by: createdBy, expires_at })
    .select()
    .single()
  if (error) throw error
  return data as GroupInvite
}

export async function redeemGroupInvite(token: string) {
  const { data, error } = await supabase.rpc('redeem_group_invite', { p_token: token })
  if (error) throw error
  return data as { joined_group_id: string }[]
}

export async function listGroupInvites(groupId: string): Promise<GroupInvite[]> {
  const { data, error } = await supabase
    .from('group_invites')
    .select('*')
    .eq('group_id', groupId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function deleteGroupInvite(inviteId: string) {
  const { error } = await supabase.from('group_invites').delete().eq('id', inviteId)
  if (error) throw error
}
