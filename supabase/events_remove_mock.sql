-- Remove seeded mock agenda events from the database.
-- Keep only events that were verified and intentionally inserted afterwards.

delete from public.event_attendees
where event_id in ('e1', 'e2', 'e3', 'e4', 'e5', 'e6', 'e7', 'e8');

delete from public.events
where id in ('e1', 'e2', 'e3', 'e4', 'e5', 'e6', 'e7', 'e8');
