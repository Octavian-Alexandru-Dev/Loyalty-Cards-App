import { describe, expect, it } from 'vitest'
import { BRAND_PRESETS, guessCategory, guessFormatFromValue } from './brands'

describe('guessCategory', () => {
  it('suggerisce "supermercato" per un EAN-13 nella fascia GS1 20-29 (restricted circulation)', () => {
    expect(guessCategory('EAN_13', '2012345000017')).toBe('supermercato')
    expect(guessCategory('EAN_13', '2912345000012')).toBe('supermercato')
  })

  it('non suggerisce nulla per un EAN-13 fuori dalla fascia 20-29', () => {
    expect(guessCategory('EAN_13', '5012345000017')).toBeNull()
  })

  it('non suggerisce nulla per un QR code', () => {
    expect(guessCategory('QR_CODE', '2012345000017')).toBeNull()
  })

  it('non suggerisce nulla per un valore EAN-13 malformato', () => {
    expect(guessCategory('EAN_13', 'abc')).toBeNull()
    expect(guessCategory('EAN_13', '201234500001')).toBeNull() // 12 cifre, non 13
  })
})

describe('guessFormatFromValue', () => {
  it('riconosce un EAN-13 da 13 cifre', () => {
    expect(guessFormatFromValue('2012345000017')).toBe('EAN_13')
  })

  it('riconosce un UPC-A da 12 cifre', () => {
    expect(guessFormatFromValue('012345678905')).toBe('UPC_A')
  })

  it('riconosce un EAN-8 da 8 cifre', () => {
    expect(guessFormatFromValue('96385074')).toBe('EAN_8')
  })

  it('ricade su Code 128 per valori numerici di altre lunghezze', () => {
    expect(guessFormatFromValue('12345')).toBe('CODE_128')
  })

  it('ricade su Code 128 per valori alfanumerici', () => {
    expect(guessFormatFromValue('ABC-123')).toBe('CODE_128')
  })

  it('ignora gli spazi ai bordi nel contare le cifre', () => {
    expect(guessFormatFromValue('  2012345000017  ')).toBe('EAN_13')
  })
})

describe('BRAND_PRESETS', () => {
  it('ha chiavi uniche', () => {
    const keys = BRAND_PRESETS.map((p) => p.key)
    expect(new Set(keys).size).toBe(keys.length)
  })

  it('ogni preset ha una categoria valida non vuota', () => {
    for (const preset of BRAND_PRESETS) {
      expect(preset.category.length).toBeGreaterThan(0)
      expect(preset.color).toMatch(/^#[0-9a-f]{6}$/i)
    }
  })
})
