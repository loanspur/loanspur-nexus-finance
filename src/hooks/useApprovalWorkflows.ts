import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export interface ApprovalWorkflowType {
  id: string;
  name: string;
  description?: string;
  tenant_id: string;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ApprovalWorkflow {
  id: string;
  workflow_type_id: string;
  action_type: string;
  table_name: string;
  minimum_approvers: number;
  maximum_approvers?: number;
  approval_order: 'sequential' | 'any' | 'all';
  auto_approve_threshold?: number;
  tenant_id: string;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
  workflow_type?: ApprovalWorkflowType;
}

export interface ApprovalWorkflowRole {
  id: string;
  workflow_id: string;
  role: string;
  custom_role_id?: string;
  approval_level: number;
  can_approve: boolean;
  can_reject: boolean;
  tenant_id: string;
  created_at: string;
}

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

// Fetch approval workflow types
export const useApprovalWorkflowTypes = () => {
  const { profile } = useAuth();
  
  return useQuery({
    queryKey: ['approval-workflow-types', profile?.tenant_id],
    queryFn: async () => {
      if (!profile?.tenant_id) return [];
      
      const { data, error } = await supabase
        .from('approval_workflow_types')
        .select('*')
        .eq('tenant_id', profile.tenant_id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as ApprovalWorkflowType[];
    },
    enabled: !!profile?.tenant_id,
  });
};

// Fetch approval workflows
export const useApprovalWorkflows = () => {
  const { profile } = useAuth();
  
  return useQuery({
    queryKey: ['approval-workflows', profile?.tenant_id],
    queryFn: async () => {
      if (!profile?.tenant_id) return [];
      
      const { data, error } = await supabase
        .from('approval_workflows')
        .select(`
          *,
          workflow_type:approval_workflow_types(*)
        `)
        .eq('tenant_id', profile.tenant_id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as ApprovalWorkflow[];
    },
    enabled: !!profile?.tenant_id,
  });
};

// Fetch approval workflow roles
export const useApprovalWorkflowRoles = (workflowId?: string) => {
  const { profile } = useAuth();
  
  return useQuery({
    queryKey: ['approval-workflow-roles', profile?.tenant_id, workflowId],
    queryFn: async () => {
      if (!profile?.tenant_id || !workflowId) return [];
      
      const { data, error } = await supabase
        .from('approval_workflow_roles')
        .select('*')
        .eq('tenant_id', profile.tenant_id)
        .eq('workflow_id', workflowId)
        .order('approval_level', { ascending: true });
      
      if (error) throw error;
      return data as ApprovalWorkflowRole[];
    },
    enabled: !!profile?.tenant_id && !!workflowId,
  });
};

// Create approval workflow
export const useCreateApprovalWorkflow = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async (workflowData: {
      workflow_type_id: string;
      action_type: string;
      table_name: string;
      minimum_approvers: number;
      maximum_approvers?: number;
      approval_order: 'sequential' | 'any' | 'all';
      auto_approve_threshold?: number;
      roles: Array<{
        role: string;
        custom_role_id?: string;
        approval_level: number;
        can_approve: boolean;
        can_reject: boolean;
      }>;
    }) => {
      if (!profile?.tenant_id) throw new Error('No tenant ID');
      
      // Create the workflow
      const { data: workflow, error: workflowError } = await supabase
        .from('approval_workflows')
        .insert([{
          workflow_type_id: workflowData.workflow_type_id,
          action_type: workflowData.action_type,
          table_name: workflowData.table_name,
          minimum_approvers: workflowData.minimum_approvers,
          maximum_approvers: workflowData.maximum_approvers,
          approval_order: workflowData.approval_order,
          auto_approve_threshold: workflowData.auto_approve_threshold,
          tenant_id: profile.tenant_id,
          created_by: profile.id
        }])
        .select()
        .single();
      
      if (workflowError) throw workflowError;
      
      // Add workflow roles
      if (workflowData.roles.length > 0) {
        const { error: rolesError } = await supabase
          .from('approval_workflow_roles')
          .insert(
            workflowData.roles.map(role => ({
              workflow_id: workflow.id,
              role: role.role,
              custom_role_id: role.custom_role_id,
              approval_level: role.approval_level,
              can_approve: role.can_approve,
              can_reject: role.can_reject,
              tenant_id: profile.tenant_id
            }))
          );
        
        if (rolesError) throw rolesError;
      }
      
      return workflow;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approval-workflows'] });
      queryClient.invalidateQueries({ queryKey: ['approval-workflow-roles'] });
      toast({
        title: "Success",
        description: "Approval workflow created successfully",
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

// Update approval workflow
export const useUpdateApprovalWorkflow = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async ({
      workflowId,
      updates
    }: {
      workflowId: string;
      updates: {
        workflow_type_id?: string;
        action_type?: string;
        table_name?: string;
        minimum_approvers?: number;
        maximum_approvers?: number;
        approval_order?: 'sequential' | 'any' | 'all';
        auto_approve_threshold?: number;
        is_active?: boolean;
        roles?: Array<{
          role: string;
          custom_role_id?: string;
          approval_level: number;
          can_approve: boolean;
          can_reject: boolean;
        }>;
      };
    }) => {
      if (!profile?.tenant_id) throw new Error('No tenant ID');
      
      // Update workflow
      const { data: workflow, error: workflowError } = await supabase
        .from('approval_workflows')
        .update({
          workflow_type_id: updates.workflow_type_id,
          action_type: updates.action_type,
          table_name: updates.table_name,
          minimum_approvers: updates.minimum_approvers,
          maximum_approvers: updates.maximum_approvers,
          approval_order: updates.approval_order,
          auto_approve_threshold: updates.auto_approve_threshold,
          is_active: updates.is_active
        })
        .eq('id', workflowId)
        .eq('tenant_id', profile.tenant_id)
        .select()
        .single();
      
      if (workflowError) throw workflowError;
      
      // Update roles if provided
      if (updates.roles !== undefined) {
        // Remove existing roles
        await supabase
          .from('approval_workflow_roles')
          .delete()
          .eq('workflow_id', workflowId)
          .eq('tenant_id', profile.tenant_id);
        
        // Add new roles
        if (updates.roles.length > 0) {
          const { error: rolesError } = await supabase
            .from('approval_workflow_roles')
            .insert(
              updates.roles.map(role => ({
                workflow_id: workflowId,
                role: role.role,
                custom_role_id: role.custom_role_id,
                approval_level: role.approval_level,
                can_approve: role.can_approve,
                can_reject: role.can_reject,
                tenant_id: profile.tenant_id
              }))
            );
          
          if (rolesError) throw rolesError;
        }
      }
      
      return workflow;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approval-workflows'] });
      queryClient.invalidateQueries({ queryKey: ['approval-workflow-roles'] });
      toast({
        title: "Success",
        description: "Approval workflow updated successfully",
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

// Delete approval workflow
export const useDeleteApprovalWorkflow = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async (workflowId: string) => {
      if (!profile?.tenant_id) throw new Error('No tenant ID');
      
      const { error } = await supabase
        .from('approval_workflows')
        .delete()
        .eq('id', workflowId)
        .eq('tenant_id', profile.tenant_id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approval-workflows'] });
      toast({
        title: "Success",
        description: "Approval workflow deleted successfully",
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