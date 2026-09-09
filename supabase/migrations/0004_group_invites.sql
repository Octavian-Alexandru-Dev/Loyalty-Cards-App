-- Link di invito per i gruppi.
--
-- A differenza degli inviti-carta (share_invites, a singolo uso: una volta
-- riscattati non sono più validi), un invito di gruppo è pensato per essere
-- condiviso una volta e usato da più persone (es. il link del gruppo
-- "famiglia" o "coinquilini" mandato su una chat): resta valido finché non
-- scade o il proprietario del gruppo lo revoca esplicitamente.
--
-- Solo il proprietario del gruppo può generare o revocare un link (stessa
-- restrizione già in vigore per l'aggiunta diretta di membri, vedi
-- group_members_insert in 0001_init.sql).

create table if not exists public.group_invites (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  created_by uuid not null references public.profiles (id) on delete cascade,
  token text not null unique default encode(gen_random_bytes(16), 'hex'),
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists group_invites_group_idx on public.group_invites (group_id);

alter table public.group_invites enable row level security;

drop policy if exists group_invites_select on public.group_invites;
create policy group_invites_select on public.group_invites
  for select using (created_by = auth.uid());

drop policy if exists group_invites_insert on public.group_invites;
create policy group_invites_insert on public.group_invites
  for insert with check (
    created_by = auth.uid()
    and exists (select 1 from public.groups g where g.id = group_id and g.owner_id = auth.uid())
  );

drop policy if exists group_invites_delete on public.group_invites;
create policy group_invites_delete on public.group_invites
  for delete using (
    created_by = auth.uid()
    or exists (select 1 from public.groups g where g.id = group_id and g.owner_id = auth.uid())
  );

-- ============================================================================
-- FUNZIONE RPC: riscatto di un invito di gruppo via link
--
-- SECURITY DEFINER perché deve poter inserire in group_members per conto di
-- chi riscatta l'invito, cosa che la policy group_members_insert (solo il
-- proprietario del gruppo può aggiungere membri) altrimenti impedirebbe: è
-- esattamente lo stesso schema già usato per redeem_card_invite rispetto a
-- card_shares_insert. ON CONFLICT DO NOTHING rende il riscatto idempotente
-- (riaprire lo stesso link da già-membro, incluso il proprietario, non
-- genera errore).
-- ============================================================================

create or replace function public.redeem_group_invite(p_token text)
returns table (joined_group_id uuid)
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

  select * into v_invite from public.group_invites where token = p_token;
  if not found then
    raise exception 'Invito non valido';
  end if;
  if v_invite.expires_at is not null and v_invite.expires_at < now() then
    raise exception 'Invito scaduto';
  end if;

  insert into public.group_members (group_id, user_id, role)
  values (v_invite.group_id, auth.uid(), 'member')
  on conflict (group_id, user_id) do nothing;

  return query select v_invite.group_id as joined_group_id;
end;
$$;

-- Vedi 0002/0003: Postgres concede EXECUTE a PUBLIC di default, e Supabase
-- concede esplicitamente anche ad anon/authenticated/service_role. Qui
-- serve raggiungibile solo da "authenticated" (si autodifende comunque con
-- il controllo "auth.uid() is null" nel corpo).
revoke execute on function public.redeem_group_invite(text) from public;
revoke execute on function public.redeem_group_invite(text) from anon;
grant execute on function public.redeem_group_invite(text) to authenticated;

grant select, insert, delete on public.group_invites to authenticated;
