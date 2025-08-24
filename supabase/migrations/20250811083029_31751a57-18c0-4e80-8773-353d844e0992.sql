-- Enable realtime on tenants table for instant currency decimal updates
ALTER TABLE public.tenants REPLICA IDENTITY FULL;

-- Add tenants table to the realtime publication if not already present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'tenants'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.tenants;
  END IF;
END $$;