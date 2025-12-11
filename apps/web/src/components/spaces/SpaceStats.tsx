'use client';

import { useEffect, useState } from 'react';
import { useSpaces } from '@/contexts/SpacesContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { FolderKanban, Workflow, FolderOpen, FileText } from 'lucide-react';
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
        setError(err?.message || 'Erro ao carregar estatísticas');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [spaceId, getSpaceStats]);

  if (loading) {
    return (
      <div className={cn('grid gap-4 sm:grid-cols-2 lg:grid-cols-4', className)}>
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Carregando...</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  if (error || !stats) {
    return null; // Silently fail - stats are optional
  }

  return (
    <div className={cn('grid gap-4 sm:grid-cols-2 lg:grid-cols-4', className)}>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Pastas</CardTitle>
          <FolderKanban className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total_folders}</div>
          <p className="text-xs text-muted-foreground">{stats.root_folders} na raiz</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Processos</CardTitle>
          <Workflow className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total_processes}</div>
          <p className="text-xs text-muted-foreground">{stats.root_processes} na raiz</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pastas na Raiz</CardTitle>
          <FolderOpen className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.root_folders}</div>
          <p className="text-xs text-muted-foreground">Nível superior</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Processos na Raiz</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.root_processes}</div>
          <p className="text-xs text-muted-foreground">Nível superior</p>
        </CardContent>
      </Card>
    </div>
  );
}

