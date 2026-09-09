-- Hardening dei privilegi sulle funzioni SECURITY DEFINER.
--
-- Il linter di sicurezza di Supabase segnala che is_group_member,
-- card_owner, has_card_access, has_card_reshare_permission e
-- handle_new_user (tutte SECURITY DEFINER) sono chiamabili direttamente da
-- "anon" e "authenticated" via /rest/v1/rpc/<nome_funzione>, perché Postgres
-- concede EXECUTE a PUBLIC su una funzione per default. Queste funzioni non
-- sono pensate per essere chiamate direttamente: servono solo dentro le
-- espressioni USING/WITH CHECK delle policy RLS. Chiamate direttamente,
-- permetterebbero di leggere informazioni che le RLS policy proteggono
-- (es. "chi possiede la carta X", "l'utente Y è membro del gruppo Z?") per
-- un id qualsiasi, aggirando il controllo "solo se ho accesso a quella riga".
--
-- Fix: spostarle in uno schema "private" che PostgREST non espone via REST
-- (di default espone solo "public"). ALTER FUNCTION ... SET SCHEMA sposta la
-- funzione senza toccarne l'OID, quindi le policy RLS e i trigger esistenti
-- continuano a funzionare senza bisogno di essere ridefiniti.
--
-- handle_new_user() resta inoltre eseguibile come trigger anche senza alcun
-- privilegio EXECUTE concesso: l'esecuzione di una funzione trigger non
-- richiede che il ruolo che ha causato l'evento abbia EXECUTE su di essa.
--
-- redeem_card_invite resta invece in "public" (è l'unica funzione pensata
-- per essere chiamata direttamente dal client via supabase.rpc(...)), ma le
-- viene tolto l'EXECUTE implicito a PUBLIC/anon: resta chiamabile solo da
-- "authenticated" (si autoprotegge comunque con il controllo
-- "auth.uid() is null" nel corpo, questo è un ulteriore livello di difesa).

create schema if not exists private;

revoke execute on function public.is_group_member(uuid, uuid) from public;
revoke execute on function public.card_owner(uuid) from public;
revoke execute on function public.has_card_access(uuid, uuid) from public;
revoke execute on function public.has_card_reshare_permission(uuid, uuid) from public;
revoke execute on function public.handle_new_user() from public;
revoke execute on function public.redeem_card_invite(text) from public;

alter function public.is_group_member(uuid, uuid) set schema private;
alter function public.card_owner(uuid) set schema private;
alter function public.has_card_access(uuid, uuid) set schema private;
alter function public.has_card_reshare_permission(uuid, uuid) set schema private;
alter function public.handle_new_user() set schema private;
alter function public.set_updated_at() set schema private;

-- Le funzioni interne si richiamano a vicenda: aggiornate i riferimenti al
-- nuovo schema (erano scritti come public.card_owner(...), ecc.).
create or replace function private.has_card_access(p_card_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select
    private.card_owner(p_card_id) = p_user_id
    or exists (
      select 1 from public.card_shares cs
      where cs.card_id = p_card_id
        and (
          cs.shared_with_user = p_user_id
          or (cs.shared_with_group is not null and private.is_group_member(cs.shared_with_group, p_user_id))
        )
    );
$$;

create or replace function private.has_card_reshare_permission(p_card_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select
    private.card_owner(p_card_id) = p_user_id
    or exists (
      select 1 from public.card_shares cs
      where cs.card_id = p_card_id
        and cs.permission = 'reshare'
        and (
          cs.shared_with_user = p_user_id
          or (cs.shared_with_group is not null and private.is_group_member(cs.shared_with_group, p_user_id))
        )
    );
$$;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_username text;
  candidate text;
  suffix int := 0;
begin
  base_username := lower(regexp_replace(
    coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1)),
    '[^a-z0-9_]', '', 'gi'
  ));
  if base_username is null or length(base_username) < 3 then
    base_username := 'user' || substr(new.id::text, 1, 8);
  end if;
  candidate := base_username;
  loop
    begin
      insert into public.profiles (id, username) values (new.id, candidate);
      exit;
    exception when unique_violation then
      suffix := suffix + 1;
      candidate := base_username || suffix::text;
    end;
  end loop;
  return new;
end;
$$;

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- I trigger puntavano alle versioni in "public": ricreali sulla nuova
-- posizione (il ricreare la funzione con CREATE OR REPLACE sopra non sposta
-- automaticamente il trigger, a differenza di ALTER ... SET SCHEMA sulle
-- altre quattro funzioni, perché qui abbiamo ridefinito il corpo via
-- CREATE OR REPLACE anziché spostare la funzione originale).
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

drop trigger if exists cards_set_updated_at on public.cards;
create trigger cards_set_updated_at
  before update on public.cards
  for each row execute function private.set_updated_at();

-- redeem_card_invite chiama card_owner internamente: aggiorna il riferimento.
create or replace function public.redeem_card_invite(p_token text)
returns table (redeemed_card_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite record;
begin
  if auth.uid() is null then
    raise exception 'Devi essere autenticato per riscattare un invito';
  end if;

  select * into v_invite from public.share_invites where token = p_token for update;
  if not found then
    raise exception 'Invito non valido';
  end if;
  if v_invite.expires_at is not null and v_invite.expires_at < now() then
    raise exception 'Invito scaduto';
  end if;
  if v_invite.redeemed_by is not null then
    raise exception 'Invito già utilizzato';
  end if;
  if v_invite.created_by = auth.uid() or private.card_owner(v_invite.card_id) = auth.uid() then
    raise exception 'Non puoi riscattare un invito per una carta che già possiedi';
  end if;

  insert into public.card_shares (card_id, shared_by, shared_with_user, permission)
  values (v_invite.card_id, v_invite.created_by, auth.uid(), v_invite.permission)
  on conflict (card_id, shared_with_user) where shared_with_user is not null do nothing;

  update public.share_invites set redeemed_by = auth.uid() where id = v_invite.id;

  return query select v_invite.card_id as redeemed_card_id;
end;
$$;

-- Le policy RLS chiamano le funzioni tramite l'espressione USING/WITH CHECK:
-- il ruolo che esegue la query (authenticated) deve poter usare lo schema
-- "private" e le funzioni al suo interno, anche se PostgREST non le espone
-- come endpoint REST. "anon" non ne ha bisogno: non ha alcun privilegio
-- sulle tabelle applicative, quindi le sue query non arrivano mai a
-- valutare queste policy.
grant usage on schema private to authenticated;
grant execute on function private.is_group_member(uuid, uuid) to authenticated;
grant execute on function private.card_owner(uuid) to authenticated;
grant execute on function private.has_card_access(uuid, uuid) to authenticated;
grant execute on function private.has_card_reshare_permission(uuid, uuid) to authenticated;

grant execute on function public.redeem_card_invite(text) to authenticated;
