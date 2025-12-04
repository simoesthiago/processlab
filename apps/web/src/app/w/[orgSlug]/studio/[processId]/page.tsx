'use client';

/**
 * Studio Page with Process ID (Organization Workspace)
 * 
 * BPMN Editor for editing a specific process.
 */

import { use } from 'react';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import StudioContent from '@/features/bpmn/StudioContent';

interface PageProps {
  params: Promise<{ orgSlug: string; processId: string }>;
}

export default function OrganizationStudioProcessPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const { currentWorkspace, getWorkspaceBasePath } = useWorkspace();

  return (
    <StudioContent
      processId={resolvedParams.processId}
      workspaceId={currentWorkspace?.id}
      workspaceType={currentWorkspace?.type}
      basePath={getWorkspaceBasePath()}
    />
  );
}

