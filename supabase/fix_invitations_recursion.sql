-- Fix: infinite recursion detected in policy for relation "annonces"
--
-- Cause: public.annonces SELECT policy contained
--   exists (select 1 from annonce_invitations ...)
-- while public.annonce_invitations policies contained
--   exists (select 1 from annonces ...)
-- → each RLS check triggers the other → recursion.
--
-- Fix:
--   1. Replace the cross-table exists() with SECURITY DEFINER helpers
--      that bypass RLS.
--   2. On annonce_invitations, the inviter_id already equals the annonce
--      creator (only creator can insert per policy), so the "creator
--      can see" clause is redundant — drop the subquery.
--
-- Run this ENTIRELY in the Supabase SQL editor after annonce_invitations.sql.

-- ─── SECURITY DEFINER helpers (bypass RLS, avoid recursion) ───

create or replace function public.user_owns_annonce(p_annonce_id text, p_user_id uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.annonces
    where id = p_annonce_id and user_id = p_user_id
  );
$$;

create or replace function public.user_invited_to_annonce(p_annonce_id text, p_user_id uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.annonce_invitations
    where annonce_id = p_annonce_id and invitee_id = p_user_id
  );
$$;

-- ─── Drop all annonces policies and recreate cleanly ───
do $$
declare r record; begin
  for r in select policyname from pg_policies where schemaname='public' and tablename='annonces'
  loop execute format('drop policy if exists %I on public.annonces', r.policyname); end loop;
end $$;

create policy "Read annonces by visibility"
  on public.annonces for select
  using (
    visibility = 'public'
    or auth.uid() = user_id
    or (
      visibility = 'friends'
      and exists (
        select 1 from public.friendships f
        where f.status = 'accepted'
          and (
            (f.requester = auth.uid() and f.addressee = annonces.user_id)
            or (f.addressee = auth.uid() and f.requester = annonces.user_id)
          )
      )
    )
    or exists (
      select 1 from public.annonce_participants ap
      where ap.annonce_id = annonces.id and ap.user_id = auth.uid()
    )
    or public.user_invited_to_annonce(annonces.id, auth.uid())
  );

create policy "Users can create own annonces"
  on public.annonces for insert
  with check (auth.uid() = user_id);

create policy "Creators can update own annonces"
  on public.annonces for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Creators can delete own annonces"
  on public.annonces for delete
  using (auth.uid() = user_id);

-- ─── Drop all annonce_invitations policies and recreate without recursion ───
do $$
declare r record; begin
  for r in select policyname from pg_policies where schemaname='public' and tablename='annonce_invitations'
  loop execute format('drop policy if exists %I on public.annonce_invitations', r.policyname); end loop;
end $$;

-- inviter_id IS the creator (enforced on insert), so inviter_id check covers
-- the "creator can see invitations for their sortie" case without touching annonces.
create policy "See own invitations"
  on public.annonce_invitations for select
  using (auth.uid() = inviter_id or auth.uid() = invitee_id);

create policy "Create invitations"
  on public.annonce_invitations for insert
  with check (
    auth.uid() = inviter_id
    and public.user_owns_annonce(annonce_id, auth.uid())
  );

create policy "Respond to own invitation"
  on public.annonce_invitations for update
  using (auth.uid() = invitee_id)
  with check (auth.uid() = invitee_id);

create policy "Delete own invitation"
  on public.annonce_invitations for delete
  using (auth.uid() = inviter_id or auth.uid() = invitee_id);
