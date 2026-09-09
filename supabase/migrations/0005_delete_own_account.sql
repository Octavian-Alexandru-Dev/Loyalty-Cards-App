-- Auto-eliminazione dell'account da parte dell'utente stesso.
--
-- "profiles.id" referenzia "auth.users.id" con "on delete cascade", e a
-- cascata anche tutte le altre tabelle che referenziano "profiles" (carte,
-- gruppi, condivisioni, inviti, log utilizzo — vedi 0001_init.sql): basta
-- eliminare la riga in auth.users per far sparire ogni dato dell'utente.
--
-- Un utente autenticato non ha però privilegi DELETE su auth.users (schema
-- gestito da Supabase, non esposto via PostgREST): serve una funzione
-- SECURITY DEFINER, eseguita con i privilegi di chi la crea (il ruolo
-- "postgres" del progetto, che quei privilegi li ha).

create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Devi essere autenticato per eliminare il tuo account';
  end if;

  delete from auth.users where id = auth.uid();
end;
$$;

-- Vedi 0002/0003/0004: Supabase concede EXECUTE esplicitamente anche ad
-- anon/authenticated di default, va revocato e riconcesso solo dove serve.
revoke execute on function public.delete_own_account() from public;
revoke execute on function public.delete_own_account() from anon;
grant execute on function public.delete_own_account() to authenticated;
