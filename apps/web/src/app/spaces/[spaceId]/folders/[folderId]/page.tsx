'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { FolderKanban, FolderOpen, Trash2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useSpaces } from '@/contexts/SpacesContext';

export default function FolderPage() {
  const params = useParams<{ spaceId: string; folderId: string }>();
  const spaceId = params.spaceId;
  const folderId = params.folderId;
  const { selectSpace, loadTree, trees, getFolder, spaces, deleteFolder } = useSpaces();
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deletingCurrent, setDeletingCurrent] = useState(false);

  useEffect(() => {
    if (spaceId) {
      selectSpace(spaceId);
      loadTree(spaceId);
    }
  }, [spaceId, selectSpace, loadTree]);

  const folder = getFolder(spaceId, folderId);
  const space = useMemo(() => spaces.find((s) => s.id === spaceId), [spaces, spaceId]);

  const handleDelete = async (childId: string) => {
    if (!spaceId) return;
    setError(null);
    setDeletingId(childId);
    try {
      await deleteFolder(spaceId, childId);
    } catch (e: any) {
      setError(e?.message || 'Erro ao apagar pasta');
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteCurrent = async () => {
    if (!spaceId || !folder) return;
    const confirmDelete = window.confirm('Apagar esta pasta? Itens dentro serão removidos.');
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
      setError(e?.message || 'Erro ao apagar pasta');
    } finally {
      setDeletingCurrent(false);
    }
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-6xl px-8 py-8 space-y-6">
        <PageHeader
          title={folder?.name || 'Folder'}
          description={folder?.description || 'Pastas e processos dentro desta pasta.'}
          breadcrumbs={[
            { label: 'Spaces', href: '/spaces', icon: FolderKanban },
            { label: space?.name || 'Space', href: `/spaces/${spaceId}`, icon: FolderKanban },
            { label: folder?.name || 'Folder', icon: FolderOpen },
          ]}
          actions={
            folder ? (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteCurrent}
                disabled={deletingCurrent}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                {deletingCurrent ? 'Apagando...' : 'Apagar pasta'}
              </Button>
            ) : null
          }
        />

        {error && (
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">Erro</CardTitle>
              <CardDescription>{error}</CardDescription>
            </CardHeader>
          </Card>
        )}

        {!trees[spaceId] && (
          <Card>
            <CardHeader>
              <CardTitle>Carregando...</CardTitle>
            </CardHeader>
          </Card>
        )}

        {folder && (
          <div className="grid gap-4 sm:grid-cols-2">
            {folder.children?.map((child) => (
              <Card key={child.id}>
                <CardHeader>
                  <CardTitle>{child.name}</CardTitle>
                  <CardDescription>{child.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between gap-3">
                  <div className="text-sm text-muted-foreground">
                    {child.processes?.length || 0} processos · {child.children?.length || 0} pastas
                  </div>
                  <div className="flex items-center gap-2">
                    <Button asChild size="sm">
                      <Link href={`/spaces/${spaceId}/folders/${child.id}`}>Abrir</Link>
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(child.id)}
                      disabled={deletingId === child.id}
                    >
                      {deletingId === child.id ? 'Apagando...' : 'Apagar'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {folder.processes?.map((proc) => (
              <Card key={proc.id}>
                <CardHeader>
                  <CardTitle>{proc.name}</CardTitle>
                  <CardDescription>{proc.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">Processo</div>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/spaces/${spaceId}/processes/${proc.id}`}>Abrir</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {folder && !folder.children?.length && !folder.processes?.length && (
          <Card>
            <CardHeader>
              <CardTitle>Pasta vazia</CardTitle>
              <CardDescription>Use o botão + na sidebar para adicionar itens.</CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}

