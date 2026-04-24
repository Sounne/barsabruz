-- Realtime updates for agenda and notification surfaces.
-- Safe to run more than once: tables are added only when missing.

do $$
declare
  realtime_table text;
  realtime_tables text[] := array[
    'bars',
    'events',
    'event_attendees',
    'annonces',
    'annonce_participants',
    'annonce_invitations'
  ];
begin
  foreach realtime_table in array realtime_tables loop
    if exists (
      select 1
      from information_schema.tables
      where table_schema = 'public'
        and table_name = realtime_table
    )
    and not exists (
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
