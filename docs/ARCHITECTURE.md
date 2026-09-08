# Architettura

## Principio guida: client-heavy, infra minima

Tutta la logica che non richiede un server condiviso vive nel client:

- **Decodifica immagini** (QR/barcode) → nel browser, via `@zxing/browser`
  (wrapper delle API della fotocamera + libreria ZXing compilata in WASM/JS).
  Il server non riceve mai un'immagine: riceve solo `{ value, format }`.
- **Rendering dei codici** per l'uso alla cassa → generati al volo nel client
  a partire dal valore testuale (`qrcode.react` per i QR, `jsbarcode` per i
  barcode 1D/2D), non salvati come immagine.
- **Cache locale e offline** → IndexedDB (via Dexie.js) specchia le carte
  dell'utente; l'app funziona anche senza connessione per consultare/mostrare
  le carte già sincronizzate. Il service worker (Workbox, via
  `vite-plugin-pwa`) mette in cache l'app shell.
- **Autorizzazioni** → applicate a livello di database con Row Level Security
  di Postgres, non da un server applicativo custom: il client parla
  direttamente con Supabase tramite `supabase-js`, e le regole SQL
  garantiscono che ogni utente veda solo ciò che gli spetta. Questo elimina
  la necessità di scrivere e ospitare un backend.

Il risultato è un'app che, a regime, non ha nessun server applicativo da
mantenere: solo un progetto Supabase (gratuito sotto soglia) e un host di
file statici.

## Stack tecnico

| Livello | Scelta | Perché |
|---|---|---|
| Framework UI | React 18 + TypeScript + Vite | build veloce, ecosistema maturo, tree-shaking aggressivo |
| Stile | Tailwind CSS | sistema di design coerente senza CSS custom sparso |
| Routing | React Router | standard de facto per SPA |
| Stato server / cache | TanStack Query | cache, retry, invalidazione; si appoggia bene sopra Supabase e riduce le chiamate di rete |
| Persistenza locale | Dexie.js (IndexedDB) | cache offline delle carte, letture istantanee |
| Backend | Supabase (Postgres + Auth + Realtime) | free tier generoso, RLS nativa, niente server da scrivere |
| Scansione | `@zxing/browser` | multi-formato (QR, EAN-13/8, Code128, Code39, ITF, Codabar, PDF417, Aztec, Data Matrix, UPC), attivo su tutti i browser con `getUserMedia` |
| Generazione codici a schermo | `qrcode.react` + `jsbarcode` | rendering client-side dal valore decodificato |
| PWA | `vite-plugin-pwa` (Workbox) | manifest, service worker, aggiornamento app |
| Hosting | Cloudflare Pages (o Vercel/Netlify) | CDN globale, deploy da Git, piano gratuito |
| Test | Vitest + Testing Library | veloce, integrato con Vite |

## Perché Supabase e non Firebase

Entrambi hanno un free tier valido. Si è scelto Supabase perché:

- Postgres relazionale è più naturale per il modello dati richiesto
  (proprietà carte, condivisioni individuali, gruppi, log utilizzo) rispetto
  a un documentale come Firestore.
- Row Level Security esprime in SQL le regole di autorizzazione anche
  complesse (es. "vedi la carta se sei owner, o se è condivisa con te, o se
  è condivisa con un gruppo di cui fai parte") senza codice lato server.
- Auth integrata con la stessa tabella `auth.users` referenziabile da
  foreign key nelle tabelle applicative.

## Flusso dati principale

1. L'utente scansiona un codice → `@zxing/browser` restituisce `{value, format}`
   nel browser.
2. L'app propone il riconoscimento automatico del brand (dataset locale di
   prefissi/pattern noti) o richiede conferma manuale.
3. Il record carta (`label, brand_key, code_value, code_format, color, icon,
   category`) viene scritto su Supabase tramite `supabase-js`, protetto da
   RLS (`owner_id = auth.uid()`).
4. TanStack Query invalida/aggiorna la cache; Dexie specchia la carta per
   l'uso offline.
5. Per condividere, l'utente cerca un altro username (o genera un invito via
   QR) → viene creata una riga in `card_shares` (o l'invito viene "riscattato"
   da chi lo scansiona tramite una funzione Postgres `SECURITY DEFINER`).
6. Chi riceve la condivisione vede la carta tra le "carte condivise con me"
   (RLS lo consente tramite `EXISTS` su `card_shares`/`group_members`) e può
   mostrarla alla cassa; l'apertura viene registrata in `card_usage_log`.

## Limiti noti (dichiarati esplicitamente)

- Il riconoscimento automatico del brand è **best-effort**: si basa su un
  piccolo dataset locale di prefissi EAN/pattern noti, non su un servizio di
  terze parti (per restare a costo zero e client-heavy). L'utente può sempre
  correggere manualmente nome/icona/colore.
- Il deploy effettivo richiede che l'utente crei un proprio progetto
  Supabase gratuito e un proprio account sull'host statico scelto: nessun
  agente automatico può creare questi account per conto dell'utente. La
  procedura è documentata in `DEPLOYMENT.md` e richiede pochi minuti.
