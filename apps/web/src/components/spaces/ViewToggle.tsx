'use client';

import { LayoutGrid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type ViewMode = 'grid' | 'list';

interface ViewToggleProps {
  value: ViewMode;
  onChange: (value: ViewMode) => void;
  className?: string;
}

export function ViewToggle({ value, onChange, className }: ViewToggleProps) {
  return (
    <div className={cn('flex items-center gap-1 rounded-lg border p-1', className)}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onChange('grid')}
        className={cn(
          'h-8 w-8 p-0',
          value === 'grid' && 'bg-accent text-accent-foreground'
        )}
        title="Grid view"
      >
        <LayoutGrid className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onChange('list')}
        className={cn(
          'h-8 w-8 p-0',
          value === 'list' && 'bg-accent text-accent-foreground'
        )}
        title="List view"
      >
        <List className="h-4 w-4" />
      </Button>
    </div>
  );
}

