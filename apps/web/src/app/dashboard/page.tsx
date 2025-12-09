'use client';

import { useEffect, useMemo, useState } from 'react';
import { FileCard } from '@/components/files/FileCard';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  LayoutGrid,
  List,
  ArrowUpDown,
  SlidersHorizontal,
  Search as SearchIcon,
  Plus,
} from 'lucide-react';
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

function SectionHeader({ title, onNewFolder }: { title: string; onNewFolder?: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-2xl font-semibold text-neutral-900">{title}</h2>
      <div className="flex items-center gap-2 text-neutral-500">
        <Button variant="ghost" size="icon" className="h-9 w-9" title="Grid view">
          <LayoutGrid className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-9 w-9" title="List view">
          <List className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-9 w-9" title="Sort">
          <ArrowUpDown className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-9 w-9" title="Filter">
          <SlidersHorizontal className="h-4 w-4" />
        </Button>
        <div className="hidden sm:flex items-center gap-2 rounded-md border px-2 h-9 bg-white">
          <SearchIcon className="h-4 w-4 text-neutral-400" />
          <Input
            placeholder="Search"
            className="h-7 border-0 bg-transparent px-0 text-sm focus-visible:ring-0"
          />
        </div>
        {onNewFolder && (
          <Button className="h-9 gap-2" onClick={onNewFolder}>
            New Folder
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { spaces, trees, selectSpace, loadTree, createFolder } = useSpaces();
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderDesc, setNewFolderDesc] = useState('');
  const [creating, setCreating] = useState(false);

  const privateSpace = useMemo(() => spaces.find((s) => s.id === 'private'), [spaces]);
  const privateTree = trees['private'];

  useEffect(() => {
    if (privateSpace) {
      selectSpace(privateSpace.id);
      if (!trees[privateSpace.id]) {
        loadTree(privateSpace.id);
      }
    }
  }, [privateSpace, selectSpace, loadTree, trees]);

  const handleCreateFolder = async () => {
    if (!privateSpace || !newFolderName.trim()) return;
    setCreating(true);
    try {
      await createFolder(privateSpace.id, {
        name: newFolderName.trim(),
        description: newFolderDesc || undefined,
        parent_folder_id: null,
      });
      setNewFolderName('');
      setNewFolderDesc('');
      setNewFolderOpen(false);
    } finally {
      setCreating(false);
    }
  };

  return (
    <AppLayout>
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-8 py-8">
        <PageHeader
          title="Dashboard"
          breadcrumbs={[{ label: 'Dashboard', icon: LayoutDashboard }]}
        />

        <section className="space-y-4">
          <SectionHeader title="Private Space" onNewFolder={() => setNewFolderOpen(true)} />
          {!privateTree && (
            <Card>
              <CardHeader>
                <CardTitle>Carregando Private Space...</CardTitle>
                <CardDescription>Buscando pastas e processos.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-4 w-32 rounded bg-muted" />
              </CardContent>
            </Card>
          )}
          {privateTree && (
            <>
              {(privateTree.root_folders?.length || privateTree.root_processes?.length) ? (
                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {privateTree.root_folders?.map((item) => (
                    <FileCard
                      key={item.id}
                      title={item.name}
                      description={item.description || ''}
                      type="folder"
                      meta={`${item.processes?.length || 0} processos`}
                    />
                  ))}
                  {privateTree.root_processes?.map((proc) => (
                    <FileCard
                      key={proc.id}
                      title={proc.name}
                      description={proc.description || ''}
                      type="process"
                    />
                  ))}
                </div>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Private Space vazio</CardTitle>
                    <CardDescription>Use “New Folder” para criar a primeira pasta.</CardDescription>
                  </CardHeader>
                </Card>
              )}
            </>
          )}
        </section>

        <section className="space-y-4">
          <SectionHeader title="Teams Space" />
          <Card>
            <CardHeader>
              <CardTitle>Em breve</CardTitle>
              <CardDescription>Use o menu lateral para navegar pelos spaces de time.</CardDescription>
            </CardHeader>
          </Card>
        </section>
      </div>

      <Dialog open={newFolderOpen} onOpenChange={setNewFolderOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar pasta</DialogTitle>
            <DialogDescription>Adicione uma nova pasta no Private Space.</DialogDescription>
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
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleCreateFolder} disabled={!newFolderName.trim() || creating}>
              {creating ? 'Criando...' : 'Criar pasta'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
