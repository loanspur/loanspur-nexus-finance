import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { harmonizeLoanCalculations, HarmonizedLoanCalculation } from '@/lib/loan-calculation-harmonizer';
import { useToast } from './use-toast';

/**
 * Hook to get harmonized loan calculation data
 * Ensures consistency across all loan display components
 */
export function useHarmonizedLoanData(loan: any) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const harmonizedData = useQuery({
    queryKey: ['harmonized-loan-data', loan?.id],
    queryFn: async (): Promise<HarmonizedLoanCalculation> => {
      if (!loan?.id) throw new Error('No loan data provided');
      
      return await harmonizeLoanCalculations(loan);
    },
    enabled: !!loan?.id,
    staleTime: 5 * 60 * 1000, // Consider fresh for 5 minutes
    refetchOnWindowFocus: false,
  });

  const refreshHarmonization = useMutation({
    mutationFn: async () => {
      if (!loan?.id) throw new Error('No loan data provided');
      
      return await harmonizeLoanCalculations(loan);
    },
    onSuccess: (data) => {
      // Update the query cache
      queryClient.setQueryData(['harmonized-loan-data', loan?.id], data);
      
      // Invalidate related queries to refresh UI
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      queryClient.invalidateQueries({ queryKey: ['loan-schedule'] });
      queryClient.invalidateQueries({ queryKey: ['loan-payments'] });
      
      toast({
        title: "Loan Data Harmonized",
        description: "Interest rates and balances have been synchronized",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Harmonization Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    harmonizedData: harmonizedData.data,
    isLoading: harmonizedData.isLoading,
    error: harmonizedData.error,
    refreshHarmonization: refreshHarmonization.mutate,
    isRefreshing: refreshHarmonization.isPending,
  };
}

/**
 * Hook to get corrected loan display values
 * Returns properly formatted values for display in UI components
 */
export function useLoanDisplayData(loan: any) {
  const { harmonizedData } = useHarmonizedLoanData(loan);

  if (!loan) {
    return {
      displayOutstanding: 0,
      displayInterestRate: 0,
      displayStatus: 'unknown',
      daysInArrears: 0,
      isDataConsistent: false
    };
  }

  const displayOutstanding = harmonizedData?.calculatedOutstanding ?? Number(loan.outstanding_balance || 0);
  const displayInterestRate = harmonizedData?.correctedInterestRate ?? Number(loan.interest_rate || 0);
  
  // Determine display status
  let displayStatus = loan.status || 'active';
  if (harmonizedData?.daysInArrears && harmonizedData.daysInArrears > 0) {
    displayStatus = 'in_arrears';
  } else if (displayOutstanding <= 0 && loan.status !== 'closed') {
    displayStatus = 'fully_paid';
  }

  return {
    displayOutstanding,
    displayInterestRate,
    displayStatus,
    daysInArrears: harmonizedData?.daysInArrears ?? 0,
    isDataConsistent: harmonizedData?.scheduleConsistent ?? false,
    totalScheduledAmount: harmonizedData?.totalScheduledAmount ?? 0,
    totalPaidAmount: harmonizedData?.totalPaidAmount ?? 0,
  };
}