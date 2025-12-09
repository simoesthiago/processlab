'use client';

import { useEffect, useState } from 'react';
import { SpacesSidebar } from './SpacesSidebar';
import ProtectedRoute from '@/components/ProtectedRoute';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
    children: React.ReactNode;
    mainClassName?: string;
}

export function AppLayout({
    children,
    mainClassName,
}: AppLayoutProps) {
    const [collapsed, setCollapsed] = useState(false);

    // persist sidebar state across navigations
    useEffect(() => {
        const stored = typeof window !== 'undefined' ? window.localStorage.getItem('sidebar-collapsed') : null;
        if (stored !== null) {
            setCollapsed(stored === 'true');
        }
    }, []);

    const handleToggle = () => {
        setCollapsed((prev) => {
            const next = !prev;
            if (typeof window !== 'undefined') {
                window.localStorage.setItem('sidebar-collapsed', String(next));
            }
            return next;
        });
    };

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-white">
                <SpacesSidebar
                    collapsed={collapsed}
                    onToggleCollapsed={handleToggle}
                />
                <main
                    className={cn(
                        'min-h-screen bg-white transition-[margin] duration-200',
                        collapsed ? 'ml-14' : 'ml-72',
                        mainClassName
                    )}
                >
                    {children}
                </main>
            </div>
        </ProtectedRoute>
    );
}
