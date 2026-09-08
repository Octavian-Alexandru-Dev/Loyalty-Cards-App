# Guida: test in locale e deploy in cloud a costo zero

Questa guida copre due percorsi separati:

1. **Test in locale** — per sviluppare/provare l'app sul proprio computer.
2. **Ambiente cloud di produzione** — Supabase (backend) + Cloudflare Pages
   (hosting), con rilascio automatico via GitHub Actions ad ogni push su
   `main`.

Puoi fare solo il punto 1, solo il punto 2, o entrambi (consigliato: prima
1, poi 2 quando sei soddisfatto).

---

## 1. Test in locale

### Prerequisiti

- [Node.js](https://nodejs.org) 20 o superiore (consigliato 22, la stessa
  versione usata in CI)
- Un account Supabase gratuito (serve comunque un backend: anche in locale
  l'app parla con un vero progetto Supabase — non c'è un "mock" locale,
  per restare fedeli a come funzionerà in produzione)

### Passi

1. **Crea un progetto Supabase di sviluppo** (gratuito): vai su
   https://supabase.com, crea un account, poi **New project**. Scegli una
   password del database qualsiasi (non ti servirà direttamente) e una
   region vicina a te. L'attivazione richiede 1-2 minuti.

2. **Applica lo schema del database**: nel progetto Supabase appena creato,
   apri **SQL Editor → New query**, incolla l'intero contenuto di
   [`supabase/migrations/0001_init.sql`](../supabase/migrations/0001_init.sql)
   ed esegui (`Run`). Deve completare senza errori: crea tabelle, funzioni e
   le regole di sicurezza (Row Level Security) descritte in
   [`docs/DATABASE.md`](DATABASE.md).

3. **Recupera le chiavi API**: in **Project Settings → API**, copia
   `Project URL` e la chiave `anon` `public`.

4. **Configura l'app**:

   ```bash
   cd app
   npm install
   cp .env.example .env.local
   ```

   Apri `.env.local` e incolla i valori copiati al punto 3:

   ```
   VITE_SUPABASE_URL=https://<tuo-progetto>.supabase.co
   VITE_SUPABASE_ANON_KEY=<tua-anon-key>
   ```

5. **Avvia l'app**:

   ```bash
   npm run dev
   ```

   Apri l'URL stampato in console (di norma `http://localhost:5173`).
   L'accesso alla fotocamera per lo scanner richiede un contesto sicuro: su
   `localhost` funziona senza configurazioni aggiuntive; su un altro
   dispositivo della stessa rete (es. per provare da smartphone) serve
   HTTPS — vedi la nota sotto.

6. **Prova il flusso completo**: registra un utente (**Authentication →
   Providers → Email** è già attivo di default in Supabase; se vuoi saltare
   la conferma email durante i test, disattiva "Confirm email" in
   **Authentication → Providers → Email**, e riattivala prima di andare in
   produzione), scansiona/aggiungi una carta, verifica che compaia nella
   tabella `cards` del progetto Supabase, prova la condivisione registrando
   un secondo utente.

### Provare lo scanner da smartphone in locale (opzionale)

I browser permettono l'accesso alla fotocamera solo in contesti sicuri
(HTTPS, o `localhost`). Per testare da telefono sulla stessa rete Wi-Fi:

```bash
npm run dev -- --host
```

poi usa un tunnel HTTPS temporaneo (es. `npx localtunnel --port 5173` o
`ngrok http 5173`) e apri l'URL HTTPS risultante dal telefono. In
alternativa, prova direttamente l'anteprima di build pubblicata (vedi
sezione 2): quella gira già su HTTPS.

### Comandi utili

| Comando | Cosa fa |
|---|---|
| `npm run dev` | Avvia il server di sviluppo con hot reload |
| `npm run lint` | Controlla la qualità del codice (oxlint) |
| `npm run typecheck` | Verifica i tipi TypeScript senza generare output |
| `npm run test` | Esegue i test automatici (Vitest) |
| `npm run build` | Crea la build di produzione in `app/dist` |
| `npm run preview` | Serve la build di produzione in locale, per un ultimo controllo |

Sono gli stessi comandi eseguiti in CI ad ogni push (vedi sezione 3): se
passano tutti in locale, passeranno anche in CI.

---

## 2. Ambiente cloud di produzione (costo zero)

Due account gratuiti da creare (un agente automatico non può crearli al
posto tuo, perché richiedono l'accettazione di termini di servizio da parte
di una persona): un progetto **Supabase** e un account **Cloudflare**.

### 2.1 Backend — Supabase

Se hai già seguito la sezione 1 con un progetto Supabase "di sviluppo",
puoi:
- **riusarlo** anche per la produzione (va benissimo per uso personale/
  famigliare), oppure
