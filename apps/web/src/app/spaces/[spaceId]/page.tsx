'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppLayout } from '@/shared/components/layout/AppLayout';
import { PageHeader } from '@/shared/components/layout/PageHeader';
import { FolderKanban, Edit, Trash2, Lock } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import Link from 'next/link';
import { useSpaces, SpaceFolder, SpaceProcess } from '@/contexts/SpacesContext';
import { FolderEditModal } from '@/features/spaces/components/FolderEditModal';
import { ProcessEditModal } from '@/features/spaces/components/ProcessEditModal';
import { useSearchFilter } from '@/features/spaces/components/SearchBar';
import { SpaceStats } from '@/features/spaces/components/SpaceStats';
import { ViewMode } from '@/features/spaces/components/ViewToggle';
import { ViewModes } from '@/features/spaces/components/ViewModes';
import { SpaceToolbar, SortOption } from '@/features/spaces/components/SpaceToolbar';
import { QuickSearch } from '@/features/spaces/components/QuickSearch';
import { useKeyboardShortcuts } from '@/shared/hooks/useKeyboardShortcuts';

export default function SpacePage() {
  const params = useParams<{ spaceId: string }>();
  const spaceId = params.spaceId || '';
  const router = useRouter();
  const { spaces, selectSpace, loadTree, trees, deleteFolder, deleteProcess, createFolder, createProcess } = useSpaces();
  const [deletingFolderId, setDeletingFolderId] = useState<string | null>(null);
  const [deletingProcessId, setDeletingProcessId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingFolder, setEditingFolder] = useState<{ id: string; open: boolean }>({ id: '', open: false });
  const [editingProcess, setEditingProcess] = useState<{ id: string; open: boolean }>({ id: '', open: false });
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [quickSearchOpen, setQuickSearchOpen] = useState(false);
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

  const space = useMemo(() => spaces.find((s: { id: string }) => s.id === spaceId), [spaces, spaceId]);
  const tree = trees[spaceId];

  // Filter folders and processes based on search
  const filteredFolders = useSearchFilter<SpaceFolder>(tree?.root_folders || [], searchQuery);
  const filteredProcesses = useSearchFilter<SpaceProcess>(tree?.root_processes || [], searchQuery);

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

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: 'k',
      ctrl: true,
      action: () => setQuickSearchOpen(true),
    },
    {
      key: 'n',
      ctrl: true,
      action: () => {
        // Could open create modal - for now just focus search
        const searchInput = document.querySelector('input[type="search"]') as HTMLInputElement;
        searchInput?.focus();
      },
    },
  ]);

  const handleDeleteFolder = async (folderId: string) => {
    if (!spaceId || !spaceId.trim()) return;
    const confirmDelete = window.confirm('Delete this folder? Items inside will be removed.');
    if (!confirmDelete) return;
    setError(null);
    setDeletingFolderId(folderId);
    try {
      await deleteFolder(spaceId, folderId);
    } catch (e: any) {
      setError(e?.message || 'Error deleting folder');
    } finally {
      setDeletingFolderId(null);
    }
  };

  const handleDeleteProcess = async (processId: string) => {
    if (!spaceId || !spaceId.trim()) return;
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
    if (!spaceId || !spaceId.trim() || !newFolderName.trim()) return;
    setCreating(true);
    setError(null);
    try {
      await createFolder(spaceId, {
        name: newFolderName.trim(),
        description: newFolderDesc || undefined,
        parent_folder_id: null,
      });
      await loadTree(spaceId);
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
    if (!spaceId || !spaceId.trim() || !newProcessName.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const created = await createProcess(spaceId, {
        name: newProcessName.trim(),
        description: newProcessDesc || undefined,
        folder_id: null,
      });
      setNewProcessName('');
      setNewProcessDesc('');
      setNewProcessOpen(false);
      // Redirect to studio for the newly created process
      // Use the created process data directly - no need to reload immediately
      // The process was just created and returned by the API
      if (created?.id) {
        // Small delay to ensure navigation is smooth
        await new Promise(resolve => setTimeout(resolve, 100));
        // Navigate with the process ID - useProcess will handle loading
        // But we pass the created process data via URL state if possible, or just rely on retries
        router.push(`/spaces/${spaceId}/processes/${created.id}`);
      }
    } catch (e: any) {
      setError(e?.message || 'Error creating process');
    } finally {
      setCreating(false);
    }
  };

  if (!spaceId) {
    return (
      <AppLayout>
        <div className="mx-auto max-w-7xl px-8 py-8">
          <Card>
            <CardHeader>
              <CardTitle>Invalid Space</CardTitle>
              <CardDescription>Space ID is required.</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-7xl px-8 py-8 space-y-6">
        <PageHeader
          title={space?.name || 'Space'}
          description={space?.description || 'Folders and processes in this space.'}
          breadcrumbs={[
            { label: space?.name || 'Space', icon: Lock },
          ]}
        />

        <SpaceStats spaceId={spaceId} />

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

        {error && (
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">Error</CardTitle>
              <CardDescription>{error}</CardDescription>
            </CardHeader>
          </Card>
        )}

        <ViewModes
          viewMode={viewMode}
          folders={sortedFolders}
          processes={sortedProcesses}
          spaceId={spaceId}
          spaceName={space?.name}
          onEditFolder={(folder: SpaceFolder) => setEditingFolder({ id: folder.id, open: true })}
          onDeleteFolder={handleDeleteFolder}
          onEditProcess={(proc: SpaceProcess) => setEditingProcess({ id: proc.id, open: true })}
          onDeleteProcess={handleDeleteProcess}
          deletingFolderId={deletingFolderId}
          deletingProcessId={deletingProcessId}
        />

        {!tree && (
          <Card>
            <CardHeader>
              <CardTitle>Loading space...</CardTitle>
            </CardHeader>
          </Card>
        )}
        {tree && filteredFolders.length === 0 && filteredProcesses.length === 0 && searchQuery && (
          <Card>
            <CardHeader>
              <CardTitle>No results found</CardTitle>
              <CardDescription>Try searching with different terms.</CardDescription>
            </CardHeader>
          </Card>
        )}
        {tree && !tree.root_folders?.length && !tree.root_processes?.length && !searchQuery && (
          <Card>
            <CardHeader>
          <CardTitle>Empty space</CardTitle>
          <CardDescription>Use the + button in the sidebar to create folders or processes.</CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>

      {tree && (
        <>
          {tree.root_folders?.map((folder: SpaceFolder) => (
            <FolderEditModal
              key={folder.id}
              open={editingFolder.open && editingFolder.id === folder.id}
              onOpenChange={(open: boolean) => setEditingFolder({ id: folder.id, open })}
              spaceId={spaceId}
              folder={folder}
              onSuccess={() => {
                loadTree(spaceId);
              }}
            />
          ))}
          {tree.root_processes?.map((proc: SpaceProcess) => (
            <ProcessEditModal
              key={proc.id}
              open={editingProcess.open && editingProcess.id === proc.id}
              onOpenChange={(open: boolean) => setEditingProcess({ id: proc.id, open })}
              spaceId={spaceId}
              process={proc}
              onSuccess={() => {
                loadTree(spaceId);
              }}
            />
          ))}
        </>
      )}

      <QuickSearch open={quickSearchOpen} onOpenChange={setQuickSearchOpen} />

      <Dialog open={newFolderOpen} onOpenChange={(open: boolean) => {
        setNewFolderOpen(open);
        if (!open) {
          setNewFolderName('');
          setNewFolderDesc('');
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create folder</DialogTitle>
            <DialogDescription>Add a new folder.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Name</Label>
              <Input
                value={newFolderName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewFolderName(e.target.value)}
                placeholder="Ex: Finance"
              />
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Input
                value={newFolderDesc}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewFolderDesc(e.target.value)}
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

      <Dialog open={newProcessOpen} onOpenChange={(open: boolean) => {
        setNewProcessOpen(open);
        if (!open) {
          setNewProcessName('');
          setNewProcessDesc('');
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create process</DialogTitle>
            <DialogDescription>Add a new process.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Name</Label>
              <Input
                value={newProcessName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewProcessName(e.target.value)}
                placeholder="e.g., Sales Process"
              />
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Input
                value={newProcessDesc}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewProcessDesc(e.target.value)}
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

