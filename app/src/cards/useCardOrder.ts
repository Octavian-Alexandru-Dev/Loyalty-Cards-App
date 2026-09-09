import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../auth/useAuth'
import type { AccessibleCard } from '../types'

function storageKey(userId: string) {
  return `loyalty-cards:order:${userId}`
}

function readOrder(userId: string): string[] {
  try {
    const raw = localStorage.getItem(storageKey(userId))
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

function writeOrder(userId: string, order: string[]) {
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(order))
  } catch {
    // Storage non disponibile: l'ordine trascinato resta valido solo per questa sessione.
  }
}

/**
 * Ordine personalizzato delle carte (drag & drop), memorizzato solo su
 * questo dispositivo. È deliberatamente una preferenza locale e non un
 * campo scritto su "cards": quella tabella ha un solo proprietario per riga
 * ma può essere letta anche da chi riceve una condivisione, e per loro
 * l'ordine di visualizzazione è una scelta personale, non qualcosa che il
 * proprietario della carta dovrebbe poter cambiare nella loro vista (né a
 * cui avrebbero permessi di scrittura, dato che solo l'owner può modificare
 * la riga "cards").
 */
export function useCardOrder(cards: AccessibleCard[] | undefined) {
  const { session } = useAuth()
  const userId = session?.user.id
  const [order, setOrder] = useState<string[]>([])

  useEffect(() => {
    setOrder(userId ? readOrder(userId) : [])
  }, [userId])

  const orderedCards = useMemo(() => {
    if (!cards) return []
    const byId = new Map(cards.map((c) => [c.id, c]))
    const known = order.filter((id) => byId.has(id)).map((id) => byId.get(id)!)
    const rest = cards.filter((c) => !order.includes(c.id))
    return [...known, ...rest]
  }, [cards, order])

  const reorder = useCallback(
    (activeId: string, overId: string) => {
      if (!userId || activeId === overId) return
      setOrder((current) => {
        const base = current.length > 0 ? current : orderedCards.map((c) => c.id)
        const from = base.indexOf(activeId)
        const to = base.indexOf(overId)
        if (from === -1 || to === -1) return current
        const next = [...base]
        next.splice(from, 1)
        next.splice(to, 0, activeId)
        writeOrder(userId, next)
        return next
      })
    },
    [userId, orderedCards],
  )

  return { orderedCards, reorder }
}
