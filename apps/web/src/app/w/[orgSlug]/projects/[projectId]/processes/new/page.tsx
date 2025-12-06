'use client';

/**
 * New Process Page (Organization Workspace)
 * 
 * Creates a new process within an organization project.
 * Opens the Studio with a blank canvas for the user to start creating.
 */

import { use } from 'react';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import StudioContent from '@/features/bpmn/StudioContent';

interface PageProps {
  params: Promise<{ orgSlug: string; projectId: string }>;
}

export default function NewOrganizationProcessPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const { currentWorkspace, getWorkspaceBasePath } = useWorkspace();

  return (
    <StudioContent
      projectId={resolvedParams.projectId}
      workspaceId={currentWorkspace?.id}
      workspaceType={currentWorkspace?.type}
      basePath={getWorkspaceBasePath()}
    />
  );
}

