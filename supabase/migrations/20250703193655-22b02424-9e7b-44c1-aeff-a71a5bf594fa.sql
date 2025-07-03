-- Insert dummy tenants
INSERT INTO public.tenants (id, name, slug, pricing_tier, status, theme_colors) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'ABC Microfinance', 'abc-microfinance', 'professional', 'active', '{"primary": "#2563eb", "secondary": "#64748b"}'),
('550e8400-e29b-41d4-a716-446655440002', 'XYZ SACCO', 'xyz-sacco', 'enterprise', 'active', '{"primary": "#059669", "secondary": "#6b7280"}'),
('550e8400-e29b-41d4-a716-446655440003', 'Community Bank', 'community-bank', 'professional', 'active', '{"primary": "#dc2626", "secondary": "#64748b"}')
ON CONFLICT (id) DO NOTHING;

-- Insert dummy profiles for different roles
INSERT INTO public.profiles (id, user_id, email, first_name, last_name, role, tenant_id, is_active) VALUES
-- Super Admin
('550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440010', 'admin@loanspur.com', 'Super', 'Admin', 'super_admin', NULL, true),
-- Tenant Admins
('550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440011', 'admin@abc-microfinance.com', 'John', 'Manager', 'tenant_admin', '550e8400-e29b-41d4-a716-446655440001', true),
('550e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440012', 'admin@xyz-sacco.com', 'Jane', 'Director', 'tenant_admin', '550e8400-e29b-41d4-a716-446655440002', true),
-- Loan Officers
('550e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440013', 'officer@abc-microfinance.com', 'Mike', 'Officer', 'loan_officer', '550e8400-e29b-41d4-a716-446655440001', true),
-- Clients
('550e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440014', 'client1@example.com', 'Alice', 'Johnson', 'client', '550e8400-e29b-41d4-a716-446655440001', true),
('550e8400-e29b-41d4-a716-446655440015', '550e8400-e29b-41d4-a716-446655440015', 'client2@example.com', 'Bob', 'Smith', 'client', '550e8400-e29b-41d4-a716-446655440001', true)
ON CONFLICT (id) DO NOTHING;

-- Insert dummy clients
INSERT INTO public.clients (id, tenant_id, client_number, first_name, last_name, email, phone, national_id, date_of_birth, gender, monthly_income, timely_repayment_rate, is_active) VALUES
('550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440001', 'ABC001', 'Alice', 'Johnson', 'client1@example.com', '+254700000001', '12345678', '1990-05-15', 'Female', 25000, 95.5, true),
('550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440001', 'ABC002', 'Bob', 'Smith', 'client2@example.com', '+254700000002', '12345679', '1985-08-22', 'Male', 35000, 88.2, true),
('550e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440001', 'ABC003', 'Carol', 'Davis', 'carol@example.com', '+254700000003', '12345680', '1992-12-10', 'Female', 28000, 92.1, true),
('550e8400-e29b-41d4-a716-446655440023', '550e8400-e29b-41d4-a716-446655440002', 'XYZ001', 'David', 'Wilson', 'david@example.com', '+254700000004', '12345681', '1988-03-18', 'Male', 40000, 96.8, true),
('550e8400-e29b-41d4-a716-446655440024', '550e8400-e29b-41d4-a716-446655440002', 'XYZ002', 'Emma', 'Brown', 'emma@example.com', '+254700000005', '12345682', '1993-07-25', 'Female', 32000, 89.5, true)
ON CONFLICT (id) DO NOTHING;