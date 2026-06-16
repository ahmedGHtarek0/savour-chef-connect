
CREATE TYPE public.app_role AS ENUM ('admin', 'chef', 'customer', 'delivery');
CREATE TYPE public.verification_status AS ENUM ('pending', 'approved', 'rejected', 'not_submitted');
CREATE TYPE public.order_status AS ENUM ('placed','awaiting_payment_verification','chef_preparing','ready_for_pickup','picked_up','on_the_way','delivered','cancelled');
CREATE TYPE public.payment_status AS ENUM ('pending','verified','rejected');
CREATE TYPE public.ledger_kind AS ENUM ('customer_charge','platform_cut','chef_payout','delivery_payout','refund');

CREATE OR REPLACE FUNCTION public.tg_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT, username TEXT UNIQUE, phone TEXT UNIQUE, email TEXT, avatar_url TEXT,
  language TEXT NOT NULL DEFAULT 'en', theme TEXT NOT NULL DEFAULT 'light',
  points INT NOT NULL DEFAULT 0,
  allergies TEXT[] NOT NULL DEFAULT '{}', favorite_items UUID[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.tg_updated_at();

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.current_user_roles()
RETURNS SETOF public.app_role LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.user_roles WHERE user_id = auth.uid()
$$;

CREATE POLICY "profiles self read" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "profiles self update" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "profiles self insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "roles self read" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _role public.app_role;
BEGIN
  INSERT INTO public.profiles (id, full_name, username, phone, email)
  VALUES (NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'username', NEW.phone, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  _role := COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'customer');
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, _role) ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, center_lat DOUBLE PRECISION NOT NULL, center_lng DOUBLE PRECISION NOT NULL,
  radius_km DOUBLE PRECISION NOT NULL DEFAULT 5, polygon JSONB, active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.zones TO authenticated, anon;
GRANT INSERT, UPDATE, DELETE ON public.zones TO authenticated;
GRANT ALL ON public.zones TO service_role;
ALTER TABLE public.zones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "zones read all" ON public.zones FOR SELECT USING (true);
CREATE POLICY "zones admin write" ON public.zones FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER zones_updated BEFORE UPDATE ON public.zones FOR EACH ROW EXECUTE FUNCTION public.tg_updated_at();

CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, slug TEXT UNIQUE NOT NULL, description TEXT, image_url TEXT,
  sort_order INT NOT NULL DEFAULT 0, active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categories TO authenticated, anon;
GRANT INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories read all" ON public.categories FOR SELECT USING (true);
CREATE POLICY "categories admin write" ON public.categories FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER categories_updated BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.tg_updated_at();

CREATE TABLE public.items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL, description TEXT, recipe TEXT,
  ingredients TEXT[] NOT NULL DEFAULT '{}', photos TEXT[] NOT NULL DEFAULT '{}',
  base_price NUMERIC(10,2) NOT NULL DEFAULT 0, active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.items TO authenticated, anon;
GRANT INSERT, UPDATE, DELETE ON public.items TO authenticated;
GRANT ALL ON public.items TO service_role;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "items read all" ON public.items FOR SELECT USING (true);
CREATE POLICY "items admin write" ON public.items FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER items_updated BEFORE UPDATE ON public.items FOR EACH ROW EXECUTE FUNCTION public.tg_updated_at();

CREATE TABLE public.chef_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  address TEXT, address_details TEXT, lat DOUBLE PRECISION, lng DOUBLE PRECISION,
  zone_id UUID REFERENCES public.zones(id),
  id_front_url TEXT, id_back_url TEXT, health_cert_url TEXT, ai_id_check JSONB,
  payment_method TEXT, payment_account TEXT, bio TEXT,
  verification_status public.verification_status NOT NULL DEFAULT 'not_submitted',
  rejection_reason TEXT, submitted_at TIMESTAMPTZ, reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.chef_profiles TO authenticated;
GRANT ALL ON public.chef_profiles TO service_role;
ALTER TABLE public.chef_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "chef self rw" ON public.chef_profiles FOR ALL TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin')) WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "chef public read approved" ON public.chef_profiles FOR SELECT USING (verification_status = 'approved');
CREATE TRIGGER chef_profiles_updated BEFORE UPDATE ON public.chef_profiles FOR EACH ROW EXECUTE FUNCTION public.tg_updated_at();

