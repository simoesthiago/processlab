'use client';

/**
 * Workspace Layout Component
 * 
 * Layout wrapper for workspace pages (org and personal).
 * Includes sidebar with workspace context.
 */

import { Sidebar } from './Sidebar';
import { WorkspaceSwitcher } from './WorkspaceSwitcher';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import {
  LayoutDashboard,
  FolderKanban,
  Settings,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';

interface WorkspaceLayoutProps {
  children: React.ReactNode;
}

export function WorkspaceLayout({ children }: WorkspaceLayoutProps) {
  const { getWorkspaceBasePath, canAdmin } = useWorkspace();
  const basePath = getWorkspaceBasePath();

  const workspaceNavigation = [
    {
      name: 'Dashboard',
      href: basePath,
      icon: LayoutDashboard,
      exact: true,
    },
    {
      name: 'Projects',
      href: `${basePath}/projects`,
      icon: FolderKanban,
    },
    {
      name: 'Settings',
      href: `${basePath}/settings`,
      icon: Settings,
      // Only show settings if user can admin, but for now we'll filter in the map or just show it
      // The sidebar doesn't support conditional rendering per item easily without logic there
      // For now, let's keep it simple as per requirements. 
      // If we need to hide it, we should filter this array.
    },
  ].filter(item => item.name !== 'Settings' || canAdmin());

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <Sidebar
        topComponent={
          <div className="p-4 space-y-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-1"
            >
              <ArrowLeft className="h-3 w-3" />
              Back to Overview
            </Link>
            <WorkspaceSwitcher />
          </div>
        }
        navigationItems={workspaceNavigation}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* WorkspaceNavbar removed as per requirements */}
        <main className="flex-1 overflow-y-auto bg-white">
          {children}
        </main>
      </div>
    </div>
  );
}

