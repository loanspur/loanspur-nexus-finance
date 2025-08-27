/**
 * Unified Database Access Layer
 * 
 * This module provides a centralized, consistent interface for all database operations
 * across the LoanspurCBS v2.0 system. It abstracts Supabase operations and provides
 * type-safe, standardized methods for common database operations.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Database operation result types
export interface DatabaseResult<T> {
  data: T | null;
  error: any | null;
  success: boolean;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface FilterParams {
  [key: string]: any;
}

export interface SortParams {
  column: string;
  ascending?: boolean;
}

// Base database operations
export class DatabaseService {
  private client: SupabaseClient<Database>;

  constructor(client: SupabaseClient<Database> = supabase) {
    this.client = client;
  }

  /**
   * Generic query method with error handling
   */
  private async executeQuery<T>(
    queryFn: () => Promise<{ data: T | null; error: any }>
  ): Promise<DatabaseResult<T>> {
    try {
      const { data, error } = await queryFn();
      return {
        data,
        error,
        success: !error,
      };
    } catch (error) {
      return {
        data: null,
        error,
        success: false,
      };
    }
  }

  /**
   * Generic insert method
   */
  async insert<T>(
    table: string,
    data: Partial<T>,
    options?: { returning?: string }
  ): Promise<DatabaseResult<T>> {
    return this.executeQuery(async () => {
      let query = this.client.from(table).insert(data);
      if (options?.returning) {
        query = query.select(options.returning);
      }
      return query.single();
    });
  }

  /**
   * Generic update method
   */
  async update<T>(
    table: string,
    data: Partial<T>,
    filter: FilterParams,
    options?: { returning?: string }
  ): Promise<DatabaseResult<T>> {
    return this.executeQuery(async () => {
      let query = this.client.from(table).update(data);
      
      // Apply filters
      Object.entries(filter).forEach(([key, value]) => {
        query = query.eq(key, value);
      });

      if (options?.returning) {
        query = query.select(options.returning);
      }
      return query.single();
    });
  }

  /**
   * Generic delete method
   */
  async delete<T>(
    table: string,
    filter: FilterParams,
    options?: { returning?: string }
  ): Promise<DatabaseResult<T>> {
    return this.executeQuery(async () => {
      let query = this.client.from(table).delete();
      
      // Apply filters
      Object.entries(filter).forEach(([key, value]) => {
        query = query.eq(key, value);
      });

      if (options?.returning) {
        query = query.select(options.returning);
      }
      return query.single();
    });
  }

  /**
   * Generic select method with pagination and filtering
   */
  async select<T>(
    table: string,
    options?: {
      columns?: string;
      filter?: FilterParams;
      sort?: SortParams;
      pagination?: PaginationParams;
      count?: boolean;
    }
  ): Promise<DatabaseResult<T[]>> {
    return this.executeQuery(async () => {
      let query = this.client.from(table).select(options?.columns || '*');

      // Apply filters
      if (options?.filter) {
        Object.entries(options.filter).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            query = query.in(key, value);
          } else {
            query = query.eq(key, value);
          }
        });
      }

      // Apply sorting
      if (options?.sort) {
        query = query.order(options.sort.column, {
          ascending: options.sort.ascending ?? true,
        });
      }

      // Apply pagination
      if (options?.pagination) {
        if (options.pagination.offset !== undefined) {
          query = query.range(
            options.pagination.offset,
            options.pagination.offset + (options.pagination.limit || 10) - 1
          );
        } else if (options.pagination.page !== undefined) {
          const limit = options.pagination.limit || 10;
          const offset = options.pagination.page * limit;
          query = query.range(offset, offset + limit - 1);
        }
      }

      // Apply count
      if (options?.count) {
        return query.count();
      }

      return query;
    });
  }

  /**
   * Generic select single record method
   */
  async selectOne<T>(
    table: string,
    filter: FilterParams,
    options?: { columns?: string }
  ): Promise<DatabaseResult<T>> {
    return this.executeQuery(async () => {
      let query = this.client.from(table).select(options?.columns || '*');
      
      // Apply filters
      Object.entries(filter).forEach(([key, value]) => {
        query = query.eq(key, value);
      });

      return query.single();
    });
  }

  /**
   * Count records in a table
   */
  async count(
    table: string,
    filter?: FilterParams
  ): Promise<DatabaseResult<number>> {
    return this.executeQuery(async () => {
      let query = this.client.from(table).select('*', { count: 'exact', head: true });
      
      // Apply filters
      if (filter) {
        Object.entries(filter).forEach(([key, value]) => {
          query = query.eq(key, value);
        });
      }

      return query;
    });
  }

  /**
   * Execute a raw SQL query (use with caution)
   */
  async rawQuery<T>(sql: string, params?: any[]): Promise<DatabaseResult<T[]>> {
    return this.executeQuery(async () => {
      return this.client.rpc('exec_sql', { sql, params });
    });
  }

  /**
   * Begin a transaction
   */
  async beginTransaction(): Promise<DatabaseResult<void>> {
    return this.executeQuery(async () => {
      // Note: Supabase doesn't support explicit transactions in the client
      // This is a placeholder for future implementation
      return { data: null, error: null };
    });
  }

  /**
   * Commit a transaction
   */
  async commitTransaction(): Promise<DatabaseResult<void>> {
    return this.executeQuery(async () => {
      // Note: Supabase doesn't support explicit transactions in the client
      // This is a placeholder for future implementation
      return { data: null, error: null };
    });
  }

  /**
   * Rollback a transaction
   */
  async rollbackTransaction(): Promise<DatabaseResult<void>> {
    return this.executeQuery(async () => {
      // Note: Supabase doesn't support explicit transactions in the client
      // This is a placeholder for future implementation
      return { data: null, error: null };
    });
  }
}

