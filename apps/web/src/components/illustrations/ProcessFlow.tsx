'use client';

import { cn } from '@/lib/utils';

interface ProcessFlowProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function ProcessFlow({ className, size = 'md' }: ProcessFlowProps) {
  const sizeClasses = {
    sm: 'w-32 h-32',
    md: 'w-64 h-64',
    lg: 'w-96 h-96',
  };

  return (
    <svg
      className={cn(sizeClasses[size], className)}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background circles */}
      <circle cx="100" cy="100" r="80" fill="url(#gradient1)" opacity="0.1" />
      <circle cx="100" cy="100" r="60" fill="url(#gradient2)" opacity="0.15" />
      
      {/* Process nodes */}
      <g>
        {/* Start node */}
        <circle cx="100" cy="40" r="12" fill="#2563eb" />
        <circle cx="100" cy="40" r="8" fill="#60a5fa" opacity="0.6" />
        
        {/* Middle nodes */}
        <circle cx="60" cy="100" r="12" fill="#2563eb" />
        <circle cx="60" cy="100" r="8" fill="#60a5fa" opacity="0.6" />
        
        <circle cx="140" cy="100" r="12" fill="#2563eb" />
        <circle cx="140" cy="100" r="8" fill="#60a5fa" opacity="0.6" />
        
        {/* End node */}
        <circle cx="100" cy="160" r="12" fill="#2563eb" />
        <circle cx="100" cy="160" r="8" fill="#60a5fa" opacity="0.6" />
      </g>
      
      {/* Connection lines */}
      <path
        d="M 100 52 L 60 88"
        stroke="#2563eb"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.7"
      />
      <path
        d="M 100 52 L 140 88"
        stroke="#2563eb"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.7"
      />
      <path
        d="M 72 100 L 128 100"
        stroke="#2563eb"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.7"
      />
      <path
        d="M 100 148 L 100 160"
        stroke="#2563eb"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.7"
      />
      
      {/* Sparkles */}
      <circle cx="85" cy="25" r="2" fill="#3b82f6" opacity="0.8" />
      <circle cx="115" cy="25" r="2" fill="#3b82f6" opacity="0.8" />
      <circle cx="45" cy="85" r="2" fill="#60a5fa" opacity="0.6" />
      <circle cx="155" cy="115" r="2" fill="#60a5fa" opacity="0.6" />
      <circle cx="85" cy="175" r="2" fill="#3b82f6" opacity="0.8" />
      <circle cx="115" cy="175" r="2" fill="#3b82f6" opacity="0.8" />
      
      {/* Gradient definitions */}
      <defs>
        <linearGradient id="gradient1" x1="100" y1="20" x2="100" y2="180">
          <stop offset="0%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
        <linearGradient id="gradient2" x1="40" y1="100" x2="160" y2="100">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>
      </defs>
    </svg>
  );
}

