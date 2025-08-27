/**
 * Unified Database Hook
 * 
 * This hook provides React components with access to the unified database layer.
 * It includes caching, error handling, and loading states for database operations.
 */

import { useState, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  db, 
  loanDb, 
  clientDb, 
  userDb, 
  transactionDb, 
  DatabaseUtils,
  type DatabaseResult,
  type PaginationParams,
  type FilterParams,
  type SortParams 
} from '@/lib/database';
import { useToast } from './use-toast';

// Cache configuration
const CACHE_TIME = 5 * 60 * 1000; // 5 minutes
const STALE_TIME = 2 * 60 * 1000; // 2 minutes

export const useDatabase = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Generic database operations
  const executeQuery = useCallback(async <T>(
    queryFn: () => Promise<DatabaseResult<T>>,
    options?: {
      showError?: boolean;
      errorMessage?: string;
    }
  ): Promise<DatabaseResult<T>> => {
    try {
      const result = await queryFn();
      
      if (!result.success && options?.showError !== false) {
        const message = options?.errorMessage || DatabaseUtils.createErrorMessage(result.error);
        toast({
          title: "Database Error",
          description: message,
          variant: "destructive",
        });
      }
      
      return result;
    } catch (error) {
      const errorResult: DatabaseResult<T> = {
        data: null,
        error,
        success: false,
      };
      
      if (options?.showError !== false) {
        toast({
          title: "Database Error",
          description: DatabaseUtils.createErrorMessage(error),
          variant: "destructive",
        });
      }
      
      return errorResult;
    }
  }, [toast]);

  // Generic select hook
  const useSelect = <T>(
    queryKey: string[],
    table: string,
    options?: {
      columns?: string;
      filter?: FilterParams;
      sort?: SortParams;
      pagination?: PaginationParams;
      enabled?: boolean;
      showError?: boolean;
    }
  ) => {
    return useQuery({
      queryKey,
      queryFn: async () => {
        const result = await db.select<T>(table, {
          columns: options?.columns,
          filter: options?.filter,
          sort: options?.sort,
          pagination: options?.pagination,
        });
        
        if (!result.success && options?.showError !== false) {
          toast({
            title: "Database Error",
            description: DatabaseUtils.createErrorMessage(result.error),
            variant: "destructive",
          });
        }
        
        return result;
      },
      enabled: options?.enabled ?? true,
      staleTime: STALE_TIME,
      gcTime: CACHE_TIME,
    });
  };

  // Generic select one hook
  const useSelectOne = <T>(
    queryKey: string[],
    table: string,
    filter: FilterParams,
    options?: {
      columns?: string;
      enabled?: boolean;
      showError?: boolean;
    }
  ) => {
    return useQuery({
      queryKey,
      queryFn: async () => {
        const result = await db.selectOne<T>(table, filter, {
          columns: options?.columns,
        });
        
        if (!result.success && options?.showError !== false) {
          toast({
            title: "Database Error",
            description: DatabaseUtils.createErrorMessage(result.error),
            variant: "destructive",
          });
        }
        
        return result;
      },
      enabled: options?.enabled ?? true,
      staleTime: STALE_TIME,
      gcTime: CACHE_TIME,
    });
  };

  // Generic insert mutation
  const useInsert = <T>(
    table: string,
    options?: {
      onSuccess?: (data: T) => void;
      onError?: (error: any) => void;
      invalidateQueries?: string[][];
    }
  ) => {
    return useMutation({
      mutationFn: async (data: Partial<T>) => {
        return await executeQuery(
          () => db.insert<T>(table, data, { returning: '*' }),
          { showError: true }
        );
      },
      onSuccess: (result, variables) => {
        if (result.success && result.data) {
          toast({
            title: "Success",
            description: "Record created successfully",
          });
          
          options?.onSuccess?.(result.data);
          
          // Invalidate related queries
          if (options?.invalidateQueries) {
            options.invalidateQueries.forEach(queryKey => {
              queryClient.invalidateQueries({ queryKey });
            });
          }
        }
      },
      onError: (error) => {
        options?.onError?.(error);
      },
    });
  };

  // Generic update mutation
  const useUpdate = <T>(
    table: string,
    options?: {
      onSuccess?: (data: T) => void;
      onError?: (error: any) => void;
      invalidateQueries?: string[][];
    }
  ) => {
    return useMutation({
      mutationFn: async ({ data, filter }: { data: Partial<T>; filter: FilterParams }) => {
        return await executeQuery(
          () => db.update<T>(table, data, filter, { returning: '*' }),
          { showError: true }
        );
      },
      onSuccess: (result, variables) => {
        if (result.success && result.data) {
          toast({
            title: "Success",
            description: "Record updated successfully",
          });
          
          options?.onSuccess?.(result.data);
          
          // Invalidate related queries
          if (options?.invalidateQueries) {
            options.invalidateQueries.forEach(queryKey => {
              queryClient.invalidateQueries({ queryKey });
            });
          }
        }
      },
      onError: (error) => {
        options?.onError?.(error);
      },
    });
  };

  // Generic delete mutation
  const useDelete = <T>(
    table: string,
    options?: {
      onSuccess?: (data: T) => void;
      onError?: (error: any) => void;
      invalidateQueries?: string[][];
    }
  ) => {
    return useMutation({
      mutationFn: async (filter: FilterParams) => {
        return await executeQuery(
          () => db.delete<T>(table, filter, { returning: '*' }),
          { showError: true }
        );
      },
      onSuccess: (result, variables) => {
        if (result.success && result.data) {
          toast({
            title: "Success",
            description: "Record deleted successfully",
          });
          
          options?.onSuccess?.(result.data);
          
          // Invalidate related queries
          if (options?.invalidateQueries) {
            options.invalidateQueries.forEach(queryKey => {
              queryClient.invalidateQueries({ queryKey });
            });
          }
        }
      },
      onError: (error) => {
        options?.onError?.(error);
      },
    });
  };

  // Count hook
  const useCount = (
    queryKey: string[],
    table: string,
    filter?: FilterParams,
    options?: {
      enabled?: boolean;
      showError?: boolean;
    }
  ) => {
    return useQuery({
      queryKey,
      queryFn: async () => {
        const result = await db.count(table, filter);
        
        if (!result.success && options?.showError !== false) {
          toast({
            title: "Database Error",
            description: DatabaseUtils.createErrorMessage(result.error),
            variant: "destructive",
          });
        }
        
        return result;
      },
      enabled: options?.enabled ?? true,
      staleTime: STALE_TIME,
      gcTime: CACHE_TIME,
    });
  };

  return {
    // Generic operations
    executeQuery,
    useSelect,
    useSelectOne,
    useInsert,
    useUpdate,
    useDelete,
    useCount,
    
    // Direct database access
    db,
    loanDb,
    clientDb,
    userDb,
    transactionDb,
    
    // Utilities
    DatabaseUtils,
    
    // Query client for manual cache management
    queryClient,
  };
};

