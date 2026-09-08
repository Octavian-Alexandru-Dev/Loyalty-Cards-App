# Scope funzionale

Questo documento fissa cosa è **dentro** lo scope della v1 e cosa è
**esplicitamente escluso** (per scelta del committente del progetto).

## Incluso — Scansione e gestione carte

- [x] Scansione da fotocamera di QR code e barcode multi-formato (EAN-13/8,
      Code128, Code39, ITF, Codabar, UPC-A/E, PDF417, Aztec, Data Matrix)
- [x] Import multiplo in sequenza (scansione continua, conferma per ogni
      carta trovata prima di salvarla)
- [x] Inserimento manuale come fallback (codice non leggibile o assente)
- [x] Riconoscimento automatico best-effort del brand da prefisso/pattern del
      codice, con dataset locale estendibile
- [x] Modifica di colore, icona, etichetta e categoria di ogni carta
- [x] Categorie/tag e ricerca/filtro nella lista carte
- [x] Eliminazione carte

## Incluso — Condivisione tra utenti

- [x] Autenticazione obbligatoria (email + password via Supabase Auth)
- [x] Condivisione di una carta con un utente specifico (per username) o
      tramite invito generato come QR da far scansionare
- [x] Permessi di condivisione: sola visualizzazione/uso vs. possibilità di
      ri-condividere ad altri
- [x] Gruppi (es. famiglia/coinquilini): le carte condivise con un gruppo
      sono visibili a tutti i membri, presenti e futuri
- [x] Revoca della condivisione (dal lato di chi condivide o di chi riceve)
- [x] Log di utilizzo: il proprietario di una carta vede chi, tra le persone
      con cui l'ha condivisa, l'ha aperta e quando

## Incluso — Base PWA (non negoziabile per definizione di "PWA")

- [x] Installabilità (manifest, icone, service worker)
- [x] Funzionamento offline in lettura per le carte già sincronizzate

## Escluso dalla v1 (per richiesta esplicita)

Categorie di feature proposte in fase di brainstorming e **non incluse** in
questa versione:

- ❌ *UX da app nativa avanzata*: modalità "mostra alla cassa" con luminosità
  forzata, carte preferite/pinnate, blocco app con biometria, shortcut da
  home screen, feedback aptico
- ❌ *Valore aggiunto*: promemoria scadenza, note sul saldo punti,
  statistiche d'uso, export/import backup cifrato

Queste rimangono candidate naturali per una v2.
