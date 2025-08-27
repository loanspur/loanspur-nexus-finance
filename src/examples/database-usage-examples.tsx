/**
 * Database Usage Examples
 * 
 * This file demonstrates how to use the unified database layer in React components.
 * It shows various patterns and best practices for database operations.
 */

import React, { useState } from 'react';
import { useDatabase, useLoanDatabase, useClientDatabase, useUserDatabase, useTransactionDatabase } from '@/hooks/useDatabase';
import { DatabaseUtils } from '@/lib/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';

// Example 1: Basic Database Operations
export const BasicDatabaseExample = () => {
  const { profile } = useAuth();
  const { useSelect, useInsert, useUpdate, useDelete, executeQuery } = useDatabase();
  const [newClientName, setNewClientName] = useState('');

  // Get clients for the current tenant
  const { data: clientsResult, isLoading: clientsLoading, error: clientsError } = useSelect(
    ['clients', 'tenant', profile?.tenant_id],
    'clients',
    {
      filter: { tenant_id: profile?.tenant_id },
      sort: { column: 'created_at', ascending: false },
      enabled: !!profile?.tenant_id,
    }
  );

  // Insert new client
  const insertClient = useInsert('clients', {
    invalidateQueries: [['clients', 'tenant', profile?.tenant_id]],
    onSuccess: (data) => {
      console.log('Client created:', data);
      setNewClientName('');
    },
  });

  // Update client
  const updateClient = useUpdate('clients', {
    invalidateQueries: [['clients', 'tenant', profile?.tenant_id]],
  });

  // Delete client
  const deleteClient = useDelete('clients', {
    invalidateQueries: [['clients', 'tenant', profile?.tenant_id]],
  });

  const handleCreateClient = () => {
    if (!newClientName.trim() || !profile?.tenant_id) return;

    insertClient.mutate({
      first_name: newClientName,
      last_name: '',
      tenant_id: profile.tenant_id,
      is_active: true,
    });
  };

  const handleUpdateClient = (clientId: string, updates: any) => {
    updateClient.mutate({
      data: updates,
      filter: { id: clientId },
    });
  };

  const handleDeleteClient = (clientId: string) => {
    deleteClient.mutate({ id: clientId });
  };

  if (clientsLoading) return <div>Loading clients...</div>;
  if (clientsError) return <div>Error loading clients</div>;

  const clients = DatabaseUtils.getData(clientsResult) || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Basic Database Operations</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Create new client */}
        <div className="flex gap-2 mb-4">
          <Input
            value={newClientName}
            onChange={(e) => setNewClientName(e.target.value)}
            placeholder="Enter client name"
          />
          <Button 
            onClick={handleCreateClient}
            disabled={insertClient.isPending}
          >
            {insertClient.isPending ? 'Creating...' : 'Create Client'}
          </Button>
        </div>

        {/* List clients */}
        <div className="space-y-2">
          {clients.map((client: any) => (
            <div key={client.id} className="flex items-center justify-between p-2 border rounded">
              <span>{client.first_name} {client.last_name}</span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleUpdateClient(client.id, { is_active: !client.is_active })}
                  disabled={updateClient.isPending}
                >
                  Toggle Active
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDeleteClient(client.id)}
                  disabled={deleteClient.isPending}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// Example 2: Specialized Loan Database Operations
export const LoanDatabaseExample = () => {
  const { profile } = useAuth();
  const { 
    useLoansByTenant, 
    useLoanById, 
    useLoansByClient,
    useInsertLoan,
    useUpdateLoan,
    useLoanSchedules,
    useLoanPayments 
  } = useLoanDatabase();

  // Get all loans for tenant
  const { data: loansResult, isLoading: loansLoading } = useLoansByTenant(profile?.tenant_id || '', {
    pagination: { page: 0, limit: 10 },
    sort: { column: 'created_at', ascending: false },
    enabled: !!profile?.tenant_id,
  });

  // Get specific loan details
  const [selectedLoanId, setSelectedLoanId] = useState<string>('');
  const { data: loanResult } = useLoanById(selectedLoanId, !!selectedLoanId);

  // Get loan schedules
  const { data: schedulesResult } = useLoanSchedules(selectedLoanId, !!selectedLoanId);

  // Get loan payments
  const { data: paymentsResult } = useLoanPayments(selectedLoanId, !!selectedLoanId);

  // Insert new loan
  const insertLoan = useInsertLoan();

  // Update loan
  const updateLoan = useUpdateLoan();

  const handleCreateLoan = () => {
    if (!profile?.tenant_id) return;

    insertLoan.mutate({
      tenant_id: profile.tenant_id,
      client_id: 'some-client-id',
      loan_product_id: 'some-product-id',
      principal_amount: 10000,
      interest_rate: 0.15,
      term_months: 12,
      status: 'pending_disbursement',
    });
  };

  const handleUpdateLoanStatus = (loanId: string, status: string) => {
    updateLoan.mutate({
      data: { status },
      filter: { id: loanId },
    });
  };

  if (loansLoading) return <div>Loading loans...</div>;

  const loans = DatabaseUtils.getData(loansResult) || [];
  const selectedLoan = DatabaseUtils.getData(loanResult);
  const schedules = DatabaseUtils.getData(schedulesResult) || [];
  const payments = DatabaseUtils.getData(paymentsResult) || [];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Loan Database Operations</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={handleCreateLoan} disabled={insertLoan.isPending}>
            {insertLoan.isPending ? 'Creating...' : 'Create Sample Loan'}
          </Button>

          <div className="mt-4 space-y-2">
            {loans.map((loan: any) => (
              <div key={loan.id} className="flex items-center justify-between p-2 border rounded">
                <div>
                  <span className="font-medium">{loan.loan_number}</span>
                  <Badge variant="outline" className="ml-2">{loan.status}</Badge>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedLoanId(loan.id)}
                  >
                    View Details
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleUpdateLoanStatus(loan.id, 'active')}
                    disabled={updateLoan.isPending}
                  >
                    Activate
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Selected loan details */}
      {selectedLoan && (
        <Card>
          <CardHeader>
            <CardTitle>Loan Details: {selectedLoan.loan_number}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium">Loan Info</h4>
                <p>Principal: ${selectedLoan.principal_amount}</p>
                <p>Interest Rate: {selectedLoan.interest_rate * 100}%</p>
                <p>Status: {selectedLoan.status}</p>
              </div>
              <div>
                <h4 className="font-medium">Schedules ({schedules.length})</h4>
                <p>Payments ({payments.length})</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Example 3: Client Database Operations
export const ClientDatabaseExample = () => {
  const { profile } = useAuth();
  const { 
    useClientsByTenant, 
    useClientById,
    useInsertClient,
    useUpdateClient 
  } = useClientDatabase();

  // Get clients with pagination
  const [page, setPage] = useState(0);
  const { data: clientsResult, isLoading } = useClientsByTenant(profile?.tenant_id || '', {
    pagination: { page, limit: 5 },
    sort: { column: 'first_name', ascending: true },
    enabled: !!profile?.tenant_id,
  });

  // Insert client
  const insertClient = useInsertClient();

  // Update client
  const updateClient = useUpdateClient();

  const handleCreateClient = () => {
    if (!profile?.tenant_id) return;

    insertClient.mutate({
      tenant_id: profile.tenant_id,
      first_name: 'John',
      last_name: 'Doe',
      phone: '+1234567890',
      email: 'john.doe@example.com',
      is_active: true,
    });
  };

  if (isLoading) return <div>Loading clients...</div>;

  const clients = DatabaseUtils.getData(clientsResult) || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Client Database Operations</CardTitle>
      </CardHeader>
      <CardContent>
        <Button onClick={handleCreateClient} disabled={insertClient.isPending}>
          {insertClient.isPending ? 'Creating...' : 'Create Sample Client'}
        </Button>

        <div className="mt-4 space-y-2">
          {clients.map((client: any) => (
            <div key={client.id} className="p-2 border rounded">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium">{client.first_name} {client.last_name}</span>
                  <p className="text-sm text-gray-600">{client.phone}</p>
                </div>
                <Badge variant={client.is_active ? 'default' : 'secondary'}>
                  {client.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2 mt-4">
          <Button 
            variant="outline" 
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
          >
            Previous
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setPage(page + 1)}
            disabled={clients.length < 5}
          >
            Next
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Example 4: Transaction Database Operations
export const TransactionDatabaseExample = () => {
  const { profile } = useAuth();
  const { 
    useTransactionsByTenant,
    useTransactionsByLoan,
    useInsertTransaction 
  } = useTransactionDatabase();

  // Get transactions for tenant with date range
  const { data: transactionsResult, isLoading } = useTransactionsByTenant(profile?.tenant_id || '', {
    dateFrom: '2024-01-01',
    dateTo: '2024-12-31',
    pagination: { page: 0, limit: 10 },
    enabled: !!profile?.tenant_id,
  });

  // Insert transaction
  const insertTransaction = useInsertTransaction();

  const handleCreateTransaction = () => {
    if (!profile?.tenant_id) return;

    insertTransaction.mutate({
      tenant_id: profile.tenant_id,
      loan_id: 'some-loan-id',
      transaction_type: 'repayment',
      amount: 1000,
      transaction_date: new Date().toISOString(),
      description: 'Sample repayment transaction',
    });
  };

  if (isLoading) return <div>Loading transactions...</div>;

  const transactions = DatabaseUtils.getData(transactionsResult) || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transaction Database Operations</CardTitle>
      </CardHeader>
      <CardContent>
        <Button onClick={handleCreateTransaction} disabled={insertTransaction.isPending}>
          {insertTransaction.isPending ? 'Creating...' : 'Create Sample Transaction'}
        </Button>

        <div className="mt-4 space-y-2">
          {transactions.map((transaction: any) => (
            <div key={transaction.id} className="p-2 border rounded">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium">{transaction.transaction_type}</span>
                  <p className="text-sm text-gray-600">{transaction.description}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">${transaction.amount}</p>
                  <p className="text-sm text-gray-600">
                    {new Date(transaction.transaction_date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// Example 5: Advanced Database Operations with Error Handling
export const AdvancedDatabaseExample = () => {
  const { profile } = useAuth();
  const { executeQuery, db, DatabaseUtils } = useDatabase();
  const [customQuery, setCustomQuery] = useState('');

  // Custom query execution
  const handleCustomQuery = async () => {
    if (!customQuery.trim()) return;

    const result = await executeQuery(
      () => db.rawQuery(customQuery),
      {
        showError: true,
        errorMessage: 'Custom query failed',
      }
    );

    if (DatabaseUtils.isSuccess(result)) {
      console.log('Query result:', result.data);
    }
  };

  // Complex operation with multiple queries
  const handleComplexOperation = async () => {
    if (!profile?.tenant_id) return;

    // Get loan count
    const loanCountResult = await executeQuery(
      () => db.count('loans', { tenant_id: profile.tenant_id }),
      { showError: false }
    );

    // Get client count
    const clientCountResult = await executeQuery(
      () => db.count('clients', { tenant_id: profile.tenant_id }),
      { showError: false }
    );

    // Get transaction count
    const transactionCountResult = await executeQuery(
      () => db.count('transactions', { tenant_id: profile.tenant_id }),
      { showError: false }
    );

    const stats = {
      loans: DatabaseUtils.getData(loanCountResult) || 0,
      clients: DatabaseUtils.getData(clientCountResult) || 0,
      transactions: DatabaseUtils.getData(transactionCountResult) || 0,
    };

    console.log('Tenant statistics:', stats);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Advanced Database Operations</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Input
              value={customQuery}
              onChange={(e) => setCustomQuery(e.target.value)}
              placeholder="Enter custom SQL query"
            />
            <Button onClick={handleCustomQuery} className="mt-2">
              Execute Custom Query
            </Button>
          </div>

          <Button onClick={handleComplexOperation}>
            Get Tenant Statistics
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Main example component that combines all examples
export const DatabaseUsageExamples = () => {
  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Database Usage Examples</h1>
      
      <BasicDatabaseExample />
      <LoanDatabaseExample />
      <ClientDatabaseExample />
      <TransactionDatabaseExample />
      <AdvancedDatabaseExample />
    </div>
  );
};
