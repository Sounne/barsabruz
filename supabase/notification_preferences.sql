-- User-level notification settings.
-- Defaults: messages and groups enabled, events disabled.

create table if not exists public.notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  messages boolean not null default true,
  groups boolean not null default true,
  events boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.notification_preferences (user_id)
select id from public.profiles
on conflict (user_id) do nothing;

create or replace function public.set_notification_preferences_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_notification_preferences_updated_at on public.notification_preferences;
create trigger set_notification_preferences_updated_at
before update on public.notification_preferences
for each row
execute function public.set_notification_preferences_updated_at();

alter table public.notification_preferences enable row level security;

drop policy if exists "Users can read own notification preferences" on public.notification_preferences;
create policy "Users can read own notification preferences"
on public.notification_preferences
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can create own notification preferences" on public.notification_preferences;
create policy "Users can create own notification preferences"
on public.notification_preferences
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update own notification preferences" on public.notification_preferences;
create policy "Users can update own notification preferences"
on public.notification_preferences
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

alter table public.push_subscriptions
  alter column prefs set default '{
    "messages": true,
    "groups": true,
    "events": false
  }'::jsonb;

update public.push_subscriptions
set prefs = jsonb_build_object(
  'messages', coalesce((prefs->>'messages')::boolean, true),
  'groups', coalesce((prefs->>'groups')::boolean, true),
  'events', coalesce((prefs->>'events')::boolean, false)
);