- crearne uno **nuovo, separato**, ripetendo i passi 1-3 della sezione 1
  (progetto dedicato "produzione").

In entrambi i casi assicurati che lo schema
(`supabase/migrations/0001_init.sql`) sia stato eseguito su quel progetto,
e tieni a portata di mano `Project URL` e `anon key`.

Prima di considerarlo pronto per utenti reali: in **Authentication →
Providers → Email**, verifica che **"Confirm email"** sia attivo (di
default lo è), così un indirizzo email va verificato prima di poter
accedere.

### 2.2 Hosting — Cloudflare Pages

1. Crea un account gratuito su https://dash.cloudflare.com.
2. Vai su **Workers & Pages → Create → Pages**. Non serve creare il
   progetto manualmente dall'interfaccia: il primo deploy da GitHub Actions
   (sezione 3) lo crea automaticamente con il nome che indicherai nei
   secrets. Se preferisci crearlo a mano, il nome deve coincidere con
   `CLOUDFLARE_PAGES_PROJECT` (vedi sotto).
3. Recupera un **API Token**: **My Profile → API Tokens → Create Token**,
   usa il template **"Edit Cloudflare Workers"** (include i permessi Pages
   necessari) oppure crea un token custom con permesso
   `Account.Cloudflare Pages: Edit`. Copialo (visibile una sola volta).
4. Recupera l'**Account ID**: visibile nella barra laterale destra di
   qualunque pagina del dashboard Cloudflare, o in **Workers & Pages** →
   qualsiasi progetto → "Account ID".

### 2.3 Collega GitHub Actions (rilascio automatico su push a `main`)

Il repository include già `.github/workflows/deploy.yml`: ad ogni push sul
branch `main` che supera lint, typecheck, test e build, l'app viene
pubblicata automaticamente su Cloudflare Pages.

Configura i **secrets** del repository (**Settings → Secrets and
variables → Actions → New repository secret**):

| Nome | Valore |
|---|---|
| `VITE_SUPABASE_URL` | Il `Project URL` del progetto Supabase di produzione |
| `VITE_SUPABASE_ANON_KEY` | La `anon key` dello stesso progetto |
| `CLOUDFLARE_API_TOKEN` | Il token creato al punto 2.2.3 |
| `CLOUDFLARE_ACCOUNT_ID` | L'Account ID recuperato al punto 2.2.4 |

Facoltativo, in **Settings → Secrets and variables → Actions → Variables**:

| Nome | Valore | Default se assente |
|---|---|---|
| `CLOUDFLARE_PAGES_PROJECT` | Nome del progetto Pages, es. `carte-fedelta` | `loyalty-cards-app` |

Da quel momento, ogni `git push` su `main` (o merge di una pull request)
attiva automaticamente il workflow: build → test → deploy. Puoi seguirne
l'esecuzione nella scheda **Actions** del repository su GitHub.

### 2.4 Verifica

- Apri l'URL pubblico (`https://<progetto>.pages.dev`, o il dominio
  custom se ne colleghi uno) da smartphone: dovrebbe comparire il prompt
  "Aggiungi a schermata Home" (installabilità PWA).
- Registra un utente, scansiona una carta, verifica che compaia nella
  tabella `cards` del progetto Supabase di produzione.
- Registra un secondo utente e prova la condivisione.

### Costi attesi

Con uso personale/famigliare (decine di utenti, centinaia di carte), il
progetto resta comodamente dentro i piani Free di Supabase, Cloudflare
Pages e GitHub Actions (2.000 minuti/mese gratuiti su repository privati,
illimitati su repository pubblici): **0 €/mese**. Il limite da monitorare
nel tempo è la banda/le righe lette su Supabase se il numero di utenti
cresce molto: in tal caso i piani a pagamento partono comunque da poche
decine di euro/mese.

---

## 3. Come funziona la pipeline CI/CD

Due workflow GitHub Actions, in [`.github/workflows/`](../.github/workflows):

- **`ci.yml`** — su ogni push (qualsiasi branch) e ogni pull request verso
  `main`: installa le dipendenze, esegue lint, typecheck, test e build.
  Usa chiavi Supabase fittizie (la build non contatta davvero Supabase, le
  serve solo per compilare): serve a garantire che il codice sia sempre in
  uno stato valido, indipendentemente dal deploy.
- **`deploy.yml`** — solo sui push diretti a `main`: ripete le stesse
  verifiche con le chiavi Supabase **reali** (dai secrets), poi pubblica la
  build su Cloudflare Pages.

Il deploy non parte mai se lint, typecheck, test o build falliscono: un
push che rompe la build non arriva mai in produzione.
