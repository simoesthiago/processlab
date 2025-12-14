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
      <div className="max-w-7xl pr-10 py-8 space-y-6 mx-auto">
        <PageHeader
          title="Classification Framework"
          description="Structure your processes with reference frameworks such as APQC / PCF to ensure consistency and comparability across teams and clients."
          breadcrumbs={[{ label: 'Classification Framework', icon: FolderKanban }]}
        />

        <div className="max-w-5xl">
          <Card>
            <CardHeader>
              <CardTitle>APQC / PCF</CardTitle>
              <CardDescription>Ready-to-import classification templates.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button asChild variant="secondary">
                <Link href="#">View APQC catalog</Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href="#">View PCF catalog</Link>
              </Button>
              <Button variant="outline">Import custom framework</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
