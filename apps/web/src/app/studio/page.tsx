'use client';

/**
 * Studio Page - Redirect to Default Project
 * 
 * The /studio route redirects to the default "Drafts" project in personal workspace.
 * Studio only exists within a project context, similar to how code only exists
 * within repositories on GitHub.
 * 
 * Flow:
 * 1. Check if user has a default project
 * 2. If not, create one automatically
 * 3. Redirect to the project's process creation page
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function StudioRedirectPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading, token } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Wait for auth to load
    if (authLoading) return;

    // If not authenticated, redirect to login
    if (!isAuthenticated) {
      router.replace('/login?redirect=/studio');
      return;
    }

    // Find or create default project and redirect
    findOrCreateDefaultProject();
  }, [isAuthenticated, authLoading, token]);

  const findOrCreateDefaultProject = async () => {
    if (!token) return;

    try {
      // Try to get the default project
      const response = await fetch(`${API_URL}/api/v1/users/me/default-project`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const project = await response.json();
        // Redirect to create new process in the default project
        router.replace(`/personal/projects/${project.id}/processes/new`);
        return;
      }

      // If no default project, create one
      if (response.status === 404) {
        const createResponse = await fetch(`${API_URL}/api/v1/users/me/default-project`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        if (createResponse.ok) {
          const project = await createResponse.json();
          router.replace(`/personal/projects/${project.id}/processes/new`);
          return;
        }
      }

      // Fallback: redirect to projects page if something goes wrong
      setError('Could not access default project');
      setTimeout(() => router.replace('/personal/projects'), 2000);

    } catch (err) {
      console.error('Failed to get/create default project:', err);
      setError('Failed to load. Redirecting to projects...');
      setTimeout(() => router.replace('/personal/projects'), 2000);
    }
  };

  // Show loading state while determining redirect
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="text-center">
        {error ? (
          <>
            <p className="text-sm text-destructive mb-2">{error}</p>
            <p className="text-xs text-muted-foreground">
              Redirecting...
            </p>
          </>
        ) : (
          <>
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">
              Preparing your workspace...
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Setting up your default project
            </p>
          </>
        )}
      </div>
    </div>
  );
}
