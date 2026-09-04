import React from 'react';
import { cn } from '../../utils/cn';

const VARIANTS = {
  primary:
    'bg-[#5A67D8] hover:bg-[#4C51BF] text-white shadow-sm hover:shadow active:scale-[0.98]',
  secondary:
    'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200',
  outline:
    'border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200',
  danger:
    'bg-rose-500 hover:bg-rose-600 text-white shadow-sm hover:shadow active:scale-[0.98]',
  ghost:
    'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800',
};

const SIZES = {
  sm: 'px-2.5 py-1 text-xs rounded-lg',
  md: 'px-3.5 py-1.5 text-sm rounded-xl',
  lg: 'px-5 py-2.5 text-base rounded-xl font-semibold',
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className,
  disabled,
  ...props
}) {
  return (
    <button
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
        VARIANTS[variant] || VARIANTS.primary,
        SIZES[size] || SIZES.md,
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
