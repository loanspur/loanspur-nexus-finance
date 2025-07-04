-- Create savings accounts for group members
INSERT INTO public.savings_accounts (
  client_id, 
  account_number, 
  account_balance, 
  interest_earned,
  tenant_id, 
  is_active,
  opened_date
)
SELECT 
  gm.client_id,
  'SA' || LPAD((ROW_NUMBER() OVER() + COALESCE((SELECT COUNT(*) FROM savings_accounts WHERE tenant_id = (SELECT id FROM tenants LIMIT 1)), 0))::text, 6, '0'),
  (RANDOM() * 5000 + 500)::numeric(10,2) as account_balance,
  (RANDOM() * 200)::numeric(10,2) as interest_earned,
  (SELECT id FROM tenants LIMIT 1) as tenant_id,
  true,
  NOW() - INTERVAL '1 day' * (RANDOM() * 365)
FROM group_members gm
JOIN clients c ON gm.client_id = c.id
WHERE gm.is_active = true
AND c.tenant_id = (SELECT id FROM tenants LIMIT 1)
AND NOT EXISTS (
  SELECT 1 FROM savings_accounts sa 
  WHERE sa.client_id = gm.client_id
);

-- Create loans for some group members
INSERT INTO public.loans (
  client_id,
  loan_number,
  principal_amount,
  outstanding_balance,
  interest_rate,
  term_months,
  monthly_payment,
  tenant_id,
  status,
  disbursement_date,
  maturity_date,
  purpose,
  applied_date,
  is_active
)
SELECT 
  gm.client_id,
  'LN' || LPAD((ROW_NUMBER() OVER() + COALESCE((SELECT COUNT(*) FROM loans WHERE tenant_id = (SELECT id FROM tenants LIMIT 1)), 0))::text, 6, '0'),
  loan_data.principal_amount,
  loan_data.outstanding_balance,
  loan_data.interest_rate,
  loan_data.term_months,
  loan_data.monthly_payment,
  (SELECT id FROM tenants LIMIT 1) as tenant_id,
  loan_data.status,
  loan_data.disbursement_date,
  loan_data.maturity_date,
  loan_data.purpose,
  loan_data.applied_date,
  true
FROM group_members gm
JOIN clients c ON gm.client_id = c.id
CROSS JOIN (
  SELECT 
    (CASE 
      WHEN RANDOM() < 0.5 THEN 5000 + (RANDOM() * 15000)
      ELSE 1000 + (RANDOM() * 5000)
    END)::numeric(10,2) as principal_amount,
    (CASE 
      WHEN RANDOM() < 0.3 THEN 'approved'
      WHEN RANDOM() < 0.7 THEN 'active'
      ELSE 'pending'
    END) as status,
    (CASE 
      WHEN RANDOM() < 0.3 THEN 'Business expansion'
      WHEN RANDOM() < 0.6 THEN 'Equipment purchase'
      ELSE 'Working capital'
    END) as purpose,
    (NOW() - INTERVAL '1 day' * (RANDOM() * 200)) as applied_date,
    (NOW() - INTERVAL '1 day' * (RANDOM() * 180)) as disbursement_date,
    (12 + (RANDOM() * 12)::int) as term_months,
    (12.0 + (RANDOM() * 8))::numeric(5,2) as interest_rate
) loan_data
CROSS JOIN (
  SELECT 
    loan_data.disbursement_date + INTERVAL '1 month' * loan_data.term_months as maturity_date,
    (CASE 
      WHEN loan_data.status = 'active' THEN loan_data.principal_amount * (0.3 + RANDOM() * 0.7)
      WHEN loan_data.status = 'approved' THEN loan_data.principal_amount
      ELSE 0
    END)::numeric(10,2) as outstanding_balance,
    ((loan_data.principal_amount * (loan_data.interest_rate / 100 / 12)) + (loan_data.principal_amount / loan_data.term_months))::numeric(10,2) as monthly_payment
) calculated_values
WHERE gm.is_active = true
AND c.tenant_id = (SELECT id FROM tenants LIMIT 1)
AND RANDOM() < 0.6  -- Only 60% of members get loans  
AND NOT EXISTS (
  SELECT 1 FROM loans l 
  WHERE l.client_id = gm.client_id
)
ORDER BY RANDOM();