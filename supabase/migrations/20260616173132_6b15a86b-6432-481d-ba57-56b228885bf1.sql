
-- 1) Admin user
DO $$
DECLARE admin_id uuid := '00000000-0000-0000-0000-0000000000a1';
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@savora.com') THEN
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
    VALUES ('00000000-0000-0000-0000-000000000000', admin_id, 'authenticated','authenticated','admin@savora.com', crypt('1234', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Savora Admin","username":"admin","role":"admin"}', now(), now(), '', '', '', '');
    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES (gen_random_uuid(), admin_id, jsonb_build_object('sub', admin_id::text, 'email','admin@savora.com'), 'email', admin_id::text, now(), now(), now());
  END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (admin_id, 'admin') ON CONFLICT DO NOTHING;
END $$;

-- 2) chef-docs storage policies
CREATE POLICY "chef docs self rw" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'chef-docs' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.has_role(auth.uid(),'admin')))
  WITH CHECK (bucket_id = 'chef-docs' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 3) Category images
UPDATE public.categories SET image_url = CASE slug
  WHEN 'sweets'    THEN 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=800&q=80'
  WHEN 'mains'     THEN 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80'
  WHEN 'mezze'     THEN 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&q=80'
  WHEN 'breakfast' THEN 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800&q=80'
  WHEN 'beverages' THEN 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=800&q=80'
END WHERE image_url IS NULL OR image_url = '';

-- 4) Existing items photos
UPDATE public.items SET photos = ARRAY['https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80']
WHERE photos = '{}' OR photos IS NULL;

-- 5) Zones
INSERT INTO public.zones (id, name, center_lat, center_lng, radius_km) VALUES
  ('00000000-0000-0000-0000-0000000000b1','Downtown Cairo',30.0444,31.2357,6),
  ('00000000-0000-0000-0000-0000000000b2','Maadi',29.9602,31.2569,5),
  ('00000000-0000-0000-0000-0000000000b3','Zamalek',30.0626,31.2197,4),
  ('00000000-0000-0000-0000-0000000000b4','Heliopolis',30.0808,31.3220,6)
ON CONFLICT (id) DO NOTHING;

-- 6) Demo users
DO $$
DECLARE
  rec record;
  demo_users jsonb := '[
    {"id":"00000000-0000-0000-0000-0000000000c1","email":"chef.amira@savora.com","name":"Amira Hassan","username":"amira_kitchen","role":"chef"},
    {"id":"00000000-0000-0000-0000-0000000000c2","email":"chef.youssef@savora.com","name":"Youssef Adel","username":"youssef_grill","role":"chef"},
    {"id":"00000000-0000-0000-0000-0000000000c3","email":"chef.layla@savora.com","name":"Layla Mostafa","username":"layla_sweets","role":"chef"},
    {"id":"00000000-0000-0000-0000-0000000000c4","email":"chef.omar@savora.com","name":"Omar Fathi","username":"omar_mezze","role":"chef"},
    {"id":"00000000-0000-0000-0000-0000000000d1","email":"driver.ali@savora.com","name":"Ali Mahmoud","username":"ali_drive","role":"delivery"},
    {"id":"00000000-0000-0000-0000-0000000000d2","email":"driver.sara@savora.com","name":"Sara Nabil","username":"sara_drive","role":"delivery"},
    {"id":"00000000-0000-0000-0000-0000000000d3","email":"driver.hany@savora.com","name":"Hany Khaled","username":"hany_drive","role":"delivery"},
    {"id":"00000000-0000-0000-0000-0000000000e1","email":"customer1@savora.com","name":"Mona Saleh","username":"mona","role":"customer"},
    {"id":"00000000-0000-0000-0000-0000000000e2","email":"customer2@savora.com","name":"Karim Tarek","username":"karim","role":"customer"},
    {"id":"00000000-0000-0000-0000-0000000000e3","email":"customer3@savora.com","name":"Nour Aly","username":"nour","role":"customer"},
    {"id":"00000000-0000-0000-0000-0000000000e4","email":"customer4@savora.com","name":"Dina Magdy","username":"dina","role":"customer"}
  ]'::jsonb;
BEGIN
  FOR rec IN SELECT * FROM jsonb_to_recordset(demo_users) AS x(id uuid,email text,name text,username text,role text) LOOP
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

