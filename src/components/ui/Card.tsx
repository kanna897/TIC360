import React from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glass?: boolean;
  glow?: 'blue' | 'emerald' | 'purple' | 'none';
}

export const Card = ({
  className,
  children,
  glass = true,
  glow = 'none',
  ...props
}: CardProps) => {
  const glowClasses = {
    blue: 'glass-panel-glow',
    emerald: 'border border-emerald-500/30 shadow-lg shadow-emerald-500/10',
    purple: 'border border-purple-500/30 shadow-lg shadow-purple-500/10',
    none: '',
  };

  return (
    <div
      className={cn(
        'rounded-2xl transition-all duration-300',
        glass ? 'glass-panel' : 'bg-slate-900 border border-slate-800',
        glowClasses[glow],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('p-6 pb-3 flex flex-col space-y-1.5', className)} {...props}>
    {children}
  </div>
);

export const CardTitle = ({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h3 className={cn('text-lg font-bold tracking-tight text-white light:text-slate-900', className)} {...props}>
    {children}
  </h3>
);

export const CardDescription = ({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className={cn('text-xs text-slate-400 light:text-slate-500', className)} {...props}>
    {children}
  </p>
);

export const CardContent = ({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('p-6 pt-3', className)} {...props}>
    {children}
  </div>
);

export const CardFooter = ({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('p-6 pt-0 flex items-center', className)} {...props}>
    {children}
  </div>
);
