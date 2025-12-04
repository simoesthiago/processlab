'use client';

import { useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
    message: string;
    type?: ToastType;
    isVisible: boolean;
    onClose: () => void;
    duration?: number;
}

export default function Toast({
    message,
    type = 'info',
    isVisible,
    onClose,
    duration = 3000
}: ToastProps) {
    useEffect(() => {
        if (isVisible && duration > 0) {
            const timer = setTimeout(() => {
                onClose();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [isVisible, duration, onClose]);

    if (!isVisible) return null;

    const typeStyles = {
        success: 'bg-green-500 text-white border-green-600',
        error: 'bg-red-500 text-white border-red-600',
        warning: 'bg-orange-500 text-white border-orange-600',
        info: 'bg-blue-500 text-white border-blue-600',
    };

    return (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2">
            <div className={`px-4 py-3 rounded-lg shadow-lg border ${typeStyles[type]} max-w-md`}>
                <div className="flex items-center justify-between gap-4">
                    <p className="text-sm font-medium">{message}</p>
                    <button
                        onClick={onClose}
                        className="text-white/80 hover:text-white transition-colors"
                    >
                        ✕
                    </button>
                </div>
            </div>
        </div>
    );
}

