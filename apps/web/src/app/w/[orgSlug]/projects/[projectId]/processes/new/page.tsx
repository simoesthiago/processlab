'use client';

/**
 * New Process Page (Organization Workspace)
 * 
 * Creates a new process within an organization project.
 * Opens the Studio with a blank canvas for the user to start creating.
 */

import { useWorkspace } from '@/contexts/WorkspaceContext';
import StudioContent from '@/features/bpmn/StudioContent';

interface PageProps {
  params: { orgSlug: string; projectId: string };
}

export default function NewOrganizationProcessPage({ params }: PageProps) {
  const { projectId } = params;
  const { currentWorkspace, getWorkspaceBasePath } = useWorkspace();

  return (
    <StudioContent
      projectId={projectId}
      workspaceId={currentWorkspace?.id}
      workspaceType={currentWorkspace?.type}
      basePath={getWorkspaceBasePath()}
    />
  );
}

