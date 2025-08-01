
/**
 * Component interface types for enhanced type safety
 */

import { ReactNode } from 'react';

// Authentication Component Types
export interface AuthFormProps {
  mode?: 'signin' | 'signup';
  onSuccess?: () => void;
  onError?: (error: string) => void;
  redirectPath?: string;
  showAccountTypeToggle?: boolean;
}

export interface OTPVerificationProps {
  email: string;
  onSuccess: (data: { isNewUser?: boolean; accountType?: string }) => void;
  onError: (error: string) => void;
  onResendSuccess?: () => void;
  maxAttempts?: number;
  autoSubmit?: boolean;
}

export interface AccountTypeGuardProps {
  children: ReactNode;
  allowedTypes: ('user' | 'client')[];
  fallback?: ReactNode;
  showDebugInfo?: boolean;
  loadingComponent?: ReactNode;
}

export interface AccountTypeStatusDisplayProps {
  showDetails?: boolean;
  variant?: 'default' | 'compact' | 'detailed';
  className?: string;
  onAccountTypeChange?: (accountType: string) => void;
}

// System Monitoring Component Types
export interface SystemHealthIndicatorProps {
  autoRefresh?: boolean;
  refreshInterval?: number;
  showDetails?: boolean;
  onHealthChange?: (isHealthy: boolean) => void;
  className?: string;
}

export interface MonitoringDashboardProps {
  refreshInterval?: number;
  enableAlerts?: boolean;
  onSystemAlert?: (alert: SystemAlert) => void;
}

export interface SystemAlert {
  id: string;
  type: 'warning' | 'error' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  resolved?: boolean;
  metadata?: Record<string, any>;
}

// Profile Component Types
export interface ProfileSectionProps {
  isEditable?: boolean;
  onSave?: (data: any) => Promise<void>;
  onCancel?: () => void;
  showProgress?: boolean;
  className?: string;
}

export interface ProfileProgressBarProps {
  percentage: number;
  showLabel?: boolean;
  animated?: boolean;
  className?: string;
  onComplete?: () => void;
}

// Form Component Types
export interface FormFieldProps {
  name: string;
  label: string;
  type?: 'text' | 'email' | 'password' | 'select' | 'textarea' | 'checkbox';
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  options?: Array<{ value: string; label: string }>;
  validation?: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    customValidator?: (value: any) => string | null;
  };
  onChange?: (value: any) => void;
  onBlur?: () => void;
  className?: string;
}

export interface FormSubmissionState {
  isSubmitting: boolean;
  hasSubmitted: boolean;
  errors: Record<string, string>;
  values: Record<string, any>;
  isValid: boolean;
}

// Navigation Component Types
export interface NavigationItem {
  id: string;
  label: string;
  path: string;
  icon?: string;
  badge?: string | number;
  children?: NavigationItem[];
  requiresAuth?: boolean;
  allowedAccountTypes?: ('user' | 'client')[];
}

export interface NavigationProps {
  items: NavigationItem[];
  currentPath: string;
  onNavigate?: (path: string) => void;
  collapseMode?: 'hover' | 'click' | 'none';
  className?: string;
}

// Table Component Types
export interface TableColumn<T = any> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: any, record: T, index: number) => ReactNode;
  width?: string | number;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

export interface TableProps<T = any> {
  data: T[];
  columns: TableColumn<T>[];
  loading?: boolean;
  pagination?: {
    current: number;
    pageSize: number;
    total: number;
    onChange: (page: number, pageSize: number) => void;
  };
  sorting?: {
    field: keyof T | string;
    direction: 'asc' | 'desc';
    onChange: (field: keyof T | string, direction: 'asc' | 'desc') => void;
  };
  filtering?: {
    filters: Record<string, any>;
    onChange: (filters: Record<string, any>) => void;
  };
  selection?: {
    selectedRows: string[];
    onChange: (selectedRows: string[]) => void;
    getRowKey: (record: T) => string;
  };
  onRowClick?: (record: T, index: number) => void;
  className?: string;
}

// Modal Component Types
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  preventScroll?: boolean;
  children: ReactNode;
  className?: string;
  headerActions?: ReactNode;
  footerActions?: ReactNode;
}

export interface ConfirmModalProps extends Omit<ModalProps, 'children'> {
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'default' | 'destructive' | 'outline';
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
}

// Loading Component Types
export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'secondary' | 'muted';
  className?: string;
}

export interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  className?: string;
  animate?: boolean;
}

// Error Component Types
export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: any) => void;
  resetKeys?: any[];
  resetOnPropsChange?: boolean;
}

export interface ErrorDisplayProps {
  error: Error | string;
  onRetry?: () => void;
  showDetails?: boolean;
  className?: string;
}

// Toast Component Types
export interface ToastOptions {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success' | 'warning';
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Theme Component Types
export interface ThemeConfig {
  mode: 'light' | 'dark' | 'system';
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  destructiveColor: string;
  borderRadius: number;
  fontFamily: string;
}

export interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: ThemeConfig['mode'];
  storageKey?: string;
  attribute?: string;
}
