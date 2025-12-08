'use client';

/**
 * Workspace Layout Component
 * 
 * Layout wrapper for workspace pages (org and personal).
 * Includes sidebar with workspace context.
 */

import { Sidebar } from './Sidebar';
import { WorkspaceSwitcher } from './WorkspaceSwitcher';
import { UserProfile } from './UserProfile';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useAuth } from '@/contexts/AuthContext';
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
  const { logout } = useAuth();
  const basePath = getWorkspaceBasePath();

  const workspaceNavigation = [
    {
      name: 'Dashboard',
      href: basePath,
      icon: LayoutDashboard,
      exact: true,
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
    {
      name: 'Classification Framework',
      href: '/classification-framework',
      icon: FolderKanban,
    },
  ].filter(item => {
    if (item.name === 'Settings') return canAdmin();
    return true;
  });

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <Sidebar
        topComponent={
          <div className="px-3 py-4">
            <div className="mb-2">
              <button
                onClick={() => logout()}
                className="flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-slate-600 transition-colors px-2 py-1.5"
              >
                <ArrowLeft className="h-4 w-4" />
                Logout
              </button>
            </div>

            <div className="mb-10">
              <UserProfile />
            </div>

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

