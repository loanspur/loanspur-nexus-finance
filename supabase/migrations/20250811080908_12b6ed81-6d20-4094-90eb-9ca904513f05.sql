-- Tighten security on email_otps: remove public access
ALTER TABLE public.email_otps ENABLE ROW LEVEL SECURITY;

-- Drop overly permissive policy
DROP POLICY IF EXISTS "Service role can manage email OTPs" ON public.email_otps;

-- Do NOT add any permissive policies: deny-by-default
-- Service Role key used by Edge Functions bypasses RLS, so functionality remains intact.

-- Optional explicit deny (redundant but self-documenting)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='email_otps' AND policyname='No direct client access - SELECT'
  ) THEN
    CREATE POLICY "No direct client access - SELECT" ON public.email_otps FOR SELECT USING (false);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='email_otps' AND policyname='No direct client access - INSERT'
  ) THEN
    CREATE POLICY "No direct client access - INSERT" ON public.email_otps FOR INSERT WITH CHECK (false);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='email_otps' AND policyname='No direct client access - UPDATE'
  ) THEN
    CREATE POLICY "No direct client access - UPDATE" ON public.email_otps FOR UPDATE USING (false) WITH CHECK (false);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='email_otps' AND policyname='No direct client access - DELETE'
  ) THEN
    CREATE POLICY "No direct client access - DELETE" ON public.email_otps FOR DELETE USING (false);
  END IF;
END $$;