-- 7) Chef profiles
INSERT INTO public.chef_profiles (user_id, bio, address, lat, lng, zone_id, payment_method, payment_account, verification_status, submitted_at, reviewed_at)
VALUES
  ('00000000-0000-0000-0000-0000000000c1','Authentic Egyptian home cooking, 15+ years experience.','12 Tahrir St, Downtown Cairo',30.0450,31.2360,'00000000-0000-0000-0000-0000000000b1','Vodafone Cash','01001234567','approved', now()-interval '7 days', now()-interval '5 days'),
  ('00000000-0000-0000-0000-0000000000c2','Charcoal grill specialist. Kofta, kebabs & shawarma.','8 El-Horreya St, Maadi',29.9610,31.2570,'00000000-0000-0000-0000-0000000000b2','Instapay','youssef@instapay','approved', now()-interval '6 days', now()-interval '4 days'),
  ('00000000-0000-0000-0000-0000000000c3','Patisserie & oriental sweets. Cakes to order.','22 Brazil St, Zamalek',30.0630,31.2200,'00000000-0000-0000-0000-0000000000b3','Vodafone Cash','01007654321','approved', now()-interval '10 days', now()-interval '8 days'),
  ('00000000-0000-0000-0000-0000000000c4','Levantine mezze, family recipes.','5 Baghdad St, Heliopolis',30.0810,31.3220,'00000000-0000-0000-0000-0000000000b4','Bank Transfer','EG380019000500000000123456789','pending', now()-interval '1 day', NULL)
ON CONFLICT (user_id) DO UPDATE SET verification_status = EXCLUDED.verification_status;

-- 8) Delivery profiles
INSERT INTO public.delivery_profiles (user_id, verification_status, submitted_at, reviewed_at, is_online)
VALUES
  ('00000000-0000-0000-0000-0000000000d1','approved', now()-interval '5 days', now()-interval '3 days', true),
  ('00000000-0000-0000-0000-0000000000d2','approved', now()-interval '4 days', now()-interval '2 days', true),
  ('00000000-0000-0000-0000-0000000000d3','pending', now()-interval '1 day', NULL, false)
ON CONFLICT (user_id) DO NOTHING;

-- 9) Chef categories
INSERT INTO public.chef_categories (chef_id, category_id)
SELECT c.user_id, cat.id FROM public.chef_profiles c CROSS JOIN public.categories cat
WHERE c.user_id IN ('00000000-0000-0000-0000-0000000000c1','00000000-0000-0000-0000-0000000000c2','00000000-0000-0000-0000-0000000000c3','00000000-0000-0000-0000-0000000000c4')
ON CONFLICT DO NOTHING;

