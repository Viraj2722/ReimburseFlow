import React from 'react';
import { cn } from '@/lib/utils';
import { ExpenseStatus } from '@/types';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'secondary';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'secondary', className }) => {
  const variantStyles = {
    primary: 'bg-primary-100 text-primary-700',
    success: 'bg-success-100 text-success-700',
    warning: 'bg-warning-100 text-warning-700',
    danger: 'bg-danger-100 text-danger-700',
    secondary: 'bg-slate-100 text-slate-700',
  };

  return <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', variantStyles[variant], className)}>{children}</span>;
};

export const StatusBadge: React.FC<{ status: ExpenseStatus; className?: string }> = ({ status, className }) => {
  const config = {
    draft: { label: 'Draft', variant: 'secondary' as const },
    pending: { label: 'Pending', variant: 'warning' as const },
    approved: { label: 'Approved', variant: 'success' as const },
    rejected: { label: 'Rejected', variant: 'danger' as const },
    partially_approved: { label: 'Partially Approved', variant: 'warning' as const },
  }[status];

  return <Badge variant={config.variant} className={className}>{config.label}</Badge>;
};