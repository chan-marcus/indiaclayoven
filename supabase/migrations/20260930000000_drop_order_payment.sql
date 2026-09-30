-- No card data is stored on orders. Removes the unused payment column that
-- an earlier (closed) branch added.
alter table public.orders drop column if exists payment;
