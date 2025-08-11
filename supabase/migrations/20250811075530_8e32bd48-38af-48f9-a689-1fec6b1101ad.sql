-- Create client_documents table and add account_opening_date to clients

-- 1) Add column to clients for onboarding date
ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS account_opening_date date;

-- 2) Create client_documents table
CREATE TABLE IF NOT EXISTS public.client_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  client_id uuid NOT NULL,
  document_name text NOT NULL,
  document_type text NOT NULL,
  description text,
  file_url text NOT NULL, -- storage path within bucket
  file_size bigint,
  mime_type text,
  is_verified boolean NOT NULL DEFAULT false,
  is_required boolean NOT NULL DEFAULT false,
  expiry_date date,
  uploaded_by uuid, -- profiles.id
  verified_by uuid, -- profiles.id
  verified_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Optional FKs for data integrity (do not enforce cascading)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_client_documents_client_id'
  ) THEN
    ALTER TABLE public.client_documents
      ADD CONSTRAINT fk_client_documents_client_id
      FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_client_documents_uploaded_by'
  ) THEN
    ALTER TABLE public.client_documents
      ADD CONSTRAINT fk_client_documents_uploaded_by
      FOREIGN KEY (uploaded_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_client_documents_verified_by'
  ) THEN
    ALTER TABLE public.client_documents
      ADD CONSTRAINT fk_client_documents_verified_by
      FOREIGN KEY (verified_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_client_documents_client_id ON public.client_documents(client_id);
CREATE INDEX IF NOT EXISTS idx_client_documents_tenant_id ON public.client_documents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_client_documents_created_at ON public.client_documents(created_at DESC);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_client_documents_updated_at ON public.client_documents;
CREATE TRIGGER trg_client_documents_updated_at
BEFORE UPDATE ON public.client_documents
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Enable RLS
ALTER TABLE public.client_documents ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='client_documents' AND policyname='Select client documents by tenant or office access'
  ) THEN
    CREATE POLICY "Select client documents by tenant or office access"
    ON public.client_documents
    FOR SELECT
    USING (
      (tenant_id = get_user_tenant_id())
      OR (client_id IN (SELECT client_id FROM get_user_accessible_client_ids()))
      OR (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'super_admin'))
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='client_documents' AND policyname='Insert client documents (tenant + office access)'
  ) THEN
    CREATE POLICY "Insert client documents (tenant + office access)"
    ON public.client_documents
    FOR INSERT
    WITH CHECK (
      (tenant_id = get_user_tenant_id())
      AND (
        client_id IN (SELECT client_id FROM get_user_accessible_client_ids())
        OR (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role IN ('tenant_admin','super_admin')))
      )
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='client_documents' AND policyname='Update client documents (tenant match)'
  ) THEN
    CREATE POLICY "Update client documents (tenant match)"
    ON public.client_documents
    FOR UPDATE
    USING (
      (tenant_id = get_user_tenant_id())
      OR (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'super_admin'))
    )
    WITH CHECK (tenant_id = get_user_tenant_id());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='client_documents' AND policyname='Delete client documents (tenant match)'
  ) THEN
    CREATE POLICY "Delete client documents (tenant match)"
    ON public.client_documents
    FOR DELETE
    USING (
      (tenant_id = get_user_tenant_id())
      OR (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'super_admin'))
    );
  END IF;
END $$;
