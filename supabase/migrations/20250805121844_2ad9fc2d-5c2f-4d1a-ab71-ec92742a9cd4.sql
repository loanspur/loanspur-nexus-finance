-- Test client creation for Umoja Magharibi to verify the flow works
INSERT INTO clients (
  tenant_id,
  client_number,
  first_name,
  last_name,
  email,
  phone,
  date_of_birth,
  gender,
  national_id,
  office_id,
  loan_officer_id,
  kyc_status,
  approval_status,
  is_active
) VALUES (
  '1f819953-8f72-4696-88a3-e30aae532d07',
  'CLI123456',
  'Test',
  'Client',
  'test@example.com',
  '+254700000000',
  '1990-01-01',
  'male',
  '12345678',
  'a197bafd-8233-40a4-804c-0ce8c10396da', -- BUNGOMA branch
  '4f61914a-b207-41ab-869e-1efa37d74044', -- Justus as loan officer
  'completed',
  'approved',
  true
);