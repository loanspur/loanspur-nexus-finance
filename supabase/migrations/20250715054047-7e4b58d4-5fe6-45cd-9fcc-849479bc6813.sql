-- Create system code categories table
CREATE TABLE public.system_code_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  code_name TEXT NOT NULL, -- unique identifier for the category (e.g., 'LOAN_PURPOSE', 'COLLATERAL_TYPE')
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_system_defined BOOLEAN NOT NULL DEFAULT false, -- true for system-defined categories that can't be deleted
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, code_name)
);

-- Create system code values table
CREATE TABLE public.system_code_values (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.system_code_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  code_value TEXT NOT NULL, -- unique identifier for the value within the category
  position INTEGER DEFAULT 0, -- for ordering
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_system_defined BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, category_id, code_value)
);

-- Enable RLS
ALTER TABLE public.system_code_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_code_values ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can access their tenant's system code categories" 
ON public.system_code_categories 
FOR ALL 
USING (tenant_id IN (
  SELECT tenant_id FROM public.profiles WHERE user_id = auth.uid()
));

CREATE POLICY "Users can access their tenant's system code values" 
ON public.system_code_values 
FOR ALL 
USING (tenant_id IN (
  SELECT tenant_id FROM public.profiles WHERE user_id = auth.uid()
));

-- Add triggers for updated_at
CREATE TRIGGER update_system_code_categories_updated_at
  BEFORE UPDATE ON public.system_code_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_system_code_values_updated_at
  BEFORE UPDATE ON public.system_code_values
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default system code categories for all tenants
INSERT INTO public.system_code_categories (tenant_id, name, description, code_name, is_system_defined) 
SELECT 
  t.id,
  category.name,
  category.description,
  category.code_name,
  true
FROM public.tenants t
CROSS JOIN (
  VALUES 
    ('Loan Purposes', 'Categories for loan application purposes', 'LOAN_PURPOSE'),
    ('Collateral Types', 'Types of collateral that can be used for loans', 'COLLATERAL_TYPE'),
    ('Client Classifications', 'Classification categories for clients', 'CLIENT_CLASSIFICATION'),
    ('Education Levels', 'Educational qualification levels', 'EDUCATION_LEVEL'),
    ('Employment Sectors', 'Sectors of employment', 'EMPLOYMENT_SECTOR'),
    ('Marital Status', 'Marital status options', 'MARITAL_STATUS'),
    ('Gender', 'Gender options', 'GENDER'),
    ('Business Types', 'Types of business activities', 'BUSINESS_TYPE'),
    ('Income Sources', 'Sources of income', 'INCOME_SOURCE'),
    ('Relationship Types', 'Types of relationships (for next of kin)', 'RELATIONSHIP_TYPE'),
    ('Document Types', 'Types of documents', 'DOCUMENT_TYPE'),
    ('Payment Frequencies', 'Loan payment frequency options', 'PAYMENT_FREQUENCY'),
    ('Loan Statuses', 'Loan application and account statuses', 'LOAN_STATUS'),
    ('Currency Codes', 'Supported currency codes', 'CURRENCY_CODE')
) AS category(name, description, code_name);

-- Insert default values for some categories
DO $$
DECLARE
  tenant_record RECORD;
  category_record RECORD;
BEGIN
  FOR tenant_record IN SELECT id FROM public.tenants LOOP
    -- Loan Purposes
    SELECT id INTO category_record FROM public.system_code_categories 
    WHERE tenant_id = tenant_record.id AND code_name = 'LOAN_PURPOSE';
    
    IF FOUND THEN
      INSERT INTO public.system_code_values (tenant_id, category_id, name, description, code_value, position, is_system_defined)
      VALUES 
        (tenant_record.id, category_record.id, 'Business Expansion', 'Expand existing business operations', 'BUSINESS_EXPANSION', 1, true),
        (tenant_record.id, category_record.id, 'Working Capital', 'Finance day-to-day business operations', 'WORKING_CAPITAL', 2, true),
        (tenant_record.id, category_record.id, 'Equipment Purchase', 'Purchase business equipment or machinery', 'EQUIPMENT_PURCHASE', 3, true),
        (tenant_record.id, category_record.id, 'Education/School Fees', 'Pay for education expenses', 'EDUCATION', 4, true),
        (tenant_record.id, category_record.id, 'Emergency', 'Emergency financial needs', 'EMERGENCY', 5, true);
    END IF;

    -- Collateral Types
    SELECT id INTO category_record FROM public.system_code_categories 
    WHERE tenant_id = tenant_record.id AND code_name = 'COLLATERAL_TYPE';
    
    IF FOUND THEN
      INSERT INTO public.system_code_values (tenant_id, category_id, name, description, code_value, position, is_system_defined)
      VALUES 
        (tenant_record.id, category_record.id, 'Real Estate/Property', 'Land, buildings, or other real estate', 'REAL_ESTATE', 1, true),
        (tenant_record.id, category_record.id, 'Motor Vehicle', 'Cars, trucks, motorcycles', 'MOTOR_VEHICLE', 2, true),
        (tenant_record.id, category_record.id, 'Machinery & Equipment', 'Business machinery and equipment', 'MACHINERY', 3, true),
        (tenant_record.id, category_record.id, 'Personal Guarantor', 'Individual guarantee', 'PERSONAL_GUARANTOR', 4, true);
    END IF;

    -- Gender
    SELECT id INTO category_record FROM public.system_code_categories 
    WHERE tenant_id = tenant_record.id AND code_name = 'GENDER';
    
    IF FOUND THEN
      INSERT INTO public.system_code_values (tenant_id, category_id, name, description, code_value, position, is_system_defined)
      VALUES 
        (tenant_record.id, category_record.id, 'Male', 'Male gender', 'MALE', 1, true),
        (tenant_record.id, category_record.id, 'Female', 'Female gender', 'FEMALE', 2, true),
        (tenant_record.id, category_record.id, 'Other', 'Other gender', 'OTHER', 3, true);
    END IF;

    -- Marital Status
    SELECT id INTO category_record FROM public.system_code_categories 
    WHERE tenant_id = tenant_record.id AND code_name = 'MARITAL_STATUS';
    
    IF FOUND THEN
      INSERT INTO public.system_code_values (tenant_id, category_id, name, description, code_value, position, is_system_defined)
      VALUES 
        (tenant_record.id, category_record.id, 'Single', 'Single/Unmarried', 'SINGLE', 1, true),
        (tenant_record.id, category_record.id, 'Married', 'Married', 'MARRIED', 2, true),
        (tenant_record.id, category_record.id, 'Divorced', 'Divorced', 'DIVORCED', 3, true),
        (tenant_record.id, category_record.id, 'Widowed', 'Widowed', 'WIDOWED', 4, true);
    END IF;
  END LOOP;
END $$;