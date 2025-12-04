'use client';

/**
 * Studio Page with Process ID (Personal Workspace)
 * 
 * BPMN Editor for editing a specific personal process.
 */

import { use } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import StudioContent from '@/features/bpmn/StudioContent';

interface PageProps {
  params: Promise<{ processId: string }>;
}

export default function PersonalStudioProcessPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const { user } = useAuth();
  const { getWorkspaceBasePath } = useWorkspace();

  return (
    <StudioContent
      processId={resolvedParams.processId}
      workspaceId={user?.id}
      workspaceType="personal"
      basePath={getWorkspaceBasePath()}
    />
  );
}

