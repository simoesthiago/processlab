'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

import { useAuth } from '@/contexts/AuthContext';
import {
    Menu,
    X,
} from 'lucide-react';



export interface NavigationItem {
    name: string;
    href: string;
    icon: any;
    exact?: boolean;
}

interface SidebarProps {
    topComponent?: React.ReactNode;
    navigationItems: NavigationItem[];
}

export function Sidebar({ topComponent, navigationItems }: SidebarProps) {
    const pathname = usePathname();
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    return (
        <>
            {/* Mobile menu button */}
            <div className="lg:hidden fixed top-4 left-4 z-50">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsMobileOpen(!isMobileOpen)}
                    className="bg-card border shadow-sm"
                >
                    {isMobileOpen ? (
                        <X className="h-5 w-5" />
                    ) : (
                        <Menu className="h-5 w-5" />
                    )}
                </Button>
            </div>

            {/* Mobile overlay */}
            {isMobileOpen && (
                <div
                    className="lg:hidden fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div
                className={cn(
                    'fixed lg:static inset-y-0 left-0 z-50 flex h-full w-72 flex-col bg-card transition-transform duration-300 ease-in-out border-r border-gray-100',
                    isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
                )}
            >
                {/* Top Component (Profile or Workspace Switcher) */}
                {topComponent}

                {/* Navigation */}
                <nav className="flex-1 space-y-1 overflow-y-auto px-3">
                    {navigationItems.map((item) => {
                        const isActive = item.exact
                            ? pathname === item.href
                            : pathname === item.href || pathname?.startsWith(item.href + '/');

                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                onClick={() => setIsMobileOpen(false)}
                                className={cn(
                                    'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-200',
                                    isActive
                                        ? 'bg-orange-50 text-orange-600'
                                        : 'text-gray-600 hover:bg-accent hover:text-accent-foreground'
                                )}
                            >
                                <item.icon className="h-5 w-5" />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>
            </div>
        </>
    );
}
