-- Permette a chi riceve una carta condivisa (direttamente o via gruppo) di
-- nasconderla dalla propria lista senza revocare la condivisione: è una
-- preferenza personale di chi guarda, non un'azione su chi condivide, quindi
-- non tocca "card_shares" né richiede permessi su di essa. Va salvata lato
-- server (non in localStorage come l'ordine delle carte) perché deve valere
-- su tutti i dispositivi dell'utente.

create table if not exists public.hidden_cards (
  user_id uuid not null references public.profiles (id) on delete cascade,
  card_id uuid not null references public.cards (id) on delete cascade,
  hidden_at timestamptz not null default now(),
  primary key (user_id, card_id)
);

create index if not exists hidden_cards_card_idx on public.hidden_cards (card_id);

alter table public.hidden_cards enable row level security;

drop policy if exists hidden_cards_select on public.hidden_cards;
create policy hidden_cards_select on public.hidden_cards
  for select using (user_id = auth.uid());

drop policy if exists hidden_cards_insert on public.hidden_cards;
create policy hidden_cards_insert on public.hidden_cards
  for insert with check (user_id = auth.uid());

drop policy if exists hidden_cards_delete on public.hidden_cards;
create policy hidden_cards_delete on public.hidden_cards
  for delete using (user_id = auth.uid());

grant select, insert, delete on public.hidden_cards to authenticated;

-- accessible_cards: stessa logica di 0006 (dedup delle vie di accesso), con
-- l'aggiunta di "is_hidden" calcolato con un left join su hidden_cards.
drop view if exists public.accessible_cards;
create view public.accessible_cards
with (security_invoker = true) as
with access_rows as (
  select c.id as card_id, 'owner'::text as access, 0 as priority, null::text as shared_by_username
  from public.cards c
  where c.owner_id = auth.uid()
  union all
  select cs.card_id, cs.permission as access,
    case cs.permission when 'reshare' then 1 else 2 end as priority,
    sp.username as shared_by_username
  from public.card_shares cs
  left join public.profiles sp on sp.id = cs.shared_by
  where cs.shared_with_user = auth.uid()
  union all
  select cs.card_id, cs.permission as access,
    case cs.permission when 'reshare' then 1 else 2 end as priority,
    sp.username as shared_by_username
  from public.card_shares cs
  join public.group_members gm on gm.group_id = cs.shared_with_group and gm.user_id = auth.uid()
  left join public.profiles sp on sp.id = cs.shared_by
  where cs.shared_with_group is not null
),
best_access as (
  select distinct on (card_id) card_id, access, shared_by_username
  from access_rows
  order by card_id, priority asc
)
select c.*, b.access, b.shared_by_username, (h.user_id is not null) as is_hidden
from public.cards c
join best_access b on b.card_id = c.id
left join public.hidden_cards h on h.card_id = c.id and h.user_id = auth.uid();

grant select on public.accessible_cards to authenticated;
