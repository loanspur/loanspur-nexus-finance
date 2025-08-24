// src/types/group.ts - Group management types
export interface EnhancedGroup {
  id: string;
  tenant_id: string;
  mifos_group_id?: number;
  
  // Group Details
  name: string;
  external_id?: string;
  status: 'active' | 'inactive' | 'closed';
  group_type: 'savings' | 'credit' | 'mixed';
  
  // Group Structure
  group_level: number; // 1 = Primary, 2 = Secondary, etc.
  parent_group_id?: string;
  office_id: string;
  
  // Membership
  member_count: number;
  max_members?: number;
  joining_fee?: number;
  annual_fee?: number;
  
  // Meeting & Governance
  meeting_frequency: 'weekly' | 'monthly' | 'quarterly';
  meeting_day?: number; // 1-7 for days of week
  meeting_time?: string;
  meeting_location?: string;
  
  // Financial Management
  group_savings_balance: number;
  group_loan_balance: number;
  group_guarantee_fund: number;
  
  // Compliance
  registration_date: string;
  registration_number?: string;
  regulatory_approval?: boolean;
  
  created_at: string;
  updated_at: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  client_id: string;
  role: 'member' | 'chairperson' | 'secretary' | 'treasurer';
  joined_date: string;
  status: 'active' | 'inactive' | 'suspended';
  savings_contribution: number;
  loan_guarantee: number;
}

export interface GroupMeeting {
  id: string;
  group_id: string;
  meeting_date: string;
  meeting_time: string;
  location: string;
  agenda: string;
  minutes?: string;
  attendance_count: number;
  status: 'scheduled' | 'completed' | 'cancelled';
  created_at: string;
}
