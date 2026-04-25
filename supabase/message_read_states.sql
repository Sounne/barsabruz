-- Synced read state for social message badges.

create table if not exists public.group_message_reads (
  group_id uuid not null references public.group_chats(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  last_read_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create table if not exists public.direct_message_reads (
  user_id uuid not null references public.profiles(id) on delete cascade,
  friend_id uuid not null references public.profiles(id) on delete cascade,
  last_read_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, friend_id),
  check (user_id <> friend_id)
);

create or replace function public.set_message_read_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_group_message_reads_updated_at on public.group_message_reads;
create trigger set_group_message_reads_updated_at
before update on public.group_message_reads
for each row
execute function public.set_message_read_updated_at();

drop trigger if exists set_direct_message_reads_updated_at on public.direct_message_reads;
create trigger set_direct_message_reads_updated_at
before update on public.direct_message_reads
for each row
execute function public.set_message_read_updated_at();

alter table public.group_message_reads enable row level security;
alter table public.direct_message_reads enable row level security;

drop policy if exists "Users can read their group read states" on public.group_message_reads;
create policy "Users can read their group read states"
on public.group_message_reads
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can upsert their group read states" on public.group_message_reads;
create policy "Users can upsert their group read states"
on public.group_message_reads
for insert
to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.group_members gm
    where gm.group_id = group_message_reads.group_id
      and gm.user_id = auth.uid()
  )
);

drop policy if exists "Users can update their group read states" on public.group_message_reads;
create policy "Users can update their group read states"
on public.group_message_reads
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can read their direct read states" on public.direct_message_reads;
create policy "Users can read their direct read states"
on public.direct_message_reads
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can upsert their direct read states" on public.direct_message_reads;
create policy "Users can upsert their direct read states"
on public.direct_message_reads
for insert
to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.friendships f
    where f.status = 'accepted'
      and (
        (f.requester = auth.uid() and f.addressee = direct_message_reads.friend_id)
        or (f.addressee = auth.uid() and f.requester = direct_message_reads.friend_id)
      )
  )
);

drop policy if exists "Users can update their direct read states" on public.direct_message_reads;
create policy "Users can update their direct read states"
on public.direct_message_reads
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create or replace function public.get_group_unread_counts(p_user_id uuid)
returns table (
  group_id uuid,
  unread_count bigint,
  last_message_text text,
  last_message_at timestamptz
)
language sql
security definer
set search_path = ''
as $$
  select
    gc.id as group_id,
    count(gm_unread.id) as unread_count,
    lm.text as last_message_text,
    lm.created_at as last_message_at
  from public.group_chats gc
  join public.group_members my_membership
    on my_membership.group_id = gc.id
   and my_membership.user_id = p_user_id
  left join public.group_message_reads gmr
    on gmr.group_id = gc.id
   and gmr.user_id = p_user_id
  left join public.group_messages gm_unread
    on gm_unread.group_id = gc.id
   and gm_unread.sender_id is distinct from p_user_id
   and gm_unread.created_at > coalesce(gmr.last_read_at, '-infinity'::timestamptz)
  left join lateral (
    select text, created_at
    from public.group_messages
    where group_id = gc.id
    order by created_at desc
    limit 1
  ) lm on true
  where auth.uid() = p_user_id
  group by gc.id, lm.text, lm.created_at;
$$;

create or replace function public.get_direct_unread_counts(p_user_id uuid)
returns table (
  friend_id uuid,
  unread_count bigint,
  last_message_text text,
  last_message_at timestamptz
)
language sql
security definer
set search_path = ''
as $$
  with friends as (
    select case
      when requester = p_user_id then addressee
      else requester
    end as friend_id
    from public.friendships
    where status = 'accepted'
      and (requester = p_user_id or addressee = p_user_id)
  )
  select
    f.friend_id,
    count(dm_unread.id) as unread_count,
    lm.text as last_message_text,
    lm.created_at as last_message_at
  from friends f
  left join public.direct_message_reads dmr
    on dmr.user_id = p_user_id
   and dmr.friend_id = f.friend_id
  left join public.direct_messages dm_unread
    on dm_unread.sender_id = f.friend_id
   and dm_unread.recipient_id = p_user_id
   and dm_unread.created_at > coalesce(dmr.last_read_at, '-infinity'::timestamptz)
  left join lateral (
    select text, created_at
    from public.direct_messages
    where (sender_id = p_user_id and recipient_id = f.friend_id)
       or (sender_id = f.friend_id and recipient_id = p_user_id)
    order by created_at desc
    limit 1
  ) lm on true
  where auth.uid() = p_user_id
  group by f.friend_id, lm.text, lm.created_at;
$$;

create or replace function public.mark_group_messages_read(p_group_id uuid)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_last_read_at timestamptz;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if not exists (
    select 1 from public.group_members
    where group_id = p_group_id and user_id = v_user_id
  ) then
    raise exception 'Not a group member';
  end if;

  select coalesce(max(created_at), now()) into v_last_read_at
  from public.group_messages
  where group_id = p_group_id;

  insert into public.group_message_reads (group_id, user_id, last_read_at)
  values (p_group_id, v_user_id, v_last_read_at)
  on conflict (group_id, user_id)
  do update set last_read_at = greatest(public.group_message_reads.last_read_at, excluded.last_read_at);

  return v_last_read_at;
end;
$$;

create or replace function public.mark_direct_messages_read(p_friend_id uuid)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_last_read_at timestamptz;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if not exists (
    select 1
    from public.friendships
    where status = 'accepted'
      and (
        (requester = v_user_id and addressee = p_friend_id)
        or (addressee = v_user_id and requester = p_friend_id)
      )
  ) then
    raise exception 'Not friends';
  end if;

  select coalesce(max(created_at), now()) into v_last_read_at
  from public.direct_messages
  where (sender_id = v_user_id and recipient_id = p_friend_id)
     or (sender_id = p_friend_id and recipient_id = v_user_id);

  insert into public.direct_message_reads (user_id, friend_id, last_read_at)
  values (v_user_id, p_friend_id, v_last_read_at)
  on conflict (user_id, friend_id)
  do update set last_read_at = greatest(public.direct_message_reads.last_read_at, excluded.last_read_at);

  return v_last_read_at;
end;
$$;

grant execute on function public.get_group_unread_counts(uuid) to authenticated;
grant execute on function public.get_direct_unread_counts(uuid) to authenticated;
grant execute on function public.mark_group_messages_read(uuid) to authenticated;
grant execute on function public.mark_direct_messages_read(uuid) to authenticated;

do $$
declare
  realtime_table text;
  realtime_tables text[] := array['group_message_reads', 'direct_message_reads'];
begin
  foreach realtime_table in array realtime_tables loop
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = realtime_table
    ) then
      execute format('alter publication supabase_realtime add table public.%I', realtime_table);
    end if;
  end loop;
end $$;
