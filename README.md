# Loyalty Cards App

[![CI](https://github.com/octavian-alexandru-dev/loyalty-cards-app/actions/workflows/ci.yml/badge.svg)](https://github.com/octavian-alexandru-dev/loyalty-cards-app/actions/workflows/ci.yml)
[![Deploy](https://github.com/octavian-alexandru-dev/loyalty-cards-app/actions/workflows/deploy.yml/badge.svg)](https://github.com/octavian-alexandru-dev/loyalty-cards-app/actions/workflows/deploy.yml)

Progressive Web App per la gestione delle carte fedeltà: scansiona QR code e
codici a barre con la fotocamera, salva le carte nel tuo account e condividile
con altri utenti o con il tuo gruppo famiglia/coinquilini.

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
