-- The masked card summary the kitchen sees on each order:
-- {brand, last4, expiry, billingZip}. Never the full number or the CVC.
alter table public.orders add column payment jsonb;
