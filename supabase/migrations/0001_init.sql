-- Loyalty Cards App — schema iniziale
-- Idempotente quanto ragionevolmente possibile: eseguibile una volta su un
-- progetto Supabase nuovo. Vedi docs/DATABASE.md per la spiegazione del
-- modello e delle scelte di sicurezza.

create extension if not exists pgcrypto;

-- ============================================================================
-- TABELLE
-- ============================================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique check (char_length(username) between 3 and 24 and username ~ '^[a-z0-9_]+$'),
  created_at timestamptz not null default now()
);

create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 60),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.group_members (
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create table if not exists public.cards (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  label text not null check (char_length(label) between 1 and 80),
  brand_key text,
  code_value text not null check (char_length(code_value) between 1 and 512),
  code_format text not null,
  color text not null default '#2563eb',
  icon text not null default 'card',
  category text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.card_shares (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null references public.cards (id) on delete cascade,
  shared_by uuid not null references public.profiles (id) on delete cascade,
  shared_with_user uuid references public.profiles (id) on delete cascade,
  shared_with_group uuid references public.groups (id) on delete cascade,
  permission text not null default 'view' check (permission in ('view', 'reshare')),
  created_at timestamptz not null default now(),
  constraint card_shares_target_check check (
    (shared_with_user is not null)::int + (shared_with_group is not null)::int = 1
  )
);

create unique index if not exists card_shares_unique_user
  on public.card_shares (card_id, shared_with_user)
  where shared_with_user is not null;

create unique index if not exists card_shares_unique_group
  on public.card_shares (card_id, shared_with_group)
  where shared_with_group is not null;

create table if not exists public.share_invites (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null references public.cards (id) on delete cascade,
  created_by uuid not null references public.profiles (id) on delete cascade,
  permission text not null default 'view' check (permission in ('view', 'reshare')),
  token text not null unique default encode(gen_random_bytes(16), 'hex'),
  expires_at timestamptz,
  redeemed_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create table if not exists public.card_usage_log (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null references public.cards (id) on delete cascade,
  used_by uuid not null references public.profiles (id) on delete cascade,
  used_at timestamptz not null default now()
);

create index if not exists cards_owner_idx on public.cards (owner_id);
create index if not exists card_shares_card_idx on public.card_shares (card_id);
create index if not exists card_shares_user_idx on public.card_shares (shared_with_user);
create index if not exists card_shares_group_idx on public.card_shares (shared_with_group);
create index if not exists group_members_user_idx on public.group_members (user_id);
create index if not exists card_usage_log_card_idx on public.card_usage_log (card_id);
create index if not exists share_invites_card_idx on public.share_invites (card_id);

-- ============================================================================
-- FUNZIONI DI SUPPORTO (SECURITY DEFINER)
--
-- Usate dentro le policy RLS per evitare la ricorsione che Postgres
-- rileverebbe se una tabella referenziasse se stessa (group_members) o due
-- tabelle si referenziassero a vicenda (cards <-> card_shares) direttamente
-- dentro le policy. Sono funzioni "a esito booleano/id", non espongono dati:
-- restano sicure anche girando con privilegi elevati.
-- ============================================================================

create or replace function public.is_group_member(p_group_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.group_members gm
    where gm.group_id = p_group_id and gm.user_id = p_user_id
  );
$$;

create or replace function public.card_owner(p_card_id uuid)
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select owner_id from public.cards where id = p_card_id;
$$;

create or replace function public.has_card_access(p_card_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select
    public.card_owner(p_card_id) = p_user_id
    or exists (
      select 1 from public.card_shares cs
      where cs.card_id = p_card_id
        and (
          cs.shared_with_user = p_user_id
          or (cs.shared_with_group is not null and public.is_group_member(cs.shared_with_group, p_user_id))
        )
    );
$$;

create or replace function public.has_card_reshare_permission(p_card_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select
    public.card_owner(p_card_id) = p_user_id
    or exists (
      select 1 from public.card_shares cs
      where cs.card_id = p_card_id
        and cs.permission = 'reshare'
        and (
          cs.shared_with_user = p_user_id
          or (cs.shared_with_group is not null and public.is_group_member(cs.shared_with_group, p_user_id))
        )
    );
$$;

-- ============================================================================
-- TRIGGER: crea automaticamente il profilo alla registrazione
-- ============================================================================

create or replace function public.handle_new_user()
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

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists cards_set_updated_at on public.cards;
create trigger cards_set_updated_at
  before update on public.cards
  for each row execute function public.set_updated_at();

-- ============================================================================
-- FUNZIONE RPC: riscatto di un invito di condivisione via QR/link
-- ============================================================================

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
  if v_invite.created_by = auth.uid() or public.card_owner(v_invite.card_id) = auth.uid() then
    raise exception 'Non puoi riscattare un invito per una carta che già possiedi';
  end if;

  insert into public.card_shares (card_id, shared_by, shared_with_user, permission)
  values (v_invite.card_id, v_invite.created_by, auth.uid(), v_invite.permission)
  on conflict (card_id, shared_with_user) where shared_with_user is not null do nothing;

  update public.share_invites set redeemed_by = auth.uid() where id = v_invite.id;

  return query select v_invite.card_id as redeemed_card_id;
end;
$$;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

alter table public.profiles enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.cards enable row level security;
alter table public.card_shares enable row level security;
alter table public.share_invites enable row level security;
alter table public.card_usage_log enable row level security;

-- profiles: chiunque autenticato può cercare uno username, ognuno modifica solo il proprio
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select using (auth.uid() is not null);

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles
  for insert with check (id = auth.uid());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- groups
drop policy if exists groups_select on public.groups;
create policy groups_select on public.groups
  for select using (owner_id = auth.uid() or public.is_group_member(id, auth.uid()));

drop policy if exists groups_insert on public.groups;
create policy groups_insert on public.groups
  for insert with check (owner_id = auth.uid());

drop policy if exists groups_update on public.groups;
create policy groups_update on public.groups
  for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists groups_delete on public.groups;
create policy groups_delete on public.groups
  for delete using (owner_id = auth.uid());

-- group_members
drop policy if exists group_members_select on public.group_members;
create policy group_members_select on public.group_members
  for select using (user_id = auth.uid() or public.is_group_member(group_id, auth.uid()));

drop policy if exists group_members_insert on public.group_members;
create policy group_members_insert on public.group_members
  for insert with check (
    exists (select 1 from public.groups g where g.id = group_id and g.owner_id = auth.uid())
  );

drop policy if exists group_members_delete on public.group_members;
create policy group_members_delete on public.group_members
  for delete using (
    user_id = auth.uid()
    or exists (select 1 from public.groups g where g.id = group_id and g.owner_id = auth.uid())
  );

-- cards
--
-- NB: la condizione "owner_id = auth.uid()" è scritta come confronto diretto
-- di colonna, non tramite la funzione has_card_access(): se si passa da una
-- funzione che ri-legge la tabella "cards" per il proprio controllo di
-- appartenenza, Postgres può non vedere ancora la riga appena inserita
-- quando la policy viene rivalutata per un INSERT ... RETURNING sulla
-- stessa tabella, facendo fallire erroneamente l'operazione con "new row
-- violates row-level security policy". Il confronto diretto sulla colonna
-- della riga in corso di valutazione non ha questo problema.
drop policy if exists cards_select on public.cards;
create policy cards_select on public.cards
  for select using (
    owner_id = auth.uid()
    or exists (
      select 1 from public.card_shares cs
      where cs.card_id = cards.id
        and (
          cs.shared_with_user = auth.uid()
          or (cs.shared_with_group is not null and public.is_group_member(cs.shared_with_group, auth.uid()))
        )
    )
  );

drop policy if exists cards_insert on public.cards;
create policy cards_insert on public.cards
  for insert with check (owner_id = auth.uid());

drop policy if exists cards_update on public.cards;
create policy cards_update on public.cards
  for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists cards_delete on public.cards;
create policy cards_delete on public.cards
  for delete using (owner_id = auth.uid());

-- card_shares
drop policy if exists card_shares_select on public.card_shares;
create policy card_shares_select on public.card_shares
  for select using (
    shared_by = auth.uid()
    or shared_with_user = auth.uid()
    or (shared_with_group is not null and public.is_group_member(shared_with_group, auth.uid()))
    or public.card_owner(card_id) = auth.uid()
  );

drop policy if exists card_shares_insert on public.card_shares;
create policy card_shares_insert on public.card_shares
  for insert with check (
    shared_by = auth.uid() and public.has_card_reshare_permission(card_id, auth.uid())
  );

drop policy if exists card_shares_delete on public.card_shares;
create policy card_shares_delete on public.card_shares
  for delete using (
    shared_by = auth.uid()
    or shared_with_user = auth.uid()
    or public.card_owner(card_id) = auth.uid()
  );

-- share_invites
drop policy if exists share_invites_select on public.share_invites;
create policy share_invites_select on public.share_invites
  for select using (created_by = auth.uid());

drop policy if exists share_invites_insert on public.share_invites;
create policy share_invites_insert on public.share_invites
  for insert with check (
    created_by = auth.uid() and public.has_card_reshare_permission(card_id, auth.uid())
  );

drop policy if exists share_invites_delete on public.share_invites;
create policy share_invites_delete on public.share_invites
  for delete using (created_by = auth.uid());

-- card_usage_log
drop policy if exists card_usage_log_select on public.card_usage_log;
create policy card_usage_log_select on public.card_usage_log
  for select using (used_by = auth.uid() or public.card_owner(card_id) = auth.uid());

drop policy if exists card_usage_log_insert on public.card_usage_log;
create policy card_usage_log_insert on public.card_usage_log
  for insert with check (used_by = auth.uid() and public.has_card_access(card_id, auth.uid()));

-- ============================================================================
-- VISTA DI COMODO: tutte le carte accessibili dall'utente corrente, con il
-- livello di accesso. security_invoker=true è essenziale: senza, la vista
-- girerebbe con i privilegi (e quindi bypass RLS) del suo proprietario.
-- ============================================================================

drop view if exists public.accessible_cards;
create view public.accessible_cards
with (security_invoker = true) as
  select c.*, 'owner'::text as access, null::text as shared_by_username
  from public.cards c
  where c.owner_id = auth.uid()
  union all
  select c.*, cs.permission as access, sp.username as shared_by_username
  from public.cards c
  join public.card_shares cs on cs.card_id = c.id
  left join public.profiles sp on sp.id = cs.shared_by
  where cs.shared_with_user = auth.uid()
  union all
  select c.*, cs.permission as access, sp.username as shared_by_username
  from public.cards c
  join public.card_shares cs on cs.card_id = c.id
  join public.group_members gm on gm.group_id = cs.shared_with_group and gm.user_id = auth.uid()
  left join public.profiles sp on sp.id = cs.shared_by
  where cs.shared_with_group is not null;

-- ============================================================================
-- PRIVILEGI: nessun accesso ad anon, accesso pieno (filtrato da RLS) ad authenticated
-- ============================================================================

revoke all on all tables in schema public from anon;

grant usage on schema public to authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.groups to authenticated;
grant select, insert, delete on public.group_members to authenticated;
grant select, insert, update, delete on public.cards to authenticated;
grant select, insert, delete on public.card_shares to authenticated;
grant select, insert, delete on public.share_invites to authenticated;
grant select, insert on public.card_usage_log to authenticated;
grant select on public.accessible_cards to authenticated;
grant execute on function public.redeem_card_invite(text) to authenticated;
