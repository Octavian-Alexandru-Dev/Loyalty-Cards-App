import type { CardCategory, CodeFormat } from '../types'

/**
 * Dataset locale "best effort" per velocizzare l'inserimento di una carta:
 * NON è un registro ufficiale dei prefissi codice di ogni catena (non
 * esiste un servizio pubblico e gratuito per questo), quindi non pretende
 * di riconoscere automaticamente "questa è la carta Esselunga" dal solo
 * valore del codice. Fa due cose, entrambe verificabili e oneste:
 *
 * 1. Propone una lista di catene note (nome/icona/colore) per una selezione
 *    manuale rapida dopo la scansione, invece di digitare tutto a mano.
 * 2. Suggerisce una categoria di partenza in base a pattern noti dello
 *    standard GS1 (es. i prefissi EAN-13 "20"-"29" sono la fascia
 *    "restricted circulation number" riservata da GS1 all'uso interno dei
 *    singoli punti vendita, tipicamente usata anche per le carte fedeltà).
 *    È un suggerimento, sempre modificabile dall'utente.
 */
export interface BrandPreset {
  key: string
  name: string
  category: CardCategory
  color: string
  icon: string
}

export const BRAND_PRESETS: BrandPreset[] = [
  { key: 'esselunga', name: 'Esselunga Fidaty', category: 'supermercato', color: '#dc2626', icon: 'shopping-cart' },
  { key: 'coop', name: 'Coop', category: 'supermercato', color: '#dc2626', icon: 'shopping-cart' },
  { key: 'conad', name: 'Conad Card', category: 'supermercato', color: '#dc2626', icon: 'shopping-cart' },
  { key: 'carrefour', name: 'Carrefour', category: 'supermercato', color: '#0891b2', icon: 'shopping-cart' },
  { key: 'ipercoop', name: 'Ipercoop', category: 'supermercato', color: '#dc2626', icon: 'shopping-cart' },
  { key: 'lidl', name: 'Lidl Plus', category: 'supermercato', color: '#2563eb', icon: 'shopping-cart' },
  { key: 'tigota', name: 'Tigotà', category: 'altro', color: '#db2777', icon: 'gift' },
  { key: 'acqua-sapone', name: 'Acqua & Sapone', category: 'altro', color: '#0891b2', icon: 'gift' },
  { key: 'decathlon', name: 'Decathlon', category: 'abbigliamento', color: '#2563eb', icon: 'dumbbell' },
  { key: 'ikea', name: 'IKEA Family', category: 'altro', color: '#d97706', icon: 'gift' },
  { key: 'ovs', name: 'OVS', category: 'abbigliamento', color: '#475569', icon: 'shirt' },
  { key: 'unieuro', name: 'Unieuro', category: 'altro', color: '#9333ea', icon: 'gift' },
  { key: 'feltrinelli', name: 'Feltrinelli', category: 'altro', color: '#475569', icon: 'gift' },
  { key: 'eni', name: 'Eni Station+', category: 'carburante', color: '#d97706', icon: 'fuel' },
  { key: 'q8', name: 'Q8 Fedeltà', category: 'carburante', color: '#dc2626', icon: 'fuel' },
  { key: 'palestra', name: 'Palestra / Fitness club', category: 'palestra', color: '#16a34a', icon: 'dumbbell' },
]

/** Suggerisce una categoria di default in base al formato/pattern del codice. È solo un punto di partenza, non un'identificazione certa. */
export function guessCategory(format: CodeFormat, value: string): CardCategory | null {
  if (format === 'EAN_13' && /^2\d{12}$/.test(value)) {
    // Fascia GS1 "restricted circulation number" (20-29): uso interno del
    // punto vendita, tipica per carte fedeltà e coupon emessi in negozio.
    return 'supermercato'
  }
  return null
}
