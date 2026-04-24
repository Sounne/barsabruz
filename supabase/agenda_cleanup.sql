-- Cleanup expired agenda items.
-- Events expire at starts_at. User-created sorties expire at scheduled_at.

alter table public.annonces
  add column if not exists scheduled_at timestamptz;

create index if not exists annonces_scheduled_at_idx
  on public.annonces (scheduled_at);

with parsed as (
  select
    id,
    created_at,
    regexp_match(
      lower(when_text),
      '([0-9]{1,2})\s+([[:alpha:]éèêëàâäîïôöùûüç]+)\.?\s*\.?\s+([0-9]{1,2}):([0-9]{2})'
    ) as parts
  from public.annonces
  where scheduled_at is null
    and when_text is not null
),
resolved as (
  select
    id,
    created_at,
    make_timestamptz(
      extract(year from created_at)::integer,
      case
        when parts[2] like 'janv%' then 1
        when parts[2] like 'fevr%' or parts[2] like 'févr%' then 2
        when parts[2] like 'mars%' then 3
        when parts[2] like 'avr%' then 4
        when parts[2] like 'mai%' then 5
        when parts[2] like 'juin%' then 6
        when parts[2] like 'juil%' then 7
        when parts[2] like 'aout%' or parts[2] like 'août%' then 8
        when parts[2] like 'sept%' then 9
        when parts[2] like 'oct%' then 10
        when parts[2] like 'nov%' then 11
        when parts[2] like 'dec%' or parts[2] like 'déc%' then 12
      end,
      parts[1]::integer,
      parts[3]::integer,
      parts[4]::integer,
      0,
      'Europe/Paris'
    ) as scheduled_at
  from parsed
  where parts is not null
),
adjusted as (
  select
    id,
    case
      when scheduled_at < created_at - interval '180 days'
        then scheduled_at + interval '1 year'
      else scheduled_at
    end as scheduled_at
  from resolved
)
update public.annonces a
set scheduled_at = adjusted.scheduled_at
from adjusted
where a.id = adjusted.id;

create or replace function public.cleanup_expired_agenda_items(p_reference timestamptz default now())
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_events_deleted integer := 0;
  v_annonces_deleted integer := 0;
begin
  delete from public.events
  where starts_at is not null
    and starts_at < p_reference;
  get diagnostics v_events_deleted = row_count;

  delete from public.annonces
  where scheduled_at is not null
    and scheduled_at < p_reference;
  get diagnostics v_annonces_deleted = row_count;

  return jsonb_build_object(
    'events_deleted', v_events_deleted,
    'annonces_deleted', v_annonces_deleted
  );
end;
$$;

grant execute on function public.cleanup_expired_agenda_items(timestamptz) to anon, authenticated;
