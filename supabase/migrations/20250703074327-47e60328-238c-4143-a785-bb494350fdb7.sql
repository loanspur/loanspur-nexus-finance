-- Fix the client access policy
DROP POLICY IF EXISTS "Clients can only access their own data" ON public.clients;

CREATE POLICY "Clients can only access their own data" ON public.clients FOR SELECT TO authenticated USING (
    EXISTS (
        SELECT 1 FROM public.profiles p 
        WHERE p.user_id = auth.uid() 
        AND p.role = 'client' 
        AND p.tenant_id = clients.tenant_id
        AND p.email = clients.email
    )
);

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, role)
  VALUES (
    NEW.id, 
    NEW.email,
    'client' -- default role, can be updated later
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user registration
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create helper functions for common operations
CREATE OR REPLACE FUNCTION public.get_user_tenant_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT tenant_id FROM public.profiles WHERE user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid();
$$;

-- Create indexes for better performance
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_profiles_tenant_id ON public.profiles(tenant_id);
CREATE INDEX idx_clients_tenant_id ON public.clients(tenant_id);
CREATE INDEX idx_loans_client_id ON public.loans(client_id);
CREATE INDEX idx_loans_tenant_id ON public.loans(tenant_id);
CREATE INDEX idx_savings_accounts_client_id ON public.savings_accounts(client_id);
CREATE INDEX idx_transactions_tenant_id ON public.transactions(tenant_id);
CREATE INDEX idx_transactions_client_id ON public.transactions(client_id);
CREATE INDEX idx_transactions_external_id ON public.transactions(external_transaction_id);
CREATE INDEX idx_unallocated_payments_tenant_id ON public.unallocated_payments(tenant_id);