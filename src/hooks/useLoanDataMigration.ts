import { useMutation, useQuery } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { LoanDataMigrationService } from '@/services/loanDataMigration';

export const useLoanDataMigration = () => {
  const { profile } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      if (!profile?.tenant_id) {
        throw new Error('No tenant ID available for migration');
      }

      console.log('Starting loan data migration for tenant:', profile.tenant_id);
      
      const result = await LoanDataMigrationService.syncExistingLoans(profile.tenant_id);
      
      console.log('Migration completed:', result);
      return result;
    },
    onSuccess: (result) => {
      const { migrated, errors, summary } = result;
      
      if (errors.length > 0) {
        console.warn('Migration completed with errors:', errors);
        toast({
          title: "Migration Completed with Warnings",
          description: `${migrated} loans migrated successfully. ${errors.length} errors occurred. Check console for details.`,
          variant: "default",
        });
      } else {
        toast({
          title: "Migration Successful",
          description: `Successfully migrated ${migrated} loans. Processed ${summary.loansProcessed} loans, ${summary.paymentsProcessed} payments, ${summary.schedulesSynced} schedules, and created ${summary.journalEntriesCreated} journal entries.`,
        });
      }
    },
    onError: (error: any) => {
      console.error('Migration failed:', error);
      toast({
        title: "Migration Failed",
        description: error.message || "Failed to migrate loan data",
        variant: "destructive",
      });
    },
  });
};

export const useLoanMigrationValidation = () => {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['loan-migration-validation', profile?.tenant_id],
    queryFn: async () => {
      if (!profile?.tenant_id) {
        throw new Error('No tenant ID available for validation');
      }

      return await LoanDataMigrationService.validateMigration(profile.tenant_id);
    },
    enabled: !!profile?.tenant_id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};