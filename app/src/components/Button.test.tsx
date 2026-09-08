import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from './Button'

describe('Button', () => {
  it('renderizza il testo passato come children', () => {
    render(<Button>Salva</Button>)
    expect(screen.getByRole('button', { name: 'Salva' })).toBeInTheDocument()
  })

  it('chiama onClick quando premuto', () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Clicca</Button>)
    fireEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('non chiama onClick quando disabilitato', () => {
    const onClick = vi.fn()
    render(
      <Button onClick={onClick} disabled>
        Clicca
      </Button>,
    )
    fireEvent.click(screen.getByRole('button'))
    expect(onClick).not.toHaveBeenCalled()
  })
})
