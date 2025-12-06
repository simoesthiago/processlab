'use client';

/**
 * New Process Page (Personal Workspace)
 * 
 * Creates a new process within a personal project.
 * Opens the Studio with a blank canvas for the user to start creating.
 */

import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import StudioContent from '@/features/bpmn/StudioContent';

interface PageProps {
  params: { projectId: string };
}

export default function NewPersonalProcessPage({ params }: PageProps) {
  const { projectId } = params;
  const { user } = useAuth();
  const { getWorkspaceBasePath } = useWorkspace();

  return (
    <StudioContent
      projectId={projectId}
      workspaceId={user?.id}
      workspaceType="personal"
      basePath={getWorkspaceBasePath()}
    />
  );
}