-- 10) Items
INSERT INTO public.items (id, category_id, name, description, base_price, photos)
SELECT gen_random_uuid(), cat.id, x.name, x.description, x.price, ARRAY[x.photo] FROM (
  VALUES
    ('mains','Koshari','Classic Egyptian rice, lentils & pasta with crispy onions.', 80, 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=800&q=80'),
    ('mains','Molokhia with Chicken','Slow-cooked greens with garlic & chicken.', 120, 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&q=80'),
    ('mains','Stuffed Vine Leaves','Hand-rolled with rice & herbs.', 95, 'https://images.unsplash.com/photo-1626508035297-0cd27c4c5cd0?w=800&q=80'),
    ('mains','Mixed Grill Platter','Kofta, kebab, shish tawook.', 220, 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=800&q=80'),
    ('mezze','Hummus & Pita','Creamy hummus with warm pita.', 45, 'https://images.unsplash.com/photo-1571197119282-7c4b8f1a17f4?w=800&q=80'),
    ('mezze','Baba Ganoush','Smoky eggplant dip.', 50, 'https://images.unsplash.com/photo-1633321702518-7feccafb94d5?w=800&q=80'),
    ('mezze','Tabbouleh','Parsley salad with bulgur & lemon.', 55, 'https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?w=800&q=80'),
    ('sweets','Basbousa','Semolina cake soaked in syrup.', 60, 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=800&q=80'),
    ('sweets','Kunafa','Crispy pastry with cheese & syrup.', 90, 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=800&q=80'),
    ('sweets','Umm Ali','Egyptian bread pudding with nuts.', 70, 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=800&q=80'),
    ('breakfast','Ful Medames','Slow-cooked fava beans with olive oil.', 35, 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800&q=80'),
    ('breakfast','Falafel Sandwich','Crispy falafel with tahini.', 30, 'https://images.unsplash.com/photo-1593504049359-74330189a345?w=800&q=80'),
    ('breakfast','Shakshuka','Eggs poached in tomato sauce.', 65, 'https://images.unsplash.com/photo-1590412200988-a436970781fa?w=800&q=80'),
    ('beverages','Karkadeh','Cold hibiscus tea.', 25, 'https://images.unsplash.com/photo-1499638673689-79a0b5115d87?w=800&q=80'),
    ('beverages','Sahlab','Warm milk drink with cinnamon.', 35, 'https://images.unsplash.com/photo-1517578239113-b03992dcdd25?w=800&q=80'),
    ('beverages','Sugarcane Juice','Fresh squeezed.', 20, 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=800&q=80')
) AS x(cat_slug,name,description,price,photo)
JOIN public.categories cat ON cat.slug = x.cat_slug
WHERE NOT EXISTS (SELECT 1 FROM public.items i WHERE i.name = x.name);

-- 11) Chef items
INSERT INTO public.chef_items (chef_id, item_id, price, lead_time_hours, available)
SELECT cp.user_id, i.id,
  (i.base_price * (1 + (random()*0.3 - 0.1)))::numeric(10,2),
  (2 + floor(random()*4))::int, true
FROM public.chef_profiles cp CROSS JOIN public.items i
WHERE cp.verification_status='approved'
ON CONFLICT (chef_id, item_id) DO NOTHING;

-- 12) Customer addresses
INSERT INTO public.customer_addresses (user_id, label, address, lat, lng, zone_id, is_default) VALUES
  ('00000000-0000-0000-0000-0000000000e1','Home','11 Talaat Harb, Cairo',30.0470,31.2380,'00000000-0000-0000-0000-0000000000b1', true),
  ('00000000-0000-0000-0000-0000000000e2','Home','3 Road 9, Maadi',29.9605,31.2580,'00000000-0000-0000-0000-0000000000b2', true),
  ('00000000-0000-0000-0000-0000000000e3','Home','7 Hassan Sabri, Zamalek',30.0628,31.2199,'00000000-0000-0000-0000-0000000000b3', true),
  ('00000000-0000-0000-0000-0000000000e4','Home','9 Roxy, Heliopolis',30.0815,31.3230,'00000000-0000-0000-0000-0000000000b4', true);

-- 13) Sample orders
DO $$
DECLARE
  oid uuid; cust uuid; chef uuid;
  ci record;
  statuses public.order_status[] := ARRAY['delivered','delivered','on_the_way','chef_preparing','placed']::public.order_status[];
  st public.order_status; i int;
BEGIN
  FOR i IN 1..10 LOOP
    cust := (ARRAY['00000000-0000-0000-0000-0000000000e1'::uuid,'00000000-0000-0000-0000-0000000000e2'::uuid,'00000000-0000-0000-0000-0000000000e3'::uuid,'00000000-0000-0000-0000-0000000000e4'::uuid])[(i % 4)+1];
    chef := (ARRAY['00000000-0000-0000-0000-0000000000c1'::uuid,'00000000-0000-0000-0000-0000000000c2'::uuid,'00000000-0000-0000-0000-0000000000c3'::uuid])[(i % 3)+1];
    st := statuses[(i % 5)+1];
    oid := gen_random_uuid();
    INSERT INTO public.orders (id, customer_id, status, payment_status, subtotal, delivery_fee, total, placed_at, delivered_at, notes)
    VALUES (oid, cust, st,
      CASE WHEN st='delivered' THEN 'verified'::payment_status ELSE 'pending'::payment_status END,
      150, 20, 170, now() - (i || ' days')::interval,
      CASE WHEN st='delivered' THEN now() - ((i-1) || ' days')::interval ELSE NULL END,
      'Demo order');
    SELECT * INTO ci FROM public.chef_items WHERE chef_id = chef ORDER BY random() LIMIT 1;
    IF ci IS NOT NULL THEN
      INSERT INTO public.order_items (order_id, chef_id, item_id, chef_item_id, qty, unit_price, lead_time_hours)
      VALUES (oid, chef, ci.item_id, ci.id, 2, 75, ci.lead_time_hours);
    END IF;
  END LOOP;
END $$;

-- 14) Reviews
INSERT INTO public.reviews (order_id, chef_id, customer_id, rating, comment)
SELECT DISTINCT ON (o.id) o.id, oi.chef_id, o.customer_id, (3 + floor(random()*3))::int, 'Loved it! Will order again.'
FROM public.orders o JOIN public.order_items oi ON oi.order_id = o.id
WHERE o.status = 'delivered'
ON CONFLICT (order_id) DO NOTHING;

-- 15) Notifications
INSERT INTO public.notifications (user_id, type, title, body)
SELECT id, 'info', 'Welcome to Savora 👋', 'Browse home chefs near you and enjoy fresh meals.'
FROM auth.users WHERE email LIKE 'customer%@savora.com';

-- 16) Memberships catalog
INSERT INTO public.memberships (name, description, price, duration_days, benefits) VALUES
  ('Bronze','Free delivery on orders over 200 EGP', 0, 365, '["Free delivery >200 EGP","Birthday treat"]'::jsonb),
  ('Silver','Priority support and 5% off all orders', 99, 30, '["5% off","Priority support","Free delivery >150 EGP"]'::jsonb),
  ('Gold','10% off all orders and free delivery', 199, 30, '["10% off","Free delivery","Exclusive chefs"]'::jsonb)
ON CONFLICT DO NOTHING;
