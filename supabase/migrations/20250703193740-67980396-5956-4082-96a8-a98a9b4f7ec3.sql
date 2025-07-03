-- Insert dummy loan products with correct precision
INSERT INTO public.loan_products (id, tenant_id, name, short_name, description, currency_code, min_principal, max_principal, default_principal, min_nominal_interest_rate, max_nominal_interest_rate, default_nominal_interest_rate, min_term, max_term, default_term, repayment_frequency, is_active) VALUES
('550e8400-e29b-41d4-a716-446655440030', '550e8400-e29b-41d4-a716-446655440001', 'Individual Loan', 'IND_LOAN', 'Standard individual loan product', 'USD', 1000, 50000, 5000, 1.0, 2.5, 1.5, 6, 36, 12, 'monthly', true),
('550e8400-e29b-41d4-a716-446655440031', '550e8400-e29b-41d4-a716-446655440001', 'Group Loan', 'GRP_LOAN', 'Group lending product', 'USD', 5000, 100000, 20000, 0.8, 2.0, 1.2, 12, 48, 24, 'monthly', true),
('550e8400-e29b-41d4-a716-446655440032', '550e8400-e29b-41d4-a716-446655440002', 'SME Loan', 'SME_LOAN', 'Small and medium enterprise loan', 'USD', 10000, 200000, 50000, 1.2, 3.0, 1.8, 12, 60, 36, 'monthly', true)
ON CONFLICT (id) DO NOTHING;

-- Insert dummy loans with correct precision
INSERT INTO public.loans (id, tenant_id, client_id, loan_product_id, loan_number, principal_amount, interest_rate, term_months, disbursement_date, expected_maturity_date, outstanding_balance, total_overdue_amount, next_repayment_amount, next_repayment_date, status, loan_officer_id) VALUES
('550e8400-e29b-41d4-a716-446655440040', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440030', 'LN001', 15000, 1.5, 12, '2024-01-15', '2025-01-15', 8500, 0, 1250, '2024-12-15', 'active', '550e8400-e29b-41d4-a716-446655440013'),
('550e8400-e29b-41d4-a716-446655440041', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440030', 'LN002', 25000, 1.5, 18, '2024-02-01', '2025-08-01', 18750, 500, 1680, '2024-12-01', 'overdue', '550e8400-e29b-41d4-a716-446655440013'),
('550e8400-e29b-41d4-a716-446655440042', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440031', 'LN003', 30000, 1.2, 24, '2024-03-10', '2026-03-10', 22500, 0, 1450, '2024-12-10', 'active', '550e8400-e29b-41d4-a716-446655440013'),
('550e8400-e29b-41d4-a716-446655440043', '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440023', '550e8400-e29b-41d4-a716-446655440032', 'LN004', 75000, 1.8, 36, '2024-04-01', '2027-04-01', 65000, 0, 2850, '2024-12-01', 'active', NULL)
ON CONFLICT (id) DO NOTHING;

-- Insert dummy savings products with correct precision
INSERT INTO public.savings_products (id, tenant_id, name, short_name, description, currency_code, nominal_annual_interest_rate, min_required_opening_balance, min_balance_for_interest_calculation, is_active) VALUES
('550e8400-e29b-41d4-a716-446655440050', '550e8400-e29b-41d4-a716-446655440001', 'Standard Savings', 'STD_SAV', 'Standard savings account', 'USD', 5.0, 100, 500, true),
('550e8400-e29b-41d4-a716-446655440051', '550e8400-e29b-41d4-a716-446655440001', 'Premium Savings', 'PREM_SAV', 'High yield savings account', 'USD', 7.5, 1000, 2000, true),
('550e8400-e29b-41d4-a716-446655440052', '550e8400-e29b-41d4-a716-446655440002', 'Business Savings', 'BIZ_SAV', 'Business savings account', 'USD', 6.0, 500, 1000, true)
ON CONFLICT (id) DO NOTHING;