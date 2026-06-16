
DO $$
DECLARE
  rec record;
  more_users jsonb := '[
    {"id":"00000000-0000-0000-0000-0000000000e5","email":"customer5@savora.com","name":"Hassan Reda","username":"hassan","role":"customer"},
    {"id":"00000000-0000-0000-0000-0000000000e6","email":"customer6@savora.com","name":"Salma Adel","username":"salma","role":"customer"},
    {"id":"00000000-0000-0000-0000-0000000000e7","email":"customer7@savora.com","name":"Rana Sami","username":"rana","role":"customer"},
    {"id":"00000000-0000-0000-0000-0000000000e8","email":"customer8@savora.com","name":"Tamer Fouad","username":"tamer","role":"customer"},
    {"id":"00000000-0000-0000-0000-0000000000d4","email":"driver.mido@savora.com","name":"Mido Salem","username":"mido_drive","role":"delivery"},
    {"id":"00000000-0000-0000-0000-0000000000d5","email":"driver.rami@savora.com","name":"Rami Hosny","username":"rami_drive","role":"delivery"},
    {"id":"00000000-0000-0000-0000-0000000000d6","email":"driver.fady@savora.com","name":"Fady Wagdy","username":"fady_drive","role":"delivery"}
  ]'::jsonb;
BEGIN
  FOR rec IN SELECT * FROM jsonb_to_recordset(more_users) AS x(id uuid,email text,name text,username text,role text) LOOP
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = rec.id) THEN
      INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
      VALUES ('00000000-0000-0000-0000-000000000000', rec.id, 'authenticated','authenticated', rec.email, crypt('1234', gen_salt('bf')), now(),
        '{"provider":"email","providers":["email"]}',
        jsonb_build_object('full_name',rec.name,'username',rec.username,'role',rec.role),
        now(), now(), '', '', '', '');
      INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
      VALUES (gen_random_uuid(), rec.id, jsonb_build_object('sub', rec.id::text,'email',rec.email), 'email', rec.id::text, now(), now(), now());
    END IF;
    INSERT INTO public.user_roles (user_id, role) VALUES (rec.id, rec.role::public.app_role) ON CONFLICT DO NOTHING;
  END LOOP;
END $$;

INSERT INTO public.delivery_profiles (user_id, verification_status, submitted_at, reviewed_at, is_online, total_earnings) VALUES
  ('00000000-0000-0000-0000-0000000000d4','approved', now()-interval '8 days', now()-interval '6 days', true, 1250.50),
  ('00000000-0000-0000-0000-0000000000d5','approved', now()-interval '12 days', now()-interval '10 days', false, 870.00),
  ('00000000-0000-0000-0000-0000000000d6','pending', now()-interval '2 days', NULL, false, 0)
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.customer_addresses (user_id, label, address, lat, lng, zone_id, is_default) VALUES
  ('00000000-0000-0000-0000-0000000000e5','Home','22 Tahrir Square, Cairo',30.0444,31.2357,'00000000-0000-0000-0000-0000000000b1', true),
  ('00000000-0000-0000-0000-0000000000e5','Work','45 Champollion St',30.0498,31.2398,'00000000-0000-0000-0000-0000000000b1', false),
  ('00000000-0000-0000-0000-0000000000e6','Home','15 Road 200, Maadi',29.9614,31.2569,'00000000-0000-0000-0000-0000000000b2', true),
  ('00000000-0000-0000-0000-0000000000e7','Home','5 26th of July, Zamalek',30.0640,31.2200,'00000000-0000-0000-0000-0000000000b3', true),
  ('00000000-0000-0000-0000-0000000000e8','Home','12 Cleopatra, Heliopolis',30.0820,31.3225,'00000000-0000-0000-0000-0000000000b4', true);

