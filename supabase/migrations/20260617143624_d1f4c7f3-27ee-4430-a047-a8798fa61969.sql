
DO $$
DECLARE
  chef_uid uuid; cust_uid uuid; order_uid uuid;
  i int; j int; k int;
  item_ids uuid[]; zone_ids uuid[];
  chef_ids uuid[] := '{}'::uuid[];
  cust_ids uuid[] := '{}'::uuid[];
  pick_item uuid; pick_chef uuid; pick_cust uuid; pick_zone uuid;
  bprice numeric; vprice numeric; vqty int; vstatus text;
  created timestamptz;
  cuisines text[] := ARRAY['Egyptian','Levantine','Italian','Asian','Mexican','Indian','French','Greek','Turkish','Moroccan'];
  cities text[] := ARRAY['Downtown','Maadi','Zamalek','Heliopolis','New Cairo','Dokki'];
  ci_uid uuid;
BEGIN
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'demo-chef-1@savora.demo') THEN RETURN; END IF;

  SELECT array_agg(id) INTO item_ids FROM public.items;
  SELECT array_agg(id) INTO zone_ids FROM public.zones WHERE active = true;
  IF item_ids IS NULL OR array_length(item_ids,1) = 0 THEN RETURN; END IF;

  FOR i IN 1..50 LOOP
    chef_uid := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, recovery_token,
      email_change_token_new, email_change
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', chef_uid, 'authenticated', 'authenticated',
      'demo-chef-' || i || '@savora.demo', crypt('!disabled-demo-account!', gen_salt('bf')),
      now(), jsonb_build_object('provider','email','providers',ARRAY['email']),
      jsonb_build_object('full_name','Chef ' || (ARRAY['Amira','Omar','Layla','Nour','Tarek','Salma','Hassan','Yara','Adam','Mona'])[1+(i%10)] || ' ' || i,
                         'role','chef','username','chef_demo_' || i),
      now() - (random()*60 || ' days')::interval, now(),'','','',''
    );
    chef_ids := chef_ids || chef_uid;

    INSERT INTO public.profiles (id, full_name, username, email, avatar_url)
    VALUES (chef_uid,
            'Chef ' || (ARRAY['Amira','Omar','Layla','Nour','Tarek','Salma','Hassan','Yara','Adam','Mona'])[1+(i%10)] || ' ' || i,
            'chef_demo_' || i, 'demo-chef-' || i || '@savora.demo',
            'https://i.pravatar.cc/200?img=' || (1 + (i % 70)))
    ON CONFLICT (id) DO NOTHING;
    INSERT INTO public.user_roles (user_id, role) VALUES (chef_uid, 'chef') ON CONFLICT DO NOTHING;

    pick_zone := zone_ids[1 + floor(random() * array_length(zone_ids,1))::int];
    INSERT INTO public.chef_profiles (
      user_id, bio, address, lat, lng, zone_id, verification_status, max_orders_per_day,
      payment_method, payment_account, submitted_at, reviewed_at
    ) VALUES (
      chef_uid,
      'Home-kitchen specializing in ' || cuisines[1 + (i % array_length(cuisines,1))] || ' cuisine.',
      (10 + (i % 90)) || ' Demo St, ' || cities[1 + (i % array_length(cities,1))],
      30.0444 + (random()-0.5)*0.2, 31.2357 + (random()-0.5)*0.2,
      pick_zone, 'approved'::verification_status, 5 + (i % 20),
      (ARRAY['Vodafone Cash','Instapay','Bank Transfer','PayPal'])[1+(i%4)],
      '01' || (i+100000000)::text,
      now() - interval '30 days', now() - interval '20 days'
    );

    FOR j IN 1..(4 + (i % 3)) LOOP
      pick_item := item_ids[1 + floor(random() * array_length(item_ids,1))::int];
      SELECT it.base_price INTO bprice FROM public.items it WHERE it.id = pick_item;
      vprice := round((bprice * (0.85 + random()*0.4))::numeric, 2);
      INSERT INTO public.chef_items (chef_id, item_id, price, lead_time_hours, available, unit_mode)
      VALUES (chef_uid, pick_item, vprice, 1 + (j % 4), true, CASE WHEN j % 5 = 0 THEN 'weight' ELSE 'count' END)
      ON CONFLICT (chef_id, item_id) DO NOTHING;
    END LOOP;
  END LOOP;

  FOR i IN 1..200 LOOP
    cust_uid := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, recovery_token,
      email_change_token_new, email_change
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', cust_uid, 'authenticated', 'authenticated',
      'demo-cust-' || i || '@savora.demo', crypt('!disabled-demo-account!', gen_salt('bf')),
      now(), jsonb_build_object('provider','email','providers',ARRAY['email']),
      jsonb_build_object('full_name','Customer ' || i,'role','customer','username','cust_demo_' || i),
      now() - (random()*60 || ' days')::interval, now(),'','','',''
    );
    cust_ids := cust_ids || cust_uid;

    INSERT INTO public.profiles (id, full_name, username, email, avatar_url, points)
    VALUES (cust_uid, 'Customer ' || i, 'cust_demo_' || i,
            'demo-cust-' || i || '@savora.demo',
            'https://i.pravatar.cc/200?img=' || (1 + ((i+30) % 70)),
            (random()*500)::int)
    ON CONFLICT (id) DO NOTHING;
    INSERT INTO public.user_roles (user_id, role) VALUES (cust_uid, 'customer') ON CONFLICT DO NOTHING;

    pick_zone := zone_ids[1 + floor(random() * array_length(zone_ids,1))::int];
    INSERT INTO public.customer_addresses (user_id, label, address, lat, lng, zone_id, is_default)
    VALUES (cust_uid, 'Home',
            (10 + (i % 90)) || ' Customer St, ' || cities[1 + (i % array_length(cities,1))],
            30.0444 + (random()-0.5)*0.2, 31.2357 + (random()-0.5)*0.2, pick_zone, true);
  END LOOP;

  FOR i IN 1..600 LOOP
    pick_cust := cust_ids[1 + floor(random() * array_length(cust_ids,1))::int];
    pick_chef := chef_ids[1 + floor(random() * array_length(chef_ids,1))::int];
    created := now() - (random()*30 || ' days')::interval - (random()*86400 || ' seconds')::interval;
    vstatus := (ARRAY['delivered','delivered','delivered','delivered','delivered',
                     'chef_preparing','on_the_way','placed','cancelled'])[1+floor(random()*9)::int];
    order_uid := gen_random_uuid();

    INSERT INTO public.orders (id, customer_id, status, subtotal, delivery_fee, total, payment_status, placed_at, created_at, updated_at, delivered_at)
    VALUES (order_uid, pick_cust, vstatus::order_status, 0, 30, 0,
            CASE WHEN vstatus='cancelled' THEN 'pending'::payment_status ELSE 'verified'::payment_status END,
            created, created, created,
            CASE WHEN vstatus='delivered' THEN created + interval '1 hour' ELSE NULL END);

    FOR k IN 1..(1 + floor(random()*3)::int) LOOP
      SELECT ci.id, ci.item_id, ci.price INTO ci_uid, pick_item, vprice
      FROM public.chef_items ci WHERE ci.chef_id = pick_chef ORDER BY random() LIMIT 1;
      IF ci_uid IS NULL THEN EXIT; END IF;
      vqty := 1 + floor(random()*3)::int;
      INSERT INTO public.order_items (order_id, chef_id, item_id, chef_item_id, qty, unit_price, lead_time_hours)
      VALUES (order_uid, pick_chef, pick_item, ci_uid, vqty, vprice, 2);
    END LOOP;

    UPDATE public.orders o SET
      subtotal = COALESCE((SELECT sum(oi.qty * oi.unit_price) FROM public.order_items oi WHERE oi.order_id = o.id), 0),
      total = COALESCE((SELECT sum(oi.qty * oi.unit_price) FROM public.order_items oi WHERE oi.order_id = o.id), 0) + 30
    WHERE o.id = order_uid;

    IF vstatus = 'delivered' AND random() < 0.25 THEN
      INSERT INTO public.reviews (order_id, chef_id, customer_id, rating, comment, created_at)
      VALUES (order_uid, pick_chef, pick_cust,
              3 + floor(random()*3)::int,
              (ARRAY['Delicious!','Great food, would order again.','Tasty and well-portioned.','Loved it.','Could be hotter on delivery.','Authentic flavors.','Five stars!'])[1+floor(random()*7)::int],
              created + interval '2 hours')
      ON CONFLICT (order_id) DO NOTHING;
    END IF;
  END LOOP;
END $$;
