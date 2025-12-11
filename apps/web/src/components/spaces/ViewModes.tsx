'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileCard } from '@/components/files/FileCard';
import Link from 'next/link';
import { ViewMode } from './ViewToggle';
import { FolderOpen, Workflow } from 'lucide-react';
import { SpaceFolder, SpaceProcess } from '@/contexts/SpacesContext';

interface ViewModesProps {
  viewMode: ViewMode;
  folders: SpaceFolder[];
  processes: SpaceProcess[];
  spaceId: string;
  spaceName?: string;
  onEditFolder?: (folder: SpaceFolder) => void;
  onDeleteFolder?: (folderId: string) => void;
  onEditProcess?: (process: SpaceProcess) => void;
  onDeleteProcess?: (processId: string) => void;
  deletingFolderId?: string | null;
  deletingProcessId?: string | null;
}

export function ViewModes({
  viewMode,
  folders,
  processes,
  spaceId,
  spaceName,
  onEditFolder,
  onDeleteFolder,
  onEditProcess,
  onDeleteProcess,
  deletingFolderId,
  deletingProcessId,
}: ViewModesProps) {
  if (viewMode === 'grid') {
    return (
      <div className="flex flex-wrap gap-4">
        {folders.map((folder) => (
          <FileCard
            key={folder.id}
            title={folder.name}
            description={folder.description || undefined}
            type="folder"
            meta={spaceName}
            processCount={folder.process_count ?? folder.processes?.length ?? 0}
            href={`/spaces/${spaceId}/folders/${folder.id}`}
          />
        ))}
        {processes.map((proc) => (
          <FileCard
            key={proc.id}
            title={proc.name}
            description={proc.description || undefined}
            type="process"
            meta={spaceName}
            processCount={1}
            href={`/spaces/${spaceId}/processes/${proc.id}`}
          />
        ))}
      </div>
    );
  }

  if (viewMode === 'list') {
    return (
      <div className="space-y-2">
        {folders.map((folder) => (
          <Card key={folder.id} className="hover:bg-accent/50 transition-colors">
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3 flex-1">
                <FolderOpen className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{folder.name}</div>
                  {folder.description && (
                    <div className="text-sm text-muted-foreground truncate">{folder.description}</div>
                  )}
                  <div className="text-xs text-muted-foreground mt-1">
                    {folder.processes?.length || 0} processos · {folder.children?.length || 0} pastas
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button asChild size="sm">
                  <Link href={`/spaces/${spaceId}/folders/${folder.id}`}>Abrir</Link>
                </Button>
                {onEditFolder && (
                  <Button size="sm" variant="outline" onClick={() => onEditFolder(folder)}>
                    Editar
                  </Button>
                )}
                {onDeleteFolder && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => onDeleteFolder(folder.id)}
                    disabled={deletingFolderId === folder.id}
                  >
                    {deletingFolderId === folder.id ? 'Apagando...' : 'Apagar'}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {processes.map((proc) => (
          <Card key={proc.id} className="hover:bg-accent/50 transition-colors">
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3 flex-1">
                <Workflow className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{proc.name}</div>
                  {proc.description && (
                    <div className="text-sm text-muted-foreground truncate">{proc.description}</div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button asChild size="sm" variant="outline">
                  <Link href={`/spaces/${spaceId}/processes/${proc.id}`}>Abrir</Link>
                </Button>
                {onEditProcess && (
                  <Button size="sm" variant="outline" onClick={() => onEditProcess(proc)}>
                    Editar
                  </Button>
                )}
                {onDeleteProcess && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => onDeleteProcess(proc.id)}
                    disabled={deletingProcessId === proc.id}
                  >
                    {deletingProcessId === proc.id ? 'Apagando...' : 'Apagar'}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Default to list view if viewMode is not recognized
  return null;
}

