import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "@/hooks/use-toast";

export interface DocumentTemplate {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  category: 'loan_agreement' | 'guarantor_form' | 'id_verification' | 'income_verification' | 'collateral_document' | 'other';
  template_content?: string;
  placeholders: string[];
  is_active: boolean;
  requires_approval: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentWorkflowStage {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  stage_order: number;
  required_role?: string;
  auto_approve: boolean;
  is_active: boolean;
  created_at: string;
}

export interface DocumentVersion {
  id: string;
  document_id: string;
  version_number: number;
  file_url: string;
  file_size?: number;
  mime_type?: string;
  changes_description?: string;
  created_by?: string;
  created_at: string;
}

export interface DocumentWorkflow {
  id: string;
  tenant_id: string;
  document_id: string;
  current_stage_id?: string;
  status: 'pending' | 'in_progress' | 'approved' | 'rejected' | 'cancelled';
  initiated_by?: string;
  initiated_at: string;
  completed_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentApproval {
  id: string;
  workflow_id: string;
  stage_id: string;
  approver_id: string;
  status: 'pending' | 'approved' | 'rejected';
  comments?: string;
  approved_at?: string;
  created_at: string;
}

export interface DocumentSignature {
  id: string;
  document_id: string;
  signer_id?: string;
  signer_name: string;
  signer_email?: string;
  signature_data?: string;
  signature_method: 'electronic' | 'digital' | 'wet_signature';
  ip_address?: string;
  user_agent?: string;
  signed_at: string;
  is_valid: boolean;
  verification_code?: string;
  created_at: string;
}

export interface DocumentCompliance {
  id: string;
  tenant_id: string;
  document_id: string;
  compliance_type: string;
  requirement_name: string;
  status: 'compliant' | 'non_compliant' | 'pending_review' | 'expired';
  expiry_date?: string;
  checked_by?: string;
  checked_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export const useDocumentManagement = () => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);

  // Template Management
  const fetchTemplates = async (): Promise<DocumentTemplate[]> => {
    if (!profile?.tenant_id) return [];
    
    const { data, error } = await supabase
      .from('document_templates')
      .select('*')
      .eq('tenant_id', profile.tenant_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching templates:', error);
      toast({
        title: "Error",
        description: "Failed to fetch document templates",
        variant: "destructive",
      });
      return [];
    }

    return (data || []) as DocumentTemplate[];
  };

  const createTemplate = async (template: Omit<DocumentTemplate, 'id' | 'tenant_id' | 'created_at' | 'updated_at' | 'created_by'>): Promise<DocumentTemplate | null> => {
    if (!profile?.tenant_id || !profile?.id) return null;
    
    setLoading(true);
    
    const { data, error } = await supabase
      .from('document_templates')
      .insert({
        ...template,
        tenant_id: profile.tenant_id,
        created_by: profile.id
      })
      .select()
      .single();

    setLoading(false);

    if (error) {
      console.error('Error creating template:', error);
      toast({
        title: "Error",
        description: "Failed to create document template",
        variant: "destructive",
      });
      return null;
    }

    toast({
      title: "Success",
      description: "Document template created successfully",
    });

    return data as DocumentTemplate;
  };

  // Workflow Management
  const fetchWorkflowStages = async (): Promise<DocumentWorkflowStage[]> => {
    if (!profile?.tenant_id) return [];
    
    const { data, error } = await supabase
      .from('document_workflow_stages')
      .select('*')
      .eq('tenant_id', profile.tenant_id)
      .order('stage_order', { ascending: true });

    if (error) {
      console.error('Error fetching workflow stages:', error);
      return [];
    }

    return (data || []) as DocumentWorkflowStage[];
  };

  const createWorkflow = async (documentId: string): Promise<DocumentWorkflow | null> => {
    if (!profile?.tenant_id || !profile?.id) return null;
    
    setLoading(true);
    
    const { data, error } = await supabase
      .from('document_workflows')
      .insert({
        tenant_id: profile.tenant_id,
        document_id: documentId,
        initiated_by: profile.id,
        status: 'pending'
      })
      .select()
      .single();

    setLoading(false);

    if (error) {
      console.error('Error creating workflow:', error);
      toast({
        title: "Error",
        description: "Failed to create document workflow",
        variant: "destructive",
      });
      return null;
    }

    return data as DocumentWorkflow;
  };

