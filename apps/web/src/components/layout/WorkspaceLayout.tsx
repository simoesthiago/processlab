'use client';

/**
 * Workspace Layout Component
 * 
 * Layout wrapper for workspace pages (org and personal).
 * Includes sidebar with workspace context.
 */

import { Sidebar } from './Sidebar';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  FolderKanban,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';

interface WorkspaceLayoutProps {
  children: React.ReactNode;
}

export function WorkspaceLayout({ children }: WorkspaceLayoutProps) {
  const { logout } = useAuth();

  const workspaceNavigation = [
    {
      name: 'Private Space',
      href: '/spaces/private',
      icon: LayoutDashboard,
      exact: true,
    },
    {
      name: 'Classification Framework',
      href: '/classification-framework',
      icon: FolderKanban,
    },
  ];

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

