-- A dish can have no photo (the owner removed it in Dashboard → Menu).
alter table public.menu_items alter column image drop not null;
