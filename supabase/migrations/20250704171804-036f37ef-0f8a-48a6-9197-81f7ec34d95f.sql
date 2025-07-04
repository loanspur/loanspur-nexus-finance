-- First, create a savings product if none exists
INSERT INTO public.savings_products (
  tenant_id,
  name,
  short_name,
  description,
  currency_code,
  nominal_annual_interest_rate,
  min_required_opening_balance,
  min_balance_for_interest_calculation,
  is_active
) VALUES (
  '550e8400-e29b-41d4-a716-446655440001',
  'Basic Savings Account',
  'BSA',
  'Standard savings account with competitive interest rates',
  'KES',
  5.5,
  1000,
  500,
  true
) ON CONFLICT DO NOTHING;

-- Create 5 dummy clients
INSERT INTO public.clients (
  tenant_id,
  client_number,
  first_name,
  last_name,
  email,
  phone,
  national_id,
  date_of_birth,
  gender,
  address,
  occupation,
  monthly_income,
  is_active,
  timely_repayment_rate,
  kyc_status,
  approval_status
) VALUES 
(
  '550e8400-e29b-41d4-a716-446655440001',
  'CLI001',
  'John',
  'Kamau',
  'john.kamau@email.com',
  '+254712345678',
  '12345678',
  '1985-03-15',
  'male',
  '{"street": "123 Kenyatta Avenue", "city": "Nairobi", "postal_code": "00100"}'::jsonb,
  'Business Owner',
  45000,
  true,
  95.5,
  'completed',
  'approved'
),
(
  '550e8400-e29b-41d4-a716-446655440001',
  'CLI002',
  'Mary',
  'Wanjiku',
  'mary.wanjiku@email.com',
  '+254723456789',
  '23456789',
  '1990-07-22',
  'female',
  '{"street": "456 Uhuru Highway", "city": "Nairobi", "postal_code": "00200"}'::jsonb,
  'Teacher',
  35000,
  true,
  92.3,
  'completed',
  'approved'
),
(
  '550e8400-e29b-41d4-a716-446655440001',
  'CLI003',
  'Peter',
  'Ochieng',
  'peter.ochieng@email.com',
  '+254734567890',
  '34567890',
  '1988-11-08',
  'male',
  '{"street": "789 Moi Avenue", "city": "Kisumu", "postal_code": "40100"}'::jsonb,
  'Farmer',
  28000,
  true,
  88.7,
  'completed',
  'approved'
),
(
  '550e8400-e29b-41d4-a716-446655440001',
  'CLI004',
  'Grace',
  'Njeri',
  'grace.njeri@email.com',
  '+254745678901',
  '45678901',
  '1992-05-30',
  'female',
  '{"street": "321 Tom Mboya Street", "city": "Nairobi", "postal_code": "00300"}'::jsonb,
  'Nurse',
  42000,
  true,
  96.8,
  'completed',
  'approved'
),
(
  '550e8400-e29b-41d4-a716-446655440001',
  'CLI005',
  'James',
  'Mwangi',
  'james.mwangi@email.com',
  '+254756789012',
  '56789012',
  '1987-09-14',
  'male',
  '{"street": "654 Haile Selassie Avenue", "city": "Nairobi", "postal_code": "00400"}'::jsonb,
  'Mechanic',
  32000,
  true,
  91.2,
  'completed',
  'approved'
);

-- Create savings accounts for each client
INSERT INTO public.savings_accounts (
  tenant_id,
  client_id,
  savings_product_id,
  account_number,
  account_balance,
  available_balance,
  interest_earned,
  is_active,
  opened_date
) 
SELECT 
  '550e8400-e29b-41d4-a716-446655440001',
  c.id,
  sp.id,
  'SAV' || LPAD((ROW_NUMBER() OVER())::text, 6, '0'),
  CASE 
    WHEN c.client_number = 'CLI001' THEN 15000
    WHEN c.client_number = 'CLI002' THEN 8500
    WHEN c.client_number = 'CLI003' THEN 12000
    WHEN c.client_number = 'CLI004' THEN 22000
    WHEN c.client_number = 'CLI005' THEN 6750
  END,
  CASE 
    WHEN c.client_number = 'CLI001' THEN 15000
    WHEN c.client_number = 'CLI002' THEN 8500
    WHEN c.client_number = 'CLI003' THEN 12000
    WHEN c.client_number = 'CLI004' THEN 22000
    WHEN c.client_number = 'CLI005' THEN 6750
  END,
  CASE 
    WHEN c.client_number = 'CLI001' THEN 125.50
    WHEN c.client_number = 'CLI002' THEN 87.30
    WHEN c.client_number = 'CLI003' THEN 98.75
    WHEN c.client_number = 'CLI004' THEN 201.25
    WHEN c.client_number = 'CLI005' THEN 45.60
  END,
  true,
  CURRENT_DATE - INTERVAL '6 months'
FROM public.clients c
CROSS JOIN public.savings_products sp
WHERE c.tenant_id = '550e8400-e29b-41d4-a716-446655440001'
  AND sp.tenant_id = '550e8400-e29b-41d4-a716-446655440001'
  AND c.client_number IN ('CLI001', 'CLI002', 'CLI003', 'CLI004', 'CLI005');