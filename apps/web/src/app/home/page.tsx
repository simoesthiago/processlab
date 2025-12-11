'use client';

import { useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSpaces } from '@/contexts/SpacesContext';
import { useRecentItems } from '@/hooks/useRecentItems';
import { FileCard } from '@/components/files/FileCard';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock3, LayoutGrid, Users, Home as HomeIcon } from 'lucide-react';

type CardItem = {
  id: string;
  name: string;
  description?: string | null;
  type: 'folder' | 'process';
  spaceId: string;
  spaceType: 'private' | 'team';
  parent_folder_id?: string | null;
  processes?: { id: string }[];
};

export default function HomePage() {
  const { user } = useAuth();
  const { spaces, trees, loadTree } = useSpaces();
  const { recents, loading: recentsLoading } = useRecentItems();
  const name = useMemo(
    () => user?.full_name?.split(' ')[0] || user?.email || 'there',
    [user]
  );

  const privateSpace = useMemo(
    () => spaces.find((s) => s.id === 'private' || s.type === 'private'),
    [spaces]
  );
  const teamSpaces = useMemo(() => spaces.filter((s) => s.type === 'team'), [spaces]);
  const privateTree = privateSpace ? trees[privateSpace.id] : undefined;

  useEffect(() => {
    if (privateSpace && !trees[privateSpace.id]) {
      loadTree(privateSpace.id);
    }
    teamSpaces.forEach((space) => {
      if (!trees[space.id]) {
        loadTree(space.id);
      }
    });
  }, [privateSpace, teamSpaces, trees, loadTree]);

  const buildHref = (spaceId: string, type: 'folder' | 'process', id: string) =>
    type === 'folder'
      ? `/spaces/${spaceId}/folders/${id}`
      : `/spaces/${spaceId}/processes/${id}`;

  const privateItems: CardItem[] = useMemo(() => {
    if (!privateSpace || !privateTree) return [];
    return [
      ...(privateTree.root_folders || []).map((folder) => ({
        id: folder.id,
        name: folder.name,
        description: folder.description,
        type: 'folder' as const,
        spaceId: privateSpace.id,
        spaceType: 'private' as const,
        parent_folder_id: folder.parent_folder_id ?? null,
        processes: folder.processes,
      })),
      ...(privateTree.root_processes || []).map((proc) => ({
        id: proc.id,
        name: proc.name,
        description: proc.description,
        type: 'process' as const,
        spaceId: privateSpace.id,
        spaceType: 'private' as const,
        parent_folder_id: proc.folder_id ?? null,
      })),
    ];
  }, [privateSpace, privateTree]);

  // Team items are now handled per-space in the render

  return (
    <AppLayout>
      <div className="max-w-7xl pr-10 py-8 bg-white space-y-10 mx-auto">
        <PageHeader
          title="Home"
          description={`Welcome back, ${name}`}
          breadcrumbs={[{ label: 'Home', icon: HomeIcon }]}
        />

        <section className="space-y-3">
          <div className="flex items-center gap-2 text-lg font-semibold text-neutral-900">
            <Clock3 className="h-5 w-5 text-neutral-500" />
            <span>Recently Visited</span>
          </div>
          <div className="h-px bg-neutral-200" />
          {recentsLoading && (
            <Card>
              <CardHeader>
                <CardTitle>Carregando itens recentes...</CardTitle>
                <CardDescription>Buscando suas últimas pastas e processos.</CardDescription>
              </CardHeader>
            </Card>
          )}
          {!recentsLoading && !recents.length && (
            <Card>
              <CardHeader>
                <CardTitle>Nenhum item recente</CardTitle>
                <CardDescription>Abra uma pasta ou processo para vê-lo aqui.</CardDescription>
              </CardHeader>
            </Card>
          )}
          {!recentsLoading && recents.length > 0 && (
            <div className="flex flex-wrap gap-4">
              {recents.map((item) => {
                const spaceName =
                  item.space_type === 'private'
                    ? 'Private Space'
                    : teamSpaces.find((s) => s.id === item.space_id)?.name || 'Team Space';
                const spaceIdForRoute = item.space_type === 'private' ? 'private' : item.space_id || '';
                const processCount = item.type === 'folder' ? 0 : 1;
                return (
                  <FileCard
                    key={`${item.space_id}-${item.id}`}
                    title={item.name}
                    type={item.type}
                    meta={spaceName}
                    processCount={processCount}
                    href={buildHref(spaceIdForRoute, item.type, item.id)}
                  />
                );
              })}
            </div>
          )}
        </section>

        <div className="space-y-10">
            <section className="space-y-3">
              <div className="flex items-center gap-2 text-lg font-semibold text-neutral-900">
                <LayoutGrid className="h-5 w-5 text-neutral-500" />
                <span>Private Space</span>
              </div>
              <div className="h-px bg-neutral-200" />
              {!privateSpace && (
                <Card>
                  <CardHeader>
                    <CardTitle>Nenhum Private Space</CardTitle>
                    <CardDescription>Não foi possível encontrar seu espaço privado.</CardDescription>
                  </CardHeader>
                </Card>
              )}
              {privateSpace && !privateTree && (
                <Card>
                  <CardHeader>
                    <CardTitle>Carregando Private Space...</CardTitle>
                    <CardDescription>Buscando pastas e processos.</CardDescription>
                  </CardHeader>
                </Card>
              )}
              {privateSpace && privateTree && privateItems.length === 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Private Space vazio</CardTitle>
                    <CardDescription>Crie uma pasta ou processo para começar.</CardDescription>
                  </CardHeader>
                </Card>
              )}
              {privateItems.length > 0 && (
                <div className="flex flex-wrap gap-4">
                  {privateItems.map((item) => (
                    <FileCard
                      key={item.id}
                      title={item.name}
                      description={item.description || undefined}
                      type={item.type}
                      meta={privateSpace?.name || 'Private Space'}
                      processCount={item.type === 'folder' ? item.process_count ?? item.processes?.length ?? 0 : 1}
                      href={buildHref(item.spaceId, item.type, item.id)}
                    />
                  ))}
                </div>
              )}
            </section>

            {teamSpaces.map((teamSpace) => {
                const teamTree = trees[teamSpace.id];
                const teamSpaceItems: CardItem[] = teamTree
                  ? [
                      ...(teamTree.root_folders || []).map((folder) => ({
                        id: folder.id,
                        name: folder.name,
                        description: folder.description,
                        type: 'folder' as const,
                        spaceId: teamSpace.id,
                        spaceType: 'team' as const,
                        parent_folder_id: folder.parent_folder_id ?? null,
                        processes: folder.processes,
                      })),
                      ...(teamTree.root_processes || []).map((proc) => ({
                        id: proc.id,
                        name: proc.name,
                        description: proc.description,
                        type: 'process' as const,
                        spaceId: teamSpace.id,
                        spaceType: 'team' as const,
                        parent_folder_id: proc.folder_id ?? null,
                      })),
                    ]
                  : [];

                return (
                  <section key={teamSpace.id} className="space-y-3">
                    <div className="flex items-center gap-2 text-lg font-semibold text-neutral-900">
                      <Users className="h-5 w-5 text-neutral-500" />
                      <span>{teamSpace.name}</span>
                    </div>
                    <div className="h-px bg-neutral-200" />
                    {!teamTree && (
                      <Card>
                        <CardHeader>
                          <CardTitle>Carregando {teamSpace.name}...</CardTitle>
                          <CardDescription>Buscando pastas e processos.</CardDescription>
                        </CardHeader>
                      </Card>
                    )}
                    {teamTree && teamSpaceItems.length === 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle>{teamSpace.name} vazio</CardTitle>
                          <CardDescription>Crie uma pasta ou processo para começar.</CardDescription>
                        </CardHeader>
                      </Card>
                    )}
                    {teamSpaceItems.length > 0 && (
                      <div className="flex flex-wrap gap-4">
                        {teamSpaceItems.map((item) => (
                          <FileCard
                            key={`${item.spaceId}-${item.id}`}
                            title={item.name}
                            description={item.description || undefined}
                            type={item.type}
                            meta={teamSpace.name}
                            processCount={item.type === 'folder' ? item.process_count ?? item.processes?.length ?? 0 : 1}
                            href={buildHref(item.spaceId, item.type, item.id)}
                          />
                        ))}
                      </div>
                    )}
                  </section>
                );
              })}
          </div>
        </div>
    </AppLayout>
  );
}

