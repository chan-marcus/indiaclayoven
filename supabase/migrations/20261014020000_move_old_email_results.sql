-- Orders placed before faxing kept their email result in `delivery`, marked
-- channel "email". Move it to email_delivery and mark the fax "Not faxed".
update public.orders
set email_delivery = delivery - 'channel',
    delivery = jsonb_build_object('status', 'disabled', 'detail', 'Placed before fax ordering', 'attempts', 0)
where delivery ->> 'channel' = 'email';
