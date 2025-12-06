'use client';

import { cn } from '@/lib/utils';
import Image from 'next/image';

interface LogoProps {
  variant?: 'horizontal' | 'vertical' | 'icon';
  className?: string;
  width?: number;
  height?: number;
  showText?: boolean;
}

export function Logo({ 
  variant = 'horizontal', 
  className,
  width,
  height,
  showText = true 
}: LogoProps) {
  
  // Default dimensions based on variant
  const defaultDimensions = {
    horizontal: { width: 180, height: 40 },
    vertical: { width: 120, height: 120 },
    icon: { width: 40, height: 40 },
  };
  
  // Use provided dimensions or defaults
  const finalWidth = width || defaultDimensions[variant]?.width || 40;
  const finalHeight = height || defaultDimensions[variant]?.height || 40;

  const iconSize = variant === 'icon' ? finalHeight : finalHeight;
  const textSize = finalHeight * 0.7;

  return (
    <div 
      className={cn(
        'flex items-center gap-3 select-none',
        variant === 'vertical' && 'flex-col text-center gap-4',
        className
      )}
      style={{ width: variant === 'icon' ? iconSize : 'auto' }}
    >
      {/* ProcessLab Logo Image */}
      <Image
        src="/processlab_logo.png"
        alt="ProcessLab Logo"
        width={iconSize}
        height={iconSize}
        className="shrink-0"
        priority
      />

      {/* Text Part */}
      {variant !== 'icon' && showText && (
        <span 
          className="font-semibold tracking-tight text-foreground"
          style={{ fontSize: textSize, lineHeight: 1 }}
        >
          ProcessLab
        </span>
      )}
    </div>
  );
}
