-- Ensure unique short_name per tenant for savings_products (case-insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS ux_savings_products_tenant_short_name_ci
ON public.savings_products (tenant_id, lower(short_name));