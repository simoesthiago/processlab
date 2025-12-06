'use client';

/**
 * Organization Studio Process Redirect Page
 * 
 * Redirects to the proper project-based studio URL.
 * Fetches the process to find its project and redirects accordingly.
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface PageProps {
  params: { orgSlug: string; processId: string };
}

export default function OrganizationStudioProcessRedirectPage({ params }: PageProps) {
  const { orgSlug, processId } = params;
  const router = useRouter();
  const { token, isAuthenticated, loading: authLoading } = useAuth();
  const { getWorkspaceBasePath, loading: workspaceLoading } = useWorkspace();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || workspaceLoading) return;
    if (!isAuthenticated) {
      router.replace(`/login?redirect=/w/${orgSlug}/studio/${processId}`);
      return;
    }

    fetchProcessAndRedirect();
  }, [isAuthenticated, authLoading, workspaceLoading, token, processId, orgSlug]);

  const fetchProcessAndRedirect = async () => {
    const basePath = getWorkspaceBasePath();
    
    try {
      const response = await fetch(`${API_URL}/api/v1/processes/${processId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const process = await response.json();
        router.replace(`${basePath}/projects/${process.project_id}/processes/${process.id}`);
        return;
      }

      setError('Process not found');
      setTimeout(() => router.replace(`${basePath}/projects`), 2000);

    } catch (err) {
      console.error('Failed to fetch process:', err);
      setError('Redirecting...');
      setTimeout(() => router.replace(`${basePath}/projects`), 2000);
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="text-center">
        {error ? (
          <p className="text-sm text-muted-foreground">{error}</p>
        ) : (
          <>
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">
              Loading process...
            </p>
          </>
        )}
      </div>
    </div>
  );
}

