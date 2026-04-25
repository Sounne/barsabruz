-- Push notifications for direct and group messages.
-- Requires the pg_net extension and the send-push-notification Edge Function.
--
-- Configure the private values after running this script:
-- insert into private.app_config (key, value) values
--   ('push_function_url', 'https://<project-ref>.functions.supabase.co/send-push-notification'),
--   ('push_function_secret', '<PUSH_FUNCTION_SECRET>')
-- on conflict (key) do update set value = excluded.value, updated_at = now();

create extension if not exists pg_net with schema extensions;

create schema if not exists private;

create table if not exists private.app_config (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

create or replace function private.notify_direct_message_push()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_url text;
  v_secret text;
  v_sender_name text;
begin
  select value into v_url from private.app_config where key = 'push_function_url';
  select value into v_secret from private.app_config where key = 'push_function_secret';
  if v_url is null or v_secret is null then return new; end if;

  select coalesce(name, 'Quelqu''un') into v_sender_name
    from public.profiles where id = new.sender_id;

  perform net.http_post(
    url := v_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-push-secret', v_secret
    ),
    body := jsonb_build_object(
      'userIds', jsonb_build_array(new.recipient_id::text),
      'prefKey', 'messages',
      'notification', jsonb_build_object(
        'title', v_sender_name,
        'body', left(new.text, 140),
        'tag', 'dm:' || new.sender_id::text,
        'url', '/barsabruz/?dm=' || new.sender_id::text,
        'data', jsonb_build_object('type', 'dm', 'sender_id', new.sender_id::text)
      )
    )
  );

  return new;
end;
$$;

create or replace function private.notify_group_message_push()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_url text;
  v_secret text;
  v_sender_name text;
  v_group_name text;
  v_group_emoji text;
  v_recipients jsonb;
begin
  select value into v_url from private.app_config where key = 'push_function_url';
  select value into v_secret from private.app_config where key = 'push_function_secret';
  if v_url is null or v_secret is null then return new; end if;

  select coalesce(name, 'Quelqu''un') into v_sender_name
    from public.profiles where id = new.sender_id;

  select name, emoji into v_group_name, v_group_emoji
    from public.group_chats where id = new.group_id;

  select coalesce(jsonb_agg(user_id::text), '[]'::jsonb) into v_recipients
    from public.group_members
    where group_id = new.group_id
      and user_id <> new.sender_id;

  if jsonb_array_length(v_recipients) = 0 then return new; end if;

  perform net.http_post(
    url := v_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-push-secret', v_secret
    ),
    body := jsonb_build_object(
      'userIds', v_recipients,
      'prefKey', 'messages',
      'notification', jsonb_build_object(
        'title', coalesce(v_group_emoji || ' ', '') || coalesce(v_group_name, 'Groupe'),
        'body', v_sender_name || ': ' || left(new.text, 120),
        'tag', 'group:' || new.group_id::text,
        'url', '/barsabruz/?group=' || new.group_id::text,
        'data', jsonb_build_object('type', 'group', 'group_id', new.group_id::text)
      )
    )
  );

  return new;
end;
$$;

drop trigger if exists notify_direct_message_push on public.direct_messages;
create trigger notify_direct_message_push
after insert on public.direct_messages
for each row
execute function private.notify_direct_message_push();

drop trigger if exists notify_group_message_push on public.group_messages;
create trigger notify_group_message_push
after insert on public.group_messages
for each row
execute function private.notify_group_message_push();
