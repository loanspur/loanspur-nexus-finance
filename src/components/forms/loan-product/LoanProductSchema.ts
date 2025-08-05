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
  
  // Loan Terms with cross-validation
  min_principal: z.string().min(1, "Minimum principal is required"),
  max_principal: z.string().min(1, "Maximum principal is required"),
  default_principal: z.string().optional(),
  min_term: z.string().min(1, "Minimum term is required"),
  max_term: z.string().min(1, "Maximum term is required"),
  default_term: z.string().optional(),
  
  // Interest & Repayment with cross-validation
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
  accounting_type: z.string().default("none"),
  
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
}).refine((data) => {
  // Validate minimum principal <= maximum principal
  const minPrincipal = parseFloat(data.min_principal);
  const maxPrincipal = parseFloat(data.max_principal);
  return !isNaN(minPrincipal) && !isNaN(maxPrincipal) && minPrincipal <= maxPrincipal;
}, {
  message: "Minimum principal must be less than or equal to maximum principal",
  path: ["max_principal"]
}).refine((data) => {
  // Validate minimum term <= maximum term
  const minTerm = parseInt(data.min_term);
  const maxTerm = parseInt(data.max_term);
  return !isNaN(minTerm) && !isNaN(maxTerm) && minTerm <= maxTerm;
}, {
  message: "Minimum term must be less than or equal to maximum term",
  path: ["max_term"]
}).refine((data) => {
  // Validate minimum interest rate <= maximum interest rate
  const minRate = parseFloat(data.min_nominal_interest_rate);
  const maxRate = parseFloat(data.max_nominal_interest_rate);
  return !isNaN(minRate) && !isNaN(maxRate) && minRate <= maxRate;
}, {
  message: "Minimum interest rate must be less than or equal to maximum interest rate",
  path: ["max_nominal_interest_rate"]
}).refine((data) => {
  // Validate default principal is within min/max range if provided
  if (!data.default_principal) return true;
  const defaultPrincipal = parseFloat(data.default_principal);
  const minPrincipal = parseFloat(data.min_principal);
  const maxPrincipal = parseFloat(data.max_principal);
  return !isNaN(defaultPrincipal) && defaultPrincipal >= minPrincipal && defaultPrincipal <= maxPrincipal;
}, {
  message: "Default principal must be between minimum and maximum principal",
  path: ["default_principal"]
}).refine((data) => {
  // Validate default term is within min/max range if provided
  if (!data.default_term) return true;
  const defaultTerm = parseInt(data.default_term);
  const minTerm = parseInt(data.min_term);
  const maxTerm = parseInt(data.max_term);
  return !isNaN(defaultTerm) && defaultTerm >= minTerm && defaultTerm <= maxTerm;
}, {
  message: "Default term must be between minimum and maximum term",
  path: ["default_term"]
}).refine((data) => {
  // Validate default interest rate is within min/max range if provided
  if (!data.default_nominal_interest_rate) return true;
  const defaultRate = parseFloat(data.default_nominal_interest_rate);
  const minRate = parseFloat(data.min_nominal_interest_rate);
  const maxRate = parseFloat(data.max_nominal_interest_rate);
  return !isNaN(defaultRate) && defaultRate >= minRate && defaultRate <= maxRate;
}, {
  message: "Default interest rate must be between minimum and maximum interest rate",
  path: ["default_nominal_interest_rate"]
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
  accounting_type: "none",
  
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