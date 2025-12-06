'use client';

/**
 * ProjectHierarchy
 *
 * Shows project → folders → processes in a tree with drag-and-drop support
 * for moving processes/folders across folders or even to another project.
 */

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Folder,
  FolderOpen,
  FileText,
  Trash,
  Plus,
  MoveRight,
  Loader2,
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

type ProcessNode = {
  id: string;
  name: string;
  description?: string | null;
  project_id: string;
  folder_id?: string | null;
  version_count?: number | null;
  updated_at?: string;
};

type FolderNode = {
  id: string;
  project_id: string;
  parent_folder_id?: string | null;
  name: string;
  description?: string | null;
  position?: number;
  processes: ProcessNode[];
  children: FolderNode[];
};

type ProjectHierarchy = {
  project_id: string;
  root_processes: ProcessNode[];
  folders: FolderNode[];
};

type ProjectSummary = {
  id: string;
  name: string;
  organization_id?: string | null;
};

type DragItem = {
  type: 'process' | 'folder';
  id: string;
};

interface ProjectHierarchyProps {
  projectId: string;
  workspaceType: 'personal' | 'organization';
  workspaceId?: string | null;
  basePath: string;
  canEdit: boolean;
}

export function ProjectHierarchy({
  projectId,
  workspaceType,
  workspaceId,
  basePath,
  canEdit,
}: ProjectHierarchyProps) {
  const { token } = useAuth();
  const [hierarchy, setHierarchy] = useState<ProjectHierarchy | null>(null);
  const [availableProjects, setAvailableProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragItem, setDragItem] = useState<DragItem | null>(null);

  const otherProjects = useMemo(
    () => availableProjects.filter((p) => p.id !== projectId),
    [availableProjects, projectId]
  );

  const fetchJson = async <T,>(url: string, init?: RequestInit): Promise<T | null> => {
    if (!token) return null;
    setError(null);
    try {
      const res = await fetch(url, {
        ...(init || {}),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          ...(init?.headers || {}),
        },
      });
      if (!res.ok) {
        console.warn(`Request failed ${res.status}: ${url}`);
        const detail = await res.text();
        setError(detail || 'Algo deu errado ao comunicar com o servidor.');
        return null;
      }
      return (await res.json()) as T;
    } catch (err) {
      console.error(`Request error for ${url}`, err);
      setError('Não foi possível comunicar com o servidor.');
      return null;
    }
  };

  const loadHierarchy = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    const data = await fetchJson<ProjectHierarchy>(
      `${API_URL}/api/v1/projects/${projectId}/hierarchy`
    );
    if (data) {
      setHierarchy(data);
    }
    setLoading(false);
  };

  const loadProjects = async () => {
    if (!token) return;
    const url =
      workspaceType === 'personal'
        ? `${API_URL}/api/v1/users/me/projects`
        : `${API_URL}/api/v1/projects${
            workspaceId ? `?organization_id=${workspaceId}` : ''
          }`;
    const data = await fetchJson<{ projects?: ProjectSummary[] } | ProjectSummary[]>(url);
    if (!data) return;
    // Some endpoints return { projects: [] }, others return array directly
    const list = Array.isArray(data) ? data : data.projects || [];
    setAvailableProjects(list);
  };

  useEffect(() => {
    loadHierarchy();
    loadProjects();
  }, [projectId, token, workspaceType, workspaceId]);

  const handleCreateFolder = async (parentFolderId?: string | null) => {
    if (!token || !canEdit) return;
    const name = prompt('Nome da nova pasta:');
    if (!name) return;
    setSaving(true);
    await fetchJson(
      `${API_URL}/api/v1/projects/${projectId}/folders`,
      {
        method: 'POST',
        body: JSON.stringify({
          name,
          parent_folder_id: parentFolderId || null,
        }),
      }
    );
    setSaving(false);
    loadHierarchy();
  };

  const handleDeleteFolder = async (folderId: string) => {
    if (!token || !canEdit) return;
    const confirmed = confirm('Apagar esta pasta e todo o conteúdo?');
    if (!confirmed) return;
    setSaving(true);
    await fetchJson(`${API_URL}/api/v1/folders/${folderId}`, { method: 'DELETE' });
    setSaving(false);
    loadHierarchy();
  };

  const handleDeleteProcess = async (processId: string) => {
    if (!token || !canEdit) return;
    const confirmed = confirm('Apagar este processo? Ele ficará indisponível no catálogo.');
    if (!confirmed) return;
    setSaving(true);
    await fetchJson(`${API_URL}/api/v1/processes/${processId}`, { method: 'DELETE' });
    setSaving(false);
    loadHierarchy();
  };

  const moveProcess = async (processId: string, targetProject: string, folderId?: string | null) => {
    setSaving(true);
    await fetchJson(
      `${API_URL}/api/v1/processes/${processId}/move`,
      {
        method: 'PUT',
        body: JSON.stringify({
          project_id: targetProject,
          folder_id: folderId || null,
        }),
      }
    );
    setSaving(false);
    loadHierarchy();
  };

  const moveFolder = async (folderId: string, parentFolderId?: string | null) => {
    setSaving(true);
    await fetchJson(
      `${API_URL}/api/v1/folders/${folderId}`,
      {
        method: 'PATCH',
        body: JSON.stringify({
          parent_folder_id: parentFolderId || null,
        }),
      }
    );
    setSaving(false);
    loadHierarchy();
  };

  const handleDropOnFolder = async (folderId: string, projectTargetId: string) => {
    if (!dragItem || !canEdit) return;
    if (dragItem.type === 'process') {
      await moveProcess(dragItem.id, projectTargetId, folderId);
    } else if (dragItem.type === 'folder') {
      await moveFolder(dragItem.id, folderId);
    }
    setDragItem(null);
  };

  const handleDropOnProject = async (targetProjectId: string) => {
    if (!dragItem || !canEdit) return;
    if (dragItem.type === 'process') {
      await moveProcess(dragItem.id, targetProjectId, null);
    } else if (dragItem.type === 'folder') {
      setError('Pastas só podem ser movidas dentro do mesmo projeto.');
    }
    setDragItem(null);
  };

  const renderProcesses = (processes: ProcessNode[], targetProjectId: string, folderId?: string | null) => {
    if (processes.length === 0) {
      return (
        <div className="text-sm text-muted-foreground px-3 py-2">
          Nenhum processo aqui.
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {processes.map((process) => (
          <div
            key={process.id}
            draggable={canEdit}
            onDragStart={() => setDragItem({ type: 'process', id: process.id })}
            onDragEnd={() => setDragItem(null)}
            className="flex items-center justify-between rounded-md border px-3 py-2 bg-card hover:border-primary/60 transition-colors"
          >
            <div className="flex items-center gap-2 min-w-0">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{process.name}</div>
                {process.description && (
                  <div className="text-xs text-muted-foreground truncate">
                    {process.description}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link href={`${basePath}/projects/${process.project_id}/processes/${process.id}`}>
                <Button variant="outline" size="sm">Abrir</Button>
              </Link>
              {canEdit && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive"
                  onClick={() => handleDeleteProcess(process.id)}
                >
                  <Trash className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderFolder = (folder: FolderNode) => (
    <Card
      key={folder.id}
      className="bg-muted/30 border-dashed"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        handleDropOnFolder(folder.id, folder.project_id);
      }}
    >
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
        <div className="flex items-center gap-2">
          <FolderOpen className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-base">{folder.name}</CardTitle>
          {folder.processes?.length ? (
            <Badge variant="outline">{folder.processes.length} processos</Badge>
          ) : null}
        </div>
        {canEdit && (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => handleCreateFolder(folder.id)}>
              <Plus className="h-4 w-4 mr-1" /> Subpasta
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive hover:text-destructive"
              onClick={() => handleDeleteFolder(folder.id)}
            >
              <Trash className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-md border border-dashed p-3 bg-background/80">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <MoveRight className="h-4 w-4" />
            Arraste processos ou pastas para cá.
          </div>
          {renderProcesses(folder.processes || [], folder.project_id, folder.id)}
        </div>
        {folder.children && folder.children.length > 0 && (
          <div className="space-y-3">
            {folder.children.map((child) => renderFolder(child))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!hierarchy) {
    return (
      <Card>
        <CardContent className="pt-6">
          <EmptyState
            icon={FileText}
            title="Não encontramos nada aqui"
            description="Tente recarregar ou criar a primeira pasta/processo."
            action={canEdit ? { label: 'Criar pasta', onClick: () => handleCreateFolder(null) } : undefined}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <Card className="border-destructive/40">
          <CardContent className="pt-4 text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Folder className="h-4 w-4 text-muted-foreground" />
            <CardTitle>Pastas e processos</CardTitle>
          </div>
          {canEdit && (
            <Button onClick={() => handleCreateFolder(null)} disabled={saving}>
              <Plus className="h-4 w-4 mr-1" />
              Nova pasta
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className="rounded-md border border-dashed p-3 bg-background/70"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              handleDropOnProject(projectId);
            }}
          >
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
              <MoveRight className="h-4 w-4" />
              Solte aqui para mover para a raiz do projeto.
            </div>
            {renderProcesses(hierarchy.root_processes || [], projectId, null)}
          </div>

          {hierarchy.folders.length === 0 && hierarchy.root_processes.length === 0 ? (
            <EmptyState
              icon={FolderOpen}
              title="Organize seus processos"
              description="Crie pastas e arraste processos para organizar melhor."
              action={
                canEdit
                  ? {
                      label: 'Criar primeira pasta',
                      onClick: () => handleCreateFolder(null),
                    }
                  : undefined
              }
            />
          ) : (
            <div className="space-y-3">
              {hierarchy.folders.map((folder) => renderFolder(folder))}
            </div>
          )}
        </CardContent>
      </Card>

      {otherProjects.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Solte em outro projeto</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {otherProjects.map((proj) => (
              <div
                key={proj.id}
                className="rounded-md border border-dashed px-4 py-3 hover:border-primary cursor-pointer bg-muted/40"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  handleDropOnProject(proj.id);
                }}
              >
                <div className="flex items-center gap-2">
                  <Folder className="h-4 w-4 text-muted-foreground" />
                  <div className="font-medium">{proj.name}</div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Solte um processo ou pasta para mover para este projeto.
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}


