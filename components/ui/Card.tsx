import React from 'react';
import { cn } from '@/lib/utils';

export const Card: React.FC<{ children: React.ReactNode; className?: string; hover?: boolean }> = 
  ({ children, className, hover = false }) => (
    <div className={cn('card-gradient rounded-xl p-6 shadow-sm', hover && 'transition-all duration-300 hover:shadow-lg hover:-translate-y-1', className)}>
      {children}
    </div>
  );

export const CardHeader: React.FC<{ children: React.ReactNode; className?: string }> = 
  ({ children, className }) => <div className={cn('mb-4', className)}>{children}</div>;

export const CardTitle: React.FC<{ children: React.ReactNode; className?: string }> = 
  ({ children, className }) => <h3 className={cn('text-xl font-semibold text-slate-900', className)}>{children}</h3>;

export const CardContent: React.FC<{ children: React.ReactNode; className?: string }> = 
  ({ children, className }) => <div className={className}>{children}</div>;
