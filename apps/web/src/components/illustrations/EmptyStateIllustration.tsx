'use client';

import { cn } from '@/lib/utils';

interface EmptyStateIllustrationProps {
  className?: string;
  variant?: 'process' | 'document' | 'user' | 'chart';
}

export function EmptyStateIllustration({ 
  className, 
  variant = 'process' 
}: EmptyStateIllustrationProps) {
  const illustrations = {
    process: (
      <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={cn('w-full h-full', className)}>
        <circle cx="100" cy="100" r="60" fill="#f4f4f5" opacity="0.5" />
        <circle cx="70" cy="80" r="8" fill="#71717a" opacity="0.3" />
        <circle cx="130" cy="80" r="8" fill="#71717a" opacity="0.3" />
        <circle cx="100" cy="120" r="8" fill="#71717a" opacity="0.3" />
        <line x1="78" y1="80" x2="122" y2="80" stroke="#71717a" strokeWidth="2" opacity="0.2" />
        <line x1="100" y1="88" x2="100" y2="112" stroke="#71717a" strokeWidth="2" opacity="0.2" />
      </svg>
    ),
    document: (
      <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={cn('w-full h-full', className)}>
        <rect x="60" y="60" width="80" height="100" rx="4" fill="#f4f4f5" opacity="0.5" stroke="#71717a" strokeWidth="2" />
        <line x1="75" y1="85" x2="125" y2="85" stroke="#71717a" strokeWidth="2" opacity="0.2" />
        <line x1="75" y1="105" x2="125" y2="105" stroke="#71717a" strokeWidth="2" opacity="0.2" />
        <line x1="75" y1="125" x2="110" y2="125" stroke="#71717a" strokeWidth="2" opacity="0.2" />
      </svg>
    ),
    user: (
      <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={cn('w-full h-full', className)}>
        <circle cx="100" cy="80" r="30" fill="#f4f4f5" opacity="0.5" stroke="#71717a" strokeWidth="2" />
        <path d="M 50 160 Q 50 130 100 130 Q 150 130 150 160 L 150 180 L 50 180 Z" fill="#f4f4f5" opacity="0.5" stroke="#71717a" strokeWidth="2" />
      </svg>
    ),
    chart: (
      <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={cn('w-full h-full', className)}>
        <rect x="60" y="120" width="20" height="40" fill="#71717a" opacity="0.2" />
        <rect x="90" y="100" width="20" height="60" fill="#71717a" opacity="0.2" />
        <rect x="120" y="80" width="20" height="80" fill="#71717a" opacity="0.2" />
        <line x1="50" y1="160" x2="150" y2="160" stroke="#71717a" strokeWidth="2" opacity="0.2" />
        <line x1="50" y1="160" x2="50" y2="60" stroke="#71717a" strokeWidth="2" opacity="0.2" />
      </svg>
    ),
  };

  return illustrations[variant];
}

