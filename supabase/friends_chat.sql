-- ═══════════════ FRIENDSHIPS ═══════════════
create table if not exists public.friendships (
  id          uuid primary key default gen_random_uuid(),
  requester   uuid not null references public.profiles(id) on delete cascade,
  addressee   uuid not null references public.profiles(id) on delete cascade,
  status      text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at  timestamptz not null default now(),
  unique(requester, addressee)
);

alter table public.friendships enable row level security;

create policy "See own friendships"
  on public.friendships for select
  using (auth.uid() = requester or auth.uid() = addressee);

create policy "Create friend request"
  on public.friendships for insert
  with check (auth.uid() = requester);

create policy "Update friendship"
  on public.friendships for update
  using (auth.uid() = addressee or auth.uid() = requester);

create policy "Delete friendship"
  on public.friendships for delete
  using (auth.uid() = requester or auth.uid() = addressee);

-- ═══════════════ GROUP CHATS ═══════════════
create table if not exists public.group_chats (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  emoji       text not null default '💬',
  type        text not null default 'permanent' check (type in ('permanent', 'ephemeral')),
  expires_at  timestamptz,
  created_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);

alter table public.group_chats enable row level security;

create policy "Create group"
  on public.group_chats for insert
  with check (auth.uid() = created_by);

-- ═══════════════ GROUP MEMBERS ═══════════════
create table if not exists public.group_members (
  group_id  uuid not null references public.group_chats(id) on delete cascade,
  user_id   uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

alter table public.group_members enable row level security;

-- Policy on group_chats defined here because it references group_members
create policy "See groups you belong to"
  on public.group_chats for select
  using (exists (
    select 1 from public.group_members where group_id = id and user_id = auth.uid()
  ));

create policy "See group members"
  on public.group_members for select
  using (exists (
    select 1 from public.group_members gm where gm.group_id = group_id and gm.user_id = auth.uid()
  ));

create policy "Join group"
  on public.group_members for insert
  with check (auth.uid() = user_id);

-- ═══════════════ GROUP MESSAGES ═══════════════
create table if not exists public.group_messages (
  id           uuid primary key default gen_random_uuid(),
  group_id     uuid not null references public.group_chats(id) on delete cascade,
  sender_id    uuid references public.profiles(id) on delete set null,
  text         text not null,
  reactions    jsonb not null default '{}',
  shared_event jsonb,
  created_at   timestamptz not null default now()
);

alter table public.group_messages enable row level security;

create policy "Read group messages"
  on public.group_messages for select
  using (exists (
    select 1 from public.group_members where group_id = group_messages.group_id and user_id = auth.uid()
  ));

create policy "Send group message"
  on public.group_messages for insert
  with check (
    auth.uid() = sender_id and
    exists (select 1 from public.group_members where group_id = group_messages.group_id and user_id = auth.uid())
  );

-- ═══════════════ DIRECT MESSAGES ═══════════════
create table if not exists public.direct_messages (
  id           uuid primary key default gen_random_uuid(),
  sender_id    uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  text         text not null,
  reactions    jsonb not null default '{}',
  created_at   timestamptz not null default now()
);

alter table public.direct_messages enable row level security;

create policy "See own DMs"
  on public.direct_messages for select
  using (auth.uid() = sender_id or auth.uid() = recipient_id);

create policy "Send DM to friend"
  on public.direct_messages for insert
  with check (
    auth.uid() = sender_id and
    exists (
      select 1 from public.friendships
      where status = 'accepted'
        and ((requester = auth.uid() and addressee = recipient_id)
          or (addressee = auth.uid() and requester = recipient_id))
    )
  );

-- ═══════════════ REALTIME ═══════════════
alter publication supabase_realtime add table public.group_messages;
alter publication supabase_realtime add table public.direct_messages;
