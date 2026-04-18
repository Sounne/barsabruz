-- Fix: infinite recursion in group_members RLS policy
-- Run this entire script in Supabase SQL editor

-- Helper: checks if current user is a group member (security definer bypasses RLS)
create or replace function public.current_user_in_group(gid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.group_members
    where group_id = gid and user_id = auth.uid()
  )
$$;

-- Helper: checks if any accepted friend of current user is in the group
create or replace function public.group_has_friend_member(gid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.group_members gm
    join public.friendships f on (
      (f.requester = auth.uid() and f.addressee = gm.user_id and f.status = 'accepted') or
      (f.addressee = auth.uid() and f.requester = gm.user_id and f.status = 'accepted')
    )
    where gm.group_id = gid
  )
$$;

-- Fix group_members SELECT policy (was self-referencing → recursion)
drop policy if exists "See group members" on public.group_members;
create policy "See group members"
  on public.group_members for select
  using (current_user_in_group(group_id));

-- Update group_chats SELECT policy to use helper functions
drop policy if exists "See accessible groups" on public.group_chats;
drop policy if exists "See groups you belong to" on public.group_chats;
create policy "See accessible groups"
  on public.group_chats for select
  using (
    auth.uid() = created_by
    or current_user_in_group(id)
    or visibility = 'public'
    or (visibility = 'friends' and group_has_friend_member(id))
  );

-- Update group_messages policies to use helper function
drop policy if exists "Read group messages" on public.group_messages;
create policy "Read group messages"
  on public.group_messages for select
  using (current_user_in_group(group_id));

drop policy if exists "Send group message" on public.group_messages;
create policy "Send group message"
  on public.group_messages for insert
  with check (
    auth.uid() = sender_id and
    current_user_in_group(group_id)
  );
