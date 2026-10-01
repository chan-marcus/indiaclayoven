-- Dish photos uploaded from Dashboard → Menu. Public so the website can show
-- them; only the server (secret key) can upload or delete.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('menu-images', 'menu-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;
