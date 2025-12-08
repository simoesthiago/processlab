'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
    ChevronRight,
    LayoutDashboard,
    FileText,
    BarChart,
    Settings
} from 'lucide-react';

export function Navbar() {
    const pathname = usePathname();

    // Generate breadcrumbs based on pathname
    const getBreadcrumbs = () => {
        const crumbs = [
            {
                label: 'Dashboard',
        href: '/dashboard',
                icon: LayoutDashboard,
            }
        ];

        if (pathname === '/settings') {
            crumbs.push({ label: 'Settings', href: '/settings', icon: Settings });
        }

        return crumbs;
    };

    const breadcrumbs = getBreadcrumbs();

    return (
        <header className="flex h-16 items-center justify-between px-6 pt-4">
            {/* Breadcrumbs */}
            <div className="flex items-center gap-2 text-sm">
                {breadcrumbs.map((crumb, index) => (
                    <div key={index} className="flex items-center gap-2">
                        {index > 0 && (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                        <div className="flex items-center gap-2">
                            {crumb.icon && (
                                <crumb.icon className={cn("h-4 w-4", index === breadcrumbs.length - 1 ? "text-primary" : "text-muted-foreground")} />
                            )}
                            {crumb.href && index < breadcrumbs.length - 1 ? (
                                <Link
                                    href={crumb.href}
                                    className="text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {crumb.label}
                                </Link>
                            ) : (
                                <span className={index === breadcrumbs.length - 1 ? 'font-semibold text-foreground' : 'text-muted-foreground'}>
                                    {crumb.label}
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </header>
    );
}
