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