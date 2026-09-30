-- Order numbers start at 1 (shown as #00001). Existing orders are renumbered
-- in the order they were placed, and the counter continues after them.
update public.orders set number = -number;  -- step aside to avoid unique clashes

update public.orders o
set number = r.rn
from (select id, row_number() over (order by placed_at, id) as rn from public.orders) r
where o.id = r.id;

do $$
declare next_no bigint;
begin
  select coalesce(max(number), 0) + 1 into next_no from public.orders;
  execute format('alter table public.orders alter column number restart with %s', next_no);
end $$;