// Specialized hooks for common operations
export const useLoanDatabase = () => {
  const { useSelect, useSelectOne, useInsert, useUpdate, useDelete, useCount, queryClient, toast } = useDatabase();

  // Get loans by tenant
  const useLoansByTenant = (tenantId: string, options?: {
    status?: string;
    pagination?: PaginationParams;
    sort?: SortParams;
    enabled?: boolean;
  }) => {
    const filter: FilterParams = { tenant_id: tenantId };
    if (options?.status) {
      filter.status = options.status;
    }

    return useSelect(
      ['loans', 'tenant', tenantId, options?.status, options?.pagination, options?.sort],
      'loans',
      {
        columns: '*, clients(*), loan_products(*)',
        filter,
        sort: options?.sort,
        pagination: options?.pagination,
        enabled: options?.enabled,
      }
    );
  };

  // Get loan by ID
  const useLoanById = (loanId: string, enabled: boolean = true) => {
    return useSelectOne(
      ['loan', loanId],
      'loans',
      { id: loanId },
      {
        columns: '*, clients(*), loan_products(*), loan_schedules(*), loan_payments(*)',
        enabled,
      }
    );
  };

  // Get loans by client
  const useLoansByClient = (clientId: string, enabled: boolean = true) => {
    return useSelect(
      ['loans', 'client', clientId],
      'loans',
      {
        columns: '*, loan_products(*)',
        filter: { client_id: clientId },
        sort: { column: 'created_at', ascending: false },
        enabled,
      }
    );
  };

  // Insert loan
  const useInsertLoan = () => {
    return useInsert('loans', {
      invalidateQueries: [
        ['loans'],
        ['unified-all-loans'],
        ['unified-loan-applications'],
      ],
    });
  };

  // Update loan
  const useUpdateLoan = () => {
    return useUpdate('loans', {
      invalidateQueries: [
        ['loans'],
        ['unified-all-loans'],
        ['unified-loan-applications'],
      ],
    });
  };

  // Delete loan
  const useDeleteLoan = () => {
    return useDelete('loans', {
      invalidateQueries: [
        ['loans'],
        ['unified-all-loans'],
        ['unified-loan-applications'],
      ],
    });
  };

  // Get loan schedules
  const useLoanSchedules = (loanId: string, enabled: boolean = true) => {
    return useSelect(
      ['loan-schedules', loanId],
      'loan_schedules',
      {
        filter: { loan_id: loanId },
        sort: { column: 'installment_number', ascending: true },
        enabled,
      }
    );
  };

  // Get loan payments
  const useLoanPayments = (loanId: string, enabled: boolean = true) => {
    return useSelect(
      ['loan-payments', loanId],
      'loan_payments',
      {
        filter: { loan_id: loanId },
        sort: { column: 'payment_date', ascending: true },
        enabled,
      }
    );
  };

  return {
    useLoansByTenant,
    useLoanById,
    useLoansByClient,
    useInsertLoan,
    useUpdateLoan,
    useDeleteLoan,
    useLoanSchedules,
    useLoanPayments,
  };
};

