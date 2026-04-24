-- Agenda backend: public bars/events access + richer event metadata + attendance tracking

alter table public.bars enable row level security;
alter table public.events enable row level security;

drop policy if exists "Public can read bars" on public.bars;
create policy "Public can read bars"
  on public.bars for select
  using (true);

drop policy if exists "Public can read events" on public.events;
create policy "Public can read events"
  on public.events for select
  using (true);

alter table public.events
  add column if not exists starts_at timestamptz,
  add column if not exists description text;

create index if not exists events_starts_at_idx
  on public.events (starts_at);

update public.events
set
  starts_at = case id
    when 'e1' then '2026-04-25T19:30:00+02:00'::timestamptz
    when 'e2' then '2026-04-27T17:00:00+02:00'::timestamptz
    when 'e3' then '2026-05-01T20:00:00+02:00'::timestamptz
    when 'e4' then '2026-04-23T21:00:00+02:00'::timestamptz
    when 'e5' then '2026-04-26T21:00:00+02:00'::timestamptz
    when 'e6' then '2026-04-30T20:30:00+02:00'::timestamptz
    when 'e7' then '2026-04-24T20:00:00+02:00'::timestamptz
    when 'e8' then '2026-05-03T16:00:00+02:00'::timestamptz
    else starts_at
  end,
  description = case id
    when 'e1' then 'Une dégustation guidée autour des vins du Languedoc avec accords maison et ambiance conviviale à partager entre amis.'
    when 'e2' then 'Fin de semaine en douceur avec un DJ set lounge, cocktails signature et terrasse animée jusque tard.'
    when 'e3' then 'Une soirée tapas et flamenco à l''accent chaleureux, pensée pour prolonger l''afterwork autour d''une scène live.'
    when 'e4' then 'Le grand quiz du mercredi revient avec une édition spéciale années 90, équipes bienvenues et bonne humeur garantie.'
    when 'e5' then 'Le match est diffusé en grand écran avec ambiance de tribune, bières pression et planches à partager.'
    when 'e6' then 'Scène ouverte pour chanteurs, musiciennes et groupes locaux, avec micro libre et public au plus près.'
    when 'e7' then 'Retrouve l''ambiance live de L''Arrière-Cour et rejoins la communauté pour une soirée acoustique à 20:00.'
    when 'e8' then 'Le lancement de la terrasse s''annonce festif avec carte cocktail élargie, musique et premiers rayons du printemps.'
    else description
  end
where id in ('e1', 'e2', 'e3', 'e4', 'e5', 'e6', 'e7', 'e8');

create table if not exists public.event_attendees (
  event_id text not null references public.events(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

create index if not exists event_attendees_user_idx
  on public.event_attendees (user_id);

create index if not exists event_attendees_event_idx
  on public.event_attendees (event_id);

alter table public.event_attendees enable row level security;

drop policy if exists "Anyone can read event attendees" on public.event_attendees;
create policy "Anyone can read event attendees"
  on public.event_attendees for select
  using (true);

drop policy if exists "Users can join events" on public.event_attendees;
create policy "Users can join events"
  on public.event_attendees for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can unjoin events" on public.event_attendees;
create policy "Users can unjoin events"
  on public.event_attendees for delete
  to authenticated
  using ((select auth.uid()) = user_id);

create or replace function public.join_event(p_event_id text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_attending integer;
  v_rows integer;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  insert into public.event_attendees (event_id, user_id)
  values (p_event_id, v_user_id)
  on conflict do nothing;

  get diagnostics v_rows = row_count;

  if v_rows > 0 then
    update public.events
    set attending = coalesce(attending, 0) + 1
    where id = p_event_id
    returning attending into v_attending;
  else
    select attending into v_attending
    from public.events
    where id = p_event_id;
  end if;

  return coalesce(v_attending, 0);
end;
$$;

create or replace function public.unjoin_event(p_event_id text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_attending integer;
  v_rows integer;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  delete from public.event_attendees
  where event_id = p_event_id
    and user_id = v_user_id;

  get diagnostics v_rows = row_count;

  if v_rows > 0 then
    update public.events
    set attending = greatest(coalesce(attending, 0) - 1, 0)
    where id = p_event_id
    returning attending into v_attending;
  else
    select attending into v_attending
    from public.events
    where id = p_event_id;
  end if;

  return coalesce(v_attending, 0);
end;
$$;
