-- Create loan_charges table for loan fees and charges
CREATE TABLE public.loan_charges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  loan_id UUID NOT NULL,
  charge_type TEXT NOT NULL DEFAULT 'fee',
  charge_name TEXT NOT NULL,
  charge_amount NUMERIC NOT NULL DEFAULT 0,
  is_paid BOOLEAN NOT NULL DEFAULT false,
  paid_amount NUMERIC NOT NULL DEFAULT 0,
  charge_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  waived_amount NUMERIC NOT NULL DEFAULT 0,
  is_waived BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  charge_calculation_type TEXT DEFAULT 'fixed',
  charge_time_type TEXT DEFAULT 'disbursement',
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create loan_collaterals table
CREATE TABLE public.loan_collaterals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  loan_id UUID NOT NULL,
  collateral_type_id UUID,
  collateral_name TEXT NOT NULL,
  collateral_value NUMERIC,
  description TEXT,
  location TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create loan_guarantors table
CREATE TABLE public.loan_guarantors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  loan_id UUID NOT NULL,
  guarantor_type TEXT NOT NULL DEFAULT 'individual',
  guarantor_name TEXT NOT NULL,
  guarantor_phone TEXT,
  guarantor_email TEXT,
  guarantor_address TEXT,
  relationship_to_borrower TEXT,
  guarantee_amount NUMERIC,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create loan_documents table
CREATE TABLE public.loan_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  loan_id UUID NOT NULL,
  document_type TEXT NOT NULL,
  document_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  is_required BOOLEAN NOT NULL DEFAULT false,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  verified_by UUID,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.loan_charges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loan_collaterals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loan_guarantors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loan_documents ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can access their tenant's loan charges" 
ON public.loan_charges 
FOR ALL 
USING (tenant_id IN (
  SELECT profiles.tenant_id 
  FROM profiles 
  WHERE profiles.user_id = auth.uid()
));

CREATE POLICY "Users can access their tenant's loan collaterals" 
ON public.loan_collaterals 
FOR ALL 
USING (tenant_id IN (
  SELECT profiles.tenant_id 
  FROM profiles 
  WHERE profiles.user_id = auth.uid()
));

CREATE POLICY "Users can access their tenant's loan guarantors" 
ON public.loan_guarantors 
FOR ALL 
USING (tenant_id IN (
  SELECT profiles.tenant_id 
  FROM profiles 
  WHERE profiles.user_id = auth.uid()
));

CREATE POLICY "Users can access their tenant's loan documents" 
ON public.loan_documents 
FOR ALL 
USING (tenant_id IN (
  SELECT profiles.tenant_id 
  FROM profiles 
  WHERE profiles.user_id = auth.uid()
));

-- Create function to update outstanding balance after charges
CREATE OR REPLACE FUNCTION public.update_loan_outstanding_balance()
RETURNS TRIGGER AS $$
DECLARE
  v_loan_id UUID;
  v_outstanding NUMERIC;
BEGIN
  -- Get loan ID from the updated record
  v_loan_id := COALESCE(NEW.loan_id, OLD.loan_id);
  
  -- Calculate outstanding balance: sum of unpaid schedules + unpaid charges
  SELECT 
    COALESCE(
      (SELECT SUM(outstanding_amount) FROM loan_schedules WHERE loan_id = v_loan_id AND payment_status != 'paid'), 0
    ) + 
    COALESCE(
      (SELECT SUM(charge_amount - paid_amount) FROM loan_charges WHERE loan_id = v_loan_id AND is_active = true AND NOT is_paid), 0
    )
  INTO v_outstanding;
  
  -- Update the loan's outstanding balance
  UPDATE loans 
  SET outstanding_balance = v_outstanding,
      updated_at = now()
  WHERE id = v_loan_id;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers to automatically update outstanding balance
CREATE TRIGGER update_loan_outstanding_on_charge_change
  AFTER INSERT OR UPDATE OR DELETE ON public.loan_charges
  FOR EACH ROW
  EXECUTE FUNCTION public.update_loan_outstanding_balance();

-- Add updated_at triggers
CREATE TRIGGER update_loan_charges_updated_at
  BEFORE UPDATE ON public.loan_charges
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_loan_collaterals_updated_at
  BEFORE UPDATE ON public.loan_collaterals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_loan_guarantors_updated_at
  BEFORE UPDATE ON public.loan_guarantors
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_loan_documents_updated_at
  BEFORE UPDATE ON public.loan_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();