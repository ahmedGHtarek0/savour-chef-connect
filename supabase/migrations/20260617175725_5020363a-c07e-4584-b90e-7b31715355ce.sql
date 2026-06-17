
-- 0. Drop any pre-existing check constraint that may block normalization
ALTER TABLE public.chef_items DROP CONSTRAINT IF EXISTS chef_items_unit_mode_check;
UPDATE public.chef_items SET unit_mode = 'weight_kg' WHERE unit_mode NOT IN ('count','weight_g','weight_kg');

-- 1. PROFILES UNIQUENESS
CREATE UNIQUE INDEX IF NOT EXISTS profiles_email_unique_idx ON public.profiles (lower(email)) WHERE email IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_unique_idx ON public.profiles (lower(username)) WHERE username IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS profiles_phone_unique_idx ON public.profiles (phone) WHERE phone IS NOT NULL;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE _role public.app_role;
BEGIN
  INSERT INTO public.profiles (id, full_name, username, phone, email)
  VALUES (NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    lower(NULLIF(NEW.raw_user_meta_data->>'username','')),
    NULLIF(NEW.phone,''),
    lower(NULLIF(NEW.email,'')))
  ON CONFLICT (id) DO NOTHING;
  _role := COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'customer');
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, _role) ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$function$;

-- 2. CHEF CAPACITY
UPDATE public.chef_profiles SET max_orders_per_day = 10 WHERE max_orders_per_day IS NULL;
ALTER TABLE public.chef_profiles
  ALTER COLUMN max_orders_per_day SET NOT NULL,
  ALTER COLUMN max_orders_per_day SET DEFAULT 10;
ALTER TABLE public.chef_profiles DROP CONSTRAINT IF EXISTS chef_profiles_capacity_positive;
ALTER TABLE public.chef_profiles ADD CONSTRAINT chef_profiles_capacity_positive CHECK (max_orders_per_day > 0 AND max_orders_per_day <= 1000);

CREATE OR REPLACE FUNCTION public.tg_enforce_chef_capacity()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE chef uuid; cap int; used int;
BEGIN
  FOR chef IN SELECT DISTINCT chef_id FROM public.order_items WHERE order_id = NEW.id LOOP
    SELECT max_orders_per_day INTO cap FROM public.chef_profiles WHERE user_id = chef FOR UPDATE;
    IF cap IS NULL THEN cap := 10; END IF;
    SELECT count(DISTINCT o.id) INTO used
      FROM public.orders o JOIN public.order_items oi ON oi.order_id = o.id
     WHERE oi.chef_id = chef AND o.created_at::date = NEW.created_at::date
       AND o.id <> NEW.id AND o.status NOT IN ('cancelled');
    IF used >= cap THEN
      RAISE EXCEPTION 'Chef has reached daily order limit (%).', cap USING ERRCODE='check_violation';
    END IF;
  END LOOP;
  RETURN NEW;
END;
$function$;
DROP TRIGGER IF EXISTS enforce_chef_capacity ON public.orders;
CREATE TRIGGER enforce_chef_capacity AFTER INSERT ON public.orders FOR EACH ROW EXECUTE FUNCTION public.tg_enforce_chef_capacity();

-- 3. CHEF_ITEMS CONSTRAINTS
ALTER TABLE public.chef_items ADD CONSTRAINT chef_items_unit_mode_check CHECK (unit_mode IN ('count','weight_g','weight_kg'));
ALTER TABLE public.chef_items DROP CONSTRAINT IF EXISTS chef_items_qty_bounds_check;
ALTER TABLE public.chef_items ADD CONSTRAINT chef_items_qty_bounds_check CHECK (min_qty IS NULL OR max_qty IS NULL OR min_qty <= max_qty);
ALTER TABLE public.chef_items DROP CONSTRAINT IF EXISTS chef_items_qty_positive_check;
ALTER TABLE public.chef_items ADD CONSTRAINT chef_items_qty_positive_check CHECK ((min_qty IS NULL OR min_qty > 0) AND (max_qty IS NULL OR max_qty > 0));

-- 4. PAYMENT RECEIPTS: one active per order
DROP INDEX IF EXISTS payment_receipts_one_active_per_order;
CREATE UNIQUE INDEX payment_receipts_one_active_per_order
  ON public.payment_receipts (order_id) WHERE status IN ('pending','verified');

-- 5. ORDER STATUS GUARD
CREATE OR REPLACE FUNCTION public.tg_orders_require_paid()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE has_paid boolean;
BEGIN
  IF NEW.status IN ('chef_preparing','ready_for_pickup','picked_up','on_the_way','delivered')
     AND (OLD.status IS DISTINCT FROM NEW.status) THEN
    SELECT EXISTS(SELECT 1 FROM public.payment_receipts pr WHERE pr.order_id=NEW.id AND pr.status='verified') INTO has_paid;
    IF NOT has_paid AND NEW.payment_status <> 'verified' THEN
      RAISE EXCEPTION 'Order % cannot advance to % before payment is verified.', NEW.id, NEW.status USING ERRCODE='check_violation';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;
DROP TRIGGER IF EXISTS orders_require_paid ON public.orders;
CREATE TRIGGER orders_require_paid BEFORE UPDATE OF status ON public.orders FOR EACH ROW EXECUTE FUNCTION public.tg_orders_require_paid();

-- 6. FIX BROKEN RLS POLICIES
DROP POLICY IF EXISTS "orders chef read" ON public.orders;
DROP POLICY IF EXISTS "orders chef update status" ON public.orders;
DROP POLICY IF EXISTS "orders customer rw" ON public.orders;

CREATE POLICY "orders read" ON public.orders FOR SELECT USING (
  customer_id = auth.uid() OR public.has_role(auth.uid(),'admin')
  OR EXISTS (SELECT 1 FROM public.order_items oi WHERE oi.order_id=orders.id AND oi.chef_id=auth.uid())
  OR EXISTS (SELECT 1 FROM public.deliveries d WHERE d.order_id=orders.id AND d.delivery_id=auth.uid())
);
CREATE POLICY "orders customer insert" ON public.orders FOR INSERT
  WITH CHECK (customer_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "orders customer update" ON public.orders FOR UPDATE
  USING (customer_id = auth.uid() OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (customer_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "orders chef update" ON public.orders FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.order_items oi WHERE oi.order_id=orders.id AND oi.chef_id=auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.order_items oi WHERE oi.order_id=orders.id AND oi.chef_id=auth.uid()));
CREATE POLICY "orders delivery update" ON public.orders FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.deliveries d WHERE d.order_id=orders.id AND d.delivery_id=auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.deliveries d WHERE d.order_id=orders.id AND d.delivery_id=auth.uid()));

-- 7. NOTIFICATIONS DEDUPE
CREATE UNIQUE INDEX IF NOT EXISTS notifications_dedupe_idx
  ON public.notifications (user_id, type, (data->>'entity_id')) WHERE data ? 'entity_id';

-- 8. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS orders_customer_created_idx ON public.orders (customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS orders_status_created_idx ON public.orders (status, created_at DESC);
CREATE INDEX IF NOT EXISTS order_items_chef_idx ON public.order_items (chef_id, order_id);
CREATE INDEX IF NOT EXISTS deliveries_status_idx ON public.deliveries (status);
CREATE INDEX IF NOT EXISTS notifications_user_unread_idx ON public.notifications (user_id, read, created_at DESC);
CREATE INDEX IF NOT EXISTS payment_receipts_status_idx ON public.payment_receipts (status, created_at DESC);