  // Version Control
  const createDocumentVersion = async (
    documentId: string, 
    fileUrl: string, 
    changesDescription?: string,
    fileSize?: number,
    mimeType?: string
  ): Promise<DocumentVersion | null> => {
    if (!profile?.id) return null;
    
    setLoading(true);
    
    // Get the next version number
    const { data: existingVersions } = await supabase
      .from('document_versions')
      .select('version_number')
      .eq('document_id', documentId)
      .order('version_number', { ascending: false })
      .limit(1);

    const nextVersion = existingVersions && existingVersions.length > 0 
      ? existingVersions[0].version_number + 1 
      : 1;

    const { data, error } = await supabase
      .from('document_versions')
      .insert({
        document_id: documentId,
        version_number: nextVersion,
        file_url: fileUrl,
        file_size: fileSize,
        mime_type: mimeType,
        changes_description: changesDescription,
        created_by: profile.id
      })
      .select()
      .single();

    setLoading(false);

    if (error) {
      console.error('Error creating document version:', error);
      toast({
        title: "Error",
        description: "Failed to create document version",
        variant: "destructive",
      });
      return null;
    }

    toast({
      title: "Success",
      description: "Document version created successfully",
    });

    return data as DocumentVersion;
  };

  const fetchDocumentVersions = async (documentId: string): Promise<DocumentVersion[]> => {
    const { data, error } = await supabase
      .from('document_versions')
      .select('*')
      .eq('document_id', documentId)
      .order('version_number', { ascending: false });

    if (error) {
      console.error('Error fetching document versions:', error);
      return [];
    }

    return (data || []) as DocumentVersion[];
  };

  // Digital Signatures
  const addSignature = async (
    documentId: string,
    signerName: string,
    signatureMethod: 'electronic' | 'digital' | 'wet_signature',
    signatureData?: string,
    signerEmail?: string
  ): Promise<DocumentSignature | null> => {
    setLoading(true);
    
    const { data, error } = await supabase
      .from('document_signatures')
      .insert({
        document_id: documentId,
        signer_id: profile?.id,
        signer_name: signerName,
        signer_email: signerEmail,
        signature_data: signatureData,
        signature_method: signatureMethod,
        ip_address: '', // Would be set by backend
        user_agent: navigator.userAgent
      })
      .select()
      .single();

    setLoading(false);

    if (error) {
      console.error('Error adding signature:', error);
      toast({
        title: "Error",
        description: "Failed to add signature",
        variant: "destructive",
      });
      return null;
    }

    toast({
      title: "Success",
      description: "Signature added successfully",
    });

    return data as DocumentSignature;
  };

  // Compliance Tracking
  const updateCompliance = async (
    documentId: string,
    complianceType: string,
    requirementName: string,
    status: 'compliant' | 'non_compliant' | 'pending_review' | 'expired',
    notes?: string,
    expiryDate?: string
  ): Promise<boolean> => {
    if (!profile?.tenant_id || !profile?.id) return false;
    
    setLoading(true);
    
    const { error } = await supabase
      .from('document_compliance')
      .upsert({
        tenant_id: profile.tenant_id,
        document_id: documentId,
        compliance_type: complianceType,
        requirement_name: requirementName,
        status,
        expiry_date: expiryDate,
        checked_by: profile.id,
        checked_at: new Date().toISOString(),
        notes
      });

    setLoading(false);

    if (error) {
      console.error('Error updating compliance:', error);
      toast({
        title: "Error",
        description: "Failed to update compliance status",
        variant: "destructive",
      });
      return false;
    }

    toast({
      title: "Success",
      description: "Compliance status updated successfully",
    });

    return true;
  };

  const fetchDocumentCompliance = async (documentId: string): Promise<DocumentCompliance[]> => {
    const { data, error } = await supabase
      .from('document_compliance')
      .select('*')
      .eq('document_id', documentId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching document compliance:', error);
      return [];
    }

    return (data || []) as DocumentCompliance[];
  };

  // File Upload
  const uploadDocument = async (
    file: File,
    bucket: 'document-templates' | 'signed-documents' | 'document-versions' = 'document-versions'
  ): Promise<string | null> => {
    setLoading(true);
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${profile?.tenant_id}/${fileName}`;

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file);

    setLoading(false);

    if (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Error",
        description: "Failed to upload document",
        variant: "destructive",
      });
      return null;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  };

  return {
    loading,
    fetchTemplates,
    createTemplate,
    fetchWorkflowStages,
    createWorkflow,
    createDocumentVersion,
    fetchDocumentVersions,
    addSignature,
    updateCompliance,
    fetchDocumentCompliance,
    uploadDocument
  };
};