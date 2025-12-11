'use client';

import { useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useSpaces } from '@/contexts/SpacesContext';
import StudioContent from '@/features/bpmn/StudioContent';

export default function ProcessPage() {
  const params = useParams<{ spaceId: string; processId: string }>();
  const spaceId = params.spaceId;
  const processId = params.processId;
  const { selectSpace, loadTree, selectedSpaceId, trees } = useSpaces();
  const lastProcessedSpaceId = useRef<string | null>(null);

  useEffect(() => {
    // Only process if spaceId changed and is valid
    if (spaceId && spaceId !== lastProcessedSpaceId.current) {
      lastProcessedSpaceId.current = spaceId;
      
      // Only select if different from current
      if (spaceId !== selectedSpaceId) {
      selectSpace(spaceId);
      }
      
      // Only load tree if not already loaded
      if (!trees[spaceId]) {
      loadTree(spaceId);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spaceId]); // Only depend on spaceId to avoid infinite loops

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

