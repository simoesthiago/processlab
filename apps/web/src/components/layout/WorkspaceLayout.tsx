'use client';

/**
 * Workspace Layout Component
 * 
 * Layout wrapper for workspace pages (org and personal).
 * Includes sidebar with workspace context.
 */

import { WorkspaceSidebar } from './WorkspaceSidebar';
import { WorkspaceNavbar } from './WorkspaceNavbar';

interface WorkspaceLayoutProps {
  children: React.ReactNode;
}

export function WorkspaceLayout({ children }: WorkspaceLayoutProps) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <WorkspaceSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <WorkspaceNavbar />
        <main className="flex-1 overflow-y-auto bg-white">
          {children}
        </main>
      </div>
    </div>
  );
}

