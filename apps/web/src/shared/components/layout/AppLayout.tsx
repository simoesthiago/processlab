'use client';

import { useEffect, useState } from 'react';
import { SpacesSidebar } from './SpacesSidebar';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
    children: React.ReactNode;
    mainClassName?: string;
}

export function AppLayout({
    children,
    mainClassName,
}: AppLayoutProps) {
    const [collapsed, setCollapsed] = useState<boolean>(() => {
        if (typeof window === 'undefined') return false;
        const stored = window.localStorage.getItem('sidebar-collapsed');
        return stored === 'true';
    });

    const handleToggle = () => {
        setCollapsed((prev) => {
            const next = !prev;
            if (typeof window !== 'undefined') {
                window.localStorage.setItem('sidebar-collapsed', String(next));
            }
            return next;
        });
    };

    const sidebarWidth = collapsed ? '3.5rem' : '18rem' // w-14 vs w-72
    const gutter = '2.5rem' // 40px - spacing between sidebar and content

    return (
        <div className="min-h-screen bg-white">
            <SpacesSidebar
                collapsed={collapsed}
                onToggleCollapsed={handleToggle}
            />
            <main
                className={cn(
                    'min-h-screen bg-white transition-[padding-left] duration-200',
                    mainClassName
                )}
                style={{ paddingLeft: `calc(${sidebarWidth} + ${gutter})` }}
            >
                {children}
            </main>
        </div>
    );
}
