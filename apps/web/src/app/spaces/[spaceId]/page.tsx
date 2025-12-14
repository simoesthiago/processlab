'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { FolderKanban, Edit, Trash2, Lock } from 'lucide-react';
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
import { useSearchFilter } from '@/components/spaces/SearchBar';
import { SpaceStats } from '@/components/spaces/SpaceStats';
import { ViewMode } from '@/components/spaces/ViewToggle';
import { ViewModes } from '@/components/spaces/ViewModes';
import { SpaceToolbar, SortOption } from '@/components/spaces/SpaceToolbar';
import { QuickSearch } from '@/components/spaces/QuickSearch';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

export default function SpacePage() {
  const params = useParams<{ spaceId: string }>();
  const spaceId = params.spaceId;
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

  const space = useMemo(() => spaces.find((s) => s.id === spaceId), [spaces, spaceId]);
  const tree = trees[spaceId];

  // Filter folders and processes based on search
  const filteredFolders = useSearchFilter(tree?.root_folders || [], searchQuery);
  const filteredProcesses = useSearchFilter(tree?.root_processes || [], searchQuery);

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
    if (!spaceId) return;
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
    if (!spaceId || !newFolderName.trim()) return;
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
    if (!spaceId || !newProcessName.trim()) return;
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
          onEditFolder={(folder) => setEditingFolder({ id: folder.id, open: true })}
          onDeleteFolder={handleDeleteFolder}
          onEditProcess={(proc) => setEditingProcess({ id: proc.id, open: true })}
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
          {tree.root_folders?.map((folder) => (
            <FolderEditModal
              key={folder.id}
              open={editingFolder.open && editingFolder.id === folder.id}
              onOpenChange={(open) => setEditingFolder({ id: folder.id, open })}
              spaceId={spaceId}
              folder={folder}
              onSuccess={() => {
                loadTree(spaceId);
              }}
            />
          ))}
          {tree.root_processes?.map((proc) => (
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

      <QuickSearch open={quickSearchOpen} onOpenChange={setQuickSearchOpen} />

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
            <DialogDescription>Add a new folder.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Name</Label>
              <Input
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Ex: Finance"
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
            <DialogDescription>Add a new process.</DialogDescription>
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

