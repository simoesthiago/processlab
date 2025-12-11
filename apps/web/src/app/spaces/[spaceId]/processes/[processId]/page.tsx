'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useSpaces } from '@/contexts/SpacesContext';
import StudioContent from '@/features/bpmn/StudioContent';

export default function ProcessPage() {
  const params = useParams<{ spaceId: string; processId: string }>();
  const spaceId = params.spaceId;
  const processId = params.processId;
  const { selectSpace, loadTree } = useSpaces();

  useEffect(() => {
    if (spaceId) {
      selectSpace(spaceId);
      loadTree(spaceId);
    }
  }, [spaceId, selectSpace, loadTree]);

  // Determine workspace type
  const workspaceType = spaceId === 'private' ? 'personal' : 'organization';

  return (
    <StudioContent
      processId={processId}
      workspaceId={spaceId}
      workspaceType={workspaceType}
      basePath={`/spaces/${spaceId}`}
    />
  );
}

