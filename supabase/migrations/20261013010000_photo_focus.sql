-- Where to keep in frame when a photo is cropped to fit, as a CSS
-- object-position like "50% 35%". Null means the centre.
alter table public.site_images add column focus text;
alter table public.menu_items add column image_focus text;
