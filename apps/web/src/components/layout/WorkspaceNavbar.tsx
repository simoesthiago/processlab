'use client';

/**
 * Workspace Navbar Component
 * 
 * Top navigation bar for workspace pages.
 * Shows breadcrumbs and user info.
 */

import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  LogOut,
  User,
  ChevronRight,
  Bell,
  LayoutDashboard,
  FileText,
  FolderKanban,
  Sparkles,
  Settings,
  BarChart,
  Share2,
  Users
} from 'lucide-react';

export function WorkspaceNavbar() {
  const { user, logout } = useAuth();
  const { currentWorkspace, getWorkspaceBasePath } = useWorkspace();
  const router = useRouter();
  const pathname = usePathname();

  const basePath = getWorkspaceBasePath();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const getPageIcon = (segment: string) => {
    switch (segment) {
      case 'projects': return FolderKanban;
      case 'catalog': return FileText;
      case 'studio': return Sparkles;
      case 'analytics': return BarChart;
      case 'settings': return Settings;
      case 'shared': return Share2;
      case 'members': return Users;
      default: return LayoutDashboard;
    }
  };

  // Generate breadcrumbs based on pathname
  const getBreadcrumbs = (): Array<{ label: string; href?: string; icon?: any }> => {
    const crumbs: Array<{ label: string; href?: string; icon?: any }> = [];

    // Add workspace name (Dashboard/Overview)
    if (currentWorkspace) {
      crumbs.push({
        label: currentWorkspace.name,
        href: basePath,
        icon: LayoutDashboard,
      });
    }

    // Parse additional path segments
    if (pathname) {
      const relativePath = pathname.replace(basePath, '');
      const segments = relativePath.split('/').filter(Boolean);

      segments.forEach((segment, index) => {
        // Skip dynamic segments (IDs)
        if (segment.length === 36 && segment.includes('-')) {
          return;
        }

        let label = segment;
        let href: string | undefined;
        let icon: any = null;

        switch (segment) {
          case 'projects':
            label = 'Projects';
            href = `${basePath}/projects`;
            icon = FolderKanban;
            break;
          case 'new':
            label = 'New';
            break;
          case 'catalog':
            label = 'Catalog';
            href = `${basePath}/catalog`;
            icon = FileText;
            break;
          case 'studio':
            label = 'Studio';
            href = `${basePath}/studio`;
            icon = Sparkles;
            break;
          case 'members':
            label = 'Members';
            href = `${basePath}/members`;
            icon = Users;
            break;
          case 'settings':
            label = 'Settings';
            href = `${basePath}/settings`;
            icon = Settings;
            break;
          case 'shared':
            label = 'Shared with Me';
            href = `${basePath}/shared`;
            icon = Share2;
            break;
          case 'processes':
            label = 'Processes';
            break;
          case 'analytics':
            label = 'Analytics';
            href = `${basePath}/analytics`;
            icon = BarChart;
            break;
          default:
            label = segment.charAt(0).toUpperCase() + segment.slice(1);
        }

        crumbs.push({ label, href, icon });
      });
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

      {/* Right side - Removed as per design request */}
      <div className="flex items-center gap-4">
      </div>
    </header>
  );
}

