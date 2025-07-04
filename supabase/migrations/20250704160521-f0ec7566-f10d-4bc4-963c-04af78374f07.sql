-- Insert dummy tenant data for testing (without M-Pesa data for now)
INSERT INTO public.tenants (name, slug, status, pricing_tier, domain, trial_ends_at, contact_person_name, contact_person_email, contact_person_phone, currency_code, country, city) VALUES 
('Acme Microfinance', 'acme-mfi', 'active', 'professional', 'acme.microfinance.co.ke', '2025-02-15', 'John Kamau', 'john@acme-mfi.co.ke', '+254712345678', 'KES', 'Kenya', 'Nairobi'),
('Kenya Village Bank', 'village-bank-ke', 'active', 'enterprise', 'villagebank.co.ke', NULL, 'Mary Wanjiku', 'mary@villagebank.co.ke', '+254723456789', 'KES', 'Kenya', 'Kisumu'),
('Startup Loans Ltd', 'startup-loans', 'active', 'starter', NULL, '2025-01-30', 'Peter Ochieng', 'peter@startupLoans.com', '+254734567890', 'KES', 'Kenya', 'Mombasa'),
('Rural Credit Union', 'rural-credit', 'suspended', 'professional', NULL, '2024-12-01', 'Grace Njeri', 'grace@ruralcredit.org', '+254745678901', 'KES', 'Kenya', 'Eldoret'),
('Metro Finance Group', 'metro-finance', 'active', 'scale', 'metro.finance', NULL, 'David Kiprop', 'david@metro.finance', '+254756789012', 'KES', 'Kenya', 'Nakuru'),
('Community SACCO', 'community-sacco', 'cancelled', 'starter', NULL, '2024-11-15', 'Rose Akinyi', 'rose@communitysacco.org', '+254767890123', 'KES', 'Kenya', 'Thika');