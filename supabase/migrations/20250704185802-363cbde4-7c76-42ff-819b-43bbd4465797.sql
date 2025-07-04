-- Create savings products if they don't exist
INSERT INTO public.savings_products (name, description, interest_rate, minimum_balance, tenant_id, is_active)
SELECT 
  product_data.name,
  product_data.description,
  product_data.interest_rate,
  product_data.minimum_balance,
  t.tenant_id,
  true
FROM (VALUES 
  ('Basic Savings', 'Standard savings account for group members', 2.5, 100),
  ('Premium Savings', 'High-yield savings account', 4.0, 500),
  ('Group Savings', 'Collective savings account', 3.0, 50)
) AS product_data(name, description, interest_rate, minimum_balance)
CROSS JOIN (SELECT id as tenant_id FROM tenants LIMIT 1) t
WHERE NOT EXISTS (
  SELECT 1 FROM savings_products sp 
  WHERE sp.name = product_data.name 
  AND sp.tenant_id = t.tenant_id
);

-- Create loan products if they don't exist
INSERT INTO public.loan_products (name, description, interest_rate, max_amount, min_amount, term_months, tenant_id, is_active)
SELECT 
  product_data.name,
  product_data.description,
  product_data.interest_rate,
  product_data.max_amount,
  product_data.min_amount,
  product_data.term_months,
  t.tenant_id,
  true
FROM (VALUES 
  ('Micro Loan', 'Small business micro loans', 12.0, 50000, 1000, 12),
  ('Business Loan', 'Medium business loans', 15.0, 200000, 10000, 24),
  ('Emergency Loan', 'Quick emergency loans', 18.0, 20000, 500, 6)
) AS product_data(name, description, interest_rate, max_amount, min_amount, term_months)
CROSS JOIN (SELECT id as tenant_id FROM tenants LIMIT 1) t
WHERE NOT EXISTS (
  SELECT 1 FROM loan_products lp 
  WHERE lp.name = product_data.name 
  AND lp.tenant_id = t.tenant_id
);

-- Create savings accounts for group members
INSERT INTO public.savings_accounts (
  client_id, 
  product_id, 
  account_number, 
  account_balance, 
  interest_earned, 
  tenant_id, 
  status,
  opened_date
)
SELECT 
  gm.client_id,
  sp.id as product_id,
  'SA' || LPAD((ROW_NUMBER() OVER() + COALESCE((SELECT COUNT(*) FROM savings_accounts WHERE tenant_id = (SELECT id FROM tenants LIMIT 1)), 0))::text, 6, '0'),
  (RANDOM() * 5000 + 100)::numeric(10,2) as account_balance,
  (RANDOM() * 200)::numeric(10,2) as interest_earned,
  (SELECT id FROM tenants LIMIT 1) as tenant_id,
  'active',
  NOW() - INTERVAL '1 day' * (RANDOM() * 365)
FROM group_members gm
JOIN clients c ON gm.client_id = c.id
JOIN savings_products sp ON sp.tenant_id = c.tenant_id
WHERE gm.is_active = true
AND sp.name = CASE 
  WHEN RANDOM() < 0.4 THEN 'Basic Savings'
  WHEN RANDOM() < 0.7 THEN 'Premium Savings'
  ELSE 'Group Savings'
END
AND NOT EXISTS (
  SELECT 1 FROM savings_accounts sa 
  WHERE sa.client_id = gm.client_id
)
ORDER BY RANDOM()
LIMIT 20;

-- Create loans for some group members
INSERT INTO public.loans (
  client_id,
  product_id,
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
  purpose
)
SELECT 
  gm.client_id,
  lp.id as product_id,
  'LN' || LPAD((ROW_NUMBER() OVER() + COALESCE((SELECT COUNT(*) FROM loans WHERE tenant_id = (SELECT id FROM tenants LIMIT 1)), 0))::text, 6, '0'),
  loan_amounts.principal_amount,
  loan_amounts.outstanding_balance,
  lp.interest_rate,
  lp.term_months,
  loan_amounts.monthly_payment,
  (SELECT id FROM tenants LIMIT 1) as tenant_id,
  loan_amounts.status,
  loan_amounts.disbursement_date,
  loan_amounts.maturity_date,
  loan_amounts.purpose
FROM group_members gm
JOIN clients c ON gm.client_id = c.id
JOIN loan_products lp ON lp.tenant_id = c.tenant_id
CROSS JOIN (
  SELECT 
    CASE 
      WHEN RANDOM() < 0.5 THEN 5000 + (RANDOM() * 15000)
      ELSE 1000 + (RANDOM() * 5000)
    END as principal_amount,
    CASE 
      WHEN RANDOM() < 0.3 THEN 'approved'
      WHEN RANDOM() < 0.7 THEN 'active'
      ELSE 'pending'
    END as status,
    CASE 
      WHEN RANDOM() < 0.3 THEN 'Business expansion'
      WHEN RANDOM() < 0.6 THEN 'Equipment purchase'
      ELSE 'Working capital'
    END as purpose,
    NOW() - INTERVAL '1 day' * (RANDOM() * 180) as disbursement_date
) loan_amounts
CROSS JOIN (
  SELECT 
    loan_amounts.disbursement_date + INTERVAL '1 month' * lp.term_months as maturity_date,
    CASE 
      WHEN loan_amounts.status = 'active' THEN loan_amounts.principal_amount * (0.5 + RANDOM() * 0.5)
      WHEN loan_amounts.status = 'approved' THEN loan_amounts.principal_amount
      ELSE 0
    END as outstanding_balance,
    (loan_amounts.principal_amount * (lp.interest_rate / 100 / 12)) + (loan_amounts.principal_amount / lp.term_months) as monthly_payment
) calculated_values
WHERE gm.is_active = true
AND lp.name = CASE 
  WHEN RANDOM() < 0.6 THEN 'Micro Loan'
  WHEN RANDOM() < 0.8 THEN 'Business Loan'
  ELSE 'Emergency Loan'
END
AND RANDOM() < 0.7  -- Only 70% of members get loans
AND NOT EXISTS (
  SELECT 1 FROM loans l 
  WHERE l.client_id = gm.client_id
)
ORDER BY RANDOM()
LIMIT 15;