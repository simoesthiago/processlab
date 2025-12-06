'use client';

/**
 * Process Studio Page (Personal Workspace)
 * 
 * BPMN Editor for editing a specific process within a personal project.
 * This is the main canvas/studio where users create and edit processes.
 */

import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import StudioContent from '@/features/bpmn/StudioContent';

interface PageProps {
  params: { projectId: string; processId: string };
}

export default function PersonalProcessStudioPage({ params }: PageProps) {
  const { projectId, processId } = params;
  const { user } = useAuth();
  const { getWorkspaceBasePath } = useWorkspace();

  return (
    <StudioContent
      processId={processId}
      projectId={projectId}
      workspaceId={user?.id}
      workspaceType="personal"
      basePath={getWorkspaceBasePath()}
    />
  );
}

