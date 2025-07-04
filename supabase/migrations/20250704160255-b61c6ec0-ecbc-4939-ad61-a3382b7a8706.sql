-- Insert dummy tenant data for testing
INSERT INTO public.tenants (name, slug, status, pricing_tier, domain, trial_ends_at, settings) VALUES 
('Acme Microfinance', 'acme-mfi', 'active', 'professional', 'acme.microfinance.co.ke', '2025-02-15', '{"theme": "blue", "currency": "KES"}'),
('Kenya Village Bank', 'village-bank-ke', 'active', 'enterprise', 'villagebank.co.ke', NULL, '{"theme": "green", "currency": "KES"}'),
('Startup Loans Ltd', 'startup-loans', 'active', 'starter', NULL, '2025-01-30', '{"theme": "purple", "currency": "KES"}'),
('Rural Credit Union', 'rural-credit', 'suspended', 'professional', NULL, '2024-12-01', '{"theme": "orange", "currency": "KES"}'),
('Metro Finance Group', 'metro-finance', 'active', 'scale', 'metro.finance', NULL, '{"theme": "red", "currency": "KES"}'),
('Community SACCO', 'community-sacco', 'cancelled', 'starter', NULL, '2024-11-15', '{"theme": "gray", "currency": "KES"}');

-- Insert some M-Pesa credentials for a few tenants to show different statuses
INSERT INTO public.mpesa_credentials (tenant_id, environment, consumer_key, consumer_secret, business_short_code, passkey, is_active) 
SELECT 
  t.id,
  'sandbox',
  'dummy_consumer_key_' || substr(t.slug, 1, 10),
  'dummy_consumer_secret_' || substr(t.slug, 1, 10),
  '17' || lpad((random() * 9999)::text, 4, '0'),
  'dummy_passkey_' || substr(t.slug, 1, 20),
  CASE 
    WHEN t.slug = 'acme-mfi' THEN true
    WHEN t.slug = 'village-bank-ke' THEN true
    WHEN t.slug = 'startup-loans' THEN false
    ELSE false
  END as is_active
FROM public.tenants t 
WHERE t.slug IN ('acme-mfi', 'village-bank-ke', 'startup-loans');

-- Insert some M-Pesa transactions for demo purposes
INSERT INTO public.mpesa_transactions (tenant_id, transaction_type, amount, phone_number, account_reference, reconciliation_status)
SELECT 
  t.id,
  'c2b',
  (random() * 10000 + 1000)::numeric,
  '254' || lpad((random() * 999999999)::text, 9, '0'),
  'LOAN-' || lpad((random() * 999)::text, 3, '0'),
  CASE WHEN random() > 0.3 THEN 'matched' ELSE 'unmatched' END
FROM public.tenants t 
WHERE t.slug IN ('acme-mfi', 'village-bank-ke')
LIMIT 5;

INSERT INTO public.mpesa_transactions (tenant_id, transaction_type, amount, phone_number, account_reference, reconciliation_status)
SELECT 
  t.id,
  'b2c',
  (random() * 50000 + 5000)::numeric,
  '254' || lpad((random() * 999999999)::text, 9, '0'),
  'DISBURSEMENT-' || lpad((random() * 999)::text, 3, '0'),
  'matched'
FROM public.tenants t 
WHERE t.slug = 'acme-mfi'
LIMIT 2;