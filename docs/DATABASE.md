# Schema dati e sicurezza

SQL completo (idempotente) in [`supabase/migrations/0001_init.sql`](../supabase/migrations/0001_init.sql).
Qui la descrizione del modello e del ragionamento dietro le policy RLS.

## Tabelle

### `profiles`
Un profilo per utente, con `id` uguale a `auth.users.id`. Espone solo
`username` pubblicamente ricercabile (mai l'email, per evitare enumerazione).
Creato automaticamente da un trigger su `auth.users` al signup.

### `groups` / `group_members`
Un gruppo (es. "Famiglia Rossi") ha un owner e dei membri. Le carte
condivise con un gruppo sono visibili a tutti i membri correnti — se qualcuno
entra dopo, vede anche le carte già condivise in passato con il gruppo.

### `group_invites`
Un link di invito al gruppo, generato solo dal proprietario. A differenza di
`share_invites` (usa e getta), qui non c'è un `redeemed_by`: lo stesso link
può essere aperto da più persone finché non scade o il proprietario lo
revoca, perché è pensato per essere condiviso una volta su una chat di
gruppo. Chi apre il link chiama `redeem_group_invite(token)`, che inserisce
la riga in `group_members` per suo conto (`SECURITY DEFINER`, con lo stesso
schema di `redeem_card_invite`); `ON CONFLICT DO NOTHING` rende il riscatto
idempotente per chi è già membro.

### `cards`
La carta fedeltà vera e propria: `owner_id`, `label`, `brand_key` (per il
riconoscimento automatico), `code_value` + `code_format` (il risultato della
decodifica, mai un'immagine), `color`, `icon`, `category`.

### `card_shares`
Riga = "questa carta è condivisa con questo utente O con questo gruppo, con
questo permesso". Esattamente uno tra `shared_with_user`/`shared_with_group`
è valorizzato (check constraint). `permission` è `view` o `reshare`.

### `share_invites`
Un invito "usa e getta" (o con scadenza) generato dal proprietario/da chi ha
permesso `reshare`: contiene un `token` casuale codificato in un QR. Chi lo
scansiona chiama la funzione `redeem_card_invite(token)` per trasformarlo in
una riga di `card_shares` a proprio nome. Il redeem passa da una funzione
`SECURITY DEFINER` apposta perché normalmente un utente non ha i permessi
RLS per scrivere una condivisione su una carta che non possiede.

### `card_usage_log`
Una riga ogni volta che qualcuno che **non** è il proprietario apre la
schermata "usa carta" di una carta condivisa con lui. Il proprietario può
leggere il log delle proprie carte.

### Auto-eliminazione dell'account
Non è una tabella, ma la funzione `delete_own_account()`: elimina la riga
dell'utente corrente in `auth.users`. Grazie a `on delete cascade` su tutte
le foreign key verso `profiles` (a sua volta `on delete cascade` verso
`auth.users`), la cancellazione si propaga automaticamente a carte, gruppi
di cui è proprietario, condivisioni, inviti e log — senza bisogno di
cancellare esplicitamente riga per riga. Anche questa è `SECURITY DEFINER`
per lo stesso motivo di `redeem_card_invite`/`redeem_group_invite`: un
utente autenticato non ha di per sé privilegi DELETE su `auth.users`
(schema gestito da Supabase).

## Regole di autorizzazione (Row Level Security)

Riassunto delle policy (vedi la migration per il SQL esatto):

| Tabella | Chi può leggere | Chi può scrivere |
|---|---|---|
| `profiles` | tutti gli utenti autenticati (solo `id`+`username`) | solo il proprio profilo |
| `groups` | owner o membri | owner (create/update/delete) |
| `group_members` | membri dello stesso gruppo | owner del gruppo aggiunge/rimuove; un membro può rimuovere se stesso |
| `group_invites` | chi lo ha creato (l'owner) | solo l'owner del gruppo; il redeem passa solo dalla funzione dedicata |
| `cards` | owner, o chi ha una condivisione individuale/di gruppo attiva | solo owner |
| `card_shares` | owner della carta, chi condivide, chi riceve | chi condivide, se è owner della carta o ha permesso `reshare` su di essa |
| `share_invites` | chi lo ha creato | chi ha permesso di condividere la carta; il redeem passa solo dalla funzione dedicata |
| `card_usage_log` | owner della carta, chi ha generato la riga | chiunque abbia accesso in lettura alla carta (registra il proprio utilizzo) |

Nessuna tabella è leggibile o scrivibile senza autenticazione: `RLS` è
abilitata ovunque e non esiste alcuna policy per il ruolo `anon` sui dati
applicativi.

## Nota tecnica: deduplica in `accessible_cards`

La vista `accessible_cards` (usata dal frontend per la lista carte) unisce
tre vie di accesso: proprietario, condivisione diretta con l'utente,
condivisione con un gruppo di cui l'utente è membro. Una stessa carta può
essere raggiungibile da più di una via contemporaneamente — tipicamente il
proprietario condivide una carta con un gruppo di cui lui stesso è membro,
oppure una carta è condivisa sia con un utente direttamente sia con un
gruppo a cui appartiene. La vista calcola tutte le vie di accesso per ogni
carta e tiene solo la migliore (`owner` > `reshare` > `view`, tramite
`distinct on (card_id) ... order by priority`), così ogni carta compare
**una sola volta** per utente, indipendentemente da quante condivisioni la
rendano visibile.

## Nota tecnica: perché `cards_select` non usa una funzione helper

Le altre policy usano funzioni `SECURITY DEFINER` (`is_group_member`,
`card_owner`, `has_card_access`, ...) per evitare la ricorsione che Postgres
rileva quando una policy referenzia direttamente la propria tabella. La
policy di lettura di `cards`, però, confronta `owner_id = auth.uid()`
direttamente sulla colonna invece di passare da `has_card_access()`: usare
la funzione lì causava un errore ("new row violates row-level security
policy") sugli `INSERT ... RETURNING` fatti dal proprietario, perché la
funzione ri-leggeva la tabella `cards` per la riga appena inserita nella
stessa istruzione, e quella lettura non vedeva ancora in modo affidabile la
riga nuova. Il confronto diretto sulla colonna della riga in valutazione
evita il problema. Verificato con una suite di test end-to-end delle
policy su un'istanza Postgres locale (vedi cronologia di sviluppo).
