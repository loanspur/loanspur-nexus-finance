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

  // Enhanced Mifos X Product Constraint Validation
  export interface MifosProductConstraints {
    principal: {
      min: number;
      max: number;
      default: number;
    };
    numberOfRepayments: {
      min: number;
      max: number;
      default: number;
    };
    interestRatePerPeriod: {
      min: number;
      max: number;
      default: number;
    };
    loanTermFrequency: {
      min: number;
      max: number;
      default: number;
    };
    charges: Array<{
      id: number;
      name: string;
      amount: number;
      chargeTimeType: string;
      chargeCalculationType: string;
    }>;
    accountingRule: {
      id: number;
      code: string;
      value: string;
    };
  }

  // Validate loan application against Mifos X product constraints
  export const validateMifosProductConstraints = async (
    mifosConfig: any,
    productMifosId: number,
    loanData: {
      principal: number;
      numberOfRepayments: number;
      interestRatePerPeriod: number;
      loanTermFrequency: number;
    }
  ): Promise<{ valid: boolean; errors: string[]; warnings: string[] }> => {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      const mifosService = createMifosService(mifosConfig);
      
      // Fetch product details from Mifos X
      const product = await mifosService.getLoanProduct(productMifosId);
      
      if (!product) {
        errors.push('Product not found in Mifos X');
        return { valid: false, errors, warnings };
      }

      // Validate principal amount
      if (loanData.principal < product.principal.min) {
        errors.push(`Principal amount (${loanData.principal}) is below minimum (${product.principal.min})`);
      }
      if (loanData.principal > product.principal.max) {
        errors.push(`Principal amount (${loanData.principal}) exceeds maximum (${product.principal.max})`);
      }

      // Validate number of repayments
      if (loanData.numberOfRepayments < product.numberOfRepayments.min) {
        errors.push(`Number of repayments (${loanData.numberOfRepayments}) is below minimum (${product.numberOfRepayments.min})`);
      }
      if (loanData.numberOfRepayments > product.numberOfRepayments.max) {
        errors.push(`Number of repayments (${loanData.numberOfRepayments}) exceeds maximum (${product.numberOfRepayments.max})`);
      }

      // Validate interest rate
      if (loanData.interestRatePerPeriod < product.interestRatePerPeriod.min) {
        errors.push(`Interest rate (${loanData.interestRatePerPeriod}%) is below minimum (${product.interestRatePerPeriod.min}%)`);
      }
      if (loanData.interestRatePerPeriod > product.interestRatePerPeriod.max) {
        errors.push(`Interest rate (${loanData.interestRatePerPeriod}%) exceeds maximum (${product.interestRatePerPeriod.max}%)`);
      }

      // Validate loan term frequency
      if (product.loanTermFrequency && product.loanTermFrequency.min && loanData.loanTermFrequency < product.loanTermFrequency.min) {
        errors.push(`Loan term (${loanData.loanTermFrequency}) is below minimum (${product.loanTermFrequency.min})`);
      }
      if (product.loanTermFrequency && product.loanTermFrequency.max && loanData.loanTermFrequency > product.loanTermFrequency.max) {
        errors.push(`Loan term (${loanData.loanTermFrequency}) exceeds maximum (${product.loanTermFrequency.max})`);
      }

      // Check for warnings (non-blocking issues)
      if (loanData.principal !== product.principal.default) {
        warnings.push(`Principal amount differs from product default (${product.principal.default})`);
      }
      if (loanData.interestRatePerPeriod !== product.interestRatePerPeriod.default) {
        warnings.push(`Interest rate differs from product default (${product.interestRatePerPeriod.default}%)`);
      }

      return {
        valid: errors.length === 0,
        errors,
        warnings
      };

    } catch (error: any) {
      errors.push(`Failed to validate against Mifos X constraints: ${error.message}`);
      return { valid: false, errors, warnings };
    }
  };

  // Sync product constraints from Mifos X to local database
  export const syncMifosProductConstraints = async (
    mifosConfig: any,
    localProductId: string
  ): Promise<{ success: boolean; updatedFields: string[] }> => {
    try {
      const mifosService = createMifosService(mifosConfig);
      
      // Get local product to find Mifos ID
      const { data: localProduct, error: localError } = await supabase
        .from('loan_products')
        .select('mifos_product_id')
        .eq('id', localProductId)
        .single();

      if (localError || !localProduct?.mifos_product_id) {
        throw new Error('Local product not found or no Mifos ID configured');
      }

      // Fetch product from Mifos X
      const mifosProduct = await mifosService.getLoanProduct(localProduct.mifos_product_id);
      
      if (!mifosProduct) {
        throw new Error('Product not found in Mifos X');
      }

      // Update local product with Mifos constraints
      const updateData: any = {
        min_principal: mifosProduct.principal.min,
        max_principal: mifosProduct.principal.max,
        default_principal: mifosProduct.principal.default,
        min_term: mifosProduct.numberOfRepayments.min,
        max_term: mifosProduct.numberOfRepayments.max,
        default_term: mifosProduct.numberOfRepayments.default,
        min_nominal_interest_rate: mifosProduct.interestRatePerPeriod.min,
        max_nominal_interest_rate: mifosProduct.interestRatePerPeriod.max,
        default_nominal_interest_rate: mifosProduct.interestRatePerPeriod.default,
        last_mifos_sync: new Date().toISOString()
      };

      const { error: updateError } = await supabase
        .from('loan_products')
        .update(updateData)
        .eq('id', localProductId);

      if (updateError) {
        throw updateError;
      }

      return {
        success: true,
        updatedFields: Object.keys(updateData)
      };

    } catch (error: any) {
      console.error('Failed to sync Mifos product constraints:', error);
      throw error;
    }
  };

  // Enhanced createMifosLoanApplication with constraint validation
  const createMifosLoanApplicationWithValidation = useMutation({
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

      // Validate against Mifos X constraints first
      const validation = await validateMifosProductConstraints(mifosConfig, data.productMifosId, {
        principal: data.principal,
        numberOfRepayments: data.numberOfRepayments,
        interestRatePerPeriod: data.interestRate,
        loanTermFrequency: data.termFrequency
      });

      if (!validation.valid) {
        throw new Error(`Mifos X validation failed: ${validation.errors.join(', ')}`);
      }

      if (validation.warnings.length > 0) {
        console.warn('Mifos X validation warnings:', validation.warnings);
      }

      // Proceed with existing creation logic
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
        dateFormat: 'yyyy-MM-dd'
      };

      const response = await mifosService.createLoanApplication(loanApplication);
      
      // Update local application with Mifos loan ID
      if (response.resourceId) {
        await supabase
          .from('loan_applications')
          .update({ mifos_loan_id: response.resourceId })
          .eq('id', data.loanApplicationId);
      }

      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loan-applications'] });
      toast({
        title: 'Success',
        description: 'Loan application created in Mifos X with constraint validation',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Mifos Integration Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Approve loan in Mifos
  const approveMifosLoan = useMutation({
    mutationFn: async (data: {
      mifosLoanId: number;
      approvedOnDate: string;
      approvedLoanAmount?: number;
      expectedDisbursementDate?: string;
    }) => {
      if (!mifosConfig) {
        throw new Error('Mifos configuration not available');
      }

      const mifosService = createMifosService(mifosConfig);
      return await mifosService.approveLoan(data.mifosLoanId, {
        approvedOnDate: data.approvedOnDate,
        approvedLoanAmount: data.approvedLoanAmount,
        expectedDisbursementDate: data.expectedDisbursementDate,
        locale: 'en',
        dateFormat: 'yyyy-MM-dd'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      toast({
        title: 'Success',
        description: 'Loan approved in Mifos X',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Mifos Approval Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Disburse loan in Mifos
  const disburseMifosLoan = useMutation({
    mutationFn: async (data: {
      mifosLoanId: number;
      disbursementData: MifosLoanDisbursement;
    }) => {
      if (!mifosConfig) {
        throw new Error('Mifos configuration not available');
      }

      const mifosService = createMifosService(mifosConfig);
      return await mifosService.disburseLoan(data.mifosLoanId, data.disbursementData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      toast({
        title: 'Success',
        description: 'Loan disbursed in Mifos X',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Mifos Disbursement Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Record repayment in Mifos
  const recordMifosRepayment = useMutation({
    mutationFn: async (data: {
      mifosLoanId: number;
      paymentAmount: number;
      paymentDate: string;
      paymentTypeId: number;
      accountNumber?: string;
      checkNumber?: string;
      routingCode?: string;
      receiptNumber?: string;
      bankNumber?: string;
    }) => {
      if (!mifosConfig) {
        throw new Error('Mifos configuration not available');
      }

      const mifosService = createMifosService(mifosConfig);
      return await mifosService.recordRepayment(data.mifosLoanId, {
        transactionAmount: data.paymentAmount,
        transactionDate: data.paymentDate,
        paymentTypeId: data.paymentTypeId,
        accountNumber: data.accountNumber,
        checkNumber: data.checkNumber,
        routingCode: data.routingCode,
        receiptNumber: data.receiptNumber,
        bankNumber: data.bankNumber,
        locale: 'en',
        dateFormat: 'yyyy-MM-dd'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loan-payments'] });
      toast({
        title: 'Success',
        description: 'Repayment recorded in Mifos X',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Mifos Repayment Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Write off loan in Mifos
  const writeOffMifosLoan = useMutation({
    mutationFn: async (data: {
      mifosLoanId: number;
      writeOffReasonId: number;
      writeOffDate: string;
    }) => {
      if (!mifosConfig) {
        throw new Error('Mifos configuration not available');
      }

      const mifosService = createMifosService(mifosConfig);
      return await mifosService.writeOffLoan(data.mifosLoanId, {
        writeOffReasonId: data.writeOffReasonId,
        writeOffDate: data.writeOffDate,
        locale: 'en',
        dateFormat: 'yyyy-MM-dd'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      toast({
        title: 'Success',
        description: 'Loan written off in Mifos X',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Mifos Write-off Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Undo disbursement in Mifos
  const undoMifosDisbursement = useMutation({
    mutationFn: async (data: {
      mifosLoanId: number;
      transactionDate: string;
    }) => {
      if (!mifosConfig) {
        throw new Error('Mifos configuration not available');
      }

      const mifosService = createMifosService(mifosConfig);
      return await mifosService.undoDisbursement(data.mifosLoanId, {
        transactionDate: data.transactionDate,
        locale: 'en',
        dateFormat: 'yyyy-MM-dd'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      toast({
        title: 'Success',
        description: 'Disbursement undone in Mifos X',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Mifos Undo Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Get loan schedule from Mifos
  const getMifosLoanSchedule = useMutation({
    mutationFn: async (mifosLoanId: number) => {
      if (!mifosConfig) {
        throw new Error('Mifos configuration not available');
      }

      const mifosService = createMifosService(mifosConfig);
      return await mifosService.getLoanSchedule(mifosLoanId);
    },
    onError: (error: Error) => {
      toast({
        title: 'Mifos Schedule Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Get loan transactions from Mifos
  const getMifosLoanTransactions = useMutation({
    mutationFn: async (mifosLoanId: number) => {
      if (!mifosConfig) {
        throw new Error('Mifos configuration not available');
      }

      const mifosService = createMifosService(mifosConfig);
      return await mifosService.getLoanTransactions(mifosLoanId);
    },
    onError: (error: Error) => {
      toast({
        title: 'Mifos Transactions Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    mifosConfig,
    isLoadingConfig,
    testConnection,
    createMifosLoanApplication: createMifosLoanApplicationWithValidation,
    approveMifosLoan,
    disburseMifosLoan,
    recordMifosRepayment,
    writeOffMifosLoan,
    undoMifosDisbursement,
    getMifosLoanSchedule,
    getMifosLoanTransactions,
    validateMifosProductConstraints,
    syncMifosProductConstraints,
    isConfigured: !!mifosConfig,
  };
};