-- Add visibility column to group_chats
-- Run this migration in Supabase SQL editor

alter table public.group_chats
  add column if not exists visibility text not null default 'private'
  check (visibility in ('private', 'friends', 'public'));

-- Replace old restrictive policy
drop policy if exists "See groups you belong to" on public.group_chats;

-- New policy: member OR friend-accessible OR public
create policy "See accessible groups"
  on public.group_chats for select
  using (
    exists (
      select 1 from public.group_members
      where group_id = id and user_id = auth.uid()
    )
    or visibility = 'public'
    or (
      visibility = 'friends' and
      exists (
        select 1 from public.group_members gm
        join public.friendships f on (
          (f.requester = auth.uid() and f.addressee = gm.user_id and f.status = 'accepted') or
          (f.addressee = auth.uid() and f.requester = gm.user_id and f.status = 'accepted')
        )
        where gm.group_id = id
      )
    )
  );
