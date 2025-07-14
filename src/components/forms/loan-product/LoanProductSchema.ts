import * as z from "zod";

// Simplified schema matching the actual database structure
export const loanProductSchema = z.object({
  // Basic Information
  name: z.string().min(1, "Product name is required"),
  short_name: z.string().min(1, "Short name is required"),
  description: z.string().optional(),
  currency_code: z.string().min(1, "Currency is required"),
  
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
  repayment_frequency: z.string().min(1, "Repayment frequency is required"),
});

export type LoanProductFormData = z.infer<typeof loanProductSchema>;

export const defaultValues: LoanProductFormData = {
  // Basic Information
  name: "",
  short_name: "",
  description: "",
  currency_code: "USD",
  
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
  repayment_frequency: "monthly",
};