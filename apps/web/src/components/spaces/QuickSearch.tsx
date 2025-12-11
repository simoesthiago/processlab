'use client';

import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useSpaces, SpaceFolder, SpaceProcess } from '@/contexts/SpacesContext';
import { useRouter } from 'next/navigation';
import { FolderOpen, Workflow } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useKeyboardShortcuts, isMac } from '@/hooks/useKeyboardShortcuts';

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
    }> = [];

    spaces.forEach((space) => {
      const tree = trees[space.id];
      if (!tree) return;

      // Add root folders
      tree.root_folders?.forEach((folder) => {
        items.push({
          id: folder.id,
          name: folder.name,
          description: folder.description,
          type: 'folder',
          spaceId: space.id,
          spaceName: space.name,
          href: `/spaces/${space.id}/folders/${folder.id}`,
        });
      });

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
        const spaceMatch = item.spaceName?.toLowerCase().includes(q);
        return nameMatch || descMatch || spaceMatch;
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
      <DialogContent className="max-w-2xl p-0">
        <div className="flex items-center border-b px-4">
          <Search className="mr-2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar em todos os spaces..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            autoFocus
          />
          <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
            {isMac() ? '⌘' : 'Ctrl'}+K
          </kbd>
        </div>
        <div className="max-h-[400px] overflow-y-auto p-2">
          {filteredItems.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              {query.trim() ? 'Nenhum resultado encontrado' : 'Digite para buscar...'}
            </div>
          ) : (
            <div className="space-y-1">
              {filteredItems.map((item, idx) => (
                <button
                  key={`${item.type}-${item.id}`}
                  onClick={() => handleSelect(item.href)}
                  className={cn(
                    'w-full flex items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-accent transition-colors',
                    idx === selectedIndex && 'bg-accent'
                  )}
                >
                  {item.type === 'folder' ? (
                    <FolderOpen className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  ) : (
                    <Workflow className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{item.name}</div>
                    {item.description && (
                      <div className="text-sm text-muted-foreground truncate">{item.description}</div>
                    )}
                    <div className="text-xs text-muted-foreground">{item.spaceName}</div>
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

