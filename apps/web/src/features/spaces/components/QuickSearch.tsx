'use client';

import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/shared/components/ui/dialog';
import { Input } from '@/shared/components/ui/input';
import { Search, X } from 'lucide-react';
import { useSpaces, SpaceFolder, SpaceProcess } from '@/contexts/SpacesContext';
import { useRouter } from 'next/navigation';
import { FolderOpen, Workflow } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useKeyboardShortcuts, isMac } from '@/shared/hooks/useKeyboardShortcuts';

interface QuickSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QuickSearch({ open, onOpenChange }: QuickSearchProps) {
  const { spaces, trees } = useSpaces();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Collect all folders and processes from all spaces
  const allItems = useMemo(() => {
    const items: Array<{
      id: string;
      name: string;
      description?: string | null;
      type: 'folder' | 'process';
      spaceId: string;
      spaceName: string;
      href: string;
      path?: string;
    }> = [];

    const walkFolder = (spaceId: string, spaceName: string, folder: SpaceFolder, ancestors: string[]) => {
      const path = [...ancestors, folder.name].join(' / ');

      // Current folder
      items.push({
        id: folder.id,
        name: folder.name,
        description: folder.description,
        type: 'folder',
        spaceId,
        spaceName,
        href: `/spaces/${spaceId}/folders/${folder.id}`,
        path,
      });

      // Processes inside this folder
      folder.processes?.forEach((proc) => {
        items.push({
          id: proc.id,
          name: proc.name,
          description: proc.description,
          type: 'process',
          spaceId,
          spaceName,
          href: `/spaces/${spaceId}/processes/${proc.id}`,
          path: `${path} / ${proc.name}`,
        });
      });

      // Recurse children
      folder.children?.forEach((child) => walkFolder(spaceId, spaceName, child, [...ancestors, folder.name]));
    };

    spaces.forEach((space) => {
      const tree = trees[space.id];
      if (!tree) return;

      // Walk root folders (and nested)
      tree.root_folders?.forEach((folder) => walkFolder(space.id, space.name, folder, []));

      // Add root processes
      tree.root_processes?.forEach((proc) => {
        items.push({
          id: proc.id,
          name: proc.name,
          description: proc.description,
          type: 'process',
          spaceId: space.id,
          spaceName: space.name,
          href: `/spaces/${space.id}/processes/${proc.id}`,
          path: proc.name,
        });
      });
    });

    return items;
  }, [spaces, trees]);

  // Filter items based on query
  const filteredItems = useMemo(() => {
    if (!query.trim()) return allItems.slice(0, 10); // Show first 10 when no query

    const q = query.toLowerCase().trim();
    return allItems
      .filter((item) => {
        const nameMatch = item.name?.toLowerCase().includes(q);
        const descMatch = item.description?.toLowerCase().includes(q);
        const pathMatch = item.path?.toLowerCase().includes(q);
        return nameMatch || descMatch || pathMatch;
      })
      .slice(0, 10); // Limit to 10 results
  }, [allItems, query]);

  // Reset selected index when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Keyboard navigation
  useKeyboardShortcuts(
    [
      {
        key: 'ArrowDown',
        action: () => {
          setSelectedIndex((prev) => Math.min(prev + 1, filteredItems.length - 1));
        },
      },
      {
        key: 'ArrowUp',
        action: () => {
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
        },
      },
      {
        key: 'Enter',
        action: () => {
          if (filteredItems[selectedIndex]) {
            router.push(filteredItems[selectedIndex].href);
            onOpenChange(false);
            setQuery('');
          }
        },
      },
    ],
    open
  );

  const handleSelect = (href: string) => {
    router.push(href);
    onOpenChange(false);
    setQuery('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden rounded-2xl border border-slate-200 bg-white/95 shadow-2xl backdrop-blur outline-none focus-visible:outline-none [&>button]:hidden">
        <DialogTitle className="sr-only">Search folders and processes</DialogTitle>
        <div className="flex items-center gap-3 border-b border-slate-200/80 px-4 py-3 bg-slate-50/60">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search folders and processes..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
              autoFocus
            />
          </div>
        </div>
        <div className="max-h-[320px] overflow-y-auto p-3">
          {filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-sm text-muted-foreground gap-2">
              <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                <Search className="h-5 w-5" />
              </div>
              {query.trim() ? 'No results found' : 'Type to search...'}
            </div>
          ) : (
            <div className="space-y-1">
              {filteredItems.map((item, idx) => (
                <button
                  key={`${item.type}-${item.id}`}
                  onClick={() => handleSelect(item.href)}
                  className={cn(
                    'w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors border border-transparent',
                    idx === selectedIndex ? 'bg-accent border-accent' : 'hover:bg-muted'
                  )}
                >
                  {item.type === 'folder' ? (
                    <FolderOpen className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  ) : (
                    <Workflow className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate text-foreground">{item.name}</div>
                    {(item.description || item.path) && (
                      <div className="text-sm text-muted-foreground truncate">
                        {item.path || item.description}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

