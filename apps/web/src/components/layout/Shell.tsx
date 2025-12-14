'use client';

/**
 * Shell Component
 * 
 * A simple container component for page layouts.
 */

import { cn } from '@/lib/utils';

interface ShellProps {
  children: React.ReactNode;
  className?: string;
}

export function Shell({ children, className }: ShellProps) {
  return (
    <div className={cn('flex flex-col min-h-screen', className)}>
      {children}
    </div>
  );
}

