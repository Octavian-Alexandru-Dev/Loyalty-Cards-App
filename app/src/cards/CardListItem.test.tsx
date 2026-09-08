import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
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
}

function renderCard(card: AccessibleCard) {
  return render(
    <MemoryRouter>
      <CardListItem card={card} />
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
})
