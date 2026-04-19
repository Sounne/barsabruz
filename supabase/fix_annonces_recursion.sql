-- Fix: infinite recursion detected in policy for relation "annonces"
-- Run this entire script in the Supabase SQL editor.
--
-- Cause: one (or several) policies on public.annonces reference
-- public.annonces (directly or via another table whose policy
-- references annonces back). We drop ALL existing policies on
-- annonces and recreate a clean, non-recursive set.

alter table public.annonces enable row level security;

-- ─── Drop every existing policy on annonces ───
do $$
declare r record;
begin
  for r in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'annonces'
  loop
    execute format('drop policy if exists %I on public.annonces', r.policyname);
  end loop;
end $$;

-- ─── Recreate clean policies (no self-reference) ───

-- Anyone authenticated can read annonces
create policy "Anyone can read annonces"
  on public.annonces for select
  using (true);

-- Authenticated users can create their own annonce
create policy "Users can create own annonces"
  on public.annonces for insert
  with check (auth.uid() = user_id);

-- Creators can update their own annonce (needed for attending count
-- update from join_annonce/unjoin_annonce SECURITY DEFINER functions,
-- plus any direct update the client might do)
create policy "Creators can update own annonces"
  on public.annonces for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Creators can delete their own annonce
create policy "Creators can delete own annonces"
  on public.annonces for delete
  using (auth.uid() = user_id);
