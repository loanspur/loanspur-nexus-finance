-- Fix RLS policies to ensure proper tenant data isolation
-- Remove existing policies and recreate with proper authentication

-- Drop existing policies on clients table
DROP POLICY IF EXISTS "Users can access their tenant's clients" ON public.clients;

-- Create new strict tenant isolation policy for clients
CREATE POLICY "Tenant data isolation for clients" 
ON public.clients 
FOR ALL 
TO authenticated
USING (
  -- Super admins can see all data
  (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'super_admin')) 
  OR 
  -- Users can only see data from their own tenant
  (tenant_id = (SELECT tenant_id FROM profiles WHERE user_id = auth.uid() AND tenant_id IS NOT NULL))
);

-- Drop and recreate policies for loans table
DROP POLICY IF EXISTS "Users can access their tenant loans" ON public.loans;
DROP POLICY IF EXISTS "Users can access their tenant's loans" ON public.loans;

CREATE POLICY "Tenant data isolation for loans" 
ON public.loans 
FOR ALL 
TO authenticated
USING (
  -- Super admins can see all data
  (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'super_admin')) 
  OR 
  -- Users can only see data from their own tenant
  (tenant_id = (SELECT tenant_id FROM profiles WHERE user_id = auth.uid() AND tenant_id IS NOT NULL))
);

-- Drop and recreate policies for savings_accounts table
DROP POLICY IF EXISTS "Users can access their tenant's savings accounts" ON public.savings_accounts;

CREATE POLICY "Tenant data isolation for savings accounts" 
ON public.savings_accounts 
FOR ALL 
TO authenticated
USING (
  -- Super admins can see all data
  (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'super_admin')) 
  OR 
  -- Users can only see data from their own tenant
  (tenant_id = (SELECT tenant_id FROM profiles WHERE user_id = auth.uid() AND tenant_id IS NOT NULL))
);