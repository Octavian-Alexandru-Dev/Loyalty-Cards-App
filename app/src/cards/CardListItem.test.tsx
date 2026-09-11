import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { CardListItem } from './CardListItem'
import type { AccessibleCard } from '../types'

const baseCard: AccessibleCard = {
  id: 'card-1',
  owner_id: 'user-1',
  label: 'Esselunga Fidaty',
  brand_key: 'esselunga',
  code_value: '2012345000017',
  code_format: 'EAN_13',
  color: '#dc2626',
  icon: 'shopping-cart',
  category: 'supermercato',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  access: 'owner',
  is_hidden: false,
}

function renderCard(card: AccessibleCard, onToggleHidden?: () => void) {
  return render(
    <MemoryRouter>
      <CardListItem card={card} onToggleHidden={onToggleHidden} />
    </MemoryRouter>,
  )
}

describe('CardListItem', () => {
  it('mostra nome e categoria della carta', () => {
    renderCard(baseCard)
    expect(screen.getByText('Esselunga Fidaty')).toBeInTheDocument()
    expect(screen.getByText(/supermercato/)).toBeInTheDocument()
  })

  it('non mostra il badge "condivisa" per una carta propria', () => {
    renderCard(baseCard)
    expect(screen.queryByText(/condivisa/)).not.toBeInTheDocument()
  })

  it('mostra il badge "condivisa da" per una carta ricevuta in condivisione', () => {
    renderCard({ ...baseCard, access: 'view', shared_by_username: 'bob' })
    expect(screen.getByText(/condivisa da @bob/)).toBeInTheDocument()
  })

  it('punta al link di dettaglio corretto', () => {
    renderCard(baseCard)
    expect(screen.getByRole('link')).toHaveAttribute('href', '/cards/card-1')
  })

  it('non mostra il pulsante nascondi per una carta propria', () => {
    renderCard(baseCard, vi.fn())
    expect(screen.queryByLabelText('Nascondi la carta')).not.toBeInTheDocument()
  })

  it('mostra il pulsante nascondi per una carta condivisa e lo attiva al click', () => {
    const onToggleHidden = vi.fn()
    renderCard({ ...baseCard, access: 'view', shared_by_username: 'bob' }, onToggleHidden)
    fireEvent.click(screen.getByLabelText('Nascondi la carta'))
    expect(onToggleHidden).toHaveBeenCalledTimes(1)
  })

  it('mostra il pulsante "mostra di nuovo" per una carta condivisa già nascosta', () => {
    renderCard({ ...baseCard, access: 'view', shared_by_username: 'bob', is_hidden: true }, vi.fn())
    expect(screen.getByLabelText('Mostra di nuovo la carta')).toBeInTheDocument()
  })
})
