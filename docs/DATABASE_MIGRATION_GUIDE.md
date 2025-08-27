# Database Migration Guide

## Overview

This guide helps you migrate existing components to use the new unified database layer. The unified database layer provides:

- **Consistent API**: Standardized methods for all database operations
- **Type Safety**: TypeScript support with proper error handling
- **Caching**: Built-in React Query caching and invalidation
- **Error Handling**: Centralized error handling with toast notifications
- **Performance**: Optimized queries with pagination and filtering

## Migration Steps

### Step 1: Import the Unified Database Hooks

Replace direct Supabase imports with the unified database hooks:

```typescript
// ❌ Old way
import { supabase } from '@/integrations/supabase/client';

// ✅ New way
import { useDatabase, useLoanDatabase, useClientDatabase } from '@/hooks/useDatabase';
```

### Step 2: Replace Direct Supabase Queries

#### Before (Direct Supabase):
```typescript
const { data: loans, error, isLoading } = useQuery({
  queryKey: ['loans', tenantId],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('loans')
      .select('*, clients(*), loan_products(*)')
      .eq('tenant_id', tenantId);
    
    if (error) throw error;
    return data;
  },
});
```

#### After (Unified Database):
```typescript
const { data: loansResult, isLoading } = useLoansByTenant(tenantId, {
  pagination: { page: 0, limit: 10 },
  sort: { column: 'created_at', ascending: false },
});
```

### Step 3: Replace Mutations

#### Before (Direct Supabase):
```typescript
const createLoan = useMutation({
  mutationFn: async (loanData) => {
    const { data, error } = await supabase
      .from('loans')
      .insert(loanData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
  onSuccess: () => {
    queryClient.invalidateQueries(['loans']);
  },
});
```

#### After (Unified Database):
```typescript
const insertLoan = useInsertLoan();
// Usage: insertLoan.mutate(loanData)
```

## Component Migration Examples

### Example 1: Loan List Component

#### Before:
```typescript
export const LoanList = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  
  const { data: loans, isLoading, error } = useQuery({
    queryKey: ['loans', profile?.tenant_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('loans')
        .select('*, clients(*), loan_products(*)')
        .eq('tenant_id', profile?.tenant_id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.tenant_id,
  });

  const deleteLoan = useMutation({
    mutationFn: async (loanId: string) => {
      const { error } = await supabase
        .from('loans')
        .delete()
        .eq('id', loanId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['loans']);
    },
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {loans?.map(loan => (
        <div key={loan.id}>
          {loan.loan_number} - {loan.clients?.first_name}
          <button onClick={() => deleteLoan.mutate(loan.id)}>
            Delete
          </button>
        </div>
      ))}
    </div>
  );
};
```

#### After:
```typescript
export const LoanList = () => {
  const { profile } = useAuth();
  const { useLoansByTenant, useDeleteLoan } = useLoanDatabase();
  
  const { data: loansResult, isLoading } = useLoansByTenant(profile?.tenant_id || '', {
    pagination: { page: 0, limit: 10 },
    sort: { column: 'created_at', ascending: false },
    enabled: !!profile?.tenant_id,
  });

  const deleteLoan = useDeleteLoan();

  if (isLoading) return <div>Loading...</div>;

  const loans = DatabaseUtils.getData(loansResult) || [];

  return (
    <div>
      {loans.map(loan => (
        <div key={loan.id}>
          {loan.loan_number} - {loan.clients?.first_name}
          <button 
            onClick={() => deleteLoan.mutate({ id: loan.id })}
            disabled={deleteLoan.isPending}
          >
            {deleteLoan.isPending ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      ))}
    </div>
  );
};
```

### Example 2: Client Form Component

#### Before:
```typescript
export const ClientForm = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const createClient = useMutation({
    mutationFn: async (clientData) => {
      const { data, error } = await supabase
        .from('clients')
        .insert({ ...clientData, tenant_id: profile?.tenant_id })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['clients']);
      toast({ title: "Success", description: "Client created successfully" });
    },
    onError: (error) => {
      toast({ 
        title: "Error", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  const handleSubmit = (data) => {
    createClient.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
    </form>
  );
};
```

