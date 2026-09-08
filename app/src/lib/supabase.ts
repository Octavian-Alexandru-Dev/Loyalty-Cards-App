import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  // eslint-disable-next-line no-console
  console.error(
    'Variabili VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY mancanti. ' +
      'Copia .env.example in .env.local e valorizzale (vedi docs/DEPLOYMENT.md).',
  )
}

export const supabase = createClient(url ?? '', anonKey ?? '', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})
