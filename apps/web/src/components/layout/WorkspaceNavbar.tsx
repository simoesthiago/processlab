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
import { LogOut, User, ChevronRight, Bell } from 'lucide-react';

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

  // Generate breadcrumbs based on pathname
  const getBreadcrumbs = (): Array<{ label: string; href?: string }> => {
    const crumbs: Array<{ label: string; href?: string }> = [];

    // Add workspace name
    if (currentWorkspace) {
      crumbs.push({
        label: currentWorkspace.name,
        href: basePath,
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

        switch (segment) {
          case 'projects':
            label = 'Projects';
            href = `${basePath}/projects`;
            break;
          case 'new':
            label = 'New';
            break;
          case 'catalog':
            label = 'Catalog';
            href = `${basePath}/catalog`;
            break;
          case 'studio':
            label = 'Studio';
            href = `${basePath}/studio`;
            break;
          case 'members':
            label = 'Members';
            href = `${basePath}/members`;
            break;
          case 'settings':
            label = 'Settings';
            href = `${basePath}/settings`;
            break;
          case 'shared':
            label = 'Shared with Me';
            href = `${basePath}/shared`;
            break;
          case 'processes':
            label = 'Processes';
            break;
          default:
            label = segment.charAt(0).toUpperCase() + segment.slice(1);
        }

        crumbs.push({ label, href });
      });
    }

    return crumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-6">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm">
        {breadcrumbs.map((crumb, index) => (
          <div key={index} className="flex items-center gap-2">
            {index > 0 && (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
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
        ))}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* Notifications (placeholder) */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {/* Notification badge */}
          {/* <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground flex items-center justify-center">
            3
          </span> */}
        </Button>

        {/* User info */}
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

