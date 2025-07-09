import * as z from "zod";

export const loanProductSchema = z.object({
  // Basic Information
  name: z.string().min(1, "Product name is required"),
  short_name: z.string().min(1, "Short name is required"),
  description: z.string().optional(),
  currency_code: z.string().min(1, "Currency is required"),
  start_date: z.string().min(1, "Start date is required"),
  end_date: z.string().optional(),
  fund_type: z.string().min(1, "Fund type is required"),
  
  // Loan Terms
  min_principal: z.string().min(1, "Minimum principal is required"),
  max_principal: z.string().min(1, "Maximum principal is required"),
  default_principal: z.string().optional(),
  term_unit: z.string().min(1, "Term unit is required"),
  min_term: z.string().min(1, "Minimum term is required"),
  max_term: z.string().min(1, "Maximum term is required"),
  default_term: z.string().optional(),
  
  // Interest & Repayment
  min_nominal_interest_rate: z.string().min(1, "Minimum interest rate is required"),
  max_nominal_interest_rate: z.string().min(1, "Maximum interest rate is required"),
  default_nominal_interest_rate: z.string().optional(),
  
  repayment_frequency: z.string().min(1, "Repayment frequency is required"),
  grace_period: z.string().optional(),
  
  amortization_method: z.string().min(1, "Amortization method is required"),
  interest_calculation_method: z.string().min(1, "Interest calculation method is required"),
  repayment_strategy: z.string().min(1, "Repayment strategy is required"),
  
  // Moratorium & Arrears
  moratorium_period: z.string().optional(),
  moratorium_principal: z.string().optional(),
  moratorium_interest: z.string().optional(),
  other_loan_charges: z.string().optional(),
  days_in_month_type: z.string().min(1, "Days in month type is required"),
  days_in_year_type: z.string().min(1, "Days in year type is required"),
  overdue_days_for_arrears: z.string().min(1, "Days for arrears is required"),
  overdue_days_for_npa: z.string().min(1, "Days for NPA is required"),
  account_moves_out_of_npa_only_on_arrears_completion: z.boolean(),
  
  // Guarantee & Funds
  guarantee_funds_on_hold: z.boolean(),
  minimum_guarantee_from_own_funds: z.string().optional(),
  minimum_guarantee_from_guarantor_funds: z.string().optional(),
  
  // Charges & Penalties
  include_in_borrower_cycle: z.boolean(),
  lock_in_period_frequency: z.string().optional(),
  lock_in_period_frequency_type: z.string().optional(),
  overdue_charge_calculation_method: z.string().optional(),
  overdue_charge_applicable: z.boolean(),
  
  // Accounting & General Ledger
  accounting_method: z.string().min(1, "Accounting method is required"),
  fund_source_account_id: z.string().min(1, "Fund source account is required"),
  loan_portfolio_account_id: z.string().min(1, "Loan portfolio account is required"),
  interest_on_loans_account_id: z.string().min(1, "Interest on loans account is required"),
  income_from_fees_account_id: z.string().min(1, "Income from fees account is required"),
  income_from_penalties_account_id: z.string().min(1, "Income from penalties account is required"),
  losses_written_off_account_id: z.string().min(1, "Losses written off account is required"),
  suspense_account_id: z.string().min(1, "Suspense account is required"),
  overpayment_account_id: z.string().min(1, "Overpayment account is required"),
  transferred_in_suspense_account_id: z.string().min(1, "Transferred in suspense account is required"),
  
  // Liability Accounts
  interest_payable_account_id: z.string().optional(),
  fees_payable_account_id: z.string().optional(),
  loan_loss_provision_account_id: z.string().optional(),
  unearned_income_account_id: z.string().optional(),
  
  // Expense Accounts
  loan_impairment_expense_account_id: z.string().optional(),
  credit_loss_expense_account_id: z.string().optional(),
  loan_processing_expense_account_id: z.string().optional(),
  collection_expense_account_id: z.string().optional(),
});

export type LoanProductFormData = z.infer<typeof loanProductSchema>;

export const defaultValues: LoanProductFormData = {
  // Basic Information
  name: "",
  short_name: "",
  description: "",
  currency_code: "USD",
  start_date: "",
  end_date: "",
  fund_type: "internal",
  
  // Loan Terms
  min_principal: "",
  max_principal: "",
  default_principal: "",
  term_unit: "months",
  min_term: "",
  max_term: "",
  default_term: "",
  
  // Interest & Repayment
  min_nominal_interest_rate: "",
  max_nominal_interest_rate: "",
  default_nominal_interest_rate: "",
  
  repayment_frequency: "monthly",
  grace_period: "",
  
  amortization_method: "equal_installments",
  interest_calculation_method: "declining_balance",
  repayment_strategy: "penalties_fees_interest_principal",
  
  // Moratorium & Arrears
  moratorium_period: "",
  moratorium_principal: "none",
  moratorium_interest: "none",
  other_loan_charges: "",
  days_in_month_type: "actual",
  days_in_year_type: "actual",
  overdue_days_for_arrears: "1",
  overdue_days_for_npa: "90",
  account_moves_out_of_npa_only_on_arrears_completion: true,
  
  // Guarantee & Funds
  guarantee_funds_on_hold: false,
  minimum_guarantee_from_own_funds: "",
  minimum_guarantee_from_guarantor_funds: "",
  
  // Charges & Penalties
  include_in_borrower_cycle: true,
  lock_in_period_frequency: "",
  lock_in_period_frequency_type: "days",
  overdue_charge_calculation_method: "outstanding_principal",
  overdue_charge_applicable: false,
  
  // Accounting & General Ledger
  accounting_method: "accrual_periodic",
  fund_source_account_id: "",
  loan_portfolio_account_id: "",
  interest_on_loans_account_id: "",
  income_from_fees_account_id: "",
  income_from_penalties_account_id: "",
  losses_written_off_account_id: "",
  suspense_account_id: "",
  overpayment_account_id: "",
  transferred_in_suspense_account_id: "",
  
  // Liability Accounts
  interest_payable_account_id: "",
  fees_payable_account_id: "",
  loan_loss_provision_account_id: "",
  unearned_income_account_id: "",
  
  // Expense Accounts
  loan_impairment_expense_account_id: "",
  credit_loss_expense_account_id: "",
  loan_processing_expense_account_id: "",
  collection_expense_account_id: "",
};