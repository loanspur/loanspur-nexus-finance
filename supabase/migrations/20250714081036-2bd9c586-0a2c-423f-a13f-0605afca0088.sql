-- Add new fields to loan_products table for fee mapping and advanced accounting

ALTER TABLE public.loan_products
ADD COLUMN linked_fee_ids UUID[] DEFAULT '{}',
ADD COLUMN accounting_type TEXT DEFAULT 'cash' CHECK (accounting_type IN ('cash', 'accrual_periodic', 'accrual_upfront')),
ADD COLUMN principal_payment_account_id UUID,
ADD COLUMN interest_payment_account_id UUID,
ADD COLUMN fee_payment_account_id UUID,
ADD COLUMN penalty_payment_account_id UUID;

-- Add foreign key constraints for the new payment account IDs
ALTER TABLE public.loan_products
ADD CONSTRAINT fk_loan_products_principal_payment_account 
  FOREIGN KEY (principal_payment_account_id) 
  REFERENCES public.chart_of_accounts(id) ON DELETE SET NULL,
ADD CONSTRAINT fk_loan_products_interest_payment_account 
  FOREIGN KEY (interest_payment_account_id) 
  REFERENCES public.chart_of_accounts(id) ON DELETE SET NULL,
ADD CONSTRAINT fk_loan_products_fee_payment_account 
  FOREIGN KEY (fee_payment_account_id) 
  REFERENCES public.chart_of_accounts(id) ON DELETE SET NULL,
ADD CONSTRAINT fk_loan_products_penalty_payment_account 
  FOREIGN KEY (penalty_payment_account_id) 
  REFERENCES public.chart_of_accounts(id) ON DELETE SET NULL;

-- Add comment to explain the linked_fee_ids array
COMMENT ON COLUMN public.loan_products.linked_fee_ids IS 'Array of fee structure IDs linked to this loan product';
COMMENT ON COLUMN public.loan_products.accounting_type IS 'Type of accounting method: cash, accrual_periodic, or accrual_upfront';