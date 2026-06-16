
-- Reviews table
CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL UNIQUE REFERENCES public.orders(id) ON DELETE CASCADE,
  chef_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating int NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reviews public read" ON public.reviews
  FOR SELECT USING (true);

CREATE POLICY "reviews customer insert" ON public.reviews
  FOR INSERT TO authenticated
  WITH CHECK (
    customer_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id AND o.customer_id = auth.uid() AND o.status = 'delivered'
    )
  );

CREATE POLICY "reviews customer update own" ON public.reviews
  FOR UPDATE TO authenticated
  USING (customer_id = auth.uid())
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY "reviews customer delete own" ON public.reviews
  FOR DELETE TO authenticated
  USING (customer_id = auth.uid() OR has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.tg_updated_at();

CREATE INDEX idx_reviews_chef ON public.reviews(chef_id, created_at DESC);

-- Public directory of approved chefs (safe columns only).
CREATE OR REPLACE VIEW public.public_chef_directory
WITH (security_invoker = false) AS
SELECT
  cp.user_id        AS chef_id,
  p.full_name,
  p.username,
  cp.bio,
  cp.address,
  cp.zone_id,
  cp.lat,
  cp.lng
FROM public.chef_profiles cp
JOIN public.profiles p ON p.id = cp.user_id
WHERE cp.verification_status = 'approved';

GRANT SELECT ON public.public_chef_directory TO anon, authenticated;
