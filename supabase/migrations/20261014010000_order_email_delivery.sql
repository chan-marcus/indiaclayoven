-- Orders are both faxed and emailed. `delivery` holds the fax result; this
-- holds the email result. Null on orders placed while only faxing.
alter table public.orders add column email_delivery jsonb;