export const useClientDatabase = () => {
  const { useSelect, useSelectOne, useInsert, useUpdate, useDelete, useCount, queryClient, toast } = useDatabase();

  // Get clients by tenant
  const useClientsByTenant = (tenantId: string, options?: {
    active?: boolean;
    pagination?: PaginationParams;
    sort?: SortParams;
    enabled?: boolean;
  }) => {
    const filter: FilterParams = { tenant_id: tenantId };
    if (options?.active !== undefined) {
      filter.is_active = options.active;
    }

    return useSelect(
      ['clients', 'tenant', tenantId, options?.active, options?.pagination, options?.sort],
      'clients',
      {
        filter,
        sort: options?.sort || { column: 'created_at', ascending: false },
        pagination: options?.pagination,
        enabled: options?.enabled,
      }
    );
  };

  // Get client by ID
  const useClientById = (clientId: string, enabled: boolean = true) => {
    return useSelectOne(
      ['client', clientId],
      'clients',
      { id: clientId },
      {
        columns: '*, loans(*), savings_accounts(*)',
        enabled,
      }
    );
  };

  // Insert client
  const useInsertClient = () => {
    return useInsert('clients', {
      invalidateQueries: [
        ['clients'],
        ['unified-all-loans'],
      ],
    });
  };

  // Update client
  const useUpdateClient = () => {
    return useUpdate('clients', {
      invalidateQueries: [
        ['clients'],
        ['unified-all-loans'],
      ],
    });
  };

  // Delete client
  const useDeleteClient = () => {
    return useDelete('clients', {
      invalidateQueries: [
        ['clients'],
        ['unified-all-loans'],
      ],
    });
  };

  return {
    useClientsByTenant,
    useClientById,
    useInsertClient,
    useUpdateClient,
    useDeleteClient,
  };
};

export const useUserDatabase = () => {
  const { useSelect, useSelectOne, useInsert, useUpdate, useDelete, queryClient, toast } = useDatabase();

  // Get user profile
  const useUserProfile = (userId: string, enabled: boolean = true) => {
    return useSelectOne(
      ['user-profile', userId],
      'profiles',
      { user_id: userId },
      { enabled }
    );
  };

  // Get users by tenant
  const useUsersByTenant = (tenantId: string, enabled: boolean = true) => {
    return useSelect(
      ['users', 'tenant', tenantId],
      'profiles',
      {
        filter: { tenant_id: tenantId },
        sort: { column: 'created_at', ascending: false },
        enabled,
      }
    );
  };

  // Update user profile
  const useUpdateUserProfile = () => {
    return useUpdate('profiles', {
      invalidateQueries: [
        ['user-profile'],
        ['users'],
      ],
    });
  };

  return {
    useUserProfile,
    useUsersByTenant,
    useUpdateUserProfile,
  };
};

export const useTransactionDatabase = () => {
  const { useSelect, useInsert, useUpdate, useDelete, queryClient, toast } = useDatabase();

  // Get transactions by loan
  const useTransactionsByLoan = (loanId: string, enabled: boolean = true) => {
    return useSelect(
      ['transactions', 'loan', loanId],
      'transactions',
      {
        filter: { loan_id: loanId },
        sort: { column: 'transaction_date', ascending: false },
        enabled,
      }
    );
  };

  // Get transactions by tenant
  const useTransactionsByTenant = (tenantId: string, options?: {
    type?: string;
    dateFrom?: string;
    dateTo?: string;
    pagination?: PaginationParams;
    enabled?: boolean;
  }) => {
    const filter: FilterParams = { tenant_id: tenantId };
    if (options?.type) {
      filter.transaction_type = options.type;
    }

    return useSelect(
      ['transactions', 'tenant', tenantId, options?.type, options?.dateFrom, options?.dateTo, options?.pagination],
      'transactions',
      {
        filter,
        sort: { column: 'transaction_date', ascending: false },
        pagination: options?.pagination,
        enabled: options?.enabled,
      }
    );
  };

  // Insert transaction
  const useInsertTransaction = () => {
    return useInsert('transactions', {
      invalidateQueries: [
        ['transactions'],
        ['loans'],
        ['unified-all-loans'],
      ],
    });
  };

  return {
    useTransactionsByLoan,
    useTransactionsByTenant,
    useInsertTransaction,
  };
};
