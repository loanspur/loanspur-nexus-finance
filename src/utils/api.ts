// src/utils/api.ts - Centralized API utilities
import { supabase } from '@/integrations/supabase/client';
import { AppError } from './errorHandler';

export interface ApiResponse<T> {
  data: T | null;
  error: AppError | null;
}

export interface ApiConfig {
  timeout?: number;
  retries?: number;
  cache?: boolean;
}

export class ApiClient {
  private static instance: ApiClient;
  private config: ApiConfig;

  private constructor(config: ApiConfig = {}) {
    this.config = {
      timeout: 30000,
      retries: 3,
      cache: true,
      ...config
    };
  }

  static getInstance(config?: ApiConfig): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient(config);
    }
    return ApiClient.instance;
  }

  async get<T>(endpoint: string, config?: Partial<ApiConfig>): Promise<ApiResponse<T>> {
    try {
      const { data, error } = await supabase
        .from(endpoint)
        .select('*');

      if (error) {
        throw new AppError(error.message, 'API_ERROR', 500);
      }

      return { data: data as T, error: null };
    } catch (error) {
      return { data: null, error: error as AppError };
    }
  }

  async post<T>(endpoint: string, payload: any, config?: Partial<ApiConfig>): Promise<ApiResponse<T>> {
    try {
      const { data, error } = await supabase
        .from(endpoint)
        .insert(payload)
        .select()
        .single();

      if (error) {
        throw new AppError(error.message, 'API_ERROR', 500);
      }

      return { data: data as T, error: null };
    } catch (error) {
      return { data: null, error: error as AppError };
    }
  }

  async put<T>(endpoint: string, id: string, payload: any, config?: Partial<ApiConfig>): Promise<ApiResponse<T>> {
    try {
      const { data, error } = await supabase
        .from(endpoint)
        .update(payload)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new AppError(error.message, 'API_ERROR', 500);
      }

      return { data: data as T, error: null };
    } catch (error) {
      return { data: null, error: error as AppError };
    }
  }

  async delete<T>(endpoint: string, id: string, config?: Partial<ApiConfig>): Promise<ApiResponse<T>> {
    try {
      const { data, error } = await supabase
        .from(endpoint)
        .delete()
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new AppError(error.message, 'API_ERROR', 500);
      }

      return { data: data as T, error: null };
    } catch (error) {
      return { data: null, error: error as AppError };
    }
  }
}

// Export singleton instance
export const apiClient = ApiClient.getInstance();

// Convenience functions
export const api = {
  get: <T>(endpoint: string) => apiClient.get<T>(endpoint),
  post: <T>(endpoint: string, payload: any) => apiClient.post<T>(endpoint, payload),
  put: <T>(endpoint: string, id: string, payload: any) => apiClient.put<T>(endpoint, id, payload),
  delete: <T>(endpoint: string, id: string) => apiClient.delete<T>(endpoint, id)
};
