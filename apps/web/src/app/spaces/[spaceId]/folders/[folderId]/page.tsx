'use client';

import { useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useSpaces } from '@/contexts/SpacesContext';

export default function FolderPage() {
  const params = useParams<{ spaceId: string; folderId: string }>();
  const spaceId = params.spaceId;
  const folderId = params.folderId;
  const { selectSpace, loadTree, trees, getFolder, spaces } = useSpaces();

  useEffect(() => {
    if (spaceId) {
      selectSpace(spaceId);
      loadTree(spaceId);
    }
  }, [spaceId, selectSpace, loadTree]);

  const folder = getFolder(spaceId, folderId);
  const space = useMemo(() => spaces.find((s) => s.id === spaceId), [spaces, spaceId]);

  return (
    <AppLayout>
      <div className="mx-auto max-w-6xl px-8 py-8 space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Spaces', href: '/spaces' },
            { label: space?.name || 'Space', href: `/spaces/${spaceId}` },
            { label: folder?.name || 'Folder' },
          ]}
        />

        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">{folder?.name || 'Folder'}</h1>
          <p className="text-muted-foreground">
            {folder?.description || 'Pastas e processos dentro desta pasta.'}
          </p>
        </div>

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
                <CardContent className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    {child.processes?.length || 0} processos · {child.children?.length || 0} pastas
                  </div>
                  <Button asChild size="sm">
                    <Link href={`/spaces/${spaceId}/folders/${child.id}`}>Abrir</Link>
                  </Button>
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

