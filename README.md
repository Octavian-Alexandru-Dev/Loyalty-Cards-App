# Loyalty Cards App

[![CI](https://github.com/octavian-alexandru-dev/loyalty-cards-app/actions/workflows/ci.yml/badge.svg)](https://github.com/octavian-alexandru-dev/loyalty-cards-app/actions/workflows/ci.yml)
[![Deploy](https://github.com/octavian-alexandru-dev/loyalty-cards-app/actions/workflows/deploy.yml/badge.svg)](https://github.com/octavian-alexandru-dev/loyalty-cards-app/actions/workflows/deploy.yml)

A web app to keep all your loyalty cards in one place. You scan the QR code
or barcode with your phone camera, the card gets saved to your account, and
you can share it with other people or with your family or flatmates group.

I built it because I was tired of carrying a pile of loyalty cards around, and
I wanted the whole family to have them on their phones. It was also a chance
to try an app with no backend of its own. All the logic about who can see
which card lives in the database, written as Postgres Row Level Security
policies, so there's no server code to write or maintain.

## Live demo

You can try it at **[loyalty-cards-app.demo-v1.workers.dev](https://loyalty-cards-app.demo-v1.workers.dev)**

It's the actual production app, deployed automatically like everything else
described below. Sign up, try the scanner from your phone since it needs a
camera, and register a second user if you want to test sharing.

## How it works

- Barcodes and QR codes are decoded in the browser, so there's no server
  processing images. The database only stores the decoded text and its
  format, never the photo.
- Everything runs on free tiers, Supabase for the database and auth and
  Cloudflare Workers for hosting.
- It's an installable PWA and cards you've already synced keep working
  offline.

The docs folder has more details, written in Italian for now.

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) covers the stack and the design choices
- [`docs/DATABASE.md`](docs/DATABASE.md) covers the schema and the RLS policies
- [`docs/FEATURES.md`](docs/FEATURES.md) lists what the app does and what it doesn't
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) explains how to host it for free

## Running it locally

```bash
cd app
npm install
cp .env.example .env.local   # add your Supabase URL and anon key
npm run dev
```

If you have access to the `Fidelity-card` project on Bitwarden Secrets
Manager you can skip the manual `.env.local` step and run
`../scripts/bws-env.sh` instead. There's an example token file in
`.bws-token.example`.

For a full walkthrough, from creating the Supabase project to testing on your
phone, see [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md#1-test-in-locale).

## Deploying

The backend is on Supabase and the frontend on Cloudflare Workers. Every push
to `main` gets deployed by GitHub Actions. The steps to set it up are in
[`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md#2-ambiente-cloud-di-produzione-costo-zero).

## Checks

```bash
cd app
npm run lint
npm run typecheck
npm run test
npm run build
```

CI runs the same commands on every push and pull request
with [`ci.yml`](.github/workflows/ci.yml), and runs them again with the real
keys before each deploy with [`deploy.yml`](.github/workflows/deploy.yml).
