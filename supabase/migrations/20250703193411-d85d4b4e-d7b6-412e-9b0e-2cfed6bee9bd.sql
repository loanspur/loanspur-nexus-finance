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

-- Insert dummy loan products
INSERT INTO public.loan_products (id, tenant_id, name, short_name, description, currency_code, min_principal, max_principal, default_principal, min_nominal_interest_rate, max_nominal_interest_rate, default_nominal_interest_rate, min_term, max_term, default_term, repayment_frequency, is_active) VALUES
('550e8400-e29b-41d4-a716-446655440030', '550e8400-e29b-41d4-a716-446655440001', 'Individual Loan', 'IND_LOAN', 'Standard individual loan product', 'USD', 1000, 50000, 5000, 10.0, 25.0, 15.0, 6, 36, 12, 'monthly', true),
('550e8400-e29b-41d4-a716-446655440031', '550e8400-e29b-41d4-a716-446655440001', 'Group Loan', 'GRP_LOAN', 'Group lending product', 'USD', 5000, 100000, 20000, 8.0, 20.0, 12.0, 12, 48, 24, 'monthly', true),
('550e8400-e29b-41d4-a716-446655440032', '550e8400-e29b-41d4-a716-446655440002', 'SME Loan', 'SME_LOAN', 'Small and medium enterprise loan', 'USD', 10000, 200000, 50000, 12.0, 30.0, 18.0, 12, 60, 36, 'monthly', true)
ON CONFLICT (id) DO NOTHING;

