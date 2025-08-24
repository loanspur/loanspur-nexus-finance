-- Comprehensive RLS Enforcement Fix
-- This migration ensures proper tenant isolation across all tables

-- Function to get current user's tenant_id safely
CREATE OR REPLACE FUNCTION public.get_current_user_tenant_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  user_tenant_id UUID;
BEGIN
  SELECT tenant_id INTO user_tenant_id
  FROM public.profiles
  WHERE user_id = auth.uid() AND is_active = true;
  
  RETURN user_tenant_id;
END;
$$;

-- Function to check if user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND role = 'super_admin' AND is_active = true
  );
END;
$$;

-- Function to check if user can access specific tenant data
CREATE OR REPLACE FUNCTION public.can_access_tenant_data(target_tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  -- Super admins can access all data
  IF public.is_super_admin() THEN
    RETURN true;
  END IF;
  
  -- Users can only access their own tenant's data
  RETURN target_tenant_id = public.get_current_user_tenant_id();
END;
$$;

-- Drop existing RLS policies that might be inconsistent
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT schemaname, tablename, policyname 
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename IN (
      'clients', 'loans', 'loan_applications', 'loan_approvals', 
      'savings_accounts', 'transactions', 'groups', 'loan_products',
      'savings_products', 'notifications', 'approval_requests',
      'approval_actions', 'profiles', 'tenants'
    )
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;

-- Enable RLS on all critical tables
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loan_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loan_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loan_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- Super admin policies (can access everything)
CREATE POLICY "super_admin_all_access" ON public.tenants
FOR ALL TO authenticated
USING (public.is_super_admin());

CREATE POLICY "super_admin_all_access" ON public.profiles
FOR ALL TO authenticated
USING (public.is_super_admin());

CREATE POLICY "super_admin_all_access" ON public.clients
FOR ALL TO authenticated
USING (public.is_super_admin());

CREATE POLICY "super_admin_all_access" ON public.loans
FOR ALL TO authenticated
USING (public.is_super_admin());

CREATE POLICY "super_admin_all_access" ON public.loan_applications
FOR ALL TO authenticated
USING (public.is_super_admin());

CREATE POLICY "super_admin_all_access" ON public.loan_approvals
FOR ALL TO authenticated
USING (public.is_super_admin());

CREATE POLICY "super_admin_all_access" ON public.savings_accounts
FOR ALL TO authenticated
USING (public.is_super_admin());

CREATE POLICY "super_admin_all_access" ON public.transactions
FOR ALL TO authenticated
USING (public.is_super_admin());

CREATE POLICY "super_admin_all_access" ON public.groups
FOR ALL TO authenticated
USING (public.is_super_admin());

CREATE POLICY "super_admin_all_access" ON public.loan_products
FOR ALL TO authenticated
USING (public.is_super_admin());

CREATE POLICY "super_admin_all_access" ON public.savings_products
FOR ALL TO authenticated
USING (public.is_super_admin());

CREATE POLICY "super_admin_all_access" ON public.notifications
FOR ALL TO authenticated
USING (public.is_super_admin());

CREATE POLICY "super_admin_all_access" ON public.approval_requests
FOR ALL TO authenticated
USING (public.is_super_admin());

CREATE POLICY "super_admin_all_access" ON public.approval_actions
FOR ALL TO authenticated
USING (public.is_super_admin());

-- Tenant-specific policies (users can only access their tenant's data)
CREATE POLICY "tenant_data_isolation" ON public.clients
FOR ALL TO authenticated
USING (public.can_access_tenant_data(tenant_id));

CREATE POLICY "tenant_data_isolation" ON public.loans
FOR ALL TO authenticated
USING (public.can_access_tenant_data(tenant_id));

CREATE POLICY "tenant_data_isolation" ON public.loan_applications
FOR ALL TO authenticated
USING (public.can_access_tenant_data(tenant_id));

CREATE POLICY "tenant_data_isolation" ON public.loan_approvals
FOR ALL TO authenticated
USING (public.can_access_tenant_data(tenant_id));

CREATE POLICY "tenant_data_isolation" ON public.savings_accounts
FOR ALL TO authenticated
USING (public.can_access_tenant_data(tenant_id));

CREATE POLICY "tenant_data_isolation" ON public.transactions
FOR ALL TO authenticated
USING (public.can_access_tenant_data(tenant_id));

CREATE POLICY "tenant_data_isolation" ON public.groups
FOR ALL TO authenticated
USING (public.can_access_tenant_data(tenant_id));

CREATE POLICY "tenant_data_isolation" ON public.loan_products
FOR ALL TO authenticated
USING (public.can_access_tenant_data(tenant_id));

CREATE POLICY "tenant_data_isolation" ON public.savings_products
FOR ALL TO authenticated
USING (public.can_access_tenant_data(tenant_id));

CREATE POLICY "tenant_data_isolation" ON public.notifications
FOR ALL TO authenticated
USING (public.can_access_tenant_data(tenant_id));

CREATE POLICY "tenant_data_isolation" ON public.approval_requests
FOR ALL TO authenticated
USING (public.can_access_tenant_data(tenant_id));

CREATE POLICY "tenant_data_isolation" ON public.approval_actions
FOR ALL TO authenticated
USING (public.can_access_tenant_data(tenant_id));

-- Special policies for profiles (users can see their own profile and tenant members)
CREATE POLICY "profile_access" ON public.profiles
FOR ALL TO authenticated
USING (
  public.is_super_admin() OR 
  user_id = auth.uid() OR 
  public.can_access_tenant_data(tenant_id)
);

-- Special policies for tenants (users can see their own tenant)
CREATE POLICY "tenant_access" ON public.tenants
FOR ALL TO authenticated
USING (
  public.is_super_admin() OR 
  id = public.get_current_user_tenant_id()
);

-- Add indexes for better performance on tenant_id lookups
CREATE INDEX IF NOT EXISTS idx_clients_tenant_id ON public.clients(tenant_id);
CREATE INDEX IF NOT EXISTS idx_loans_tenant_id ON public.loans(tenant_id);
CREATE INDEX IF NOT EXISTS idx_loan_applications_tenant_id ON public.loan_applications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_loan_approvals_tenant_id ON public.loan_approvals(tenant_id);
CREATE INDEX IF NOT EXISTS idx_savings_accounts_tenant_id ON public.savings_accounts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_transactions_tenant_id ON public.transactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_groups_tenant_id ON public.groups(tenant_id);
CREATE INDEX IF NOT EXISTS idx_loan_products_tenant_id ON public.loan_products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_savings_products_tenant_id ON public.savings_products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notifications_tenant_id ON public.notifications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_approval_requests_tenant_id ON public.approval_requests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_approval_actions_tenant_id ON public.approval_actions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_profiles_tenant_id ON public.profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.get_current_user_tenant_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_tenant_data(UUID) TO authenticated;

-- Check if helper functions exist
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('get_current_user_tenant_id', 'is_super_admin', 'can_access_tenant_data');

-- Check if RLS is enabled on critical tables
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
  'clients', 'loans', 'loan_applications', 'loan_approvals', 
  'savings_accounts', 'transactions', 'groups', 'loan_products',
  'savings_products', 'notifications', 'approval_requests',
  'approval_actions', 'profiles', 'tenants'
)
ORDER BY tablename;

-- Check if policies exist
SELECT 
  schemaname,
  tablename,
  policyname
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN (
  'clients', 'loans', 'loan_applications', 'loan_approvals', 
  'savings_accounts', 'transactions', 'groups', 'loan_products',
  'savings_products', 'notifications', 'approval_requests',
  'approval_actions', 'profiles', 'tenants'
)
ORDER BY tablename, policyname;
