-- Fix RLS Policies for Loans Table
-- This script resolves the 406 (Not Acceptable) error when accessing loan data

-- First, let's check what policies currently exist
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'loans';

-- Drop all existing policies on loans table to start fresh
DROP POLICY IF EXISTS "Users can access their tenant's loans" ON public.loans;
DROP POLICY IF EXISTS "Users can access their tenant loans" ON public.loans;
DROP POLICY IF EXISTS "Tenant data isolation for loans" ON public.loans;
DROP POLICY IF EXISTS "Office-based access for loans" ON public.loans;
DROP POLICY IF EXISTS "Users can only access their tenant's loans" ON public.loans;

-- Create a simple, comprehensive policy for loans table
CREATE POLICY "Comprehensive loan access policy" 
ON public.loans 
FOR ALL 
TO authenticated
USING (
  -- Super admins can see all loans
  (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'super_admin'
  ))
  OR
  -- Users can see loans from their own tenant
  (tenant_id IN (
    SELECT tenant_id FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND tenant_id IS NOT NULL
  ))
  OR
  -- Users can see loans for clients they have access to (office-based)
  (client_id IN (
    SELECT client_id FROM public.get_user_accessible_client_ids()
  ))
);

-- Also create a policy for loan_products table
DROP POLICY IF EXISTS "Users can access their tenant's loan products" ON public.loan_products;
DROP POLICY IF EXISTS "Users can only access their tenant's loan products" ON public.loan_products;
DROP POLICY IF EXISTS "Tenant data isolation for loan products" ON public.loan_products;

CREATE POLICY "Comprehensive loan product access policy" 
ON public.loan_products 
FOR ALL 
TO authenticated
USING (
  -- Super admins can see all loan products
  (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'super_admin'
  ))
  OR
  -- Users can see loan products from their own tenant
  (tenant_id IN (
    SELECT tenant_id FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND tenant_id IS NOT NULL
  ))
);

-- Create a policy for clients table as well
DROP POLICY IF EXISTS "Users can access their tenant's clients" ON public.clients;
DROP POLICY IF EXISTS "Tenant data isolation for clients" ON public.clients;
DROP POLICY IF EXISTS "Office-based access for clients" ON public.clients;
DROP POLICY IF EXISTS "Users can only access their tenant's data" ON public.clients;

CREATE POLICY "Comprehensive client access policy" 
ON public.clients 
FOR ALL 
TO authenticated
USING (
  -- Super admins can see all clients
  (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'super_admin'
  ))
  OR
  -- Users can see clients from their own tenant
  (tenant_id IN (
    SELECT tenant_id FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND tenant_id IS NOT NULL
  ))
  OR
  -- Users can see clients they have access to (office-based)
  (id IN (
    SELECT client_id FROM public.get_user_accessible_client_ids()
  ))
);

-- Ensure the get_user_accessible_client_ids function exists
CREATE OR REPLACE FUNCTION public.get_user_accessible_client_ids()
RETURNS TABLE(client_id UUID)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_profile_id UUID;
  user_role user_role;
  user_tenant_id UUID;
BEGIN
  -- Get current user's profile
  SELECT id, role, tenant_id INTO user_profile_id, user_role, user_tenant_id
  FROM public.profiles 
  WHERE user_id = auth.uid();
  
  IF user_profile_id IS NULL THEN
    RETURN;
  END IF;
  
  -- Super admins can see all clients
  IF user_role = 'super_admin' THEN
    RETURN QUERY SELECT c.id FROM public.clients c;
    RETURN;
  END IF;
  
  -- Regular users can see clients from their tenant
  IF user_tenant_id IS NOT NULL THEN
    RETURN QUERY SELECT c.id FROM public.clients c WHERE c.tenant_id = user_tenant_id;
  END IF;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.get_user_accessible_client_ids() TO authenticated;

-- Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies 
WHERE tablename IN ('loans', 'loan_products', 'clients')
ORDER BY tablename, policyname;
