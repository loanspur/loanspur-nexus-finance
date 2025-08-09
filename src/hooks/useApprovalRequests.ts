import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export interface ApprovalRequest {
  id: string;
  workflow_id: string;
  record_id: string;
  record_data?: any;
  requested_by: string;
  current_level: number;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  reason?: string;
  tenant_id: string;
  expires_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ApprovalAction {
  id: string;
  approval_request_id: string;
  approver_id: string;
  action: 'approved' | 'rejected' | 'delegated' | 'escalated';
  comments?: string;
  approval_level: number;
  delegated_to?: string;
  tenant_id: string;
  created_at: string;
}

// Fetch approval requests
export const useApprovalRequests = (filters?: {
  status?: string;
  workflow_id?: string;
  requested_by?: string;
}) => {
  const { profile } = useAuth();
  
  return useQuery({
    queryKey: ['approval-requests', profile?.tenant_id, filters],
    queryFn: async () => {
      if (!profile?.tenant_id) return [];
      
      let query = supabase
        .from('approval_requests')
        .select(`
          *,
          workflow:approval_workflows(*),
          requester:profiles!requested_by(first_name, last_name, email)
        `)
        .eq('tenant_id', profile.tenant_id);
      
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.workflow_id) {
        query = query.eq('workflow_id', filters.workflow_id);
      }
      if (filters?.requested_by) {
        query = query.eq('requested_by', filters.requested_by);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as any[];
    },
    enabled: !!profile?.tenant_id,
  });
};

// Fetch pending approvals for current user
export const usePendingApprovals = () => {
  const { profile } = useAuth();
  
  return useQuery({
    queryKey: ['pending-approvals', profile?.tenant_id, profile?.id],
    queryFn: async () => {
      if (!profile?.tenant_id || !profile?.id) return [];
      
      // Get workflows where user has approval role
      const { data: workflowRoles, error: rolesError } = await supabase
        .from('approval_workflow_roles')
        .select('workflow_id, approval_level')
        .eq('tenant_id', profile.tenant_id)
        .eq('role', profile.role);
      
      if (rolesError) throw rolesError;
      if (!workflowRoles.length) return [];
      
      const workflowIds = workflowRoles.map(r => r.workflow_id);
      
      // Get pending approval requests for these workflows
      const { data, error } = await supabase
        .from('approval_requests')
        .select(`
          *,
          workflow:approval_workflows(*),
          requester:profiles!requested_by(first_name, last_name, email),
          actions:approval_actions(*)
        `)
        .eq('tenant_id', profile.tenant_id)
        .eq('status', 'pending')
        .in('workflow_id', workflowIds)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Filter based on approval level and existing actions
      const filteredRequests = data.filter(request => {
        const userRole = workflowRoles.find(r => r.workflow_id === request.workflow_id);
        if (!userRole) return false;
        
        // Check if user has already acted on this request
        const userAction = request.actions?.find((action: any) => action.approver_id === profile.id);
        if (userAction) return false;
        
        // Check if request is at the user's approval level
        return request.current_level === userRole.approval_level;
      });
      
      return filteredRequests;
    },
    enabled: !!profile?.tenant_id && !!profile?.id,
  });
};

// Create approval request
export const useCreateApprovalRequest = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async (requestData: {
      workflow_id: string;
      record_id: string;
      record_data?: any;
      priority?: 'low' | 'normal' | 'high' | 'urgent';
      reason?: string;
      expires_at?: string;
    }) => {
      if (!profile?.tenant_id || !profile?.id) throw new Error('No user context');
      
      const { data, error } = await supabase
        .from('approval_requests')
        .insert([{
          workflow_id: requestData.workflow_id,
          record_id: requestData.record_id,
          record_data: requestData.record_data,
          requested_by: profile.id,
          priority: requestData.priority || 'normal',
          reason: requestData.reason,
          tenant_id: profile.tenant_id,
          expires_at: requestData.expires_at,
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approval-requests'] });
      queryClient.invalidateQueries({ queryKey: ['pending-approvals'] });
      toast({
        title: "Success",
        description: "Approval request submitted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

// Process approval action
export const useProcessApprovalAction = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async (actionData: {
      approval_request_id: string;
      action: 'approved' | 'rejected' | 'delegated' | 'escalated';
      comments?: string;
      delegated_to?: string;
    }) => {
      if (!profile?.tenant_id || !profile?.id) throw new Error('No user context');
      
      // Get the approval request details
      const { data: request, error: requestError } = await supabase
        .from('approval_requests')
        .select(`
          *,
          workflow:approval_workflows(*)
        `)
        .eq('id', actionData.approval_request_id)
        .single();
      
      if (requestError || !request) throw new Error('Approval request not found');
      
      // Get user's approval level for this workflow
      const { data: workflowRole, error: roleError } = await supabase
        .from('approval_workflow_roles')
        .select('approval_level')
        .eq('workflow_id', request.workflow_id)
        .eq('tenant_id', profile.tenant_id)
        .eq('role', profile.role)
        .single();
      
      if (roleError || !workflowRole) throw new Error('User not authorized for this approval');
      
      // Create approval action
      const { data: action, error: actionError } = await supabase
        .from('approval_actions')
        .insert([{
          approval_request_id: actionData.approval_request_id,
          approver_id: profile.id,
          action: actionData.action,
          comments: actionData.comments,
          approval_level: workflowRole.approval_level,
          delegated_to: actionData.delegated_to,
          tenant_id: profile.tenant_id,
        }])
        .select()
        .single();
      
      if (actionError) throw actionError;
      
      // Update approval request status
      let newStatus: string = request.status;
      let newLevel = request.current_level;
      
      if (actionData.action === 'approved') {
        // Check if this meets minimum approvers requirement
        const { data: actions, error: actionsError } = await supabase
          .from('approval_actions')
          .select('action')
          .eq('approval_request_id', actionData.approval_request_id)
          .eq('action', 'approved');
        
        if (actionsError) throw actionsError;
        
        const approvalCount = (actions?.length || 0) + 1; // +1 for current action
        
        if (approvalCount >= request.workflow.minimum_approvers) {
          newStatus = 'approved';
        }
      } else if (actionData.action === 'rejected') {
        newStatus = 'rejected';
      }
      
      const { error: updateError } = await supabase
        .from('approval_requests')
        .update({
          status: newStatus,
          current_level: newLevel,
          completed_at: newStatus !== 'pending' ? new Date().toISOString() : null,
        })
        .eq('id', actionData.approval_request_id);
      
      if (updateError) throw updateError;
      
      return { action, newStatus };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approval-requests'] });
      queryClient.invalidateQueries({ queryKey: ['pending-approvals'] });
      toast({
        title: "Success",
        description: "Approval action processed successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

// Get approval workflow for a specific table and action
export const useGetApprovalWorkflow = (tableName: string, actionType: string) => {
  const { profile } = useAuth();
  
  return useQuery({
    queryKey: ['approval-workflow', profile?.tenant_id, tableName, actionType],
    queryFn: async () => {
      if (!profile?.tenant_id) return null;
      
      const { data, error } = await supabase
        .from('approval_workflows')
        .select('*')
        .eq('tenant_id', profile.tenant_id)
        .eq('table_name', tableName)
        .eq('action_type', actionType)
        .eq('is_active', true)
        .maybeSingle();
      
      if (error) throw error;
      return data;

    },
    enabled: !!profile?.tenant_id && !!tableName && !!actionType,
  });
};