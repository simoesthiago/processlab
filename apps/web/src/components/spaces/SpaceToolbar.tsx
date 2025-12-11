'use client';

import { useState, useRef, useEffect } from 'react';
import { SearchBar } from './SearchBar';
import { ViewToggle, ViewMode } from './ViewToggle';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, Plus, Folder, Workflow, ChevronDown, Search, Filter } from 'lucide-react';
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
  sortBy = 'name',
  onSortChange,
  onNewFolder,
  onNewProcess,
  className,
}: SpaceToolbarProps) {
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [newMenuOpen, setNewMenuOpen] = useState(false);
  const sortMenuRef = useRef<HTMLDivElement>(null);
  const newMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(event.target as Node)) {
        setSortMenuOpen(false);
      }
      if (newMenuRef.current && !newMenuRef.current.contains(event.target as Node)) {
        setNewMenuOpen(false);
      }
    };

    if (sortMenuOpen || newMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [sortMenuOpen, newMenuOpen]);

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'name', label: 'Nome' },
    { value: 'date', label: 'Data' },
    { value: 'type', label: 'Tipo' },
  ];

  return (
    <div className={cn('flex items-center justify-between gap-3', className)}>
      <div className="flex-1">
        <SearchBar
          value={searchQuery}
          onChange={onSearchChange}
          placeholder="Buscar pastas e processos..."
        />
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <ViewToggle value={viewMode} onChange={onViewModeChange} />
        {onSortChange && (
          <div className="relative" ref={sortMenuRef}>
            <button
              onClick={() => setSortMenuOpen(!sortMenuOpen)}
              className="p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded transition-colors"
              title="Ordenar"
            >
              <ArrowUpDown className="h-4 w-4" />
            </button>
            {sortMenuOpen && (
              <div className="absolute right-0 top-full mt-1 z-50 w-40 rounded-md border bg-white shadow-lg">
                <div className="p-1">
                  {sortOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        onSortChange(option.value);
                        setSortMenuOpen(false);
                      }}
                      className={cn(
                        'w-full text-left px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors',
                        sortBy === option.value && 'bg-accent font-medium'
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        <button
          className="p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded transition-colors"
          title="Filtros"
        >
          <Filter className="h-4 w-4" />
        </button>
        {(onNewFolder || onNewProcess) && (
          <div className="relative ml-2" ref={newMenuRef}>
            <Button
              onClick={() => setNewMenuOpen(!newMenuOpen)}
              className="gap-1.5 h-8 px-3 text-sm bg-blue-600 hover:bg-blue-700 text-white"
              size="sm"
            >
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
                      Nova Pasta
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
                      Novo Processo
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

