
CREATE UNIQUE INDEX IF NOT EXISTS profiles_phone_unique ON public.profiles (phone) WHERE phone IS NOT NULL AND phone <> '';
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_unique ON public.profiles (lower(username)) WHERE username IS NOT NULL AND username <> '';
