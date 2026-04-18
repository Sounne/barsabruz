-- Participant tracking for sorties ("Ils sortent ce soir")
-- Run AFTER annonces_user_id.sql

create table if not exists public.annonce_participants (
  annonce_id text references public.annonces(id) on delete cascade,
  user_id    uuid references auth.users(id) on delete cascade,
  joined_at  timestamptz default now(),
  primary key (annonce_id, user_id)
);

alter table public.annonce_participants enable row level security;

drop policy if exists "Anyone can read annonce_participants" on public.annonce_participants;
drop policy if exists "Users can join annonces"             on public.annonce_participants;
drop policy if exists "Users can unjoin annonces"           on public.annonce_participants;

create policy "Anyone can read annonce_participants"
  on public.annonce_participants for select using (true);

create policy "Users can join annonces"
  on public.annonce_participants for insert
  with check (auth.uid() = user_id);

create policy "Users can unjoin annonces"
  on public.annonce_participants for delete
  using (auth.uid() = user_id);

-- Creators can delete their own annonce
drop policy if exists "Creators can delete own annonces" on public.annonces;
create policy "Creators can delete own annonces"
  on public.annonces for delete
  using (auth.uid() = user_id);

-- Atomic join: insert participant + recount attending
create or replace function public.join_annonce(p_annonce_id text, p_user_id uuid)
returns int language plpgsql security definer as $$
declare v_count int; begin
  insert into public.annonce_participants (annonce_id, user_id)
  values (p_annonce_id, p_user_id)
  on conflict do nothing;
  select count(*) into v_count
  from public.annonce_participants where annonce_id = p_annonce_id;
  update public.annonces set attending = v_count where id = p_annonce_id;
  return v_count;
end; $$;

-- Atomic unjoin: remove participant + recount attending
create or replace function public.unjoin_annonce(p_annonce_id text, p_user_id uuid)
returns int language plpgsql security definer as $$
declare v_count int; begin
  delete from public.annonce_participants
  where annonce_id = p_annonce_id and user_id = p_user_id;
  select count(*) into v_count
  from public.annonce_participants where annonce_id = p_annonce_id;
  update public.annonces set attending = v_count where id = p_annonce_id;
  return v_count;
end; $$;
