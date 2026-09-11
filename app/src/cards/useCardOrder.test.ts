import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useCardOrder } from './useCardOrder'
import type { AccessibleCard } from '../types'

vi.mock('../auth/useAuth', () => ({
  useAuth: () => ({ session: { user: { id: 'user-1' } } }),
}))

function makeCard(id: string): AccessibleCard {
  return {
    id,
    owner_id: 'user-1',
    label: id,
    brand_key: null,
    code_value: '123',
    code_format: 'EAN_13',
    color: '#2563eb',
    icon: 'card',
    category: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    access: 'owner',
    is_hidden: false,
  }
}

describe('useCardOrder', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('mantiene l\'ordine originale finché non viene riordinato', () => {
    const cards = [makeCard('a'), makeCard('b'), makeCard('c')]
    const { result } = renderHook(() => useCardOrder(cards))
    expect(result.current.orderedCards.map((c) => c.id)).toEqual(['a', 'b', 'c'])
  })

  it('applica il riordino e lo mantiene tra i render', () => {
    const cards = [makeCard('a'), makeCard('b'), makeCard('c')]
    const { result, rerender } = renderHook(({ cards }) => useCardOrder(cards), {
      initialProps: { cards },
    })

    act(() => result.current.reorder('c', 'a'))
    expect(result.current.orderedCards.map((c) => c.id)).toEqual(['c', 'a', 'b'])

    rerender({ cards })
    expect(result.current.orderedCards.map((c) => c.id)).toEqual(['c', 'a', 'b'])
  })

  it('mette in fondo le carte nuove non ancora presenti nell\'ordine salvato', () => {
    const cards = [makeCard('a'), makeCard('b')]
    const { result, rerender } = renderHook(({ cards }) => useCardOrder(cards), {
      initialProps: { cards },
    })

    act(() => result.current.reorder('b', 'a'))
    expect(result.current.orderedCards.map((c) => c.id)).toEqual(['b', 'a'])

    const withNewCard = [...cards, makeCard('c')]
    rerender({ cards: withNewCard })
    expect(result.current.orderedCards.map((c) => c.id)).toEqual(['b', 'a', 'c'])
  })

  it('ignora dall\'ordine salvato le carte non più presenti (es. eliminate)', () => {
    const cards = [makeCard('a'), makeCard('b'), makeCard('c')]
    const { result, rerender } = renderHook(({ cards }) => useCardOrder(cards), {
      initialProps: { cards },
    })

    act(() => result.current.reorder('c', 'a'))
    expect(result.current.orderedCards.map((c) => c.id)).toEqual(['c', 'a', 'b'])

    rerender({ cards: [makeCard('a'), makeCard('b')] })
    expect(result.current.orderedCards.map((c) => c.id)).toEqual(['a', 'b'])
  })

  it('persiste l\'ordine in localStorage per utente', () => {
    const cards = [makeCard('a'), makeCard('b')]
    const { result } = renderHook(() => useCardOrder(cards))

    act(() => result.current.reorder('b', 'a'))

    const raw = localStorage.getItem('loyalty-cards:order:user-1')
    expect(raw && JSON.parse(raw)).toEqual(['b', 'a'])
  })
})
