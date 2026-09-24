# Loyalty Cards App

[![CI](https://github.com/octavian-alexandru-dev/loyalty-cards-app/actions/workflows/ci.yml/badge.svg)](https://github.com/octavian-alexandru-dev/loyalty-cards-app/actions/workflows/ci.yml)
[![Deploy](https://github.com/octavian-alexandru-dev/loyalty-cards-app/actions/workflows/deploy.yml/badge.svg)](https://github.com/octavian-alexandru-dev/loyalty-cards-app/actions/workflows/deploy.yml)

A Progressive Web App for managing loyalty cards: scan QR codes and barcodes
with your camera, save the cards to your account and share them with other
users or with your family/flatmates group.

It grew out of a practical need (keeping the family's loyalty cards in one
place instead of carrying them all around) and is also a testbed for a fully
client-heavy architecture: no application backend to write or maintain, with
fine-grained permissions (owner / individual sharing / group sharing)
expressed entirely in SQL through Postgres Row Level Security.

## Live demo

**[loyalty-cards-app.demo-v1.workers.dev](https://loyalty-cards-app.demo-v1.workers.dev)**

This is the real production environment (the same automated deploy described
below), not a separate demo build: you can sign up and immediately try the
scanner (it needs a camera, so a smartphone works best) and the sharing flow
by registering a second user.

## Philosophy

- **Client-heavy**: codes are decoded entirely in the browser (no
  image-processing server). Only the decoded value (text + format) is stored
  in the database, never the scanned image.
- **Zero cost**: the stack is designed to stay within the free tiers of
  Supabase and a static host (Cloudflare Workers).
- **Installable PWA**: manifest + service worker; cards that have already
  been synced work offline.

Full documentation (currently in Italian):

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — tech stack and design decisions
- [`docs/DATABASE.md`](docs/DATABASE.md) — data schema and security rules (RLS)
- [`docs/FEATURES.md`](docs/FEATURES.md) — functional scope (what's included and what's not)
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — how to put the app online at zero cost

## Local development

```bash
cd app
npm install
cp .env.example .env.local   # fill in your Supabase project URL and anon key
npm run dev
```

Alternatively, if you have access to the `Fidelity-card` Bitwarden Secrets
Manager project (see `.bws-token.example` in the repo root),
`../scripts/bws-env.sh` generates `app/.env.local` instead of the manual step
above.

Full step-by-step guide (creating the Supabase project, schema, testing from
a smartphone): [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md#1-test-in-locale).

## Production deploy

Supabase backend + Cloudflare Workers hosting, with automatic releases via
GitHub Actions on every push to `main`. Full guide:
[`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md#2-ambiente-cloud-di-produzione-costo-zero).

## Code quality

```bash
cd app
npm run lint       # oxlint
npm run typecheck  # tsc --noEmit
npm run test       # vitest
npm run build      # production build
```

The same checks run automatically on every push/PR
([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) and, with the real
keys, before every deploy
([`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)).
