-- Document Management Enhancement

-- Document Templates
CREATE TABLE IF NOT EXISTS document_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('loan_agreement', 'guarantor_form', 'id_verification', 'income_verification', 'collateral_document', 'other')),
  template_content TEXT, -- HTML content with placeholders
  placeholders JSONB DEFAULT '[]'::jsonb, -- Array of placeholder names
  is_active BOOLEAN NOT NULL DEFAULT true,
  requires_approval BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Document Workflow Stages
CREATE TABLE IF NOT EXISTS document_workflow_stages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name TEXT NOT NULL,
  description TEXT,
  stage_order INTEGER NOT NULL,
  required_role TEXT, -- Role required to approve this stage
  auto_approve BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Document Versions (for version control)
CREATE TABLE IF NOT EXISTS document_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES client_documents(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  changes_description TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(document_id, version_number)
);

-- Document Workflow Instances
CREATE TABLE IF NOT EXISTS document_workflows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  document_id UUID NOT NULL REFERENCES client_documents(id),
  current_stage_id UUID REFERENCES document_workflow_stages(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'approved', 'rejected', 'cancelled')),
  initiated_by UUID REFERENCES profiles(id),
  initiated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Document Approvals
CREATE TABLE IF NOT EXISTS document_approvals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_id UUID NOT NULL REFERENCES document_workflows(id),
  stage_id UUID NOT NULL REFERENCES document_workflow_stages(id),
  approver_id UUID NOT NULL REFERENCES profiles(id),
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
  comments TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Digital Signatures
CREATE TABLE IF NOT EXISTS document_signatures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES client_documents(id),
  signer_id UUID REFERENCES profiles(id),
  signer_name TEXT NOT NULL,
  signer_email TEXT,
  signature_data TEXT, -- Base64 encoded signature or signature hash
  signature_method TEXT NOT NULL CHECK (signature_method IN ('electronic', 'digital', 'wet_signature')),
  ip_address TEXT,
  user_agent TEXT,
  signed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_valid BOOLEAN NOT NULL DEFAULT true,
  verification_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Document Compliance Tracking
CREATE TABLE IF NOT EXISTS document_compliance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  document_id UUID NOT NULL REFERENCES client_documents(id),
  compliance_type TEXT NOT NULL, -- KYC, AML, CBK, etc.
  requirement_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('compliant', 'non_compliant', 'pending_review', 'expired')),
  expiry_date DATE,
  checked_by UUID REFERENCES profiles(id),
  checked_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create storage buckets for document management
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('document-templates', 'document-templates', false),
  ('signed-documents', 'signed-documents', false),
  ('document-versions', 'document-versions', false)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on all new tables
ALTER TABLE document_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_workflow_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_compliance ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can access their tenant's document templates" ON document_templates
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can access their tenant's workflow stages" ON document_workflow_stages
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can access their tenant's document versions" ON document_versions
  FOR ALL USING (document_id IN (SELECT id FROM client_documents WHERE tenant_id IN (SELECT tenant_id FROM profiles WHERE user_id = auth.uid())));

CREATE POLICY "Users can access their tenant's document workflows" ON document_workflows
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can access their tenant's document approvals" ON document_approvals
  FOR ALL USING (workflow_id IN (SELECT id FROM document_workflows WHERE tenant_id IN (SELECT tenant_id FROM profiles WHERE user_id = auth.uid())));

CREATE POLICY "Users can access their tenant's document signatures" ON document_signatures
  FOR ALL USING (document_id IN (SELECT id FROM client_documents WHERE tenant_id IN (SELECT tenant_id FROM profiles WHERE user_id = auth.uid())));

CREATE POLICY "Users can access their tenant's document compliance" ON document_compliance
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE user_id = auth.uid()));

-- Storage policies for document buckets
CREATE POLICY "Users can access their tenant's template files" ON storage.objects
  FOR ALL USING (bucket_id = 'document-templates' AND 
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can access their tenant's signed documents" ON storage.objects
  FOR ALL USING (bucket_id = 'signed-documents' AND 
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can access their tenant's document versions" ON storage.objects
  FOR ALL USING (bucket_id = 'document-versions' AND 
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid()));

-- Add updated_at triggers
CREATE TRIGGER update_document_templates_updated_at
  BEFORE UPDATE ON document_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_document_workflows_updated_at
  BEFORE UPDATE ON document_workflows
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_document_compliance_updated_at
  BEFORE UPDATE ON document_compliance
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();