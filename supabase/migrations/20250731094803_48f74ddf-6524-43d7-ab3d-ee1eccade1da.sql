-- Add subdomain field to tenants table
ALTER TABLE public.tenants ADD COLUMN subdomain text UNIQUE;

-- Add an index for faster subdomain lookups
CREATE INDEX idx_tenants_subdomain ON public.tenants(subdomain);

-- Update existing tenants to have subdomains based on their slugs
UPDATE public.tenants SET subdomain = slug WHERE subdomain IS NULL;