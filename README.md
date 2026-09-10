# Loyalty Cards App

[![CI](https://github.com/octavian-alexandru-dev/loyalty-cards-app/actions/workflows/ci.yml/badge.svg)](https://github.com/octavian-alexandru-dev/loyalty-cards-app/actions/workflows/ci.yml)
[![Deploy](https://github.com/octavian-alexandru-dev/loyalty-cards-app/actions/workflows/deploy.yml/badge.svg)](https://github.com/octavian-alexandru-dev/loyalty-cards-app/actions/workflows/deploy.yml)

Progressive Web App per la gestione delle carte fedeltà: scansiona QR code e
codici a barre con la fotocamera, salva le carte nel tuo account e condividile
con altri utenti o con il tuo gruppo famiglia/coinquilini.

Nasce da un'esigenza pratica (centralizzare le tessere fedeltà di famiglia
invece di portarle tutte fisicamente in borsa) ed è anche un banco di prova
per un'architettura interamente client-heavy: niente backend applicativo da
scrivere né mantenere, autorizzazioni granulari (proprietario / condivisione
individuale / condivisione di gruppo) espresse solo in SQL tramite Row Level
Security di Postgres.

## Demo live

**[loyalty-cards-app.demo-v1.workers.dev](https://loyalty-cards-app.demo-v1.workers.dev)**

È l'ambiente di produzione reale (stesso deploy automatico descritto sotto),
non una build dimostrativa a parte: puoi registrare un account e provare da
subito lo scanner (richiede fotocamera, quindi meglio da smartphone) e il
flusso di condivisione registrando un secondo utente.

## Filosofia

- **Client-heavy**: la decodifica dei codici avviene interamente nel browser
  (nessun server di elaborazione immagini). Nel database viene salvato solo il
  valore decodificato (testo + formato), mai l'immagine scansionata.
- **Costo zero**: stack pensato per restare nei piani gratuiti di Supabase e
  di un host statico (Cloudflare Workers).
- **PWA installabile**: manifest + service worker, funziona offline per le
  carte già sincronizzate.

Documentazione completa:

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — stack tecnico e scelte progettuali
- [`docs/DATABASE.md`](docs/DATABASE.md) — schema dati e regole di sicurezza (RLS)
- [`docs/FEATURES.md`](docs/FEATURES.md) — scope funzionale (cosa c'è e cosa è escluso)
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — come mettere online l'app a costo zero

## Sviluppo locale

```bash
cd app
npm install
cp .env.example .env.local   # inserire URL e anon key del progetto Supabase
npm run dev
```

In alternativa, se hai accesso al progetto Bitwarden Secrets Manager
`Fidelity-card` (vedi `.bws-token.example` nella root del repo),
`../scripts/bws-env.sh` genera `app/.env.local` al posto del passo manuale
qui sopra.

Guida completa passo-passo (creazione progetto Supabase, schema, test da
smartphone): [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md#1-test-in-locale).

## Deploy in produzione

Backend Supabase + hosting Cloudflare Workers, con rilascio automatico via
GitHub Actions ad ogni push su `main`. Guida completa:
[`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md#2-ambiente-cloud-di-produzione-costo-zero).

## Qualità del codice

```bash
cd app
npm run lint       # oxlint
npm run typecheck  # tsc --noEmit
npm run test       # vitest
npm run build      # build di produzione
```

Gli stessi controlli girano automaticamente su ogni push/PR
([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) e, con le chiavi
reali, prima di ogni deploy
([`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)).
