
-- Per-day capacity enforcement and rejection notifications

CREATE OR REPLACE FUNCTION public.tg_enforce_chef_capacity()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  chef uuid;
  cap int;
  used int;
BEGIN
  -- Find which chefs are in this order
  FOR chef IN
    SELECT DISTINCT chef_id FROM public.order_items WHERE order_id = NEW.id
  LOOP
    SELECT COALESCE(max_orders_per_day, 10) INTO cap FROM public.chef_profiles WHERE user_id = chef;
    SELECT count(DISTINCT o.id) INTO used
      FROM public.orders o
      JOIN public.order_items oi ON oi.order_id = o.id
      WHERE oi.chef_id = chef
        AND o.created_at::date = NEW.created_at::date
        AND o.id <> NEW.id
        AND o.status NOT IN ('cancelled');
    IF used >= cap THEN
      RAISE EXCEPTION 'Chef has reached daily order limit (%).', cap USING ERRCODE = 'check_violation';
    END IF;
  END LOOP;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS enforce_chef_capacity ON public.orders;
CREATE CONSTRAINT TRIGGER enforce_chef_capacity
  AFTER INSERT ON public.orders
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION public.tg_enforce_chef_capacity();
