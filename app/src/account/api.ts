import { supabase } from '../lib/supabase'

export async function updateUsername(userId: string, username: string) {
  const { error } = await supabase.from('profiles').update({ username }).eq('id', userId)
  if (error) throw error
}

export async function updateEmail(email: string) {
  const { error } = await supabase.auth.updateUser({ email })
  if (error) throw error
}

export async function updatePassword(password: string) {
  const { error } = await supabase.auth.updateUser({ password })
  if (error) throw error
}

export async function deleteOwnAccount() {
  const { error } = await supabase.rpc('delete_own_account')
  if (error) throw error
}
