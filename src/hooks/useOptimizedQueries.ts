import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

// Common query options for better performance
export const defaultQueryOptions = {
  staleTime: 5 * 60 * 1000, // 5 minutes - data considered fresh for 5 minutes
  gcTime: 10 * 60 * 1000, // 10 minutes - cache time (formerly cacheTime)
  retry: (failureCount: number, error: any) => {
    // Don't retry on 401/403 errors (auth issues)
    if (error?.status === 401 || error?.status === 403) return false;
    // Retry up to 2 times for other errors
    return failureCount < 2;
  },
  refetchOnWindowFocus: false, // Disable refetch on window focus for better UX
};

// Optimized query options for frequently updated data
export const frequentUpdateOptions = {
  ...defaultQueryOptions,
  staleTime: 30 * 1000, // 30 seconds
  refetchInterval: 60 * 1000, // Auto-refetch every minute
};

// Optimized query options for rarely changing data
export const rareUpdateOptions = {
  ...defaultQueryOptions,
  staleTime: 30 * 60 * 1000, // 30 minutes
  gcTime: 60 * 60 * 1000, // 1 hour
};

// Hook for automatic query invalidation after mutations
export const useAutoRefresh = () => {
  const queryClient = useQueryClient();

  // Function to refresh all critical queries
  const refreshAllData = () => {
    const criticalQueries = [
      'clients',
      'loans', 
      'loan-applications',
      'client-loans',
      'client-loans-dialog',
      'savings-accounts',
      'dashboard-data',
      'transactions'
    ];

    criticalQueries.forEach(queryKey => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
    });
  };

  // Function to refresh specific client data
  const refreshClientData = (clientId: string) => {
    queryClient.invalidateQueries({ queryKey: ['client-loans', clientId] });
    queryClient.invalidateQueries({ queryKey: ['client-loans-dialog', clientId] });
    queryClient.invalidateQueries({ queryKey: ['clients'] });
  };

  return {
    refreshAllData,
    refreshClientData,
  };
};

// Hook for optimized data fetching
export const useDataOptimization = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Prefetch commonly accessed data
    const prefetchCommonData = () => {
      queryClient.prefetchQuery({
        queryKey: ['loan-products'],
        staleTime: rareUpdateOptions.staleTime,
      });
      
      queryClient.prefetchQuery({
        queryKey: ['savings-products'],
        staleTime: rareUpdateOptions.staleTime,
      });
    };

    // Prefetch after a short delay to not block initial load
    const timer = setTimeout(prefetchCommonData, 1000);
    return () => clearTimeout(timer);
  }, [queryClient]);

  return null;
};