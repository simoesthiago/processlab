'use client';

/**
 * Studio Page (Organization Workspace)
 * 
 * BPMN Editor for the organization workspace.
 * Can create new processes or edit existing ones.
 */

import { useSearchParams } from 'next/navigation';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import StudioContent from '@/features/bpmn/StudioContent';

export default function OrganizationStudioPage() {
  const searchParams = useSearchParams();
  const { currentWorkspace, getWorkspaceBasePath } = useWorkspace();
  
  const processId = searchParams.get('process_id');
  const projectId = searchParams.get('project_id');

  return (
    <StudioContent
      processId={processId || undefined}
      projectId={projectId || undefined}
      workspaceId={currentWorkspace?.id}
      workspaceType={currentWorkspace?.type}
      basePath={getWorkspaceBasePath()}
    />
  );
}

