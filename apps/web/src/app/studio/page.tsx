'use client';

/**
 * Studio Page - Redirect
 * 
 * The /studio route now redirects to the appropriate workspace context.
 * This ensures users are always working within a proper workspace context
 * (personal, organization, or shared) for proper file organization,
 * permissions, and collaboration features.
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useAuth } from '@/contexts/AuthContext';

export default function StudioRedirectPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { currentWorkspace, loading: workspaceLoading, getWorkspaceBasePath } = useWorkspace();

  useEffect(() => {
    // Wait for auth and workspace to load
    if (authLoading || workspaceLoading) return;

    // If not authenticated, redirect to login
    if (!isAuthenticated) {
      router.replace('/login?redirect=/studio');
      return;
    }

    // Redirect to the appropriate workspace studio
    const basePath = getWorkspaceBasePath();
    router.replace(`${basePath}/studio`);
  }, [isAuthenticated, authLoading, workspaceLoading, currentWorkspace, router, getWorkspaceBasePath]);

  // Show loading state while determining redirect
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent mx-auto mb-4" />
        <p className="text-sm text-muted-foreground">
          Loading Studio...
        </p>
        <p className="text-xs text-muted-foreground/60 mt-1">
          Redirecting to your workspace
        </p>
      </div>
    </div>
  );
}
