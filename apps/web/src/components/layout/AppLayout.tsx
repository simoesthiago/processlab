'use client';

import { SpacesSidebar } from './SpacesSidebar';
import ProtectedRoute from '@/components/ProtectedRoute';
import { cn } from '@/lib/utils';
import { SpacesProvider } from '@/contexts/SpacesContext';

interface AppLayoutProps {
    children: React.ReactNode;
    mainClassName?: string;
}

export function AppLayout({
    children,
    mainClassName,
}: AppLayoutProps) {
    return (
        <ProtectedRoute>
            <SpacesProvider>
                <div className="min-h-screen bg-white">
                    <SpacesSidebar />
                    <main className={cn('ml-72 min-h-screen bg-white', mainClassName)}>
                        {children}
                    </main>
                </div>
            </SpacesProvider>
        </ProtectedRoute>
    );
}
