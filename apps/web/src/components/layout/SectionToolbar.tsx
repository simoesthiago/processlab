'use client';

import { Button } from '@/components/ui/button';
import {
  ArrowDownAZ,
  ChevronDown,
  LayoutGrid,
  List,
  Maximize2,
  MoreVertical,
  Search,
} from 'lucide-react';

interface SectionToolbarProps {
  title: string;
  newLabel?: string;
  onNew?: () => void;
  onSearch?: () => void;
  variant?: 'orange' | 'blue';
}

export function SectionToolbar({
  title,
  newLabel = 'New',
  onNew,
  onSearch,
  variant = 'orange',
}: SectionToolbarProps) {
  const newButtonClasses =
    variant === 'blue'
      ? 'bg-blue-500 hover:bg-blue-600 text-white'
      : 'bg-orange-500/90 hover:bg-orange-500 text-white';

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" title="Toggle layout">
          <LayoutGrid className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" title="List view">
          <List className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" title="Sort">
          <ArrowDownAZ className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" title="Expand">
          <Maximize2 className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" title="Search" onClick={onSearch}>
          <Search className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" title="Menu">
          <MoreVertical className="h-4 w-4" />
        </Button>
        <Button
          className={newButtonClasses}
          onClick={onNew}
        >
          {newLabel}
          <ChevronDown className="ml-1.5 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

