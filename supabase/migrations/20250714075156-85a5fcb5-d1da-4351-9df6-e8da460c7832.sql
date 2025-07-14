-- Add accounting journal fields to loan_products table
ALTER TABLE loan_products 
ADD COLUMN loan_portfolio_account_id UUID REFERENCES chart_of_accounts(id),
ADD COLUMN interest_receivable_account_id UUID REFERENCES chart_of_accounts(id),
ADD COLUMN interest_income_account_id UUID REFERENCES chart_of_accounts(id),
ADD COLUMN fee_income_account_id UUID REFERENCES chart_of_accounts(id),
ADD COLUMN penalty_income_account_id UUID REFERENCES chart_of_accounts(id),
ADD COLUMN provision_account_id UUID REFERENCES chart_of_accounts(id),
ADD COLUMN writeoff_expense_account_id UUID REFERENCES chart_of_accounts(id),
ADD COLUMN overpayment_liability_account_id UUID REFERENCES chart_of_accounts(id),
ADD COLUMN suspended_income_account_id UUID REFERENCES chart_of_accounts(id),
ADD COLUMN fund_source_account_id UUID REFERENCES chart_of_accounts(id);

-- Add loan calculation and fee configuration columns
ALTER TABLE loan_products 
ADD COLUMN interest_calculation_method TEXT DEFAULT 'declining_balance' CHECK (interest_calculation_method IN ('declining_balance', 'flat', 'compound')),
ADD COLUMN interest_calculation_period TEXT DEFAULT 'monthly' CHECK (interest_calculation_period IN ('daily', 'weekly', 'monthly')),
ADD COLUMN arrears_tolerance_amount NUMERIC DEFAULT 0,
ADD COLUMN arrears_tolerance_days INTEGER DEFAULT 0,
ADD COLUMN grace_period_type TEXT DEFAULT 'none' CHECK (grace_period_type IN ('none', 'principal', 'interest', 'both')),
ADD COLUMN grace_period_duration INTEGER DEFAULT 0,
ADD COLUMN allow_partial_period_interest BOOLEAN DEFAULT true,
ADD COLUMN compounding_frequency TEXT DEFAULT 'monthly' CHECK (compounding_frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'annually')),
ADD COLUMN moratorium_period INTEGER DEFAULT 0,
ADD COLUMN pre_closure_interest_calculation_rule TEXT DEFAULT 'till_pre_close_date' CHECK (pre_closure_interest_calculation_rule IN ('till_pre_close_date', 'till_rest_frequency_date')),
ADD COLUMN advance_payments_adjustment_type TEXT DEFAULT 'reduce_emi' CHECK (advance_payments_adjustment_type IN ('reduce_emi', 'reduce_number_of_installments')),
ADD COLUMN reschedule_strategy TEXT DEFAULT 'reduce_emi' CHECK (reschedule_strategy IN ('reduce_emi', 'reduce_number_of_installments', 'reschedule_next_repayments'));

-- Add fee and charge configuration
ALTER TABLE loan_products 
ADD COLUMN processing_fee_amount NUMERIC DEFAULT 0,
ADD COLUMN processing_fee_percentage NUMERIC DEFAULT 0,
ADD COLUMN late_payment_penalty_amount NUMERIC DEFAULT 0,
ADD COLUMN late_payment_penalty_percentage NUMERIC DEFAULT 0,
ADD COLUMN early_repayment_penalty_amount NUMERIC DEFAULT 0,
ADD COLUMN early_repayment_penalty_percentage NUMERIC DEFAULT 0;