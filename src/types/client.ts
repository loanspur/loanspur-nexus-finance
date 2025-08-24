// src/types/client.ts - Enhanced client management types
export interface EnhancedClient {
  // Basic Info
  id: string;
  tenant_id: string;
  mifos_client_id?: number;
  
  // Personal Details
  first_name: string;
  last_name: string;
  middle_name?: string;
  date_of_birth: string;
  gender: 'male' | 'female' | 'other';
  marital_status: 'single' | 'married' | 'divorced' | 'widowed';
  
  // Contact Information
  phone_number: string;
  email?: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  
  // KYC & Compliance
  national_id: string;
  national_id_type: 'passport' | 'drivers_license' | 'national_id' | 'other';
  national_id_expiry?: string;
  kyc_status: 'pending' | 'verified' | 'rejected';
  kyc_verified_at?: string;
  kyc_verified_by?: string;
  
  // Employment & Income
  employment_status: 'employed' | 'self_employed' | 'unemployed' | 'student' | 'retired';
  employer_name?: string;
  job_title?: string;
  monthly_income?: number;
  income_source?: string;
  
  // Banking & Financial
  bank_name?: string;
  bank_account_number?: string;
  bank_branch?: string;
  credit_score?: number;
  risk_category: 'low' | 'medium' | 'high';
  
  // System Fields
  status: 'active' | 'inactive' | 'suspended' | 'blacklisted';
  created_at: string;
  updated_at: string;
}

export interface ClientDocument {
  id: string;
  client_id: string;
  document_type: 'national_id' | 'passport' | 'drivers_license' | 'utility_bill' | 'bank_statement' | 'payslip' | 'other';
  document_number?: string;
  file_url: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  verification_status: 'pending' | 'verified' | 'rejected';
  verified_at?: string;
  verified_by?: string;
  created_at: string;
}

export interface ClientKYC {
  id: string;
  client_id: string;
  kyc_level: 'basic' | 'enhanced' | 'full';
  verification_method: 'manual' | 'automated' | 'hybrid';
  risk_score: number;
  compliance_status: 'compliant' | 'non_compliant' | 'pending';
  next_review_date: string;
  created_at: string;
  updated_at: string;
}
