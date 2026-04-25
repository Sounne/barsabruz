-- Web Push subscriptions for installed/mobile PWA notifications.
-- Run this once in Supabase SQL editor or through your migration flow.

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  keys jsonb not null,
  user_agent text,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  disabled_at timestamptz
);

create index if not exists push_subscriptions_user_id_idx
  on public.push_subscriptions(user_id);

create index if not exists push_subscriptions_enabled_idx
  on public.push_subscriptions(enabled)
  where enabled = true;

create or replace function public.set_push_subscriptions_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_push_subscriptions_updated_at on public.push_subscriptions;
create trigger set_push_subscriptions_updated_at
before update on public.push_subscriptions
for each row
execute function public.set_push_subscriptions_updated_at();

alter table public.push_subscriptions enable row level security;

drop policy if exists "Users can read their push subscriptions" on public.push_subscriptions;
create policy "Users can read their push subscriptions"
on public.push_subscriptions
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can create their push subscriptions" on public.push_subscriptions;
create policy "Users can create their push subscriptions"
on public.push_subscriptions
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update their push subscriptions" on public.push_subscriptions;
create policy "Users can update their push subscriptions"
on public.push_subscriptions
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their push subscriptions" on public.push_subscriptions;
create policy "Users can delete their push subscriptions"
on public.push_subscriptions
for delete
to authenticated
using (auth.uid() = user_id);
