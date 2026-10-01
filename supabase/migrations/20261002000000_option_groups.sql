-- Reusable choices for dishes, e.g. "Spice level: Mild, Medium, Hot, Extra Hot".
-- The owner creates a group once in Dashboard → Menu and attaches it to any
-- number of dishes. Customers pick one option from each attached group.
-- Server-only access (RLS on, no policies).
create table public.option_groups (
  id             text primary key,
  restaurant_id  text not null references public.restaurants (id) on delete cascade,
  name           text not null,
  options        text[] not null,
  sort           integer not null default 0,
  created_at     timestamptz not null default now()
);

create index option_groups_restaurant_idx on public.option_groups (restaurant_id, sort);

create table public.menu_item_option_groups (
  item_id   text not null references public.menu_items (id) on delete cascade,
  group_id  text not null references public.option_groups (id) on delete cascade,
  primary key (item_id, group_id)
);

create index menu_item_option_groups_group_idx on public.menu_item_option_groups (group_id);

alter table public.option_groups enable row level security;
alter table public.menu_item_option_groups enable row level security;
