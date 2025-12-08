'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { AppLayout } from '@/components/layout/AppLayout';

export default function ClassificationFrameworkPage() {
  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-6 py-12 space-y-6">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Workspace ▸ Classification Framework</p>
          <h1 className="text-3xl font-semibold tracking-tight">Classification Framework</h1>
          <p className="text-base text-muted-foreground max-w-2xl">
            Estruture seus processos com frameworks de referência como APQC / PCF para garantir consistência e
            comparabilidade entre áreas e clientes.
          </p>
        </div>

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
