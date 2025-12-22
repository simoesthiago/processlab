'use client';

import { KeyboardEvent, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/shared/components/ui/card';
import { Folder, Workflow } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileCardProps {
  title: string;
  description?: string;
  meta?: string;
  type?: 'folder' | 'process';
  processCount?: number;
  href?: string;
  onOpen?: () => void;
  onVisit?: () => void;
  disabled?: boolean;
}

export function FileCard({
  title,
  description,
  meta,
  type = 'process',
  processCount,
  href,
  onOpen,
  onVisit,
  disabled = false,
}: FileCardProps) {
  const router = useRouter();
  const isFolder = type === 'folder';
  const count = processCount ?? (isFolder ? 0 : 1);

  const FolderVisual = () => (
    <div className="flex h-full w-full items-center justify-center">
      <Folder className="h-28 w-32 text-neutral-600" strokeWidth={1.5} />
    </div>
  );

  const ProcessVisual = () => (
    <div className="relative flex h-full w-full items-center justify-center">
      <div className="absolute left-4 top-4 text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
        BPMN diagram
      </div>
      <div className="flex items-center gap-2">
        <div className="h-3 w-3 rounded-full border border-neutral-600" />
        <div className="h-[1px] w-6 bg-neutral-600" />
        <div className="h-8 w-10 rounded-md border border-neutral-600" />
        <div className="h-[1px] w-6 bg-neutral-600" />
        <div className="flex h-8 w-8 items-center justify-center rounded-md border border-neutral-600">
          <div className="h-5 w-5 rotate-45 border border-neutral-600" />
        </div>
        <div className="h-[1px] w-6 bg-neutral-600" />
        <div className="h-8 w-10 rounded-md border border-neutral-600" />
        <div className="h-[1px] w-6 bg-neutral-600" />
        <div className="h-3 w-3 rounded-full border border-neutral-600" />
      </div>
    </div>
  );

  const handleOpen = useCallback(() => {
    if (disabled) return;
    onVisit?.();
    if (onOpen) {
      onOpen();
      return;
    }
    if (href) {
      router.push(href);
    }
  }, [disabled, href, onOpen, onVisit, router]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!href && !onOpen) return;
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleOpen();
      }
    },
    [handleOpen, href, onOpen]
  );

  return (
    <Card
      role={href || onOpen ? 'button' : undefined}
      tabIndex={href || onOpen ? 0 : -1}
      onClick={() => (href || onOpen) && handleOpen()}
      onKeyDown={handleKeyDown}
      className={cn(
        'relative group flex h-56 w-[240px] flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm transition-all duration-150 md:h-60',
        (href || onOpen) && !disabled ? 'cursor-pointer hover:border-primary/50 hover:shadow-sm' : 'cursor-default',
        disabled && 'opacity-60'
      )}
    >
      <div className="absolute left-3 top-3 flex items-center gap-1 rounded-md bg-white/80 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-700 shadow-sm backdrop-blur">
        <Workflow className="h-3.5 w-3.5" strokeWidth={1.5} />
        <span>{count}</span>
      </div>
      <div className="flex flex-1 items-center justify-center px-4 pt-6">
        {isFolder ? <FolderVisual /> : <ProcessVisual />}
      </div>
      <div className="flex flex-col gap-1 px-4 pb-4">
        {meta && (
          <div className="text-xs font-medium uppercase tracking-[0.08em] text-neutral-500 line-clamp-1">
            {meta}
          </div>
        )}
        <div className="text-base font-semibold text-neutral-900 line-clamp-2">
          {title}
        </div>
        {!isFolder && description && (
          <p className="text-sm text-neutral-500 line-clamp-2">
            {description}
          </p>
        )}
      </div>
    </Card>
  );
}

