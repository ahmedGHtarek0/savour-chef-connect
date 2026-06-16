
CREATE POLICY "orders chef read" ON public.orders FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.order_items oi WHERE oi.order_id = id AND oi.chef_id = auth.uid()));

CREATE POLICY "orders chef update status" ON public.orders FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.order_items oi WHERE oi.order_id = id AND oi.chef_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.order_items oi WHERE oi.order_id = id AND oi.chef_id = auth.uid()));
