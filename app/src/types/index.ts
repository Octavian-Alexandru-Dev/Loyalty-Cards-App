export type CodeFormat =
  | 'QR_CODE'
  | 'EAN_13'
  | 'EAN_8'
  | 'CODE_128'
  | 'CODE_39'
  | 'ITF'
  | 'CODABAR'
  | 'UPC_A'
  | 'UPC_E'
  | 'PDF_417'
  | 'AZTEC'
  | 'DATA_MATRIX'
  | 'UNKNOWN'

export type SharePermission = 'view' | 'reshare'

export interface Profile {
  id: string
  username: string
  created_at: string
}

export interface Card {
  id: string
  owner_id: string
  label: string
  brand_key: string | null
  code_value: string
  code_format: CodeFormat
  color: string
  icon: string
  category: string | null
  created_at: string
  updated_at: string
}

/** Carta arricchita con l'informazione di accesso rispetto all'utente corrente. */
export interface AccessibleCard extends Card {
  access: 'owner' | 'view' | 'reshare'
  /** Presente solo se la carta è condivisa (non è dell'utente corrente). */
  shared_by_username?: string
  /** true se l'utente corrente ha nascosto questa carta condivisa dalla propria lista. */
  is_hidden: boolean
}

export interface Group {
  id: string
  name: string
  owner_id: string
  created_at: string
}

export interface GroupMember {
  group_id: string
  user_id: string
  role: 'owner' | 'member'
  joined_at: string
  username: string
}

export interface CardShare {
  id: string
  card_id: string
  shared_by: string
  shared_with_user: string | null
  shared_with_group: string | null
  permission: SharePermission
  created_at: string
  shared_with_username?: string | null
  shared_with_group_name?: string | null
}

export interface GroupInvite {
  id: string
  group_id: string
  created_by: string
  token: string
  expires_at: string | null
  created_at: string
}

export interface ShareInvite {
  id: string
  card_id: string
  created_by: string
  permission: SharePermission
  token: string
  expires_at: string | null
  redeemed_by: string | null
  created_at: string
}

export interface CardUsageLogEntry {
  id: string
  card_id: string
  used_by: string
  used_at: string
  used_by_username?: string
}

export const CARD_CATEGORIES = [
  'supermercato',
  'farmacia',
  'palestra',
  'ristorazione',
  'abbigliamento',
  'carburante',
  'altro',
] as const

export type CardCategory = (typeof CARD_CATEGORIES)[number]

export const CARD_ICONS = [
  'card',
  'shopping-cart',
  'pill',
  'dumbbell',
  'utensils',
  'shirt',
  'fuel',
  'star',
  'gift',
  'heart',
] as const

export type CardIcon = (typeof CARD_ICONS)[number]

export const CARD_COLORS = [
  '#2563eb', // blue
  '#16a34a', // green
  '#dc2626', // red
  '#d97706', // amber
  '#9333ea', // purple
  '#0891b2', // cyan
  '#db2777', // pink
  '#475569', // slate
] as const
