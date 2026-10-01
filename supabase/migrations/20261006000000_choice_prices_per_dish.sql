-- "Sizes": an option whose choices each have their own price, set per dish
-- (Tandoori Chicken: Half $15, Whole $26; Mixed Grill: Half $14, Whole $24).
alter table public.option_groups
  add column sets_price boolean not null default false;

-- The dish's price for each choice of a sets_price option, lined up with the
-- option's `options`. Null (or a missing entry) falls back to the dish price.
alter table public.menu_item_option_groups
  add column prices numeric(10,2)[];