-- Insert dummy loans
INSERT INTO public.loans (id, tenant_id, client_id, loan_product_id, loan_number, principal_amount, interest_rate, term_months, disbursement_date, expected_maturity_date, outstanding_balance, total_overdue_amount, next_repayment_amount, next_repayment_date, status, loan_officer_id) VALUES
('550e8400-e29b-41d4-a716-446655440040', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440030', 'LN001', 15000, 15.0, 12, '2024-01-15', '2025-01-15', 8500, 0, 1250, '2024-12-15', 'active', '550e8400-e29b-41d4-a716-446655440013'),
('550e8400-e29b-41d4-a716-446655440041', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440030', 'LN002', 25000, 15.0, 18, '2024-02-01', '2025-08-01', 18750, 500, 1680, '2024-12-01', 'overdue', '550e8400-e29b-41d4-a716-446655440013'),
('550e8400-e29b-41d4-a716-446655440042', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440031', 'LN003', 30000, 12.0, 24, '2024-03-10', '2026-03-10', 22500, 0, 1450, '2024-12-10', 'active', '550e8400-e29b-41d4-a716-446655440013'),
('550e8400-e29b-41d4-a716-446655440043', '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440023', '550e8400-e29b-41d4-a716-446655440032', 'LN004', 75000, 18.0, 36, '2024-04-01', '2027-04-01', 65000, 0, 2850, '2024-12-01', 'active', NULL)
ON CONFLICT (id) DO NOTHING;

-- Insert dummy savings products
INSERT INTO public.savings_products (id, tenant_id, name, short_name, description, currency_code, nominal_annual_interest_rate, min_required_opening_balance, min_balance_for_interest_calculation, is_active) VALUES
('550e8400-e29b-41d4-a716-446655440050', '550e8400-e29b-41d4-a716-446655440001', 'Standard Savings', 'STD_SAV', 'Standard savings account', 'USD', 5.0, 100, 500, true),
('550e8400-e29b-41d4-a716-446655440051', '550e8400-e29b-41d4-a716-446655440001', 'Premium Savings', 'PREM_SAV', 'High yield savings account', 'USD', 7.5, 1000, 2000, true),
('550e8400-e29b-41d4-a716-446655440052', '550e8400-e29b-41d4-a716-446655440002', 'Business Savings', 'BIZ_SAV', 'Business savings account', 'USD', 6.0, 500, 1000, true)
ON CONFLICT (id) DO NOTHING;

-- Insert dummy savings accounts
INSERT INTO public.savings_accounts (id, tenant_id, client_id, savings_product_id, account_number, account_balance, available_balance, interest_earned, is_active, opened_date) VALUES
('550e8400-e29b-41d4-a716-446655440060', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440050', 'SAV001', 5500, 5500, 125.50, true, '2024-01-10'),
('550e8400-e29b-41d4-a716-446655440061', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440050', 'SAV002', 12750, 12750, 275.80, true, '2024-01-15'),
('550e8400-e29b-41d4-a716-446655440062', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440051', 'SAV003', 8900, 8900, 445.60, true, '2024-02-01'),
('550e8400-e29b-41d4-a716-446655440063', '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440023', '550e8400-e29b-41d4-a716-446655440052', 'SAV004', 25600, 25600, 890.40, true, '2024-01-20')
ON CONFLICT (id) DO NOTHING;

-- Insert dummy transactions
INSERT INTO public.transactions (id, tenant_id, client_id, loan_id, savings_account_id, transaction_id, transaction_type, payment_type, amount, transaction_date, payment_status, description) VALUES
('550e8400-e29b-41d4-a716-446655440070', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440040', NULL, 'TXN001', 'loan_repayment', 'mpesa', 1250, '2024-11-15', 'completed', 'Monthly loan repayment'),
('550e8400-e29b-41d4-a716-446655440071', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440020', NULL, '550e8400-e29b-41d4-a716-446655440060', 'TXN002', 'savings_deposit', 'cash', 500, '2024-11-10', 'completed', 'Savings deposit'),
('550e8400-e29b-41d4-a716-446655440072', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440041', NULL, 'TXN003', 'loan_repayment', 'bank_transfer', 1680, '2024-11-01', 'completed', 'Loan repayment - overdue'),
('550e8400-e29b-41d4-a716-446655440073', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440022', NULL, '550e8400-e29b-41d4-a716-446655440062', 'TXN004', 'savings_deposit', 'mpesa', 1200, '2024-10-25', 'completed', 'Monthly savings'),
('550e8400-e29b-41d4-a716-446655440074', '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440023', '550e8400-e29b-41d4-a716-446655440043', NULL, 'TXN005', 'loan_repayment', 'bank_transfer', 2850, '2024-11-01', 'completed', 'SME loan repayment'),
('550e8400-e29b-41d4-a716-446655440075', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440040', NULL, 'TXN006', 'loan_disbursement', 'bank_transfer', 15000, '2024-01-15', 'completed', 'Loan disbursement'),
('550e8400-e29b-41d4-a716-446655440076', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440041', NULL, 'TXN007', 'loan_disbursement', 'bank_transfer', 25000, '2024-02-01', 'completed', 'Loan disbursement')
ON CONFLICT (id) DO NOTHING;

-- Insert dummy groups
INSERT INTO public.groups (id, tenant_id, name, group_number, meeting_day, meeting_frequency, meeting_time, is_active) VALUES
('550e8400-e29b-41d4-a716-446655440080', '550e8400-e29b-41d4-a716-446655440001', 'Village Savings Group', 'VSG001', 'Monday', 'weekly', '14:00:00', true),
('550e8400-e29b-41d4-a716-446655440081', '550e8400-e29b-41d4-a716-446655440001', 'Women Empowerment Circle', 'WEC001', 'Wednesday', 'bi-weekly', '16:00:00', true),
('550e8400-e29b-41d4-a716-446655440082', '550e8400-e29b-41d4-a716-446655440002', 'Business Development Group', 'BDG001', 'Friday', 'monthly', '10:00:00', true)
ON CONFLICT (id) DO NOTHING;

-- Insert dummy group members
INSERT INTO public.group_members (id, group_id, client_id, is_active, joined_at) VALUES
('550e8400-e29b-41d4-a716-446655440090', '550e8400-e29b-41d4-a716-446655440080', '550e8400-e29b-41d4-a716-446655440020', true, '2024-01-01'),
('550e8400-e29b-41d4-a716-446655440091', '550e8400-e29b-41d4-a716-446655440080', '550e8400-e29b-41d4-a716-446655440021', true, '2024-01-01'),
('550e8400-e29b-41d4-a716-446655440092', '550e8400-e29b-41d4-a716-446655440081', '550e8400-e29b-41d4-a716-446655440022', true, '2024-01-15'),
('550e8400-e29b-41d4-a716-446655440093', '550e8400-e29b-41d4-a716-446655440082', '550e8400-e29b-41d4-a716-446655440023', true, '2024-02-01')
ON CONFLICT (id) DO NOTHING;