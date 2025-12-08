'use client';

import Link from 'next/link';
import { AppLayout } from '@/components/layout/AppLayout';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function HelpPage() {
  return (
    <AppLayout>
      <div className="mx-auto max-w-4xl px-8 py-8 space-y-6">
        <Breadcrumbs items={[{ label: 'Help' }]} />

        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Help Center</h1>
          <p className="text-muted-foreground">
            Encontre respostas rápidas ou fale com o time de suporte.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recursos</CardTitle>
            <CardDescription>Guias e canais disponíveis.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button asChild variant="secondary">
              <Link href="/docs">Ver documentação</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="mailto:support@processlab.ai">Contatar suporte</Link>
            </Button>
            <Button variant="outline">Enviar feedback</Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

