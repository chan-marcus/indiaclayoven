-- New orders are faxed to the kitchen through Telnyx instead of emailed.

-- Fax numbers new orders go to (one or two, E.164), set in Dashboard → Settings.
-- order_email is left in place, unused, so the old addresses aren't lost.
alter table public.restaurants
  add column order_fax jsonb not null default '{"enabled": false, "numbers": []}'::jsonb;

-- How each order's ticket reached the kitchen. Orders placed so far were
-- emailed; they keep that record, marked as channel "email".
alter table public.orders rename column email_delivery to delivery;
update public.orders
set delivery = delivery || '{"channel": "email"}'::jsonb
where not delivery ? 'channel';
