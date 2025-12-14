'use client';

import { useEffect, useState } from 'react';
import { useSpaces } from '@/contexts/SpacesContext';
import { cn } from '@/lib/utils';

interface SpaceStatsProps {
  spaceId: string;
  className?: string;
}

export function SpaceStats({ spaceId, className }: SpaceStatsProps) {
  const { getSpaceStats } = useSpaces();
  const [stats, setStats] = useState<{
    total_folders: number;
    total_processes: number;
    root_folders: number;
    root_processes: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!spaceId) return;

    setLoading(true);
    setError(null);
    getSpaceStats(spaceId)
      .then((data) => {
        setStats(data);
      })
      .catch((err) => {
        console.error('Failed to load space stats:', err);
        setError(err?.message || 'Failed to load statistics');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [spaceId, getSpaceStats]);

  if (loading) return null;

  if (error || !stats) {
    return null; // Silently fail - stats are optional
  }

  return (
    <div className={cn('flex flex-wrap items-center gap-6 text-sm text-muted-foreground', className)}>
      <div className="flex items-baseline gap-2">
        <span className="font-medium text-foreground">Total Folders:</span>
        <span className="text-lg font-semibold text-foreground">{stats.total_folders}</span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="font-medium text-foreground">Total Processes:</span>
        <span className="text-lg font-semibold text-foreground">{stats.total_processes}</span>
      </div>
    </div>
  );
}

