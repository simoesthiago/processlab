'use client';

import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Trash2 } from 'lucide-react';

export default function TrashPage() {
  return (
    <AppLayout>
      <div className="mx-auto max-w-4xl px-8 py-8 space-y-6">
        <PageHeader
          title="Trash"
          description="Itens removidos permanecem aqui por 30 dias antes da exclusão permanente."
          breadcrumbs={[{ label: 'Trash', icon: Trash2 }]}
        />

        <Card>
          <CardHeader>
            <CardTitle>Lixeira vazia</CardTitle>
            <CardDescription>Não há itens para restaurar agora.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Quando você remover processos ou pastas, eles aparecerão aqui para restauração rápida.
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

