-- Refresh agenda from publicly verifiable bar sources as of 2026-04-24.
-- Source used here: official brunch site for L'Arriere-Cour.

insert into public.events (
  id,
  bar_id,
  title,
  date,
  time,
  price,
  tag,
  attending,
  starts_at,
  description
)
values (
  'e9',
  'arriere-cour',
  'Brunch d''avril',
  'Dim. 26 avril',
  '11:00',
  '19€ - 40€',
  'Brunch',
  0,
  '2026-04-26T11:00:00+02:00'::timestamptz,
  'Brunch 100% fait maison sur place ou a emporter. Reservation jusqu''au vendredi soir, service sur place le dimanche de 11:00 a 14:30 et retrait de 11:00 a 13:00.'
)
on conflict (id) do update
set
  bar_id = excluded.bar_id,
  title = excluded.title,
  date = excluded.date,
  time = excluded.time,
  price = excluded.price,
  tag = excluded.tag,
  starts_at = excluded.starts_at,
  description = excluded.description;
