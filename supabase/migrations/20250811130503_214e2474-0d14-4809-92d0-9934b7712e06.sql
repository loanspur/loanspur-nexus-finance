-- Allow public read access to active tenants by subdomain for subdomain-based routing
-- Ensure RLS is enabled (safe if already enabled)
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow anonymous (and authenticated) users to read minimal tenant rows
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'tenants' AND policyname = 'Public can read active tenants'
  ) THEN
    CREATE POLICY "Public can read active tenants"
    ON public.tenants
    FOR SELECT
    TO anon, authenticated
    USING (status = 'active');
  END IF;
END $$;

-- Optional: tighten to only allow select when a subdomain or domain constraint is applied.
-- Not enforceable directly in policy, but our client queries always filter by subdomain.

-- Index to improve lookups by subdomain if not present
CREATE INDEX IF NOT EXISTS idx_tenants_subdomain ON public.tenants (subdomain);
