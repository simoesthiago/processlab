'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastProps {
    message: string;
    type?: ToastType;
    isVisible: boolean;
    onClose: () => void;
    duration?: number;
}

const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
    ({ message, type = 'info', isVisible, onClose, duration = 3000 }, ref) => {
        React.useEffect(() => {
            if (isVisible && duration > 0) {
                const timer = setTimeout(() => {
                    onClose();
                }, duration);
                return () => clearTimeout(timer);
            }
        }, [isVisible, duration, onClose]);

        if (!isVisible) return null;

        const icons = {
            success: CheckCircle2,
            error: AlertCircle,
            warning: AlertTriangle,
            info: Info,
        };

        const variants = {
            success: 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800 text-green-900 dark:text-green-100',
            error: 'bg-destructive/10 border-destructive/20 text-destructive',
            warning: 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800 text-orange-900 dark:text-orange-100',
            info: 'bg-primary/10 border-primary/20 text-primary',
        };

        const iconColors = {
            success: 'text-green-600 dark:text-green-400',
            error: 'text-destructive',
            warning: 'text-orange-600 dark:text-orange-400',
            info: 'text-primary',
        };

        const Icon = icons[type];

        return (
            <div
                ref={ref}
                className={cn(
                    'fixed top-4 right-4 z-50 flex w-full max-w-md items-center gap-3 rounded-lg border p-4 shadow-lg transition-all',
                    'animate-in slide-in-from-top-2 fade-in-0',
                    variants[type]
                )}
                role="alert"
            >
                <Icon className={cn('h-5 w-5 flex-shrink-0', iconColors[type])} />
                <p className="text-sm font-medium flex-1">{message}</p>
                <button
                    onClick={onClose}
                    className="rounded-md p-1 text-muted-foreground hover:bg-background/50 transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
                    aria-label="Close"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>
        );
    }
);
Toast.displayName = 'Toast';

export { Toast };