#### After:
```typescript
export const ClientForm = () => {
  const { profile } = useAuth();
  const { useInsertClient } = useClientDatabase();
  
  const insertClient = useInsertClient();

  const handleSubmit = (data) => {
    insertClient.mutate({
      ...data,
      tenant_id: profile?.tenant_id,
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
    </form>
  );
};
```

## Advanced Usage Patterns

### 1. Complex Queries with Multiple Filters

```typescript
const { data: loansResult } = useLoansByTenant(tenantId, {
  status: 'active',
  pagination: { page: 0, limit: 20 },
  sort: { column: 'outstanding_balance', ascending: false },
});
```

### 2. Custom Database Operations

```typescript
const { executeQuery, db } = useDatabase();

const handleCustomOperation = async () => {
  const result = await executeQuery(
    () => db.rawQuery('SELECT COUNT(*) FROM loans WHERE status = $1', ['active']),
    { showError: true }
  );

  if (DatabaseUtils.isSuccess(result)) {
    console.log('Active loans count:', result.data);
  }
};
```

### 3. Batch Operations

```typescript
const { executeQuery, db } = useDatabase();

const handleBatchUpdate = async (loanIds: string[], updates: any) => {
  const results = await Promise.all(
    loanIds.map(loanId =>
      executeQuery(
        () => db.update('loans', updates, { id: loanId }),
        { showError: false }
      )
    )
  );

  const successCount = results.filter(r => r.success).length;
  console.log(`Updated ${successCount}/${loanIds.length} loans`);
};
```

## Error Handling

The unified database layer provides centralized error handling:

```typescript
// Automatic error handling with toast notifications
const { data: result } = useSelect(['data'], 'table', {
  showError: true, // Default: true
});

// Custom error handling
const { data: result } = useSelect(['data'], 'table', {
  showError: false,
  onError: (error) => {
    // Custom error handling
    console.error('Custom error:', error);
  },
});
```

## Performance Optimization

### 1. Query Caching

The unified database layer uses React Query for automatic caching:

```typescript
// Queries are automatically cached and shared across components
const { data: loans } = useLoansByTenant(tenantId);
const { data: sameLoans } = useLoansByTenant(tenantId); // Uses cached data
```

### 2. Pagination

```typescript
const [page, setPage] = useState(0);
const { data: loansResult } = useLoansByTenant(tenantId, {
  pagination: { page, limit: 10 },
});
```

### 3. Selective Data Loading

```typescript
// Load only necessary columns
const { data: clientsResult } = useSelect(
  ['clients', 'basic'],
  'clients',
  {
    columns: 'id, first_name, last_name, phone',
    filter: { tenant_id: tenantId },
  }
);
```

## Migration Checklist

- [ ] Replace direct Supabase imports with unified database hooks
- [ ] Update query patterns to use specialized hooks
- [ ] Replace mutations with unified mutation hooks
- [ ] Update error handling to use centralized error handling
- [ ] Add proper TypeScript types for data structures
- [ ] Test all database operations after migration
- [ ] Update any custom query logic to use the unified API
- [ ] Verify caching behavior works as expected
- [ ] Test error scenarios and error handling

## Benefits After Migration

1. **Consistency**: All database operations use the same patterns
2. **Type Safety**: Better TypeScript support and error catching
3. **Performance**: Automatic caching and query optimization
4. **Maintainability**: Centralized database logic
5. **Error Handling**: Consistent error handling across the app
6. **Testing**: Easier to mock and test database operations

## Troubleshooting

### Common Issues

1. **Type Errors**: Ensure you're using the correct types for your data
2. **Cache Issues**: Use `queryClient.invalidateQueries()` to refresh data
3. **Performance**: Use pagination for large datasets
4. **Error Handling**: Check that error handling is working as expected

### Getting Help

If you encounter issues during migration:

1. Check the examples in `src/examples/database-usage-examples.tsx`
2. Review the unified database layer code in `src/lib/database.ts`
3. Check the React Query documentation for advanced patterns
4. Test with simple queries first before migrating complex operations
