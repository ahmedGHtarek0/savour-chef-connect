
ALTER VIEW public.public_chef_directory SET (security_invoker = true);

-- Allow anyone (anon + authenticated) to read profile rows belonging to approved chefs.
-- Other profile rows remain self-only via existing policy.
CREATE POLICY "profiles read for approved chefs" ON public.profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.chef_profiles cp
      WHERE cp.user_id = profiles.id AND cp.verification_status = 'approved'
    )
  );

GRANT SELECT ON public.profiles TO anon;
