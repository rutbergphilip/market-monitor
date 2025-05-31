/**
 * Common types used across the application
 */
import type { Ref } from 'vue';

export interface JWTPayload {
  exp?: number;
  iat?: number;
  userId?: string;
  username?: string;
  role?: string;
  [key: string]: unknown;
}

export interface FormStateOptions<T = Record<string, unknown>> {
  /** Initial/original data to compare against for changes */
  initialData: T;
  /** Current form state */
  currentData: Ref<T>;
  /** Array of validation errors from UForm */
  errors?: Ref<unknown[]>;
  /** Custom validation function that returns true if form is valid */
  isValid?: () => boolean;
}

// Generic API response types
export interface ApiError {
  message: string;
  code?: string | number;
  details?: Record<string, unknown>;
}

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: ApiError;
  success: boolean;
}

// Pagination types
export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
