'use client';

import { useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useSpaces } from '@/contexts/SpacesContext';

export default function SpacePage() {
  const params = useParams<{ spaceId: string }>();
  const spaceId = params.spaceId;
  const { spaces, selectSpace, loadTree, trees } = useSpaces();

  useEffect(() => {
    if (spaceId) {
      selectSpace(spaceId);
      loadTree(spaceId);
    }
  }, [spaceId, selectSpace, loadTree]);

  const space = useMemo(() => spaces.find((s) => s.id === spaceId), [spaces, spaceId]);
  const tree = trees[spaceId];

  return (
    <AppLayout>
      <div className="mx-auto max-w-6xl px-8 py-8 space-y-6">
        <Breadcrumbs items={[{ label: 'Spaces' }, { label: space?.name || 'Space' }]} />

        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">{space?.name || 'Space'}</h1>
          <p className="text-muted-foreground">
            {space?.description || 'Pastas e processos neste space.'}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {tree?.root_folders?.map((folder) => (
            <Card key={folder.id}>
              <CardHeader>
                <CardTitle>{folder.name}</CardTitle>
                <CardDescription>{folder.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  {folder.processes?.length || 0} processos · {folder.children?.length || 0} pastas
                </div>
                <Button asChild size="sm">
                  <Link href={`/spaces/${spaceId}/folders/${folder.id}`}>Abrir</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
          {tree?.root_processes?.map((proc) => (
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
          {!tree && (
            <Card>
              <CardHeader>
                <CardTitle>Carregando space...</CardTitle>
              </CardHeader>
            </Card>
          )}
          {tree && !tree.root_folders?.length && !tree.root_processes?.length && (
            <Card>
              <CardHeader>
                <CardTitle>Space vazio</CardTitle>
                <CardDescription>Use o botão + na sidebar para criar pastas ou processos.</CardDescription>
              </CardHeader>
            </Card>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

