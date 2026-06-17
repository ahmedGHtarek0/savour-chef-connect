
ALTER TABLE public.chef_profiles
  ADD COLUMN IF NOT EXISTS max_orders_per_day integer DEFAULT 10,
  ADD COLUMN IF NOT EXISTS rejection_reason text;

ALTER TABLE public.chef_items
  ADD COLUMN IF NOT EXISTS unit_mode text NOT NULL DEFAULT 'count'
    CHECK (unit_mode IN ('count','weight'));

ALTER TABLE public.items
  ADD COLUMN IF NOT EXISTS recipe text,
  ADD COLUMN IF NOT EXISTS ingredients text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS photos text[] DEFAULT '{}'::text[];

CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_lower_unique
  ON public.profiles ((lower(username))) WHERE username IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS profiles_email_lower_unique
  ON public.profiles ((lower(email))) WHERE email IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS profiles_phone_unique
  ON public.profiles (phone) WHERE phone IS NOT NULL;

TRUNCATE TABLE
  public.payment_receipts,
  public.order_items,
  public.deliveries,
  public.reviews,
  public.ledger,
  public.notifications,
  public.group_members,
  public.group_orders,
  public.customer_addresses,
  public.chef_items,
  public.subscriptions
RESTART IDENTITY CASCADE;

DELETE FROM public.orders;

UPDATE public.chef_profiles
SET verification_status = 'not_submitted',
    rejection_reason = NULL,
    submitted_at = NULL,
    ai_id_check = NULL,
    id_front_url = NULL,
    id_back_url = NULL,
    health_cert_url = NULL,
    lat = NULL,
    lng = NULL,
    address = NULL,
    payment_method = NULL,
    payment_account = NULL,
    max_orders_per_day = 10;

UPDATE public.items SET
  recipe = COALESCE(NULLIF(recipe,''), 'Traditional preparation — see chef notes on the dish detail page.'),
  ingredients = CASE WHEN array_length(ingredients,1) IS NULL OR array_length(ingredients,1)=0
                THEN ARRAY['fresh seasonal produce','house spice blend','olive oil','salt','garlic']
                ELSE ingredients END
WHERE recipe IS NULL OR ingredients IS NULL OR array_length(ingredients,1) IS NULL;