DO $$
DECLARE
  oid uuid; cust uuid; chef uuid; drv uuid;
  ci record; addr uuid;
  statuses public.order_status[] := ARRAY['delivered','delivered','delivered','on_the_way','picked_up','ready_for_pickup','chef_preparing','placed','awaiting_payment_verification','cancelled']::public.order_status[];
  customers uuid[] := ARRAY['00000000-0000-0000-0000-0000000000e1','00000000-0000-0000-0000-0000000000e2','00000000-0000-0000-0000-0000000000e3','00000000-0000-0000-0000-0000000000e4','00000000-0000-0000-0000-0000000000e5','00000000-0000-0000-0000-0000000000e6','00000000-0000-0000-0000-0000000000e7','00000000-0000-0000-0000-0000000000e8']::uuid[];
  chefs uuid[] := ARRAY['00000000-0000-0000-0000-0000000000c1','00000000-0000-0000-0000-0000000000c2','00000000-0000-0000-0000-0000000000c3']::uuid[];
  drivers uuid[] := ARRAY['00000000-0000-0000-0000-0000000000d1','00000000-0000-0000-0000-0000000000d2','00000000-0000-0000-0000-0000000000d4','00000000-0000-0000-0000-0000000000d5']::uuid[];
  st public.order_status; i int;
BEGIN
  FOR i IN 1..25 LOOP
    cust := customers[(i % array_length(customers,1))+1];
    chef := chefs[(i % array_length(chefs,1))+1];
    drv := drivers[(i % array_length(drivers,1))+1];
    st := statuses[(i % array_length(statuses,1))+1];
    SELECT id INTO addr FROM public.customer_addresses WHERE user_id = cust AND is_default LIMIT 1;
    oid := gen_random_uuid();
    INSERT INTO public.orders (id, customer_id, address_id, status, payment_status, subtotal, delivery_fee, total, placed_at, delivered_at, notes)
    VALUES (oid, cust, addr, st,
      CASE WHEN st IN ('delivered','on_the_way','picked_up','ready_for_pickup','chef_preparing') THEN 'verified'::payment_status ELSE 'pending'::payment_status END,
      120 + (i * 7), 20, 140 + (i * 7), now() - (i || ' hours')::interval,
      CASE WHEN st='delivered' THEN now() - ((i-1) || ' hours')::interval ELSE NULL END,
      'Demo order #' || i);
    SELECT * INTO ci FROM public.chef_items WHERE chef_id = chef ORDER BY random() LIMIT 1;
    IF ci IS NOT NULL THEN
      INSERT INTO public.order_items (order_id, chef_id, item_id, chef_item_id, qty, unit_price, lead_time_hours)
      VALUES (oid, chef, ci.item_id, ci.id, 1 + (i % 3), 60 + (i % 30), ci.lead_time_hours);
    END IF;
    IF st IN ('picked_up','on_the_way','delivered') THEN
      INSERT INTO public.deliveries (order_id, delivery_id, status, picked_at, delivered_at, earnings, distance_km)
      VALUES (oid, drv,
        CASE st WHEN 'delivered' THEN 'delivered' WHEN 'on_the_way' THEN 'on_the_way' ELSE 'picked_up' END,
        now()-(i || ' hours')::interval,
        CASE WHEN st='delivered' THEN now()-((i-1) || ' hours')::interval ELSE NULL END,
        20 + (i % 15), 2.5 + (i % 8))
      ON CONFLICT (order_id) DO NOTHING;
    ELSIF st = 'ready_for_pickup' THEN
      INSERT INTO public.deliveries (order_id, status) VALUES (oid, 'available')
      ON CONFLICT (order_id) DO NOTHING;
    END IF;
  END LOOP;
END $$;

INSERT INTO public.reviews (order_id, chef_id, customer_id, rating, comment)
SELECT DISTINCT ON (o.id) o.id, oi.chef_id, o.customer_id,
  (3 + floor(random()*3))::int,
  (ARRAY['Loved it!','Tasty and fresh.','Will reorder for sure.','Great portion size.','Perfect spice level.','Came hot and on time.'])[1 + floor(random()*6)::int]
FROM public.orders o JOIN public.order_items oi ON oi.order_id = o.id
WHERE o.status = 'delivered'
ON CONFLICT (order_id) DO NOTHING;

INSERT INTO public.notifications (user_id, type, title, body)
SELECT id, 'info', 'You are online — new jobs await', 'Open the Delivery tab to accept available pickups.'
FROM auth.users WHERE email LIKE 'driver%@savora.com';

INSERT INTO public.notifications (user_id, type, title, body)
SELECT id, 'order', 'New order received', 'Check your kitchen dashboard for the latest order.'
FROM auth.users WHERE email LIKE 'chef.%@savora.com';
