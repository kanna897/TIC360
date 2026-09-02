import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?:
    | 'active'
    | 'inactive'
    | 'pending'
    | 'blue'
    | 'purple'
    | 'emerald'
    | 'rose'
    | 'amber'
    | 'neutral';
  dot?: boolean;
}

export const Badge = ({
  className,
  children,
  variant = 'neutral',
  dot = false,
  ...props
}: BadgeProps) => {
  const variantStyles = {
    active:
      'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 dark:bg-emerald-950/40 dark:text-emerald-400',
    inactive:
      'bg-slate-500/10 text-slate-400 border-slate-500/30 dark:bg-slate-900 dark:text-slate-400',
    pending:
      'bg-amber-500/10 text-amber-400 border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-400',
    blue:
      'bg-blue-500/10 text-blue-400 border-blue-500/30 dark:bg-blue-950/40 dark:text-blue-400',
    purple:
      'bg-purple-500/10 text-purple-400 border-purple-500/30 dark:bg-purple-950/40 dark:text-purple-400',
    emerald:
      'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 dark:bg-emerald-950/40 dark:text-emerald-400',
    rose:
      'bg-rose-500/10 text-rose-400 border-rose-500/30 dark:bg-rose-950/40 dark:text-rose-400',
    amber:
      'bg-amber-500/10 text-amber-400 border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-400',
    neutral:
      'bg-slate-800 text-slate-300 border-slate-700 dark:bg-slate-800 dark:text-slate-300',
  };

  const dotColors = {
    active: 'bg-emerald-400 animate-pulse',
    inactive: 'bg-slate-400',
    pending: 'bg-amber-400 animate-pulse',
    blue: 'bg-blue-400',
    purple: 'bg-purple-400',
    emerald: 'bg-emerald-400',
    rose: 'bg-rose-400',
    amber: 'bg-amber-400',
    neutral: 'bg-slate-400',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border backdrop-blur-sm tracking-wide',
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {dot && (
        <span className={cn('w-1.5 h-1.5 rounded-full', dotColors[variant])} />
      )}
      {children}
    </span>
  );
};
