'use client';

import * as React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { LucideIcon } from 'lucide-react';

export interface EmptyStateProps {
    icon?: LucideIcon;
    title: string;
    description: string;
    action?: {
        label: string;
        onClick: () => void;
        href?: string;
    };
    className?: string;
}

const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
    ({ icon: Icon, title, description, action, className }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(
                    'flex flex-col items-center justify-center py-12 px-4 text-center',
                    className
                )}
            >
                {Icon && (
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                        <Icon className="h-8 w-8 text-muted-foreground" />
                    </div>
                )}
                <h3 className="text-lg font-semibold text-foreground mb-2">
                    {title}
                </h3>
                <p className="text-sm text-muted-foreground max-w-sm mb-6">
                    {description}
                </p>
                {action && (
                    <div>
                        {action.href ? (
                            <Link href={action.href}>
                                <Button>
                                    {action.label}
                                </Button>
                            </Link>
                        ) : (
                            <Button onClick={action.onClick}>
                                {action.label}
                            </Button>
                        )}
                    </div>
                )}
            </div>
        );
    }
);
EmptyState.displayName = 'EmptyState';

export { EmptyState };

