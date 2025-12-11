'use client';

import { useEffect, useMemo, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LayoutDashboard } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSpaces } from '@/contexts/SpacesContext';
import { useRecentItems } from '@/hooks/useRecentItems';
import { SpaceToolbar, SortOption } from '@/components/spaces/SpaceToolbar';
import { ViewMode } from '@/components/spaces/ViewToggle';
import { ViewModes } from '@/components/spaces/ViewModes';
import { useSearchFilter } from '@/components/spaces/SearchBar';

export default function DashboardPage() {
  const { spaces, trees, selectSpace, loadTree, createFolder, createProcess } = useSpaces();
  
  // Load all team spaces
  useEffect(() => {
    spaces.filter((s) => s.type === 'team').forEach((space) => {
      if (!trees[space.id]) {
        selectSpace(space.id);
        loadTree(space.id);
      }
    });
  }, [spaces, trees, selectSpace, loadTree]);
  const { addRecentOptimistic, refreshRecents } = useRecentItems(12, { autoFetch: false });
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [newProcessOpen, setNewProcessOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderDesc, setNewFolderDesc] = useState('');
  const [newProcessName, setNewProcessName] = useState('');
  const [newProcessDesc, setNewProcessDesc] = useState('');
  const [creating, setCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [currentSpaceId, setCurrentSpaceId] = useState<string | null>(null);

  const privateSpace = useMemo(() => spaces.find((s) => s.id === 'private'), [spaces]);
  const privateTree = trees['private'];
  const privateSpaceId = privateSpace?.id || 'private';

  useEffect(() => {
    if (privateSpace) {
      selectSpace(privateSpace.id);
      if (!trees[privateSpace.id]) {
        loadTree(privateSpace.id);
      }
    }
  }, [privateSpace, selectSpace, loadTree, trees]);

  const handleCreateFolder = async (spaceId: string) => {
    if (!newFolderName.trim()) return;
    setCreating(true);
    try {
      const created = await createFolder(spaceId, {
        name: newFolderName.trim(),
        description: newFolderDesc || undefined,
        parent_folder_id: null,
      });
      if (created?.id) {
        addRecentOptimistic({
          id: created.id,
          name: created.name,
          type: 'folder',
          space_id: spaceId,
          space_type: spaceId === 'private' ? 'private' : 'team',
          parent_folder_id: created.parent_folder_id ?? null,
        });
        refreshRecents();
      }
      setNewFolderName('');
      setNewFolderDesc('');
      setNewFolderOpen(false);
      setCurrentSpaceId(null);
    } finally {
      setCreating(false);
    }
  };

  const handleCreateProcess = async (spaceId: string) => {
    if (!newProcessName.trim()) return;
    setCreating(true);
    try {
      const created = await createProcess(spaceId, {
        name: newProcessName.trim(),
        description: newProcessDesc || undefined,
        folder_id: null,
      });
      if (created?.id) {
        addRecentOptimistic({
          id: created.id,
          name: created.name,
          type: 'process',
          space_id: spaceId,
          space_type: spaceId === 'private' ? 'private' : 'team',
          parent_folder_id: created.folder_id ?? null,
        });
        refreshRecents();
      }
      setNewProcessName('');
      setNewProcessDesc('');
      setNewProcessOpen(false);
      setCurrentSpaceId(null);
    } finally {
      setCreating(false);
    }
  };

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

  const renderSpaceSection = (spaceId: string, spaceName: string) => {
    const tree = trees[spaceId];
    const allFolders = tree?.root_folders || [];
    const allProcesses = tree?.root_processes || [];
    
    const filteredFolders = useSearchFilter(allFolders, searchQuery);
    const filteredProcesses = useSearchFilter(allProcesses, searchQuery);
    
    const sortedFolders = sortItems(filteredFolders, sortBy);
    const sortedProcesses = sortItems(filteredProcesses, sortBy);

    return (
      <section key={spaceId} className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-neutral-900">{spaceName}</h2>
        </div>
        <SpaceToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          sortBy={sortBy}
          onSortChange={setSortBy}
          onNewFolder={() => {
            setCurrentSpaceId(spaceId);
            setNewFolderOpen(true);
          }}
          onNewProcess={() => {
            setCurrentSpaceId(spaceId);
            setNewProcessOpen(true);
          }}
        />
        {!tree && (
          <Card>
            <CardHeader>
              <CardTitle>Carregando {spaceName}...</CardTitle>
              <CardDescription>Buscando pastas e processos.</CardDescription>
            </CardHeader>
          </Card>
        )}
        {tree && (
          <ViewModes
            viewMode={viewMode}
            folders={sortedFolders}
            processes={sortedProcesses}
            spaceId={spaceId}
            spaceName={spaceName}
          />
        )}
        {tree && sortedFolders.length === 0 && sortedProcesses.length === 0 && searchQuery && (
          <Card>
            <CardHeader>
              <CardTitle>Nenhum resultado encontrado</CardTitle>
              <CardDescription>Tente buscar com outros termos.</CardDescription>
            </CardHeader>
          </Card>
        )}
        {tree && !tree.root_folders?.length && !tree.root_processes?.length && !searchQuery && (
          <Card>
            <CardHeader>
              <CardTitle>{spaceName} vazio</CardTitle>
              <CardDescription>Use o botão "Novo" para criar pastas ou processos.</CardDescription>
            </CardHeader>
          </Card>
        )}
      </section>
    );
  };

  return (
    <AppLayout>
      <div className="flex max-w-7xl flex-col gap-8 pr-10 py-8 mx-auto">
        <PageHeader
          title="Dashboard"
          breadcrumbs={[{ label: 'Dashboard', icon: LayoutDashboard }]}
        />

        {privateSpace && renderSpaceSection(privateSpace.id, privateSpace.name)}
        {spaces.filter((s) => s.type === 'team').map((teamSpace) => 
          renderSpaceSection(teamSpace.id, teamSpace.name)
        )}
      </div>

      <Dialog open={newFolderOpen} onOpenChange={(open) => {
        setNewFolderOpen(open);
        if (!open) {
          setNewFolderName('');
          setNewFolderDesc('');
          setCurrentSpaceId(null);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar pasta</DialogTitle>
            <DialogDescription>Adicione uma nova pasta.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Nome</Label>
              <Input
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Ex: Finance"
              />
            </div>
            <div className="space-y-1">
              <Label>Descrição</Label>
              <Input
                value={newFolderDesc}
                onChange={(e) => setNewFolderDesc(e.target.value)}
                placeholder="Opcional"
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
                setCurrentSpaceId(null);
              }}
            >
              Cancelar
            </Button>
            <Button 
              onClick={() => currentSpaceId && handleCreateFolder(currentSpaceId)} 
              disabled={!newFolderName.trim() || creating || !currentSpaceId}
            >
              {creating ? 'Criando...' : 'Criar pasta'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={newProcessOpen} onOpenChange={(open) => {
        setNewProcessOpen(open);
        if (!open) {
          setNewProcessName('');
          setNewProcessDesc('');
          setCurrentSpaceId(null);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar processo</DialogTitle>
            <DialogDescription>Adicione um novo processo.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Nome</Label>
              <Input
                value={newProcessName}
                onChange={(e) => setNewProcessName(e.target.value)}
                placeholder="Ex: Processo de Vendas"
              />
            </div>
            <div className="space-y-1">
              <Label>Descrição</Label>
              <Input
                value={newProcessDesc}
                onChange={(e) => setNewProcessDesc(e.target.value)}
                placeholder="Opcional"
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
                setCurrentSpaceId(null);
              }}
            >
              Cancelar
            </Button>
            <Button 
              onClick={() => currentSpaceId && handleCreateProcess(currentSpaceId)} 
              disabled={!newProcessName.trim() || creating || !currentSpaceId}
            >
              {creating ? 'Criando...' : 'Criar processo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
