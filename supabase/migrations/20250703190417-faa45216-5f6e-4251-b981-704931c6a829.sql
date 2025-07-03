-- Create storage buckets and policies
INSERT INTO storage.buckets (id, name, public) VALUES 
    ('tenant-logos', 'tenant-logos', true),
    ('client-documents', 'client-documents', false),
    ('reconciliation-files', 'reconciliation-files', false),
    ('payment-files', 'payment-files', false);

-- Create storage policies
CREATE POLICY "Users can upload tenant logos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'tenant-logos' AND 
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role IN ('super_admin', 'tenant_admin'))
);

CREATE POLICY "Anyone can view tenant logos" ON storage.objects FOR SELECT TO authenticated USING (
    bucket_id = 'tenant-logos'
);

CREATE POLICY "Users can upload client documents" ON storage.objects FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'client-documents' AND 
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Users can view client documents" ON storage.objects FOR SELECT TO authenticated USING (
    bucket_id = 'client-documents'
);

-- Create helper functions
CREATE OR REPLACE FUNCTION public.get_user_tenant_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT tenant_id FROM public.profiles WHERE user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid();
$$;