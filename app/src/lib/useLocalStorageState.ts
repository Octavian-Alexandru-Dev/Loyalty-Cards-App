import { useEffect, useState } from 'react'

/** Preferenza di visualizzazione persistita solo su questo dispositivo (non su Supabase). */
export function useLocalStorageState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key)
      return raw !== null ? (JSON.parse(raw) as T) : initial
    } catch {
      return initial
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // Storage non disponibile (privato/pieno): la preferenza resta valida solo per questa sessione.
    }
  }, [key, value])

  return [value, setValue] as const
}
