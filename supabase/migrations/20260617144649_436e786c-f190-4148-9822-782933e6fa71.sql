
-- Chef can configure quantity bounds; unit_mode already exists ('count' | 'weight_g' | 'weight_kg')
ALTER TABLE public.chef_items 
  ADD COLUMN IF NOT EXISTS min_qty numeric,
  ADD COLUMN IF NOT EXISTS max_qty numeric;

-- Backfill sensible defaults
UPDATE public.chef_items SET min_qty = COALESCE(min_qty, 1), max_qty = COALESCE(max_qty, 10) WHERE min_qty IS NULL OR max_qty IS NULL;
