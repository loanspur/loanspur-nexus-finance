-- Add additional receivable account fields for accrual accounting
ALTER TABLE public.loan_products 
ADD COLUMN fee_receivable_account_id UUID REFERENCES public.chart_of_accounts(id),
ADD COLUMN penalty_receivable_account_id UUID REFERENCES public.chart_of_accounts(id);