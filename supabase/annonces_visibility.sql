-- Add privacy to "propositions de sorties" (annonces)
-- Run this entire script in the Supabase SQL editor.
--
-- visibility values:
--   'public'  → visible to everyone (default, preserves existing rows)
--   'friends' → visible to the creator's friends only
--   'private' → visible to creator + people already joined (invite-only)

alter table public.annonces
  add column if not exists visibility text not null default 'public'
  check (visibility in ('public', 'friends', 'private'));

-- ─── Rewrite the SELECT policy to honour visibility ───
drop policy if exists "Anyone can read annonces" on public.annonces;
drop policy if exists "Read annonces by visibility" on public.annonces;

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
      where ap.annonce_id = annonces.id
        and ap.user_id = auth.uid()
    )
  );
