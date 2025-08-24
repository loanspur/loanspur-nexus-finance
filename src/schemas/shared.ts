// src/schemas/shared.ts - Centralized validation schemas
import { z } from 'zod';

// Authentication schemas
export const authSchemas = {
  signIn: z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
  }),
  
  signUp: z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
    firstName: z.string().min(2, "First name must be at least 2 characters"),
    lastName: z.string().min(2, "Last name must be at least 2 characters"),
    role: z.enum(['client', 'loan_officer', 'tenant_admin']),
  }).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  }),
  
  passwordReset: z.object({
    email: z.string().email("Invalid email address"),
  }),
  
  otpVerification: z.object({
    otp: z.string().length(6, "OTP must be 6 digits"),
  })
};

// Tenant schemas
export const tenantSchemas = {
  create: z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    slug: z.string().min(2, "Slug must be at least 2 characters"),
    subdomain: z.string().min(2, "Subdomain must be at least 2 characters"),
    domain: z.string().optional(),
    logo_url: z.string().url().optional(),
    contact_person_name: z.string().min(2, "Contact person name is required"),
    contact_person_email: z.string().email("Invalid contact email"),
    contact_person_phone: z.string().optional(),
    country: z.string().length(2, "Country code must be 2 characters"),
    currency_code: z.string().length(3, "Currency code must be 3 characters"),
  }),
  
  update: z.object({
    name: z.string().min(2).optional(),
    slug: z.string().min(2).optional(),
    subdomain: z.string().min(2).optional(),
    domain: z.string().optional(),
    logo_url: z.string().url().optional(),
    contact_person_name: z.string().min(2).optional(),
    contact_person_email: z.string().email().optional(),
    contact_person_phone: z.string().optional(),
    country: z.string().length(2).optional(),
    currency_code: z.string().length(3).optional(),
  })
};

// Client schemas
export const clientSchemas = {
  create: z.object({
    first_name: z.string().min(2, "First name must be at least 2 characters"),
    last_name: z.string().min(2, "Last name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    phone: z.string().optional(),
    date_of_birth: z.string().optional(),
    gender: z.enum(['male', 'female', 'other']).optional(),
    address: z.object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      postal_code: z.string().optional(),
      country: z.string().optional(),
    }).optional(),
    tenant_id: z.string().uuid("Invalid tenant ID"),
  }),
  
  update: z.object({
    first_name: z.string().min(2).optional(),
    last_name: z.string().min(2).optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    date_of_birth: z.string().optional(),
    gender: z.enum(['male', 'female', 'other']).optional(),
    address: z.object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      postal_code: z.string().optional(),
      country: z.string().optional(),
    }).optional(),
  })
};

// Loan schemas
export const loanSchemas = {
  create: z.object({
    client_id: z.string().uuid("Invalid client ID"),
    amount: z.number().positive("Amount must be positive"),
    term_months: z.number().int().positive("Term must be a positive integer"),
    interest_rate: z.number().min(0).max(100, "Interest rate must be between 0 and 100"),
    purpose: z.string().min(1, "Purpose is required"),
    collateral: z.string().optional(),
    tenant_id: z.string().uuid("Invalid tenant ID"),
  }),
  
  update: z.object({
    amount: z.number().positive().optional(),
    term_months: z.number().int().positive().optional(),
    interest_rate: z.number().min(0).max(100).optional(),
    purpose: z.string().min(1).optional(),
    collateral: z.string().optional(),
    status: z.enum(['pending', 'approved', 'rejected', 'active', 'completed', 'defaulted']).optional(),
  })
};

// Utility function to validate data
export const validateData = <T>(schema: z.ZodSchema<T>, data: unknown): T => {
  return schema.parse(data);
};

// Utility function to validate data safely (returns error instead of throwing)
export const validateDataSafe = <T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } => {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0]?.message || 'Validation failed' };
    }
    return { success: false, error: 'Unknown validation error' };
  }
};
