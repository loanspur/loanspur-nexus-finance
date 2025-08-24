// Centralized status management system for loans and savings
// This eliminates hard-coded status logic across components

import { getDerivedLoanStatus, type DerivedLoanStatus } from './loan-status';

export type StatusCategory = 'active' | 'pending' | 'approved' | 'closed' | 'problem' | 'unknown';

export interface StatusConfig {
  category: StatusCategory;
  displayText: string;
  badgeVariant: 'default' | 'secondary' | 'destructive' | 'outline';
  badgeClassName: string;
  iconName: string;
}

// Unified status configurations for all entities
export const STATUS_CONFIGS: Record<string, StatusConfig> = {
  // Loan/Application Statuses
  'pending': {
    category: 'pending',
    displayText: 'PENDING',
    badgeVariant: 'secondary',
    badgeClassName: 'bg-warning/10 text-warning border border-warning/20 hover:bg-warning/20',
    iconName: 'Clock'
  },
  'under_review': {
    category: 'pending',
    displayText: 'UNDER REVIEW',
    badgeVariant: 'outline',
    badgeClassName: 'bg-info/10 text-banking-primary border border-banking-primary/20 hover:bg-info/20',
    iconName: 'Eye'
  },
  'pending_approval': {
    category: 'pending',
    displayText: 'PENDING APPROVAL',
    badgeVariant: 'outline',
    badgeClassName: 'bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100',
    iconName: 'Clock'
  },
  'approved': {
    category: 'approved',
    displayText: 'APPROVED',
    badgeVariant: 'default',
    badgeClassName: 'bg-success/10 text-success border border-success/20 hover:bg-success/20',
    iconName: 'CheckCircle'
  },
  'pending_disbursement': {
    category: 'approved',
    displayText: 'PENDING DISBURSEMENT',
    badgeVariant: 'default',
    badgeClassName: 'bg-accent/10 text-accent border border-accent/20 hover:bg-accent/20',
    iconName: 'CreditCard'
  },
  'disbursed': {
    category: 'active',
    displayText: 'DISBURSED',
    badgeVariant: 'default',
    badgeClassName: 'bg-banking-primary/10 text-banking-primary border border-banking-primary/20 hover:bg-banking-primary/20',
    iconName: 'Banknote'
  },
  'active': {
    category: 'active',
    displayText: 'ACTIVE',
    badgeVariant: 'default',
    badgeClassName: 'bg-success/10 text-success border border-success/20 hover:bg-success/20',
    iconName: 'CheckCircle'
  },
  'activated': {
    category: 'active',
    displayText: 'ACTIVE',
    badgeVariant: 'default',
    badgeClassName: 'bg-success/10 text-success border border-success/20 hover:bg-success/20',
    iconName: 'CheckCircle'
  },
  'in_arrears': {
    category: 'problem',
    displayText: 'IN ARREARS',
    badgeVariant: 'destructive',
    badgeClassName: 'bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20',
    iconName: 'AlertTriangle'
  },
  'overdue': {
    category: 'problem',
    displayText: 'OVERDUE',
    badgeVariant: 'destructive',
    badgeClassName: 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100',
    iconName: 'AlertTriangle'
  },
  'overpaid': {
    category: 'active',
    displayText: 'OVERPAID',
    badgeVariant: 'outline',
    badgeClassName: 'bg-purple-50 text-purple-600 border border-purple-200 hover:bg-purple-100',
    iconName: 'Banknote'
  },
  'closed': {
    category: 'closed',
    displayText: 'CLOSED',
    badgeVariant: 'secondary',
    badgeClassName: 'bg-muted text-muted-foreground border border-border hover:bg-muted/80',
    iconName: 'CheckCircle'
  },
  'fully_paid': {
    category: 'closed',
    displayText: 'FULLY PAID',
    badgeVariant: 'secondary',
    badgeClassName: 'bg-green-50 text-green-600 border border-green-200 hover:bg-green-100',
    iconName: 'CheckCircle'
  },
  'rejected': {
    category: 'closed',
    displayText: 'REJECTED',
    badgeVariant: 'destructive',
    badgeClassName: 'bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20',
    iconName: 'XCircle'
  },
  'withdrawn': {
    category: 'closed',
    displayText: 'WITHDRAWN',
    badgeVariant: 'secondary',
    badgeClassName: 'bg-muted text-muted-foreground border border-border hover:bg-muted/80',
    iconName: 'XCircle'
  },
  'written_off': {
    category: 'closed',
    displayText: 'WRITTEN OFF',
    badgeVariant: 'destructive',
    badgeClassName: 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100',
    iconName: 'AlertTriangle'
  },
  // Savings Account Statuses
  'created': {
    category: 'pending',
    displayText: 'CREATED',
    badgeVariant: 'secondary',
    badgeClassName: 'bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100',
    iconName: 'Clock'
  },
  'inactive': {
    category: 'closed',
    displayText: 'INACTIVE',
    badgeVariant: 'secondary',
    badgeClassName: 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100',
    iconName: 'Pause'
  },
  'dormant': {
    category: 'closed',
    displayText: 'DORMANT',
    badgeVariant: 'secondary',
    badgeClassName: 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100',
    iconName: 'Sleep'
  },
  // Default fallback
  'unknown': {
    category: 'unknown',
    displayText: 'UNKNOWN',
    badgeVariant: 'secondary',
    badgeClassName: 'bg-muted text-muted-foreground border border-border hover:bg-muted/80',
    iconName: 'AlertCircle'
  }
};

// Get status configuration for any status string
export function getStatusConfig(status: string): StatusConfig {
  const normalizedStatus = status?.toLowerCase() || 'unknown';
  return STATUS_CONFIGS[normalizedStatus] || STATUS_CONFIGS.unknown;
}

// Get unified status for loans (uses derived status logic)
export function getUnifiedLoanStatus(loan: any): { status: string; config: StatusConfig; derived: DerivedLoanStatus } {
  const derived = getDerivedLoanStatus(loan);
  const config = getStatusConfig(derived.status);
  return { status: derived.status, config, derived };
}

// Check if status belongs to a category
export function isStatusInCategory(status: string, category: StatusCategory): boolean {
  const config = getStatusConfig(status);
  return config.category === category;
}

// Get all statuses in a category
export function getStatusesInCategory(category: StatusCategory): string[] {
  return Object.entries(STATUS_CONFIGS)
    .filter(([_, config]) => config.category === category)
    .map(([status, _]) => status);
}

// Helper functions for common status checks
export const StatusHelpers = {
  isClosed: (status: string) => isStatusInCategory(status, 'closed'),
  isActive: (status: string) => isStatusInCategory(status, 'active'),
  isPending: (status: string) => isStatusInCategory(status, 'pending'),
  isProblem: (status: string) => isStatusInCategory(status, 'problem'),
  isApproved: (status: string) => isStatusInCategory(status, 'approved'),
  
  // Specific status arrays for filtering
  closedStatuses: getStatusesInCategory('closed'),
  activeStatuses: getStatusesInCategory('active'),
  pendingStatuses: getStatusesInCategory('pending'),
  problemStatuses: getStatusesInCategory('problem'),
  approvedStatuses: getStatusesInCategory('approved')
};