// Specialized service classes for different domains
export class LoanDatabaseService extends DatabaseService {
  /**
   * Get all loans for a tenant
   */
  async getLoansByTenant(tenantId: string, options?: {
    status?: string;
    pagination?: PaginationParams;
    sort?: SortParams;
  }): Promise<DatabaseResult<any[]>> {
    const filter: FilterParams = { tenant_id: tenantId };
    if (options?.status) {
      filter.status = options.status;
    }

    return this.select('loans', {
      columns: '*, clients(*), loan_products(*)',
      filter,
      sort: options?.sort,
      pagination: options?.pagination,
    });
  }

  /**
   * Get loan by ID with related data
   */
  async getLoanById(loanId: string): Promise<DatabaseResult<any>> {
    return this.selectOne('loans', { id: loanId }, {
      columns: '*, clients(*), loan_products(*), loan_schedules(*), loan_payments(*)',
    });
  }

  /**
   * Get loans by client ID
   */
  async getLoansByClient(clientId: string): Promise<DatabaseResult<any[]>> {
    return this.select('loans', {
      columns: '*, loan_products(*)',
      filter: { client_id: clientId },
      sort: { column: 'created_at', ascending: false },
    });
  }

  /**
   * Update loan status
   */
  async updateLoanStatus(loanId: string, status: string, notes?: string): Promise<DatabaseResult<any>> {
    const updateData: any = { status, updated_at: new Date().toISOString() };
    if (notes) {
      updateData.status_notes = notes;
    }

    return this.update('loans', updateData, { id: loanId }, { returning: '*' });
  }

  /**
   * Get loan schedules
   */
  async getLoanSchedules(loanId: string): Promise<DatabaseResult<any[]>> {
    return this.select('loan_schedules', {
      filter: { loan_id: loanId },
      sort: { column: 'installment_number', ascending: true },
    });
  }

  /**
   * Get loan payments
   */
  async getLoanPayments(loanId: string): Promise<DatabaseResult<any[]>> {
    return this.select('loan_payments', {
      filter: { loan_id: loanId },
      sort: { column: 'payment_date', ascending: true },
    });
  }
}

export class ClientDatabaseService extends DatabaseService {
  /**
   * Get all clients for a tenant
   */
  async getClientsByTenant(tenantId: string, options?: {
    active?: boolean;
    pagination?: PaginationParams;
    sort?: SortParams;
  }): Promise<DatabaseResult<any[]>> {
    const filter: FilterParams = { tenant_id: tenantId };
    if (options?.active !== undefined) {
      filter.is_active = options.active;
    }

    return this.select('clients', {
      filter,
      sort: options?.sort || { column: 'created_at', ascending: false },
      pagination: options?.pagination,
    });
  }

