import React from 'react';
import { cn } from '@/lib/utils';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, ...props }, ref) => (
    <div className="w-full">
      {label && <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>}
      <textarea ref={ref} className={cn('input-field min-h-[100px]', error && 'border-danger-500 focus:ring-danger-500', className)} {...props} />
      {error && <p className="mt-1 text-sm text-danger-600">{error}</p>}
    </div>
  )
);

Textarea.displayName = 'Textarea';