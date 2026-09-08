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

## Regole di autorizzazione (Row Level Security)

Riassunto delle policy (vedi la migration per il SQL esatto):

| Tabella | Chi può leggere | Chi può scrivere |
|---|---|---|
| `profiles` | tutti gli utenti autenticati (solo `id`+`username`) | solo il proprio profilo |
| `groups` | owner o membri | owner (create/update/delete) |
| `group_members` | membri dello stesso gruppo | owner del gruppo aggiunge/rimuove; un membro può rimuovere se stesso |
| `cards` | owner, o chi ha una condivisione individuale/di gruppo attiva | solo owner |
| `card_shares` | owner della carta, chi condivide, chi riceve | chi condivide, se è owner della carta o ha permesso `reshare` su di essa |
| `share_invites` | chi lo ha creato | chi ha permesso di condividere la carta; il redeem passa solo dalla funzione dedicata |
| `card_usage_log` | owner della carta, chi ha generato la riga | chiunque abbia accesso in lettura alla carta (registra il proprio utilizzo) |

Nessuna tabella è leggibile o scrivibile senza autenticazione: `RLS` è
abilitata ovunque e non esiste alcuna policy per il ruolo `anon` sui dati
applicativi.

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
