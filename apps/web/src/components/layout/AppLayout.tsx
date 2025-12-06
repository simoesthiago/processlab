'use client';

import { Sidebar } from './Sidebar';
import { UserProfile } from './UserProfile';
import {
    LayoutDashboard,
    FileText,
    Settings,
    BarChart,
    Share2
} from 'lucide-react';

interface AppLayoutProps {
    children: React.ReactNode;
}

const generalNavigation = [
    {
        name: 'Overview',
        href: '/dashboard',
        icon: LayoutDashboard,
    },
    {
        name: 'Process Catalog',
        href: '/catalog',
        icon: FileText,
    },
    {
        name: 'Analytics',
        href: '/analytics',
        icon: BarChart,
    },
    {
        name: 'Shared with Me',
        href: '/shared',
        icon: Share2,
    },
    {
        name: 'Settings',
        href: '/settings',
        icon: Settings,
    },
];

export function AppLayout({ children }: AppLayoutProps) {
    return (
        <div className="flex h-screen w-full overflow-hidden bg-background">
            <Sidebar
                topComponent={<UserProfile />}
                navigationItems={generalNavigation}
            />
            <div className="flex flex-1 flex-col overflow-hidden">
                <main className="flex-1 overflow-y-auto bg-white">
                    {children}
                </main>
            </div>
        </div>
    );
}
