-- Secure password_reset_tokens table: deny public access while preserving Edge Function (service role) access
DO $$
DECLARE r RECORD;
BEGIN
  IF to_regclass('public.password_reset_tokens') IS NOT NULL THEN
    -- Ensure RLS is enabled and enforced
    ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.password_reset_tokens FORCE ROW LEVEL SECURITY;

    -- Drop all existing policies to remove any permissive access
    FOR r IN 
      SELECT pol.policyname 
      FROM pg_policies pol 
      WHERE pol.schemaname = 'public' AND pol.tablename = 'password_reset_tokens'
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.password_reset_tokens', r.policyname);
    END LOOP;

    -- Explicit deny policies for all commands (defense-in-depth)
    CREATE POLICY "No client SELECT on password_reset_tokens" 
      ON public.password_reset_tokens FOR SELECT USING (false);
    CREATE POLICY "No client INSERT on password_reset_tokens" 
      ON public.password_reset_tokens FOR INSERT WITH CHECK (false);
    CREATE POLICY "No client UPDATE on password_reset_tokens" 
      ON public.password_reset_tokens FOR UPDATE USING (false) WITH CHECK (false);
    CREATE POLICY "No client DELETE on password_reset_tokens" 
      ON public.password_reset_tokens FOR DELETE USING (false);
  END IF;
END $$;