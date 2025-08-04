import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface LoanOfficer {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  office_id: string;
  office_name: string;
  role_in_office: string;
}

export const useLoanOfficers = (officeId?: string) => {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['loan-officers', profile?.tenant_id, officeId],
    queryFn: async () => {
      if (!profile?.tenant_id) return [];

      let query = supabase
        .from('office_staff')
        .select(`
          staff_id,
          office_id,
          role_in_office,
          is_active,
          staff:profiles!office_staff_staff_id_fkey(id, first_name, last_name, email),
          office:offices!office_staff_office_id_fkey(office_name)
        `)
        .eq('role_in_office', 'loan_officer')
        .eq('is_active', true);

      if (officeId) {
        query = query.eq('office_id', officeId);
      }

      const { data, error } = await query.order('staff(first_name)', { ascending: true });

      if (error) throw error;
      
      return (data || []).map(item => ({
        id: item.staff_id,
        first_name: item.staff?.first_name,
        last_name: item.staff?.last_name,
        email: item.staff?.email,
        office_id: item.office_id,
        office_name: item.office?.office_name || '',
        role_in_office: item.role_in_office
      })) as LoanOfficer[];
    },
    enabled: !!profile?.tenant_id,
  });
};