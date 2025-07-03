import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "@/hooks/use-toast";

export interface GroupMeetingType {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  default_duration_minutes: number;
  required_attendance_percentage: number;
  is_active: boolean;
  created_at: string;
}

export interface GroupMeeting {
  id: string;
  group_id: string;
  meeting_type_id: string;
  meeting_title: string;
  meeting_date: string;
  meeting_time: string;
  duration_minutes: number;
  location?: string;
  agenda?: string;
  minutes?: string;
  facilitator_id?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  created_by?: string;
  created_at: string;
  updated_at: string;
  group_meeting_types?: GroupMeetingType;
  meeting_attendance?: MeetingAttendance[];
}

export interface MeetingAttendance {
  id: string;
  meeting_id: string;
  member_id: string;
  attendance_status: 'present' | 'absent' | 'excused' | 'late';
  check_in_time?: string;
  notes?: string;
  recorded_by?: string;
  created_at: string;
  group_members?: any;
}

export interface GroupLoanProduct {
  id: string;
  tenant_id: string;
  product_name: string;
  description?: string;
  min_group_size: number;
  max_group_size: number;
  min_loan_amount: number;
  max_loan_amount: number;
  interest_rate: number;
  term_months: number;
  group_guarantee_required: boolean;
  individual_guarantee_amount: number;
  meeting_frequency_required?: 'weekly' | 'bi_weekly' | 'monthly';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface GroupLoanApplication {
  id: string;
  group_id: string;
  product_id: string;
  application_number: string;
  requested_amount: number;
  loan_purpose: string;
  repayment_plan?: string;
  group_resolution?: string;
  status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'disbursed';
  applied_by?: string;
  reviewed_by?: string;
  approved_by?: string;
  applied_at: string;
  reviewed_at?: string;
  approved_at?: string;
  disbursement_date?: string;
  created_at: string;
  updated_at: string;
  group_loan_products?: GroupLoanProduct;
  groups?: any;
  group_loan_member_allocations?: GroupLoanMemberAllocation[];
}

export interface GroupLoanMemberAllocation {
  id: string;
  group_loan_application_id: string;
  member_id: string;
  allocated_amount: number;
  guarantee_amount: number;
  individual_purpose?: string;
  approval_status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  group_members?: any;
}

export interface GroupSavingsAccount {
  id: string;
  group_id: string;
  account_name: string;
  account_number: string;
  account_type: 'general_savings' | 'emergency_fund' | 'project_fund' | 'loan_security';
  target_amount: number;
  current_balance: number;
  interest_rate: number;
  minimum_contribution: number;
  contribution_frequency?: 'weekly' | 'bi_weekly' | 'monthly' | 'quarterly';
  is_active: boolean;
  opened_date: string;
  maturity_date?: string;
  created_at: string;
  updated_at: string;
  groups?: any;
}

export interface GroupSavingsContribution {
  id: string;
  savings_account_id: string;
  member_id: string;
  contribution_amount: number;
  contribution_date: string;
  contribution_type: 'regular' | 'voluntary' | 'penalty' | 'interest';
  payment_method: 'cash' | 'mpesa' | 'bank_transfer';
  reference_number?: string;
  recorded_by?: string;
  notes?: string;
  created_at: string;
  group_members?: any;
}

export interface GroupSavingsWithdrawal {
  id: string;
  savings_account_id: string;
  member_id: string;
  withdrawal_amount: number;
  withdrawal_date: string;
  withdrawal_reason: string;
  approval_status: 'pending' | 'approved' | 'rejected';
  approved_by?: string;
  approved_at?: string;
  processed_by?: string;
  processed_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  group_members?: any;
}

export interface GroupPerformanceMetrics {
  id: string;
  group_id: string;
  metric_date: string;
  total_members: number;
  active_members: number;
  total_savings_balance: number;
  total_loans_outstanding: number;
  loan_repayment_rate: number;
  meeting_attendance_rate: number;
  savings_target_achievement: number;
  group_solidarity_score: number;
  performance_data?: any;
  created_at: string;
}

export interface GroupLeadership {
  id: string;
  group_id: string;
  member_id: string;
  role_title: 'chairperson' | 'secretary' | 'treasurer' | 'committee_member';
  role_description?: string;
  start_date: string;
  end_date?: string;
  is_active: boolean;
  elected_date?: string;
  election_notes?: string;
  created_at: string;
  updated_at: string;
  group_members?: any;
}

export interface GroupRule {
  id: string;
  group_id: string;
  rule_category: 'attendance' | 'savings' | 'loans' | 'conduct' | 'meetings';
  rule_title: string;
  rule_description: string;
  penalty_amount: number;
  penalty_type?: 'fixed_amount' | 'percentage' | 'suspension' | 'warning';
  is_active: boolean;
  effective_date: string;
  created_by?: string;
  approved_by_group: boolean;
  approval_date?: string;
  created_at: string;
  updated_at: string;
}

export const useGroupManagement = () => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);

  // Meeting Management
  const fetchGroupMeetings = async (groupId?: string): Promise<GroupMeeting[]> => {
    if (!profile?.tenant_id) return [];
    
    let query = supabase
      .from('group_meetings')
      .select(`
        *,
        group_meeting_types (*),
        meeting_attendance (
          *,
          group_members (
            *,
            clients (first_name, last_name)
          )
        )
      `)
      .order('meeting_date', { ascending: false });

    if (groupId) {
      query = query.eq('group_id', groupId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching group meetings:', error);
      return [];
    }

    return (data || []) as GroupMeeting[];
  };

  const createGroupMeeting = async (
    groupId: string,
    meetingTypeId: string,
    meetingTitle: string,
    meetingDate: string,
    meetingTime: string,
    durationMinutes: number,
    location?: string,
    agenda?: string
  ): Promise<GroupMeeting | null> => {
    if (!profile?.id) return null;
    
    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('group_meetings')
        .insert({
          group_id: groupId,
          meeting_type_id: meetingTypeId,
          meeting_title: meetingTitle,
          meeting_date: meetingDate,
          meeting_time: meetingTime,
          duration_minutes: durationMinutes,
          location,
          agenda,
          created_by: profile.id
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Meeting scheduled successfully",
      });

      return data as GroupMeeting;
    } catch (error) {
      console.error('Error creating group meeting:', error);
      toast({
        title: "Error",
        description: "Failed to schedule meeting",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const recordAttendance = async (
    meetingId: string,
    attendanceRecords: Array<{
      member_id: string;
      attendance_status: MeetingAttendance['attendance_status'];
      notes?: string;
    }>
  ): Promise<boolean> => {
    if (!profile?.id) return false;
    
    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('meeting_attendance')
        .upsert(
          attendanceRecords.map(record => ({
            meeting_id: meetingId,
            member_id: record.member_id,
            attendance_status: record.attendance_status,
            notes: record.notes,
            recorded_by: profile.id,
            check_in_time: record.attendance_status === 'present' ? new Date().toISOString() : null
          })),
          { onConflict: 'meeting_id,member_id' }
        );

      if (error) throw error;

      toast({
        title: "Success",
        description: "Attendance recorded successfully",
      });

      return true;
    } catch (error) {
      console.error('Error recording attendance:', error);
      toast({
        title: "Error",
        description: "Failed to record attendance",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Group Loan Management
  const fetchGroupLoanProducts = async (): Promise<GroupLoanProduct[]> => {
    if (!profile?.tenant_id) return [];
    
    const { data, error } = await supabase
      .from('group_loan_products')
      .select('*')
      .eq('tenant_id', profile.tenant_id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching group loan products:', error);
      return [];
    }

    return (data || []) as GroupLoanProduct[];
  };

  const createGroupLoanProduct = async (
    productName: string,
    description: string,
    minGroupSize: number,
    maxGroupSize: number,
    minLoanAmount: number,
    maxLoanAmount: number,
    interestRate: number,
    termMonths: number,
    groupGuaranteeRequired: boolean,
    meetingFrequency?: GroupLoanProduct['meeting_frequency_required']
  ): Promise<GroupLoanProduct | null> => {
    if (!profile?.tenant_id) return null;
    
    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('group_loan_products')
        .insert({
          tenant_id: profile.tenant_id,
          product_name: productName,
          description,
          min_group_size: minGroupSize,
          max_group_size: maxGroupSize,
          min_loan_amount: minLoanAmount,
          max_loan_amount: maxLoanAmount,
          interest_rate: interestRate,
          term_months: termMonths,
          group_guarantee_required: groupGuaranteeRequired,
          meeting_frequency_required: meetingFrequency
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Group loan product created successfully",
      });

      return data as GroupLoanProduct;
    } catch (error) {
      console.error('Error creating group loan product:', error);
      toast({
        title: "Error",
        description: "Failed to create group loan product",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const fetchGroupLoanApplications = async (groupId?: string): Promise<GroupLoanApplication[]> => {
    if (!profile?.tenant_id) return [];
    
    let query = supabase
      .from('group_loan_applications')
      .select(`
        *,
        group_loan_products (*),
        groups (name, group_number),
        group_loan_member_allocations (
          *,
          group_members (
            *,
            clients (first_name, last_name)
          )
        )
      `)
      .order('applied_at', { ascending: false });

    if (groupId) {
      query = query.eq('group_id', groupId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching group loan applications:', error);
      return [];
    }

    return (data || []) as GroupLoanApplication[];
  };

  const createGroupLoanApplication = async (
    groupId: string,
    productId: string,
    requestedAmount: number,
    loanPurpose: string,
    memberAllocations: Array<{
      member_id: string;
      allocated_amount: number;
      guarantee_amount: number;
      individual_purpose?: string;
    }>
  ): Promise<GroupLoanApplication | null> => {
    if (!profile?.id) return null;
    
    setLoading(true);
    
    try {
      // Generate application number
      const applicationNumber = `GLA-${Date.now()}`;

      const { data: application, error: appError } = await supabase
        .from('group_loan_applications')
        .insert({
          group_id: groupId,
          product_id: productId,
          application_number: applicationNumber,
          requested_amount: requestedAmount,
          loan_purpose: loanPurpose,
          applied_by: profile.id
        })
        .select()
        .single();

      if (appError) throw appError;

      // Insert member allocations
      const { error: allocError } = await supabase
        .from('group_loan_member_allocations')
        .insert(
          memberAllocations.map(allocation => ({
            group_loan_application_id: application.id,
            ...allocation
          }))
        );

      if (allocError) throw allocError;

      toast({
        title: "Success",
        description: "Group loan application submitted successfully",
      });

      return application as GroupLoanApplication;
    } catch (error) {
      console.error('Error creating group loan application:', error);
      toast({
        title: "Error",
        description: "Failed to submit group loan application",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Group Savings Management
  const fetchGroupSavingsAccounts = async (groupId?: string): Promise<GroupSavingsAccount[]> => {
    if (!profile?.tenant_id) return [];
    
    let query = supabase
      .from('group_savings_accounts')
      .select(`
        *,
        groups (name, group_number)
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (groupId) {
      query = query.eq('group_id', groupId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching group savings accounts:', error);
      return [];
    }

    return (data || []) as GroupSavingsAccount[];
  };

  const createGroupSavingsAccount = async (
    groupId: string,
    accountName: string,
    accountType: GroupSavingsAccount['account_type'],
    targetAmount: number,
    interestRate: number,
    minimumContribution: number,
    contributionFrequency?: GroupSavingsAccount['contribution_frequency']
  ): Promise<GroupSavingsAccount | null> => {
    if (!profile?.tenant_id) return null;
    
    setLoading(true);
    
    try {
      // Generate account number
      const accountNumber = `GSA-${Date.now()}`;

      const { data, error } = await supabase
        .from('group_savings_accounts')
        .insert({
          group_id: groupId,
          account_name: accountName,
          account_number: accountNumber,
          account_type: accountType,
          target_amount: targetAmount,
          interest_rate: interestRate,
          minimum_contribution: minimumContribution,
          contribution_frequency: contributionFrequency
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Group savings account created successfully",
      });

      return data as GroupSavingsAccount;
    } catch (error) {
      console.error('Error creating group savings account:', error);
      toast({
        title: "Error",
        description: "Failed to create group savings account",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const recordSavingsContribution = async (
    savingsAccountId: string,
    memberId: string,
    contributionAmount: number,
    contributionType: GroupSavingsContribution['contribution_type'],
    paymentMethod: GroupSavingsContribution['payment_method'],
    referenceNumber?: string,
    notes?: string
  ): Promise<boolean> => {
    if (!profile?.id) return false;
    
    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('group_savings_contributions')
        .insert({
          savings_account_id: savingsAccountId,
          member_id: memberId,
          contribution_amount: contributionAmount,
          contribution_type: contributionType,
          payment_method: paymentMethod,
          reference_number: referenceNumber,
          recorded_by: profile.id,
          notes
        });

      if (error) throw error;

      // Update account balance by fetching current balance and updating
      const { data: currentAccount } = await supabase
        .from('group_savings_accounts')
        .select('current_balance')
        .eq('id', savingsAccountId)
        .single();

      if (currentAccount) {
        await supabase
          .from('group_savings_accounts')
          .update({ 
            current_balance: currentAccount.current_balance + contributionAmount 
          })
          .eq('id', savingsAccountId);
      }

      toast({
        title: "Success",
        description: "Savings contribution recorded successfully",
      });

      return true;
    } catch (error) {
      console.error('Error recording savings contribution:', error);
      toast({
        title: "Error",
        description: "Failed to record savings contribution",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Performance Analytics
  const generateGroupPerformanceMetrics = async (groupId: string): Promise<GroupPerformanceMetrics | null> => {
    if (!profile?.tenant_id) return null;
    
    setLoading(true);
    
    try {
      // Get group members
      const { data: members } = await supabase
        .from('group_members')
        .select('*')
        .eq('group_id', groupId);

      // Get recent meetings and attendance
      const { data: meetings } = await supabase
        .from('group_meetings')
        .select(`
          *,
          meeting_attendance (*)
        `)
        .eq('group_id', groupId)
        .gte('meeting_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

      // Get savings balances
      const { data: savingsAccounts } = await supabase
        .from('group_savings_accounts')
        .select('current_balance')
        .eq('group_id', groupId)
        .eq('is_active', true);

      // Calculate metrics
      const totalMembers = members?.length || 0;
      const activeMembers = members?.filter(m => m.is_active)?.length || 0;
      const totalSavingsBalance = savingsAccounts?.reduce((sum, acc) => sum + acc.current_balance, 0) || 0;
      
      // Calculate attendance rate
      const totalAttendanceRecords = meetings?.reduce((sum, meeting) => 
        sum + (meeting.meeting_attendance?.length || 0), 0) || 0;
      const presentCount = meetings?.reduce((sum, meeting) => 
        sum + (meeting.meeting_attendance?.filter((att: any) => att.attendance_status === 'present')?.length || 0), 0) || 0;
      const attendanceRate = totalAttendanceRecords > 0 ? (presentCount / totalAttendanceRecords) * 100 : 0;

      const performanceData = {
        member_details: members,
        meeting_summary: meetings?.map(m => ({
          date: m.meeting_date,
          attendance: m.meeting_attendance?.length || 0,
          present: m.meeting_attendance?.filter((att: any) => att.attendance_status === 'present')?.length || 0
        })),
        savings_breakdown: savingsAccounts
      };

      const { data, error } = await supabase
        .from('group_performance_metrics')
        .upsert({
          group_id: groupId,
          metric_date: new Date().toISOString().split('T')[0],
          total_members: totalMembers,
          active_members: activeMembers,
          total_savings_balance: totalSavingsBalance,
          total_loans_outstanding: 0, // Would need to calculate from loans
          loan_repayment_rate: 0, // Would need to calculate from payments
          meeting_attendance_rate: attendanceRate,
          savings_target_achievement: 0, // Would need to calculate from targets
          group_solidarity_score: Math.min(100, (attendanceRate + (activeMembers/totalMembers * 100)) / 2),
          performance_data: performanceData
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Performance metrics generated successfully",
      });

      return data as GroupPerformanceMetrics;
    } catch (error) {
      console.error('Error generating performance metrics:', error);
      toast({
        title: "Error",
        description: "Failed to generate performance metrics",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const fetchGroupPerformanceMetrics = async (groupId?: string): Promise<GroupPerformanceMetrics[]> => {
    if (!profile?.tenant_id) return [];
    
    let query = supabase
      .from('group_performance_metrics')
      .select('*')
      .order('metric_date', { ascending: false });

    if (groupId) {
      query = query.eq('group_id', groupId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching group performance metrics:', error);
      return [];
    }

    return (data || []) as GroupPerformanceMetrics[];
  };

  // Group Leadership Management
  const fetchGroupLeadership = async (groupId: string): Promise<GroupLeadership[]> => {
    const { data, error } = await supabase
      .from('group_leadership')
      .select(`
        *,
        group_members (
          *,
          clients (first_name, last_name)
        )
      `)
      .eq('group_id', groupId)
      .eq('is_active', true)
      .order('start_date', { ascending: false });

    if (error) {
      console.error('Error fetching group leadership:', error);
      return [];
    }

    return (data || []) as GroupLeadership[];
  };

  const assignGroupLeadership = async (
    groupId: string,
    memberId: string,
    roleTitle: GroupLeadership['role_title'],
    roleDescription?: string,
    startDate?: string
  ): Promise<GroupLeadership | null> => {
    setLoading(true);
    
    try {
      // End any existing active role for this member and role type
      await supabase
        .from('group_leadership')
        .update({ 
          is_active: false,
          end_date: new Date().toISOString().split('T')[0]
        })
        .eq('group_id', groupId)
        .eq('role_title', roleTitle)
        .eq('is_active', true);

      const { data, error } = await supabase
        .from('group_leadership')
        .insert({
          group_id: groupId,
          member_id: memberId,
          role_title: roleTitle,
          role_description: roleDescription,
          start_date: startDate || new Date().toISOString().split('T')[0],
          elected_date: new Date().toISOString().split('T')[0]
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Leadership role assigned successfully",
      });

      return data as GroupLeadership;
    } catch (error) {
      console.error('Error assigning group leadership:', error);
      toast({
        title: "Error",
        description: "Failed to assign leadership role",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    fetchGroupMeetings,
    createGroupMeeting,
    recordAttendance,
    fetchGroupLoanProducts,
    createGroupLoanProduct,
    fetchGroupLoanApplications,
    createGroupLoanApplication,
    fetchGroupSavingsAccounts,
    createGroupSavingsAccount,
    recordSavingsContribution,
    generateGroupPerformanceMetrics,
    fetchGroupPerformanceMetrics,
    fetchGroupLeadership,
    assignGroupLeadership
  };
};