'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Pencil, Folder, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileCardProps {
  title: string;
  description?: string;
  meta?: string;
  type?: 'folder' | 'process';
}

export function FileCard({
  title,
  description,
  meta,
  type = 'process',
}: FileCardProps) {
  const isFolder = type === 'folder';

  return (
    <Card className="relative group overflow-hidden border border-muted">
      <div className="absolute right-2 top-2 flex translate-y-[-6px] gap-2 opacity-0 transition-all duration-150 group-hover:translate-y-0 group-hover:opacity-100">
        <Button size="icon" variant="secondary" className="h-8 w-8" title="Open">
          <Eye className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="secondary" className="h-8 w-8" title="Rename / quick edit">
          <Pencil className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex flex-col gap-3 p-4">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={cn(isFolder ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700')}>
            {isFolder ? <Folder className="mr-1 h-3.5 w-3.5" /> : <FileText className="mr-1 h-3.5 w-3.5" />}
            {isFolder ? 'Folder' : 'Process'}
          </Badge>
          {meta && (
            <span className="text-xs text-muted-foreground">{meta}</span>
          )}
        </div>
        <div className="space-y-1">
          <div className="text-base font-semibold text-foreground line-clamp-1">{title}</div>
          {description && (
            <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
          )}
        </div>
      </div>
    </Card>
  );
}

