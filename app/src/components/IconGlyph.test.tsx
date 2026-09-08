import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { IconGlyph } from './IconGlyph'

describe('IconGlyph', () => {
  it('renderizza un\'icona nota', () => {
    const { container } = render(<IconGlyph icon="dumbbell" />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('ricade su un\'icona di default per una chiave sconosciuta, senza lanciare errori', () => {
    const { container } = render(<IconGlyph icon="chiave-inesistente" />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })
})
