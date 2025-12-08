'use client';

import { AppLayout } from '@/components/layout/AppLayout';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export default function TrashPage() {
  return (
    <AppLayout>
      <div className="mx-auto max-w-4xl px-8 py-8 space-y-6">
        <Breadcrumbs items={[{ label: 'Trash' }]} />

        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Trash</h1>
          <p className="text-muted-foreground">
            Itens removidos permanecem aqui por 30 dias antes da exclusão permanente.
          </p>
        </div>

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