CREATE TABLE public.chef_categories (
  chef_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  PRIMARY KEY (chef_id, category_id)
);
GRANT SELECT, INSERT, DELETE ON public.chef_categories TO authenticated;
GRANT ALL ON public.chef_categories TO service_role;
ALTER TABLE public.chef_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "chef_cats read all" ON public.chef_categories FOR SELECT USING (true);
CREATE POLICY "chef_cats self write" ON public.chef_categories FOR INSERT TO authenticated WITH CHECK (chef_id = auth.uid());
CREATE POLICY "chef_cats self delete" ON public.chef_categories FOR DELETE TO authenticated USING (chef_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.chef_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chef_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  price NUMERIC(10,2) NOT NULL, lead_time_hours INT NOT NULL DEFAULT 2,
  available BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(chef_id, item_id)
);
GRANT SELECT ON public.chef_items TO authenticated, anon;
GRANT INSERT, UPDATE, DELETE ON public.chef_items TO authenticated;
GRANT ALL ON public.chef_items TO service_role;
ALTER TABLE public.chef_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "chef_items read all" ON public.chef_items FOR SELECT USING (true);
CREATE POLICY "chef_items self write" ON public.chef_items FOR ALL TO authenticated USING (chef_id = auth.uid() OR public.has_role(auth.uid(),'admin')) WITH CHECK (chef_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER chef_items_updated BEFORE UPDATE ON public.chef_items FOR EACH ROW EXECUTE FUNCTION public.tg_updated_at();

CREATE TABLE public.delivery_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  id_front_url TEXT, id_back_url TEXT, vehicle_license_url TEXT, driving_license_url TEXT,
  vehicle_photo_url TEXT, ai_id_check JSONB, is_online BOOLEAN NOT NULL DEFAULT FALSE,
  verification_status public.verification_status NOT NULL DEFAULT 'not_submitted',
  rejection_reason TEXT, submitted_at TIMESTAMPTZ, reviewed_at TIMESTAMPTZ,
  total_earnings NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.delivery_profiles TO authenticated;
GRANT ALL ON public.delivery_profiles TO service_role;
ALTER TABLE public.delivery_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "delivery self rw" ON public.delivery_profiles FOR ALL TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin')) WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER delivery_profiles_updated BEFORE UPDATE ON public.delivery_profiles FOR EACH ROW EXECUTE FUNCTION public.tg_updated_at();

CREATE TABLE public.delivery_zones (
  delivery_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  zone_id UUID NOT NULL REFERENCES public.zones(id) ON DELETE CASCADE,
  PRIMARY KEY (delivery_id, zone_id)
);
GRANT SELECT, INSERT, DELETE ON public.delivery_zones TO authenticated;
GRANT ALL ON public.delivery_zones TO service_role;
ALTER TABLE public.delivery_zones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "delivery_zones read all" ON public.delivery_zones FOR SELECT USING (true);
CREATE POLICY "delivery_zones self write" ON public.delivery_zones FOR ALL TO authenticated USING (delivery_id = auth.uid() OR public.has_role(auth.uid(),'admin')) WITH CHECK (delivery_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.customer_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label TEXT NOT NULL DEFAULT 'Home', address TEXT, details TEXT,
  lat DOUBLE PRECISION, lng DOUBLE PRECISION, zone_id UUID REFERENCES public.zones(id),
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_addresses TO authenticated;
GRANT ALL ON public.customer_addresses TO service_role;
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "addresses self" ON public.customer_addresses FOR ALL TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin')) WITH CHECK (user_id = auth.uid());

CREATE TABLE public.payment_gateways (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, account_number TEXT, instructions TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_gateways TO authenticated;
GRANT ALL ON public.payment_gateways TO service_role;
ALTER TABLE public.payment_gateways ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gateways read auth" ON public.payment_gateways FOR SELECT TO authenticated USING (true);
CREATE POLICY "gateways admin write" ON public.payment_gateways FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, description TEXT, price NUMERIC(10,2) NOT NULL,
  duration_days INT NOT NULL DEFAULT 30, benefits JSONB NOT NULL DEFAULT '[]'::jsonb,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.memberships TO authenticated, anon;
GRANT INSERT, UPDATE, DELETE ON public.memberships TO authenticated;
GRANT ALL ON public.memberships TO service_role;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "memberships read all" ON public.memberships FOR SELECT USING (true);
CREATE POLICY "memberships admin write" ON public.memberships FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  membership_id UUID NOT NULL REFERENCES public.memberships(id),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE
);
GRANT SELECT, INSERT ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subs self" ON public.subscriptions FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "subs self insert" ON public.subscriptions FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Create group_orders + group_members BEFORE adding cross-referencing policies
CREATE TABLE public.group_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.group_orders TO authenticated;
GRANT ALL ON public.group_orders TO service_role;
ALTER TABLE public.group_orders ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.group_members (
  group_id UUID NOT NULL REFERENCES public.group_orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  PRIMARY KEY (group_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.group_members TO authenticated;
GRANT ALL ON public.group_members TO service_role;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "group host" ON public.group_orders FOR ALL TO authenticated USING (host_id = auth.uid() OR public.has_role(auth.uid(),'admin')) WITH CHECK (host_id = auth.uid());
CREATE POLICY "group member read" ON public.group_orders FOR SELECT TO authenticated USING (EXISTS(SELECT 1 FROM public.group_members gm WHERE gm.group_id = id AND gm.user_id = auth.uid()));
CREATE POLICY "group members self read" ON public.group_members FOR SELECT TO authenticated USING (user_id = auth.uid() OR EXISTS(SELECT 1 FROM public.group_orders g WHERE g.id = group_id AND g.host_id = auth.uid()));
CREATE POLICY "group members join" ON public.group_members FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES auth.users(id),
  address_id UUID REFERENCES public.customer_addresses(id),
  group_order_id UUID REFERENCES public.group_orders(id),
  status public.order_status NOT NULL DEFAULT 'placed',
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0, delivery_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount NUMERIC(10,2) NOT NULL DEFAULT 0, total NUMERIC(10,2) NOT NULL DEFAULT 0,
  payment_gateway_id UUID REFERENCES public.payment_gateways(id),
  payment_status public.payment_status NOT NULL DEFAULT 'pending',
  placed_at TIMESTAMPTZ NOT NULL DEFAULT now(), delivered_at TIMESTAMPTZ, notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER orders_updated BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.tg_updated_at();

CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  chef_id UUID NOT NULL REFERENCES auth.users(id),
  item_id UUID NOT NULL REFERENCES public.items(id),
  chef_item_id UUID REFERENCES public.chef_items(id),
  qty INT NOT NULL DEFAULT 1, unit_price NUMERIC(10,2) NOT NULL, lead_time_hours INT NOT NULL DEFAULT 2
);
GRANT SELECT, INSERT, UPDATE ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL UNIQUE REFERENCES public.orders(id) ON DELETE CASCADE,
  delivery_id UUID REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'unassigned',
  picked_at TIMESTAMPTZ, delivered_at TIMESTAMPTZ,
  earnings NUMERIC(10,2) NOT NULL DEFAULT 0, distance_km NUMERIC(10,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.deliveries TO authenticated;
GRANT ALL ON public.deliveries TO service_role;
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "orders customer rw" ON public.orders FOR ALL TO authenticated
  USING (customer_id = auth.uid() OR public.has_role(auth.uid(),'admin')
    OR EXISTS(SELECT 1 FROM public.order_items oi WHERE oi.order_id = id AND oi.chef_id = auth.uid())
    OR EXISTS(SELECT 1 FROM public.deliveries d WHERE d.order_id = id AND d.delivery_id = auth.uid()))
  WITH CHECK (customer_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "order_items participants" ON public.order_items FOR SELECT TO authenticated
  USING (chef_id = auth.uid() OR public.has_role(auth.uid(),'admin')
    OR EXISTS(SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.customer_id = auth.uid())
    OR EXISTS(SELECT 1 FROM public.deliveries d WHERE d.order_id = order_id AND d.delivery_id = auth.uid()));
CREATE POLICY "order_items customer insert" ON public.order_items FOR INSERT TO authenticated
  WITH CHECK (EXISTS(SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.customer_id = auth.uid()));

CREATE POLICY "deliveries participants" ON public.deliveries FOR SELECT TO authenticated
  USING (delivery_id = auth.uid() OR public.has_role(auth.uid(),'admin')
    OR EXISTS(SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.customer_id = auth.uid())
    OR EXISTS(SELECT 1 FROM public.order_items oi WHERE oi.order_id = order_id AND oi.chef_id = auth.uid()));
CREATE POLICY "deliveries self update" ON public.deliveries FOR UPDATE TO authenticated
  USING (delivery_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "deliveries admin insert" ON public.deliveries FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.payment_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  status public.payment_status NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES auth.users(id), reviewed_at TIMESTAMPTZ, notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.payment_receipts TO authenticated;
GRANT ALL ON public.payment_receipts TO service_role;
ALTER TABLE public.payment_receipts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "receipts customer + admin" ON public.payment_receipts FOR ALL TO authenticated
  USING (EXISTS(SELECT 1 FROM public.orders o WHERE o.id = order_id AND (o.customer_id = auth.uid() OR public.has_role(auth.uid(),'admin'))))
  WITH CHECK (EXISTS(SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.customer_id = auth.uid()) OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  party_id UUID, party_role public.app_role, kind public.ledger_kind NOT NULL,
  amount NUMERIC(10,2) NOT NULL, status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.ledger TO authenticated;
GRANT ALL ON public.ledger TO service_role;
ALTER TABLE public.ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ledger self + admin" ON public.ledger FOR SELECT TO authenticated USING (party_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "ledger admin write" ON public.ledger FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.discounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES public.items(id) ON DELETE CASCADE,
  points_required INT NOT NULL DEFAULT 50, percent_off NUMERIC(5,2) NOT NULL DEFAULT 10,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.discounts TO authenticated, anon;
GRANT INSERT, UPDATE, DELETE ON public.discounts TO authenticated;
GRANT ALL ON public.discounts TO service_role;
ALTER TABLE public.discounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "discounts read all" ON public.discounts FOR SELECT USING (true);
CREATE POLICY "discounts admin write" ON public.discounts FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, title TEXT NOT NULL, body TEXT, data JSONB,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notif self" ON public.notifications FOR ALL TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin')) WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.app_settings (
  key TEXT PRIMARY KEY, value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.app_settings TO authenticated, anon;
GRANT INSERT, UPDATE, DELETE ON public.app_settings TO authenticated;
GRANT ALL ON public.app_settings TO service_role;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings read all" ON public.app_settings FOR SELECT USING (true);
CREATE POLICY "settings admin write" ON public.app_settings FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.deliveries;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

INSERT INTO public.app_settings (key, value) VALUES
  ('delivery_price_per_km', '15'::jsonb),
  ('points_per_order', '5'::jsonb),
  ('points_unlock_threshold', '50'::jsonb);

INSERT INTO public.zones (id, name, center_lat, center_lng, radius_km) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Downtown', 30.0444, 31.2357, 8),
  ('22222222-2222-2222-2222-222222222222', 'New Cairo', 30.0300, 31.4700, 10);

INSERT INTO public.categories (id, name, slug, description, sort_order) VALUES
  ('a0000000-0000-0000-0000-000000000001','Sweets','sweets','Home-made desserts and pastries',1),
  ('a0000000-0000-0000-0000-000000000002','Mains','mains','Hearty home-cooked main courses',2),
  ('a0000000-0000-0000-0000-000000000003','Mezze','mezze','Small plates and appetizers',3),
  ('a0000000-0000-0000-0000-000000000004','Breakfast','breakfast','Morning comfort food',4),
  ('a0000000-0000-0000-0000-000000000005','Beverages','beverages','Juices, teas and specialty drinks',5);

INSERT INTO public.items (category_id, name, description, ingredients, base_price) VALUES
  ('a0000000-0000-0000-0000-000000000001','Basbousa','Semolina cake soaked in rose syrup', ARRAY['semolina','yogurt','rose water','sugar'], 60),
  ('a0000000-0000-0000-0000-000000000001','Kunafa','Crispy shredded pastry with sweet cheese', ARRAY['kunafa dough','akkawi cheese','sugar syrup'], 85),
  ('a0000000-0000-0000-0000-000000000002','Molokhia with Chicken','Slow-cooked jute leaves with garlic and chicken', ARRAY['molokhia','chicken','garlic','coriander'], 120),
  ('a0000000-0000-0000-0000-000000000002','Mahshi Warak','Vine leaves stuffed with rice and herbs', ARRAY['vine leaves','rice','tomato','mint'], 95),
  ('a0000000-0000-0000-0000-000000000003','Hummus','Creamy chickpea dip with tahini and olive oil', ARRAY['chickpeas','tahini','lemon','olive oil'], 45),
  ('a0000000-0000-0000-0000-000000000003','Baba Ganoush','Smoky grilled eggplant dip', ARRAY['eggplant','tahini','garlic'], 50),
  ('a0000000-0000-0000-0000-000000000004','Ful Medames','Slow-cooked fava beans with cumin', ARRAY['fava beans','cumin','lemon'], 35),
  ('a0000000-0000-0000-0000-000000000004','Shakshuka','Eggs poached in spiced tomato sauce', ARRAY['eggs','tomato','pepper','cumin'], 55),
  ('a0000000-0000-0000-0000-000000000005','Karkadeh','Chilled hibiscus tea', ARRAY['hibiscus','sugar'], 25),
  ('a0000000-0000-0000-0000-000000000005','Sahlab','Warm orchid milk pudding', ARRAY['sahlab','milk','cinnamon','pistachio'], 40);

INSERT INTO public.payment_gateways (name, account_number, instructions, active) VALUES
  ('Vodafone Cash', '01000000000', 'Send total to the number, then upload your receipt screenshot.', true),
  ('InstaPay', 'savora@instapay', 'Transfer via InstaPay then upload screenshot.', true);

INSERT INTO public.memberships (name, description, price, duration_days, benefits) VALUES
  ('Savora Plus', 'Free delivery + 5% off all orders', 99, 30, '["free_delivery","5_percent_off","priority_support"]'::jsonb),
  ('Savora Gold', 'Free delivery + 10% off + 2x points + priority chef', 199, 30, '["free_delivery","10_percent_off","double_points","priority_chef"]'::jsonb);
