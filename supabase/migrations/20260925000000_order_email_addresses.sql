-- Orders can now be emailed to up to two addresses:
-- order_email {enabled, address} becomes {enabled, addresses: [..]}.
update public.restaurants
set order_email = jsonb_build_object(
  'enabled', coalesce((order_email ->> 'enabled')::boolean, false),
  'addresses', case
    when coalesce(order_email ->> 'address', '') = '' then '[]'::jsonb
    else jsonb_build_array(order_email ->> 'address')
  end
)
where order_email ? 'address';
