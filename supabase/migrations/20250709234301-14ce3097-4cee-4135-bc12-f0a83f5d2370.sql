-- Add unique constraints to prevent duplicate client identifiers

-- Add unique constraint for client_number (always required)
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