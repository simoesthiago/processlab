'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { FolderKanban, FolderOpen, Trash2, Edit, MoreVertical } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import Link from 'next/link';
import { useSpaces } from '@/contexts/SpacesContext';
import { FolderEditModal } from '@/components/spaces/FolderEditModal';
import { ProcessEditModal } from '@/components/spaces/ProcessEditModal';
import { FolderBreadcrumbs } from '@/components/spaces/FolderBreadcrumbs';
import { useSearchFilter } from '@/components/spaces/SearchBar';
import { ViewMode } from '@/components/spaces/ViewToggle';
import { ViewModes } from '@/components/spaces/ViewModes';
import { SpaceToolbar, SortOption } from '@/components/spaces/SpaceToolbar';

export default function FolderPage() {
  const params = useParams<{ spaceId: string; folderId: string }>();
  const spaceId = params.spaceId;
  const folderId = params.folderId;
  const { selectSpace, loadTree, trees, getFolder, spaces, deleteFolder, deleteProcess, createFolder, createProcess } = useSpaces();
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingProcessId, setDeletingProcessId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deletingCurrent, setDeletingCurrent] = useState(false);
  const [editingFolder, setEditingFolder] = useState<{ id: string; open: boolean }>({ id: '', open: false });
  const [editingProcess, setEditingProcess] = useState<{ id: string; open: boolean }>({ id: '', open: false });
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [newProcessOpen, setNewProcessOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderDesc, setNewFolderDesc] = useState('');
  const [newProcessName, setNewProcessName] = useState('');
  const [newProcessDesc, setNewProcessDesc] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (spaceId) {
      selectSpace(spaceId);
      loadTree(spaceId);
    }
  }, [spaceId, selectSpace, loadTree]);

  const folder = getFolder(spaceId, folderId);
  const space = useMemo(() => spaces.find((s) => s.id === spaceId), [spaces, spaceId]);

  // Filter folders and processes based on search
  const filteredFolders = useSearchFilter(folder?.children || [], searchQuery);
  const filteredProcesses = useSearchFilter(folder?.processes || [], searchQuery);

  // Sort items
  const sortItems = <T extends { name: string }>(items: T[], sort: SortOption): T[] => {
    const sorted = [...items];
    switch (sort) {
      case 'name':
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case 'date':
        return sorted; // TODO: Add date sorting when available
      case 'type':
        return sorted; // Already grouped by type
      default:
        return sorted;
    }
  };

  const sortedFolders = sortItems(filteredFolders, sortBy);
  const sortedProcesses = sortItems(filteredProcesses, sortBy);

  const handleDelete = async (childId: string) => {
    if (!spaceId) return;
    setError(null);
    setDeletingId(childId);
    try {
      await deleteFolder(spaceId, childId);
    } catch (e: any) {
      setError(e?.message || 'Error deleting folder');
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteCurrent = async () => {
    if (!spaceId || !folder) return;
    const confirmDelete = window.confirm('Delete this folder? Items inside will be removed.');
    if (!confirmDelete) return;
    setError(null);
    setDeletingCurrent(true);
    try {
      await deleteFolder(spaceId, folder.id);
      // Após apagar, volta para o parent ou raiz do space
      const target = folder.parent_folder_id
        ? `/spaces/${spaceId}/folders/${folder.parent_folder_id}`
        : `/spaces/${spaceId}`;
      router.push(target);
    } catch (e: any) {
      setError(e?.message || 'Error deleting folder');
    } finally {
      setDeletingCurrent(false);
    }
  };

  const handleDeleteProcess = async (processId: string) => {
    if (!spaceId) return;
    const confirmDelete = window.confirm('Delete this process?');
    if (!confirmDelete) return;
    setError(null);
    setDeletingProcessId(processId);
    try {
      await deleteProcess(spaceId, processId);
    } catch (e: any) {
      setError(e?.message || 'Error deleting process');
    } finally {
      setDeletingProcessId(null);
    }
  };

  const handleCreateFolder = async () => {
    if (!spaceId || !newFolderName.trim() || !folderId) return;
    setCreating(true);
    setError(null);
    try {
      await createFolder(spaceId, {
        name: newFolderName.trim(),
        description: newFolderDesc || undefined,
        parent_folder_id: folderId,
      });
      setNewFolderName('');
      setNewFolderDesc('');
      setNewFolderOpen(false);
    } catch (e: any) {
      setError(e?.message || 'Error creating folder');
    } finally {
      setCreating(false);
    }
  };

  const handleCreateProcess = async () => {
    if (!spaceId || !newProcessName.trim() || !folderId) return;
    setCreating(true);
    setError(null);
    try {
      const created = await createProcess(spaceId, {
        name: newProcessName.trim(),
        description: newProcessDesc || undefined,
        folder_id: folderId,
      });
      setNewProcessName('');
      setNewProcessDesc('');
      setNewProcessOpen(false);
      // Redirect to studio for the newly created process
      if (created?.id) {
        router.push(`/spaces/${spaceId}/processes/${created.id}`);
      }
    } catch (e: any) {
      setError(e?.message || 'Error creating process');
    } finally {
      setCreating(false);
    }
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-7xl px-8 py-8 space-y-6">
        <div className="space-y-4">
          <FolderBreadcrumbs spaceId={spaceId} folderId={folderId} spaceName={space?.name} />
          <PageHeader
            title={folder?.name || 'Folder'}
            description={folder?.description || 'Folders and processes inside this folder.'}
            actions={
            folder ? (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingFolder({ id: folder.id, open: true })}
                  className="gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteCurrent}
                  disabled={deletingCurrent}
                  title={deletingCurrent ? 'Deleting...' : 'Delete folder'}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ) : null
          }
          />
        </div>

        {error && (
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">Error</CardTitle>
              <CardDescription>{error}</CardDescription>
            </CardHeader>
          </Card>
        )}

        {!trees[spaceId] && (
          <Card>
            <CardHeader>
              <CardTitle>Loading...</CardTitle>
            </CardHeader>
          </Card>
        )}

        {folder && (
          <>
            <SpaceToolbar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              sortBy={sortBy}
              onSortChange={setSortBy}
              onNewFolder={() => setNewFolderOpen(true)}
              onNewProcess={() => setNewProcessOpen(true)}
            />

            <ViewModes
              viewMode={viewMode}
              folders={sortedFolders}
              processes={sortedProcesses}
              spaceId={spaceId}
              spaceName={space?.name}
              onEditFolder={(folder) => setEditingFolder({ id: folder.id, open: true })}
              onDeleteFolder={handleDelete}
              onEditProcess={(proc) => setEditingProcess({ id: proc.id, open: true })}
              onDeleteProcess={handleDeleteProcess}
              deletingFolderId={deletingId}
              deletingProcessId={deletingProcessId}
            />

            {sortedFolders.length === 0 && sortedProcesses.length === 0 && searchQuery && (
              <Card>
                <CardHeader>
                  <CardTitle>No results found</CardTitle>
                  <CardDescription>Try searching with different terms.</CardDescription>
                </CardHeader>
              </Card>
            )}

            {!folder.children?.length && !folder.processes?.length && !searchQuery && (
              <Card>
                <CardHeader>
                  <CardTitle>Empty folder</CardTitle>
                  <CardDescription>Use the "New" button to create folders or processes.</CardDescription>
                </CardHeader>
              </Card>
            )}
          </>
        )}
      </div>

      {folder && (
        <>
          <FolderEditModal
            open={editingFolder.open && editingFolder.id === folder.id}
            onOpenChange={(open) => setEditingFolder({ id: folder.id, open })}
            spaceId={spaceId}
            folder={folder}
            onSuccess={() => {
              loadTree(spaceId);
            }}
          />
          {folder.children?.map((child) => (
            <FolderEditModal
              key={child.id}
              open={editingFolder.open && editingFolder.id === child.id}
              onOpenChange={(open) => setEditingFolder({ id: child.id, open })}
              spaceId={spaceId}
              folder={child}
              onSuccess={() => {
                loadTree(spaceId);
              }}
            />
          ))}
          {folder.processes?.map((proc) => (
            <ProcessEditModal
              key={proc.id}
              open={editingProcess.open && editingProcess.id === proc.id}
              onOpenChange={(open) => setEditingProcess({ id: proc.id, open })}
              spaceId={spaceId}
              process={proc}
              onSuccess={() => {
                loadTree(spaceId);
              }}
            />
          ))}
        </>
      )}

      <Dialog open={newFolderOpen} onOpenChange={(open) => {
        setNewFolderOpen(open);
        if (!open) {
          setNewFolderName('');
          setNewFolderDesc('');
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create folder</DialogTitle>
            <DialogDescription>Add a new folder inside this folder.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Name</Label>
              <Input
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="e.g., Subfolder"
              />
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Input
                value={newFolderDesc}
                onChange={(e) => setNewFolderDesc(e.target.value)}
                placeholder="Optional"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setNewFolderOpen(false);
                setNewFolderName('');
                setNewFolderDesc('');
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateFolder} disabled={!newFolderName.trim() || creating}>
              {creating ? 'Creating...' : 'Create folder'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={newProcessOpen} onOpenChange={(open) => {
        setNewProcessOpen(open);
        if (!open) {
          setNewProcessName('');
          setNewProcessDesc('');
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create process</DialogTitle>
            <DialogDescription>Add a new process inside this folder.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Name</Label>
              <Input
                value={newProcessName}
                onChange={(e) => setNewProcessName(e.target.value)}
                placeholder="e.g., Sales Process"
              />
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Input
                value={newProcessDesc}
                onChange={(e) => setNewProcessDesc(e.target.value)}
                placeholder="Optional"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setNewProcessOpen(false);
                setNewProcessName('');
                setNewProcessDesc('');
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateProcess} disabled={!newProcessName.trim() || creating}>
              {creating ? 'Creating...' : 'Create process'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

