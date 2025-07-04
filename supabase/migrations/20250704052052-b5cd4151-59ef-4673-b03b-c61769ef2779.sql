-- Add tenant contact details and billing information
ALTER TABLE tenants 
ADD COLUMN contact_person_name TEXT,
ADD COLUMN contact_person_email TEXT,
ADD COLUMN contact_person_phone TEXT,
ADD COLUMN billing_address JSONB DEFAULT '{}',
ADD COLUMN dns_settings JSONB DEFAULT '{}',
ADD COLUMN mpesa_settings JSONB DEFAULT '{}',
ADD COLUMN addons JSONB DEFAULT '[]',
ADD COLUMN billing_cycle TEXT DEFAULT 'monthly',
ADD COLUMN auto_billing BOOLEAN DEFAULT true,
ADD COLUMN payment_terms INTEGER DEFAULT 30;

-- Create tenant payment methods table
CREATE TABLE tenant_payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    payment_type TEXT NOT NULL, -- 'credit_card', 'bank_transfer', 'mpesa', etc.
    provider TEXT, -- 'stripe', 'paypal', 'mpesa', etc.
    provider_payment_method_id TEXT,
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create tenant subscription history table
CREATE TABLE tenant_subscription_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    pricing_tier TEXT NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ended_at TIMESTAMP WITH TIME ZONE,
    billing_amount DECIMAL(10,2),
    billing_frequency TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create tenant invoices table (enhanced)
ALTER TABLE billing_invoices 
ADD COLUMN line_items JSONB DEFAULT '[]',
ADD COLUMN payment_method_id UUID REFERENCES tenant_payment_methods(id),
ADD COLUMN payment_reference TEXT,
ADD COLUMN payment_provider TEXT,
ADD COLUMN discount_amount DECIMAL(10,2) DEFAULT 0,
ADD COLUMN tax_amount DECIMAL(10,2) DEFAULT 0,
ADD COLUMN invoice_pdf_url TEXT,
ADD COLUMN sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN payment_attempts INTEGER DEFAULT 0,
ADD COLUMN notes TEXT;

-- Create tenant payment history table
CREATE TABLE tenant_payment_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    invoice_id UUID REFERENCES billing_invoices(id) ON DELETE SET NULL,
    payment_method_id UUID REFERENCES tenant_payment_methods(id),
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    payment_provider TEXT,
    provider_transaction_id TEXT,
    payment_status TEXT NOT NULL DEFAULT 'pending',
    payment_type TEXT NOT NULL, -- 'subscription', 'addon', 'penalty', 'refund'
    payment_reference TEXT,
    processing_fee DECIMAL(10,2) DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create tenant domain management table
CREATE TABLE tenant_domains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    domain_name TEXT NOT NULL,
    domain_type TEXT NOT NULL DEFAULT 'custom', -- 'subdomain', 'custom'
    verification_status TEXT DEFAULT 'pending', -- 'pending', 'verified', 'failed'
    verification_token TEXT,
    ssl_status TEXT DEFAULT 'pending', -- 'pending', 'active', 'failed'
    dns_records JSONB DEFAULT '[]',
    is_primary BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    verified_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(tenant_id, domain_name)
);

-- Create tenant addons table
CREATE TABLE tenant_addons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    addon_name TEXT NOT NULL,
    addon_type TEXT NOT NULL, -- 'feature', 'storage', 'users', 'api_calls'
    quantity INTEGER DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    billing_cycle TEXT DEFAULT 'monthly',
    is_active BOOLEAN DEFAULT true,
    activated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    deactivated_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create M-Pesa configuration table
CREATE TABLE tenant_mpesa_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    config_type TEXT NOT NULL, -- 'c2b', 'b2c', 'stk_push'
    consumer_key TEXT,
    consumer_secret TEXT,
    business_short_code TEXT,
    passkey TEXT,
    callback_url TEXT,
    validation_url TEXT,
    confirmation_url TEXT,
    result_url TEXT,
    timeout_url TEXT,
    environment TEXT DEFAULT 'sandbox', -- 'sandbox', 'production'
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(tenant_id, config_type)
);

-- Enable RLS on new tables
ALTER TABLE tenant_payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_subscription_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_payment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_mpesa_config ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for super admins
CREATE POLICY "Super admins can access all tenant payment methods" ON tenant_payment_methods FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'super_admin')
);

CREATE POLICY "Super admins can access all tenant subscription history" ON tenant_subscription_history FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'super_admin')
);

CREATE POLICY "Super admins can access all tenant payment history" ON tenant_payment_history FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'super_admin')
);

CREATE POLICY "Super admins can access all tenant domains" ON tenant_domains FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'super_admin')
);

CREATE POLICY "Super admins can access all tenant addons" ON tenant_addons FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'super_admin')
);

CREATE POLICY "Super admins can access all tenant mpesa config" ON tenant_mpesa_config FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'super_admin')
);

-- Create triggers for updated_at columns
CREATE TRIGGER update_tenant_payment_methods_updated_at
    BEFORE UPDATE ON tenant_payment_methods
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenant_domains_updated_at
    BEFORE UPDATE ON tenant_domains
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenant_addons_updated_at
    BEFORE UPDATE ON tenant_addons
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenant_mpesa_config_updated_at
    BEFORE UPDATE ON tenant_mpesa_config
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_tenant_payment_methods_tenant_id ON tenant_payment_methods(tenant_id);
CREATE INDEX idx_tenant_subscription_history_tenant_id ON tenant_subscription_history(tenant_id);
CREATE INDEX idx_tenant_payment_history_tenant_id ON tenant_payment_history(tenant_id);
CREATE INDEX idx_tenant_payment_history_invoice_id ON tenant_payment_history(invoice_id);
CREATE INDEX idx_tenant_domains_tenant_id ON tenant_domains(tenant_id);
CREATE INDEX idx_tenant_domains_domain_name ON tenant_domains(domain_name);
CREATE INDEX idx_tenant_addons_tenant_id ON tenant_addons(tenant_id);
CREATE INDEX idx_tenant_mpesa_config_tenant_id ON tenant_mpesa_config(tenant_id);