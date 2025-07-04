-- Create M-Pesa specific transactions table for tracking payments and disbursements
CREATE TABLE public.mpesa_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('c2b', 'b2c', 'paybill', 'till')),
  mpesa_receipt_number TEXT,
  transaction_id TEXT,
  conversation_id TEXT,
  originator_conversation_id TEXT,
  amount NUMERIC NOT NULL,
  phone_number TEXT NOT NULL,
  first_name TEXT,
  middle_name TEXT,
  last_name TEXT,
  msisdn TEXT,
  transaction_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  account_reference TEXT,
  bill_ref_number TEXT,
  invoice_number TEXT,
  org_account_balance NUMERIC,
  third_party_trans_id TEXT,
  raw_callback_data JSONB,
  reconciliation_status TEXT DEFAULT 'unmatched' CHECK (reconciliation_status IN ('matched', 'unmatched', 'partial')),
  matched_transaction_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create M-Pesa API credentials table for tenant-specific configurations
CREATE TABLE public.mpesa_credentials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  environment TEXT NOT NULL DEFAULT 'sandbox' CHECK (environment IN ('sandbox', 'production')),
  consumer_key TEXT NOT NULL,
  consumer_secret TEXT NOT NULL,
  business_short_code TEXT NOT NULL,
  passkey TEXT NOT NULL,
  initiator_name TEXT,
  security_credential TEXT,
  till_number TEXT,
  paybill_number TEXT,
  validation_url TEXT,
  confirmation_url TEXT,
  callback_url TEXT,
  result_url TEXT,
  timeout_url TEXT,
  account_balance_callback_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id),
  UNIQUE(tenant_id, environment)
);

-- Create suspense accounts table for unmatched transactions
CREATE TABLE public.suspense_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  account_name TEXT NOT NULL,
  account_type TEXT NOT NULL CHECK (account_type IN ('mpesa_suspense', 'general_suspense')),
  current_balance NUMERIC NOT NULL DEFAULT 0,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create suspense entries table for tracking unmatched transactions
CREATE TABLE public.suspense_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  suspense_account_id UUID NOT NULL REFERENCES public.suspense_accounts(id) ON DELETE CASCADE,
  reference_transaction_id UUID,
  reference_type TEXT CHECK (reference_type IN ('mpesa_transaction', 'bank_transaction', 'manual_entry')),
  amount NUMERIC NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('credit', 'debit')),
  description TEXT NOT NULL,
  entry_date DATE NOT NULL,
  reconciled_at TIMESTAMP WITH TIME ZONE,
  reconciled_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.mpesa_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mpesa_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suspense_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suspense_entries ENABLE ROW LEVEL SECURITY;

-- RLS policies for mpesa_transactions
CREATE POLICY "Users can access their tenant's mpesa transactions" 
ON public.mpesa_transactions 
FOR ALL 
USING (tenant_id IN (
  SELECT tenant_id FROM public.profiles 
  WHERE user_id = auth.uid()
));

-- RLS policies for mpesa_credentials (only tenant admins can manage)
CREATE POLICY "Tenant admins can manage mpesa credentials" 
ON public.mpesa_credentials 
FOR ALL 
USING (tenant_id IN (
  SELECT tenant_id FROM public.profiles 
  WHERE user_id = auth.uid() AND role IN ('tenant_admin', 'tenant_user')
));

CREATE POLICY "Super admins can view all mpesa credentials" 
ON public.mpesa_credentials 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = auth.uid() AND role = 'super_admin'
));

-- RLS policies for suspense_accounts
CREATE POLICY "Users can access their tenant's suspense accounts" 
ON public.suspense_accounts 
FOR ALL 
USING (tenant_id IN (
  SELECT tenant_id FROM public.profiles 
  WHERE user_id = auth.uid()
));

-- RLS policies for suspense_entries
CREATE POLICY "Users can access their tenant's suspense entries" 
ON public.suspense_entries 
FOR ALL 
USING (suspense_account_id IN (
  SELECT id FROM public.suspense_accounts 
  WHERE tenant_id IN (
    SELECT tenant_id FROM public.profiles 
    WHERE user_id = auth.uid()
  )
));

-- Add triggers for updated_at
CREATE TRIGGER update_mpesa_transactions_updated_at
  BEFORE UPDATE ON public.mpesa_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_mpesa_credentials_updated_at
  BEFORE UPDATE ON public.mpesa_credentials
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_suspense_accounts_updated_at
  BEFORE UPDATE ON public.suspense_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some M-Pesa credentials for a few tenants to show different statuses
INSERT INTO public.mpesa_credentials (tenant_id, environment, consumer_key, consumer_secret, business_short_code, passkey, is_active) 
SELECT 
  t.id,
  'sandbox',
  'dummy_consumer_key_' || substr(t.slug, 1, 10),
  'dummy_consumer_secret_' || substr(t.slug, 1, 10),
  '17' || lpad((random() * 9999)::text, 4, '0'),
  'dummy_passkey_' || substr(t.slug, 1, 20),
  CASE 
    WHEN t.slug = 'acme-mfi' THEN true
    WHEN t.slug = 'village-bank-ke' THEN true
    WHEN t.slug = 'startup-loans' THEN false
    ELSE false
  END as is_active
FROM public.tenants t 
WHERE t.slug IN ('acme-mfi', 'village-bank-ke', 'startup-loans');

-- Insert some M-Pesa transactions for demo purposes
INSERT INTO public.mpesa_transactions (tenant_id, transaction_type, amount, phone_number, account_reference, reconciliation_status)
SELECT 
  t.id,
  'c2b',
  (random() * 10000 + 1000)::numeric,
  '254' || lpad((random() * 999999999)::text, 9, '0'),
  'LOAN-' || lpad((random() * 999)::text, 3, '0'),
  CASE WHEN random() > 0.3 THEN 'matched' ELSE 'unmatched' END
FROM public.tenants t 
WHERE t.slug IN ('acme-mfi', 'village-bank-ke')
LIMIT 5;

INSERT INTO public.mpesa_transactions (tenant_id, transaction_type, amount, phone_number, account_reference, reconciliation_status)
SELECT 
  t.id,
  'b2c',
  (random() * 50000 + 5000)::numeric,
  '254' || lpad((random() * 999999999)::text, 9, '0'),
  'DISBURSEMENT-' || lpad((random() * 999)::text, 3, '0'),
  'matched'
FROM public.tenants t 
WHERE t.slug = 'acme-mfi'
LIMIT 2;