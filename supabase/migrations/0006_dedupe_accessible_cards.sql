-- Fix: accessible_cards restituiva più righe per la stessa carta quando
-- c'era più di una via di accesso — es. il proprietario è anche membro del
-- gruppo con cui condivide la carta (owner + condivisione di gruppo), o una
-- carta è condivisa sia con un utente direttamente sia con un gruppo di cui
-- fa parte (condivisione utente + condivisione di gruppo). La vista era un
-- semplice UNION ALL dei tre casi (proprietario / condivisa con me /
-- condivisa con un mio gruppo): nessuna deduplica, quindi la stessa carta
-- compariva più volte nella lista.
--
-- Fix: per ogni carta si raccolgono tutte le vie di accesso in una CTE, poi
-- si tiene solo la "migliore" (owner > reshare > view) con
-- "distinct on (card_id) ... order by priority" invece di restituirle tutte.

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
select c.*, b.access, b.shared_by_username
from public.cards c
join best_access b on b.card_id = c.id;

grant select on public.accessible_cards to authenticated;
