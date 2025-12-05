'use client';

/**
 * Settings Layout for ProcessLab
 * 
 * Provides navigation sidebar for settings pages.
 */

import { usePathname, useParams } from 'next/navigation';
import Link from 'next/link';
import { Shell } from '@/components/layout/Shell';
import { cn } from '@/lib/utils';
import { 
  Settings, 
  Users, 
  Key, 
  Shield, 
  Building2,
  ScrollText 
} from 'lucide-react';

interface SettingsLayoutProps {
  children: React.ReactNode;
}

const settingsNav = [
  {
    title: 'Organization',
    href: '/settings',
    icon: Building2,
    description: 'General organization settings',
  },
  {
    title: 'Members',
    href: '/settings/members',
    icon: Users,
    description: 'Manage team members and invitations',
  },
  {
    title: 'API Keys',
    href: '/settings/api-keys',
    icon: Key,
    description: 'Manage API keys and integrations',
  },
  {
    title: 'Audit Log',
    href: '/settings/audit-log',
    icon: ScrollText,
    description: 'View security and activity logs',
  },
];

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  const pathname = usePathname();
  const params = useParams();
  const orgSlug = params?.orgSlug as string;
  const basePath = `/w/${orgSlug}`;

  return (
    <Shell>
      <div className="flex flex-col gap-8 md:flex-row">
        {/* Settings Navigation Sidebar */}
        <aside className="w-full md:w-64 shrink-0">
          <nav className="space-y-1">
            {settingsNav.map((item) => {
              const href = `${basePath}${item.href}`;
              const isActive = pathname === href || 
                (item.href !== '/settings' && pathname?.startsWith(href));
              
              return (
                <Link
                  key={item.href}
                  href={href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.title}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Settings Content */}
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </Shell>
  );
}

