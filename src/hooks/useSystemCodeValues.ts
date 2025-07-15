import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useSystemCodeValues = (categoryCodeName: string) => {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['system-code-values', profile?.tenant_id, categoryCodeName],
    queryFn: async () => {
      if (!profile?.tenant_id || !categoryCodeName) return [];
      
      // First, get the category by code name
      const { data: category, error: categoryError } = await supabase
        .from('system_code_categories')
        .select('id')
        .eq('tenant_id', profile.tenant_id)
        .eq('code_name', categoryCodeName)
        .eq('is_active', true)
        .single();
      
      if (categoryError || !category) {
        console.error(`${categoryCodeName} category not found:`, categoryError);
        return [];
      }
      
      // Then get the values for this category
      const { data, error } = await supabase
        .from('system_code_values')
        .select('*')
        .eq('tenant_id', profile.tenant_id)
        .eq('category_id', category.id)
        .eq('is_active', true)
        .order('position', { ascending: true })
        .order('name', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.tenant_id && !!categoryCodeName,
  });
};

// Convenience hooks for specific system codes
export const useGenderOptions = () => useSystemCodeValues('GENDER');
export const useMaritalStatusOptions = () => useSystemCodeValues('MARITAL_STATUS');
export const useEmploymentSectorOptions = () => useSystemCodeValues('EMPLOYMENT_SECTOR');
export const useEducationLevelOptions = () => useSystemCodeValues('EDUCATION_LEVEL');
export const useDocumentTypeOptions = () => useSystemCodeValues('DOCUMENT_TYPE');
export const useRelationshipTypeOptions = () => useSystemCodeValues('RELATIONSHIP_TYPE');
export const useBusinessTypeOptions = () => useSystemCodeValues('BUSINESS_TYPE');
export const useClientClassificationOptions = () => useSystemCodeValues('CLIENT_CLASSIFICATION');
export const useIncomeSourceOptions = () => useSystemCodeValues('INCOME_SOURCE');
export const useCurrencyCodeOptions = () => useSystemCodeValues('CURRENCY_CODE');
export const usePaymentFrequencyOptions = () => useSystemCodeValues('PAYMENT_FREQUENCY');
export const useLoanStatusOptions = () => useSystemCodeValues('LOAN_STATUS');