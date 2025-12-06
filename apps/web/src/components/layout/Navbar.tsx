'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Logo } from '@/components/branding/Logo';
import { LogOut, User } from 'lucide-react';

export function Navbar() {
    const { user, logout } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    // Generate breadcrumbs based on pathname
    const getBreadcrumbs = () => {
        if (pathname === '/dashboard') return 'Overview';
        if (pathname === '/catalog') return 'Process Catalog';
        if (pathname === '/analytics') return 'Analytics';
        if (pathname === '/settings') return 'Settings';
        if (pathname?.startsWith('/projects/')) {
            const parts = pathname.split('/');
            if (parts.length === 3 && parts[2] === 'new') return 'New Project';
            if (parts.length === 4 && parts[3] === 'processes') return 'Project Processes';
            return 'Project';
        }
        if (pathname === '/studio') return 'BPMN Studio';
        return 'ProcessLab';
    };

    return (
        <header className="flex h-16 items-center justify-between border-b bg-card px-6">
            <div className="flex items-center gap-4">
                <Link href="/dashboard" className="flex items-center">
                    <Logo variant="icon" width={32} height={32} className="mr-3" />
                </Link>
                <h2 className="text-lg font-semibold tracking-tight text-foreground">
                    {getBreadcrumbs()}
                </h2>
            </div>

            <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                            <User className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-foreground">
                                {user?.full_name || user?.email}
                            </span>
                            {user?.role && (
                                <Badge variant="secondary" className="text-xs w-fit">
                                    {user.role}
                                </Badge>
                            )}
                        </div>
                    </div>
                </div>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                </Button>
            </div>
        </header>
    );
}
