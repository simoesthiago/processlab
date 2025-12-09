'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { FolderKanban, Workflow } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useSpaces } from '@/contexts/SpacesContext';

export default function ProcessPage() {
  const params = useParams<{ spaceId: string; processId: string }>();
  const spaceId = params.spaceId;
  const { selectSpace, loadTree } = useSpaces();

  useEffect(() => {
    if (spaceId) {
      selectSpace(spaceId);
      loadTree(spaceId);
    }
  }, [spaceId, selectSpace, loadTree]);

  return (
    <AppLayout>
      <div className="mx-auto max-w-5xl px-8 py-8 space-y-6">
        <PageHeader
          title="Process"
          description={`ID: ${params.processId}`}
          breadcrumbs={[
            { label: 'Spaces', href: '/spaces', icon: FolderKanban },
            { label: spaceId, href: `/spaces/${spaceId}`, icon: FolderKanban },
            { label: 'Process', icon: Workflow },
          ]}
        />

        <Card>
          <CardHeader>
            <CardTitle>Processo</CardTitle>
            <CardDescription>ID: {params.processId}</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Página placeholder. Aqui exibiremos o processo e suas versões.
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

