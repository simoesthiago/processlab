'use client';

/**
 * Process Studio Page (Organization Workspace)
 * 
 * BPMN Editor for editing a specific process within an organization project.
 * This is the main canvas/studio where users create and edit processes.
 */

import { use } from 'react';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import StudioContent from '@/features/bpmn/StudioContent';

interface PageProps {
  params: Promise<{ orgSlug: string; projectId: string; processId: string }>;
}

export default function OrganizationProcessStudioPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const { currentWorkspace, getWorkspaceBasePath } = useWorkspace();

  return (
    <StudioContent
      processId={resolvedParams.processId}
      projectId={resolvedParams.projectId}
      workspaceId={currentWorkspace?.id}
      workspaceType={currentWorkspace?.type}
      basePath={getWorkspaceBasePath()}
    />
  );
}

