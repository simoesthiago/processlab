'use client';

/**
 * Personal Workspace Layout
 * 
 * Layout wrapper for personal workspace pages.
 * Sets up the personal workspace context.
 */

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import ProtectedRoute from '@/components/ProtectedRoute';

interface PersonalLayoutProps {
  children: React.ReactNode;
}

export default function PersonalLayout({ children }: PersonalLayoutProps) {
  return (
    <ProtectedRoute>
      <PersonalLayoutContent>
        {children}
      </PersonalLayoutContent>
    </ProtectedRoute>
  );
}

function PersonalLayoutContent({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { currentWorkspace, setCurrentWorkspace, loading } = useWorkspace();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (loading || !user) return;

    // Ensure personal workspace is selected
    if (!currentWorkspace || currentWorkspace.type !== 'personal') {
      setCurrentWorkspace({
        type: 'personal',
        id: user.id,
        name: 'Personal',
        slug: 'personal',
        role: 'owner',
      });
    }

    setIsInitialized(true);
  }, [user, currentWorkspace, setCurrentWorkspace, loading]);

  // Show loading while initializing
  if (loading || !isInitialized) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading personal workspace...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

