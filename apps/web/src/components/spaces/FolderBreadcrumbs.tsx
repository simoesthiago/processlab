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

    setLoading(true);
    getFolderPath(spaceId, folderId)
      .then((p) => {
        if (p.length) {
          setPath(p);
        } else if (currentFolder) {
          setPath([{ id: currentFolder.id, name: currentFolder.name }]);
        } else {
          setPath([]);
        }
      })
      .catch((err) => {
        console.error('Failed to load folder path:', err);
        setPath([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [spaceId, folderId, getFolderPath, currentFolder?.id, currentFolder?.name]);

  if (loading) {
    return (
      <div className="text-sm text-muted-foreground">
        <Breadcrumbs
          items={[
            { label: spaceName || 'Space', href: `/spaces/${spaceId}`, icon: Lock },
            { label: '...', icon: FolderOpen },
          ]}
        />
      </div>
    );
  }

  const items: BreadcrumbItem[] = [
    { label: spaceName || 'Space', href: `/spaces/${spaceId}`, icon: Lock },
  ];

  // Add path items
  path.forEach((item, idx) => {
    const isLast = idx === path.length - 1;
    items.push({
      label: item.name,
      href: isLast ? undefined : `/spaces/${spaceId}/folders/${item.id}`,
      icon: FolderOpen,
    });
  });

  return (
    <div className="text-sm text-muted-foreground">
      <Breadcrumbs items={items} />
    </div>
  );
}

