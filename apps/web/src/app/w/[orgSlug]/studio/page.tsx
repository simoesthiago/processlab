'use client';

/**
 * Organization Studio Redirect Page
 * 
 * This page redirects to the proper project-based studio URL.
 * Studio only exists within a project context.
 * 
 * Supports query params for backwards compatibility:
 * - project_id: Redirects to new process in that project
 * - process_id + project_id: Redirects to edit that process
 */

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function OrganizationStudioRedirectPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { token, isAuthenticated, loading: authLoading } = useAuth();
  const { currentWorkspace, loading: workspaceLoading, getWorkspaceBasePath } = useWorkspace();
  const [error, setError] = useState<string | null>(null);
  
  const processId = searchParams.get('process_id');
  const projectId = searchParams.get('project_id');
  const orgSlug = params.orgSlug as string;

  useEffect(() => {
    if (authLoading || workspaceLoading) return;
    if (!isAuthenticated) {
      router.replace(`/login?redirect=/w/${orgSlug}/studio`);
      return;
    }

    handleRedirect();
  }, [isAuthenticated, authLoading, workspaceLoading, token, processId, projectId, currentWorkspace]);

  const handleRedirect = async () => {
    const basePath = getWorkspaceBasePath();

    // If both project and process are provided, redirect to edit
    if (projectId && processId) {
      router.replace(`${basePath}/projects/${projectId}/processes/${processId}`);
      return;
    }

    // If only project is provided, redirect to new process
    if (projectId) {
      router.replace(`${basePath}/projects/${projectId}/processes/new`);
      return;
    }

    // Otherwise redirect to projects page - organization doesn't have default project
    setError('Please select a project first');
    setTimeout(() => router.replace(`${basePath}/projects`), 1500);
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="text-center">
        {error ? (
          <>
            <p className="text-sm text-muted-foreground mb-2">{error}</p>
            <p className="text-xs text-muted-foreground/60">
              Redirecting to projects...
            </p>
          </>
        ) : (
          <>
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">
              Redirecting...
            </p>
          </>
        )}
      </div>
    </div>
  );
}

