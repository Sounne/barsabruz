-- ─────────── PROFILES TABLE ───────────
create table if not exists public.profiles (
  id            uuid primary key references auth.users on delete cascade,
  name          text not null,
  handle        text unique,
  bio           text,
  color         text not null default '#C65D3D',
  avatar_letter text not null default 'E',
  created_at    timestamptz not null default now()
);

-- ─────────── ROW LEVEL SECURITY ───────────
alter table public.profiles enable row level security;

-- Tout le monde peut lire les profils (public)
create policy "Profiles are public"
  on public.profiles for select
  using (true);

-- Seul l'utilisateur peut modifier son propre profil
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- L'utilisateur peut créer son propre profil
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- ─────────── TRIGGER: CREATE PROFILE ON SIGNUP ───────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, handle, avatar_letter)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    '@' || lower(replace(split_part(new.email, '@', 1), '.', '_')),
    upper(left(coalesce(new.raw_user_meta_data->>'name', new.email), 1))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
