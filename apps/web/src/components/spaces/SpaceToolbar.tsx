'use client';

import { useState, useRef, useEffect } from 'react';
import { SearchBar } from './SearchBar';
import { ViewToggle, ViewMode } from './ViewToggle';
import { Button } from '@/components/ui/button';
import { Plus, Folder, Workflow, ChevronDown, Search, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

export type SortOption = 'name' | 'date' | 'type';

interface SpaceToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  sortBy?: SortOption;
  onSortChange?: (sort: SortOption) => void;
  onNewFolder?: () => void;
  onNewProcess?: () => void;
  className?: string;
}

export function SpaceToolbar({
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
  sortBy: _sortBy = 'name',
  onSortChange: _onSortChange,
  onNewFolder,
  onNewProcess,
  className,
}: SpaceToolbarProps) {
  const [newMenuOpen, setNewMenuOpen] = useState(false);
  const newMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (newMenuRef.current && !newMenuRef.current.contains(event.target as Node)) {
        setNewMenuOpen(false);
      }
    };

    if (newMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [newMenuOpen]);

  return (
    <div className={cn('flex items-center justify-between gap-3', className)}>
      <div className="flex-1">
        <SearchBar
          value={searchQuery}
          onChange={onSearchChange}
          placeholder="Search folders and processes..."
        />
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <ViewToggle value={viewMode} onChange={onViewModeChange} />
        <button
          className="p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded transition-colors"
          title="Filters"
        >
          <Filter className="h-4 w-4" />
        </button>
        {(onNewFolder || onNewProcess) && (
          <div className="relative ml-2" ref={newMenuRef}>
            <Button
              onClick={() => setNewMenuOpen(!newMenuOpen)}
              className="gap-2 h-8 px-3 text-sm bg-black hover:bg-black/90 text-white"
              size="sm"
            >
              <Plus className="h-4 w-4" />
              New
              <ChevronDown className="h-3.5 w-3.5" />
            </Button>
            {newMenuOpen && (
              <div className="absolute right-0 top-full mt-1 z-50 w-48 rounded-md border bg-white shadow-lg">
                <div className="p-1">
                  {onNewFolder && (
                    <button
                      onClick={() => {
                        onNewFolder();
                        setNewMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors flex items-center gap-2"
                    >
                      <Folder className="h-4 w-4" />
                      New Folder
                    </button>
                  )}
                  {onNewProcess && (
                    <button
                      onClick={() => {
                        onNewProcess();
                        setNewMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors flex items-center gap-2"
                    >
                      <Workflow className="h-4 w-4" />
                      New Process
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