  /**
   * Get client by ID with related data
   */
  async getClientById(clientId: string): Promise<DatabaseResult<any>> {
    return this.selectOne('clients', { id: clientId }, {
      columns: '*, loans(*), savings_accounts(*)',
    });
  }

  /**
   * Search clients by name or phone
   */
  async searchClients(tenantId: string, searchTerm: string): Promise<DatabaseResult<any[]>> {
    return this.executeQuery(async () => {
      return this.client
        .from('clients')
        .select('*')
        .eq('tenant_id', tenantId)
        .or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`)
        .limit(10);
    });
  }
}

export class UserDatabaseService extends DatabaseService {
  /**
   * Get user profile by user ID
   */
  async getUserProfile(userId: string): Promise<DatabaseResult<any>> {
    return this.selectOne('profiles', { user_id: userId });
  }

  /**
   * Update user profile
   */
  async updateUserProfile(userId: string, data: Partial<any>): Promise<DatabaseResult<any>> {
    return this.update('profiles', data, { user_id: userId }, { returning: '*' });
  }

  /**
   * Get users by tenant
   */
  async getUsersByTenant(tenantId: string): Promise<DatabaseResult<any[]>> {
    return this.select('profiles', {
      filter: { tenant_id: tenantId },
      sort: { column: 'created_at', ascending: false },
    });
  }
}

export class TransactionDatabaseService extends DatabaseService {
  /**
   * Get transactions by loan ID
   */
  async getTransactionsByLoan(loanId: string): Promise<DatabaseResult<any[]>> {
    return this.select('transactions', {
      filter: { loan_id: loanId },
      sort: { column: 'transaction_date', ascending: false },
    });
  }

  /**
   * Get transactions by tenant
   */
  async getTransactionsByTenant(tenantId: string, options?: {
    type?: string;
    dateFrom?: string;
    dateTo?: string;
    pagination?: PaginationParams;
  }): Promise<DatabaseResult<any[]>> {
    const filter: FilterParams = { tenant_id: tenantId };
    
    if (options?.type) {
      filter.transaction_type = options.type;
    }

    let query = this.client.from('transactions').select('*').eq('tenant_id', tenantId);

    if (options?.dateFrom) {
      query = query.gte('transaction_date', options.dateFrom);
    }

    if (options?.dateTo) {
      query = query.lte('transaction_date', options.dateTo);
    }

    if (options?.pagination) {
      const { page = 0, limit = 10 } = options.pagination;
      const offset = page * limit;
      query = query.range(offset, offset + limit - 1);
    }

    return this.executeQuery(async () => {
      return query.order('transaction_date', { ascending: false });
    });
  }
}

// Export singleton instances
export const db = new DatabaseService();
export const loanDb = new LoanDatabaseService();
export const clientDb = new ClientDatabaseService();
export const userDb = new UserDatabaseService();
export const transactionDb = new TransactionDatabaseService();

// Utility functions for common operations
export const DatabaseUtils = {
  /**
   * Check if a database result was successful
   */
  isSuccess<T>(result: DatabaseResult<T>): result is DatabaseResult<T> & { data: T } {
    return result.success && result.data !== null;
  },

  /**
   * Extract data from a successful result
   */
  getData<T>(result: DatabaseResult<T>): T | null {
    return result.success ? result.data : null;
  },

  /**
   * Extract error from a failed result
   */
  getError<T>(result: DatabaseResult<T>): any | null {
    return result.success ? null : result.error;
  },

  /**
   * Create a standardized error message
   */
  createErrorMessage(error: any): string {
    if (typeof error === 'string') return error;
    if (error?.message) return error.message;
    if (error?.details) return error.details;
    return 'An unknown database error occurred';
  },

  /**
   * Validate required fields
   */
  validateRequired(data: any, requiredFields: string[]): string[] {
    const missing: string[] = [];
    requiredFields.forEach(field => {
      if (!data[field] && data[field] !== 0) {
        missing.push(field);
      }
    });
    return missing;
  },
};

// Export types for use in other modules
export type { DatabaseResult, PaginationParams, FilterParams, SortParams };
