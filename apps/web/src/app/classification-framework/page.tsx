'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { FolderKanban } from 'lucide-react';

export default function ClassificationFrameworkPage() {
  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-8 py-8 space-y-6">
        <PageHeader
          title="Classification Framework"
          description="Estruture seus processos com frameworks de referência como APQC / PCF para garantir consistência e comparabilidade entre áreas e clientes."
          breadcrumbs={[{ label: 'Classification Framework', icon: FolderKanban }]}
        />

        <Card>
          <CardHeader>
            <CardTitle>APQC / PCF</CardTitle>
            <CardDescription>Modelos de classificação prontos para importar.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button asChild variant="secondary">
              <Link href="#">Ver catálogo APQC</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="#">Ver catálogo PCF</Link>
            </Button>
            <Button variant="outline">Importar framework personalizado</Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
