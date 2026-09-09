-- Supabase concede EXECUTE su ogni nuova funzione a "anon", "authenticated" e
-- "service_role" come privilegio di default (non tramite lo pseudo-ruolo
-- PUBLIC, ma come grant esplicito a ciascun ruolo), quindi il semplice
-- "REVOKE ... FROM PUBLIC" della migration precedente non bastava a togliere
-- l'accesso ad "anon". Per redeem_card_invite questo è un problema concreto,
-- perché è nello schema "public" esposto da PostgREST: un chiamante anonimo
-- può raggiungerla via /rest/v1/rpc/redeem_card_invite (la funzione si
-- autodifende comunque rifiutando auth.uid() null, ma non deve essere
-- comunque concessa). Per le funzioni in schema "private" non è invece un
-- problema di sicurezza reale — PostgREST non espone quello schema
-- indipendentemente dai grant SQL — ma togliamo comunque l'EXECUTE ad
-- "anon" per igiene e minimo privilegio.

revoke execute on function public.redeem_card_invite(text) from anon;

revoke execute on function private.card_owner(uuid) from anon;
revoke execute on function private.is_group_member(uuid, uuid) from anon;
revoke execute on function private.has_card_access(uuid, uuid) from anon;
revoke execute on function private.has_card_reshare_permission(uuid, uuid) from anon;
revoke execute on function private.handle_new_user() from anon;
revoke execute on function private.set_updated_at() from anon, public;
