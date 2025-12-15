'use client';

import { useEffect, useState } from 'react';
import { useSpaces } from '@/contexts/SpacesContext';
import { BreadcrumbItem, Breadcrumbs } from '@/components/ui/breadcrumbs';
import { FolderOpen, Lock } from 'lucide-react';

interface FolderBreadcrumbsProps {
  spaceId: string;
  folderId: string | null;
  spaceName?: string;
}

export function FolderBreadcrumbs({ spaceId, folderId, spaceName }: FolderBreadcrumbsProps) {
  const { getFolderPath, getFolder } = useSpaces();
  const currentFolder = folderId ? getFolder(spaceId, folderId) : null;
  const [path, setPath] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!folderId) {
      setPath([]);
      return;
    }

    let isMounted = true;
    setLoading(true);

    getFolderPath(spaceId, folderId)
      .then((p) => {
        if (isMounted) setPath(p || []);
      })
      .catch((err) => {
        console.error('Failed to load folder path:', err);
        if (isMounted) setPath([]);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, [spaceId, folderId, getFolderPath]);

  // Construct full breadcrumb list
  // 1. Root Space
  const fullItems: BreadcrumbItem[] = [
    {
      label: spaceName === 'Private Space' || !spaceName ? 'Private Space' : spaceName,
      href: `/spaces/${spaceId}`,
      icon: (spaceName === 'Private Space' || !spaceName) ? Lock : FolderOpen
    }
  ];

  // 2. Folder Path (API returns path including the current folder)
  // We want to link all except the last one (current page) usually, but Breadcrumbs component handles last item distinctness.
  // Actually standard breadcrumbs usually have link for everything except current page.

  if (path.length > 0) {
    path.forEach((item) => {
      fullItems.push({
        label: item.name,
        href: `/spaces/${spaceId}/folders/${item.id}`,
        icon: FolderOpen,
      });
    });
  } else if (currentFolder) {
    // If path not loaded yet but we have the current folder, show it directly
    // This avoids the skeleton state and gives immediate feedback
    fullItems.push({
      label: currentFolder.name,
      href: `/spaces/${spaceId}/folders/${currentFolder.id}`,
      icon: FolderOpen,
    });
  } else if (loading) {
    // Skeleton ONLY if we don't even have the current folder name
    return (
      <div className="text-sm text-muted-foreground animate-pulse flex items-center gap-2">
        <Lock className="h-4 w-4" /> <span>Private Space</span> <span>/</span> <span className="h-4 w-20 bg-muted rounded"></span>
      </div>
    );
  }

  // 3. Truncation Logic
  // User wants: if > 5 elements, show "Private Space > (...) > Last Folder"
  // Interpret "elements" as the total breadcrumb items.

  let displayedItems = fullItems;
  const MAX_ITEMS = 5;

  if (fullItems.length > MAX_ITEMS) {
    // Keep first (Space)
    // Keep last (Current Folder)
    // Collapse everything in between
    const first = fullItems[0];
    const last = fullItems[fullItems.length - 1];

    displayedItems = [
      first,
      { label: '...', icon: FolderOpen }, // Collapsed indicator
      last
    ];

    // Alternative interpretation: Provide access to immediate parent? 
    // User example: "Private Space > iconepasta (...) > Folder 5"
    // This strictly matches my implementation above.
  }

  return (
    <div className="text-sm text-muted-foreground">
      <Breadcrumbs items={displayedItems} />
    </div>
  );
}
