import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { createMifosService, getMifosConfigFromTenant } from '@/services/mifosService';
import { useToast } from '@/hooks/use-toast';
import { MifosLoanApplication, MifosLoanDisbursement } from '@/types/mifos';

export const useMifosIntegration = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get tenant Mifos configuration
  const { data: mifosConfig, isLoading: isLoadingConfig } = useQuery({
    queryKey: ['mifos-config', profile?.tenant_id],
    queryFn: async () => {
      if (!profile?.tenant_id) return null;
      
      const { data: tenant, error } = await supabase
        .from('tenants')
        .select('mifos_base_url, mifos_tenant_identifier, mifos_username, mifos_password')
        .eq('id', profile.tenant_id)
        .single();

      if (error || !tenant) {
        throw new Error('Failed to fetch tenant configuration');
      }

      return getMifosConfigFromTenant(tenant);
    },
    enabled: !!profile?.tenant_id,
  });

  // Test Mifos connection
  const testConnection = useMutation({
    mutationFn: async () => {
      if (!mifosConfig) {
        throw new Error('Mifos configuration not available');
      }

      const mifosService = createMifosService(mifosConfig);
      const isValid = await mifosService.validateConnection();
      
      if (!isValid) {
        throw new Error('Failed to connect to Mifos X');
      }

      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Mifos X connection validated successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Connection Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Create loan application in Mifos
  const createMifosLoanApplication = useMutation({
    mutationFn: async (data: {
      loanApplicationId: string;
      clientMifosId: number;
      productMifosId: number;
      principal: number;
      termFrequency: number;
      numberOfRepayments: number;
      interestRate: number;
      expectedDisbursementDate: string;
    }) => {
      if (!mifosConfig) {
        throw new Error('Mifos configuration not available');
      }

      const mifosService = createMifosService(mifosConfig);

      const loanApplication: MifosLoanApplication = {
        externalId: data.loanApplicationId,
        clientId: data.clientMifosId,
        productId: data.productMifosId,
        principal: data.principal,
        loanTermFrequency: data.termFrequency,
        loanTermFrequencyType: 2, // Months
        numberOfRepayments: data.numberOfRepayments,
        repaymentEvery: 1,
        repaymentFrequencyType: 2, // Monthly
        interestRatePerPeriod: data.interestRate,
        amortizationType: 1, // Equal principal payments
        interestType: 0, // Declining balance
        interestCalculationPeriodType: 1, // Daily
        transactionProcessingStrategyId: 1, // Principal Interest Penalties Fees Order
        expectedDisbursementDate: data.expectedDisbursementDate,
        submittedOnDate: new Date().toISOString().split('T')[0],
        locale: 'en',
        dateFormat: 'yyyy-MM-dd',
      };

      return mifosService.createLoanApplication(loanApplication);
    },
    onSuccess: async (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['loan-applications'] });
      
      // Update local loan record with Mifos loan ID
      if (result.loanId) {
        // Check if a loan record exists for this application
        const { data: existingLoan } = await supabase
          .from('loans')
          .select('id')
          .eq('application_id', variables.loanApplicationId)
          .single();

        if (existingLoan) {
          await supabase
            .from('loans')
            .update({ mifos_loan_id: result.loanId })
            .eq('application_id', variables.loanApplicationId);
        }
        
        queryClient.invalidateQueries({ queryKey: ['loans'] });
      }
    },
  });

  // Approve loan in Mifos
  const approveMifosLoan = useMutation({
    mutationFn: async (data: {
      mifosLoanId: number;
      approvedAmount?: number;
      approvalDate: string;
      expectedDisbursementDate: string;
    }) => {
      if (!mifosConfig) {
        throw new Error('Mifos configuration not available');
      }

      const mifosService = createMifosService(mifosConfig);

      return mifosService.approveLoan(data.mifosLoanId, {
        approvedOnDate: data.approvalDate,
        approvedLoanAmount: data.approvedAmount,
        expectedDisbursementDate: data.expectedDisbursementDate,
        locale: 'en',
        dateFormat: 'yyyy-MM-dd',
      });
    },
  });

  // Disburse loan in Mifos
  const disburseMifosLoan = useMutation({
    mutationFn: async (data: {
      mifosLoanId: number;
      disbursementAmount: number;
      disbursementDate: string;
      paymentTypeId?: number;
      accountNumber?: string;
      note?: string;
    }) => {
      if (!mifosConfig) {
        throw new Error('Mifos configuration not available');
      }

      const mifosService = createMifosService(mifosConfig);

      const disbursementData: MifosLoanDisbursement = {
        transactionDate: data.disbursementDate,
        transactionAmount: data.disbursementAmount,
        paymentTypeId: data.paymentTypeId,
        accountNumber: data.accountNumber,
        locale: 'en',
        dateFormat: 'yyyy-MM-dd',
        note: data.note,
      };

      return mifosService.disburseLoan(data.mifosLoanId, disbursementData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      queryClient.invalidateQueries({ queryKey: ['loan-applications'] });
      
      toast({
        title: 'Success',
        description: 'Loan disbursed successfully in Mifos X',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Disbursement Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Get Mifos loan details
  const getMifosLoan = (mifosLoanId: number) => useQuery({
    queryKey: ['mifos-loan', mifosLoanId],
    queryFn: async () => {
      if (!mifosConfig) {
        throw new Error('Mifos configuration not available');
      }

      const mifosService = createMifosService(mifosConfig);
      return mifosService.getLoan(mifosLoanId);
    },
    enabled: !!mifosConfig && !!mifosLoanId,
  });

  return {
    mifosConfig,
    isLoadingConfig,
    testConnection,
    createMifosLoanApplication,
    approveMifosLoan,
    disburseMifosLoan,
    getMifosLoan,
    isConfigured: !!mifosConfig,
  };
};