-- Website wording the owner has edited from Dashboard → Website text.
-- Only edited fields have a row; everything else uses the default in
-- src/lib/site-text.ts. Server-only access (RLS on, no policies).
create table public.site_content (
  restaurant_id  text not null references public.restaurants (id) on delete cascade,
  key            text not null,
  value          text not null,
  updated_at     timestamptz not null default now(),
  primary key (restaurant_id, key)
);

alter table public.site_content enable row level security;
