'use client';

/**
 * Personal Studio Redirect Page
 * 
 * This page redirects to the proper project-based studio URL.
 * Studio only exists within a project context.
 * 
 * Supports query params for backwards compatibility:
 * - project_id: Redirects to new process in that project
 * - process_id + project_id: Redirects to edit that process
 */

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function PersonalStudioRedirectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token, isAuthenticated, loading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  
  const processId = searchParams.get('process_id');
  const projectId = searchParams.get('project_id');

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      router.replace('/login?redirect=/personal/studio');
      return;
    }

    handleRedirect();
  }, [isAuthenticated, loading, token, processId, projectId]);

  const handleRedirect = async () => {
    // If both project and process are provided, redirect to edit
    if (projectId && processId) {
      router.replace(`/personal/projects/${projectId}/processes/${processId}`);
      return;
    }

    // If only project is provided, redirect to new process
    if (projectId) {
      router.replace(`/personal/projects/${projectId}/processes/new`);
      return;
    }

    // Otherwise, get default project
    try {
      const response = await fetch(`${API_URL}/api/v1/users/me/default-project`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const project = await response.json();
        if (processId) {
          router.replace(`/personal/projects/${project.id}/processes/${processId}`);
        } else {
          router.replace(`/personal/projects/${project.id}/processes/new`);
        }
        return;
      }

      // Create default project if not found
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

      // Fallback
      setError('Could not find project');
      setTimeout(() => router.replace('/personal/projects'), 2000);

    } catch (err) {
      console.error('Redirect failed:', err);
      setError('Redirecting to projects...');
      setTimeout(() => router.replace('/personal/projects'), 2000);
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="text-center">
        {error ? (
          <>
            <p className="text-sm text-muted-foreground mb-2">{error}</p>
          </>
        ) : (
          <>
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">
              Redirecting to your project...
            </p>
          </>
        )}
      </div>
    </div>
  );
}

