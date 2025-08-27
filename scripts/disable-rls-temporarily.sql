-- Temporary RLS Disable for Testing
-- This script temporarily disables RLS to test if the loan access issue is resolved

-- Disable RLS on loans table temporarily
ALTER TABLE public.loans DISABLE ROW LEVEL SECURITY;

-- Disable RLS on loan_products table temporarily  
ALTER TABLE public.loan_products DISABLE ROW LEVEL SECURITY;

-- Disable RLS on clients table temporarily
ALTER TABLE public.clients DISABLE ROW LEVEL SECURITY;

-- Grant all permissions to authenticated users
GRANT ALL ON public.loans TO authenticated;
GRANT ALL ON public.loan_products TO authenticated;
GRANT ALL ON public.clients TO authenticated;

-- Verify RLS is disabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename IN ('loans', 'loan_products', 'clients')
AND schemaname = 'public';

-- Show current policies (should be empty)
SELECT 
  schemaname,
  tablename,
  policyname
FROM pg_policies 
WHERE tablename IN ('loans', 'loan_products', 'clients')
AND schemaname = 'public';
