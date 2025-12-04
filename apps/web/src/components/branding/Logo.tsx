'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';

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
  const getLogoPath = () => {
    switch (variant) {
      case 'vertical':
        return '/logo-vertical.svg';
      case 'icon':
        return '/logo-icon.svg';
      case 'horizontal':
      default:
        return '/logo-horizontal.svg';
    }
  };

  const defaultDimensions = {
    horizontal: { width: width || 200, height: height || 40 },
    vertical: { width: width || 120, height: height || 120 },
    icon: { width: width || 40, height: height || 40 },
  };

  const dimensions = defaultDimensions[variant];

  return (
    <Image
      src={getLogoPath()}
      alt="ProcessLab Logo"
      width={dimensions.width}
      height={dimensions.height}
      className={cn('object-contain', className)}
      priority
    />
  );
}

