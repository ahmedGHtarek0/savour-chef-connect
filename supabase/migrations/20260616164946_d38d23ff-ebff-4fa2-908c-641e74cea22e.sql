
CREATE POLICY "deliveries unclaimed visible to drivers" ON public.deliveries
  FOR SELECT TO authenticated
  USING (delivery_id IS NULL AND public.has_role(auth.uid(), 'delivery'));

CREATE POLICY "deliveries driver claim" ON public.deliveries
  FOR UPDATE TO authenticated
  USING (delivery_id IS NULL AND public.has_role(auth.uid(), 'delivery'))
  WITH CHECK (delivery_id = auth.uid());

CREATE OR REPLACE FUNCTION public.tg_create_delivery_on_ready()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'ready_for_pickup' AND (OLD.status IS DISTINCT FROM 'ready_for_pickup') THEN
    INSERT INTO public.deliveries (order_id, status) VALUES (NEW.id, 'available')
    ON CONFLICT (order_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS orders_create_delivery ON public.orders;
CREATE TRIGGER orders_create_delivery
  AFTER UPDATE OF status ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.tg_create_delivery_on_ready();

CREATE POLICY "delivery docs owner read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'delivery-docs' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.has_role(auth.uid(), 'admin')));
CREATE POLICY "delivery docs owner insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'delivery-docs' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "delivery docs owner update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'delivery-docs' AND auth.uid()::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'delivery-docs' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "delivery docs owner delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'delivery-docs' AND auth.uid()::text = (storage.foldername(name))[1]);
