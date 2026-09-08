import Dexie, { type Table } from 'dexie'
import type { AccessibleCard } from '../types'

/**
 * Specchio locale (IndexedDB) delle carte dell'utente, per lettura offline
 * istantanea. È una cache, non la fonte di verità: viene riscritta ad ogni
 * fetch riuscito verso Supabase.
 */
class LoyaltyCardsDB extends Dexie {
  cards!: Table<AccessibleCard, string>

  constructor() {
    super('loyalty-cards-app')
    this.version(1).stores({
      cards: 'id, owner_id, category, label',
    })
  }
}

export const db = new LoyaltyCardsDB()

export async function replaceCachedCards(cards: AccessibleCard[]) {
  await db.transaction('rw', db.cards, async () => {
    await db.cards.clear()
    await db.cards.bulkPut(cards)
  })
}

export async function getCachedCards(): Promise<AccessibleCard[]> {
  return db.cards.toArray()
}
