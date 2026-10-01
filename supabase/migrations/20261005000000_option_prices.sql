-- What each choice adds to the dish price, lined up with `options`
-- (e.g. options {Half,Full}, prices {0,12}). Missing entries count as 0.
alter table public.option_groups
  add column prices numeric(10,2)[] not null default '{}';
