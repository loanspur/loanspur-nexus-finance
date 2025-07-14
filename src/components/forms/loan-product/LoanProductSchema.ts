import * as z from "zod";

// Comprehensive schema with all loan product fields including accounting journals
export const loanProductSchema = z.object({
  // Basic Information
  name: z.string().min(1, "Product name is required"),
  short_name: z.string().min(1, "Short name is required"),
  description: z.string().optional(),
  currency_code: z.string().min(1, "Currency is required"),
  repayment_frequency: z.string().min(1, "Repayment frequency is required"),
  fund_id: z.string().min(1, "Fund selection is required"),
  
  // Loan Terms
  min_principal: z.string().min(1, "Minimum principal is required"),
  max_principal: z.string().min(1, "Maximum principal is required"),
  default_principal: z.string().optional(),
  min_term: z.string().min(1, "Minimum term is required"),
  max_term: z.string().min(1, "Maximum term is required"),
  default_term: z.string().optional(),
  
  // Interest & Repayment
  min_nominal_interest_rate: z.string().min(1, "Minimum interest rate is required"),
  max_nominal_interest_rate: z.string().min(1, "Maximum interest rate is required"),
  default_nominal_interest_rate: z.string().optional(),
  
  // Interest Calculation Settings
  interest_calculation_method: z.string().default("declining_balance"),
  interest_calculation_period: z.string().default("monthly"),
  compounding_frequency: z.string().default("monthly"),
  allow_partial_period_interest: z.boolean().default(true),
  
  // Grace Period & Tolerance
  grace_period_type: z.string().default("none"),
  grace_period_duration: z.string().default("0"),
  arrears_tolerance_amount: z.string().default("0"),
  arrears_tolerance_days: z.string().default("0"),
  moratorium_period: z.string().default("0"),
  
  // Prepayment & Reschedule Settings
  pre_closure_interest_calculation_rule: z.string().default("till_pre_close_date"),
  advance_payments_adjustment_type: z.string().default("reduce_emi"),
  reschedule_strategy: z.string().default("reduce_emi"),
  
  // Fees & Charges
  processing_fee_amount: z.string().default("0"),
  processing_fee_percentage: z.string().default("0"),
  late_payment_penalty_amount: z.string().default("0"),
  late_payment_penalty_percentage: z.string().default("0"),
  early_repayment_penalty_amount: z.string().default("0"),
  early_repayment_penalty_percentage: z.string().default("0"),
  
  // Fee Structure Mappings
  linked_fee_ids: z.array(z.string()).default([]),
  
  // Accounting Configuration
  accounting_type: z.string().default("cash"),
  
  // Accounting Journal Mappings
  loan_portfolio_account_id: z.string().optional(),
  interest_receivable_account_id: z.string().optional(),
  fee_receivable_account_id: z.string().optional(),
  penalty_receivable_account_id: z.string().optional(),
  interest_income_account_id: z.string().optional(),
  fee_income_account_id: z.string().optional(),
  penalty_income_account_id: z.string().optional(),
  provision_account_id: z.string().optional(),
  writeoff_expense_account_id: z.string().optional(),
  overpayment_liability_account_id: z.string().optional(),
  suspended_income_account_id: z.string().optional(),
  fund_source_account_id: z.string().optional(),
  
  // Advanced Payment Account Mappings
  principal_payment_account_id: z.string().optional(),
  interest_payment_account_id: z.string().optional(),
  fee_payment_account_id: z.string().optional(),
  penalty_payment_account_id: z.string().optional(),
});

export type LoanProductFormData = z.infer<typeof loanProductSchema>;

export const defaultValues: LoanProductFormData = {
  // Basic Information
  name: "",
  short_name: "",
  description: "",
  currency_code: "USD",
  repayment_frequency: "monthly",
  fund_id: "",
  
  // Loan Terms
  min_principal: "",
  max_principal: "",
  default_principal: "",
  min_term: "",
  max_term: "",
  default_term: "",
  
  // Interest & Repayment
  min_nominal_interest_rate: "",
  max_nominal_interest_rate: "",
  default_nominal_interest_rate: "",
  
  // Interest Calculation Settings
  interest_calculation_method: "declining_balance",
  interest_calculation_period: "monthly",
  compounding_frequency: "monthly",
  allow_partial_period_interest: true,
  
  // Grace Period & Tolerance
  grace_period_type: "none",
  grace_period_duration: "0",
  arrears_tolerance_amount: "0",
  arrears_tolerance_days: "0",
  moratorium_period: "0",
  
  // Prepayment & Reschedule Settings
  pre_closure_interest_calculation_rule: "till_pre_close_date",
  advance_payments_adjustment_type: "reduce_emi",
  reschedule_strategy: "reduce_emi",
  
  // Fees & Charges
  processing_fee_amount: "0",
  processing_fee_percentage: "0",
  late_payment_penalty_amount: "0",
  late_payment_penalty_percentage: "0",
  early_repayment_penalty_amount: "0",
  early_repayment_penalty_percentage: "0",
  
  // Fee Structure Mappings
  linked_fee_ids: [],
  
  // Accounting Configuration
  accounting_type: "cash",
  
  // Accounting Journal Mappings
  loan_portfolio_account_id: "",
  interest_receivable_account_id: "",
  fee_receivable_account_id: "",
  penalty_receivable_account_id: "",
  interest_income_account_id: "",
  fee_income_account_id: "",
  penalty_income_account_id: "",
  provision_account_id: "",
  writeoff_expense_account_id: "",
  overpayment_liability_account_id: "",
  suspended_income_account_id: "",
  fund_source_account_id: "",
  
  // Advanced Payment Account Mappings
  principal_payment_account_id: "",
  interest_payment_account_id: "",
  fee_payment_account_id: "",
  penalty_payment_account_id: "",
};