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
        <circle cx="100" cy="40" r="12" fill="#E54C2E" />
        <circle cx="100" cy="40" r="8" fill="#f67a6b" opacity="0.6" />
        
        {/* Middle nodes */}
        <circle cx="60" cy="100" r="12" fill="#E54C2E" />
        <circle cx="60" cy="100" r="8" fill="#f67a6b" opacity="0.6" />
        
        <circle cx="140" cy="100" r="12" fill="#E54C2E" />
        <circle cx="140" cy="100" r="8" fill="#f67a6b" opacity="0.6" />
        
        {/* End node */}
        <circle cx="100" cy="160" r="12" fill="#E54C2E" />
        <circle cx="100" cy="160" r="8" fill="#f67a6b" opacity="0.6" />
      </g>
      
      {/* Connection lines */}
      <path
        d="M 100 52 L 60 88"
        stroke="#E54C2E"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.7"
      />
      <path
        d="M 100 52 L 140 88"
        stroke="#E54C2E"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.7"
      />
      <path
        d="M 72 100 L 128 100"
        stroke="#E54C2E"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.7"
      />
      <path
        d="M 100 148 L 100 160"
        stroke="#E54C2E"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.7"
      />
      
      {/* Sparkles */}
      <circle cx="85" cy="25" r="2" fill="#ec5140" opacity="0.8" />
      <circle cx="115" cy="25" r="2" fill="#ec5140" opacity="0.8" />
      <circle cx="45" cy="85" r="2" fill="#f67a6b" opacity="0.6" />
      <circle cx="155" cy="115" r="2" fill="#f67a6b" opacity="0.6" />
      <circle cx="85" cy="175" r="2" fill="#ec5140" opacity="0.8" />
      <circle cx="115" cy="175" r="2" fill="#ec5140" opacity="0.8" />
      
      {/* Gradient definitions */}
      <defs>
        <linearGradient id="gradient1" x1="100" y1="20" x2="100" y2="180">
          <stop offset="0%" stopColor="#E54C2E" />
          <stop offset="100%" stopColor="#ec5140" />
        </linearGradient>
        <linearGradient id="gradient2" x1="40" y1="100" x2="160" y2="100">
          <stop offset="0%" stopColor="#f67a6b" />
          <stop offset="100%" stopColor="#E54C2E" />
        </linearGradient>
      </defs>
    </svg>
  );
}

