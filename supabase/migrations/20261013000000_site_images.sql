-- Website photos the owner has replaced from Dashboard → Edit Website.
-- Only replaced photos have a row; everything else uses the default in
-- src/lib/site-images.ts. Files live in the menu-images bucket under
-- <restaurant>/site/<key>/. Server-only access (RLS on, no policies).
create table public.site_images (
  restaurant_id  text not null references public.restaurants (id) on delete cascade,
  key            text not null,
  url            text not null,
  updated_at     timestamptz not null default now(),
  primary key (restaurant_id, key)
);

alter table public.site_images enable row level security;
