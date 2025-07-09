-- Clean up duplicate data and add unique constraints

-- First, let's update duplicate national_ids by appending a suffix
WITH duplicates AS (
  SELECT id, national_id, tenant_id,
         ROW_NUMBER() OVER (PARTITION BY tenant_id, national_id ORDER BY created_at) as rn
  FROM public.clients 
  WHERE national_id IS NOT NULL
)
UPDATE public.clients 
SET national_id = CASE 
  WHEN duplicates.rn > 1 THEN duplicates.national_id || '_' || duplicates.rn::text
  ELSE duplicates.national_id
END
FROM duplicates 
WHERE public.clients.id = duplicates.id AND duplicates.rn > 1;

-- Clean up duplicate passport numbers
WITH duplicates AS (
  SELECT id, passport_number, tenant_id,
         ROW_NUMBER() OVER (PARTITION BY tenant_id, passport_number ORDER BY created_at) as rn
  FROM public.clients 
  WHERE passport_number IS NOT NULL
)
UPDATE public.clients 
SET passport_number = CASE 
  WHEN duplicates.rn > 1 THEN duplicates.passport_number || '_' || duplicates.rn::text
  ELSE duplicates.passport_number
END
FROM duplicates 
WHERE public.clients.id = duplicates.id AND duplicates.rn > 1;

-- Clean up duplicate driving license numbers
WITH duplicates AS (
  SELECT id, driving_license_number, tenant_id,
         ROW_NUMBER() OVER (PARTITION BY tenant_id, driving_license_number ORDER BY created_at) as rn
  FROM public.clients 
  WHERE driving_license_number IS NOT NULL
)
UPDATE public.clients 
SET driving_license_number = CASE 
  WHEN duplicates.rn > 1 THEN duplicates.driving_license_number || '_' || duplicates.rn::text
  ELSE duplicates.driving_license_number
END
FROM duplicates 
WHERE public.clients.id = duplicates.id AND duplicates.rn > 1;

-- Clean up duplicate client numbers
WITH duplicates AS (
  SELECT id, client_number, tenant_id,
         ROW_NUMBER() OVER (PARTITION BY tenant_id, client_number ORDER BY created_at) as rn
  FROM public.clients 
)
UPDATE public.clients 
SET client_number = CASE 
  WHEN duplicates.rn > 1 THEN duplicates.client_number || '_' || duplicates.rn::text
  ELSE duplicates.client_number
END
FROM duplicates 
WHERE public.clients.id = duplicates.id AND duplicates.rn > 1;

-- Now add the unique constraints
ALTER TABLE public.clients 
ADD CONSTRAINT unique_client_number 
UNIQUE (tenant_id, client_number);

-- Add unique constraint for national_id (when not null)
CREATE UNIQUE INDEX unique_national_id_per_tenant 
ON public.clients (tenant_id, national_id) 
WHERE national_id IS NOT NULL;

-- Add unique constraint for passport_number (when not null)
CREATE UNIQUE INDEX unique_passport_number_per_tenant 
ON public.clients (tenant_id, passport_number) 
WHERE passport_number IS NOT NULL;

-- Add unique constraint for driving_license_number (when not null)
CREATE UNIQUE INDEX unique_driving_license_per_tenant 
ON public.clients (tenant_id, driving_license_number) 
WHERE driving_license_number IS NOT NULL;