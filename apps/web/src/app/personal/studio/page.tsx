'use client';

/**
 * Studio Page (Personal Workspace)
 * 
 * BPMN Editor for the personal workspace.
 */

import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import StudioContent from '@/features/bpmn/StudioContent';

export default function PersonalStudioPage() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { getWorkspaceBasePath } = useWorkspace();
  
  const processId = searchParams.get('process_id');
  const projectId = searchParams.get('project_id');

  return (
    <StudioContent
      processId={processId || undefined}
      projectId={projectId || undefined}
      workspaceId={user?.id}
      workspaceType="personal"
      basePath={getWorkspaceBasePath()}
    />
  );
}

