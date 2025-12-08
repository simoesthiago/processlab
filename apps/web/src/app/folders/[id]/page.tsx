'use client';

import { useMemo } from 'react';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { SectionToolbar } from '@/components/layout/SectionToolbar';
import { FileCard } from '@/components/files/FileCard';
import { AppLayout } from '@/components/layout/AppLayout';

const childItems = [
  { id: 'c1', title: 'Payroll Updates', type: 'process' as const, description: 'Updated XML + diagram' },
  { id: 'c2', title: 'Controls', type: 'folder' as const, description: 'Subfolders & SOPs' },
  { id: 'c3', title: 'Vendor Onboarding', type: 'process' as const, description: 'Flow for new vendors' },
];

export default function FolderPage({ params }: { params: { id: string } }) {
  const folderName = useMemo(
    () => decodeURIComponent(params.id || '').replace(/-/g, ' ') || 'Folder',
    [params.id]
  );

  return (
    <AppLayout>
      <div className="mx-auto max-w-7xl px-8 py-6 space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Teams Space', href: '/dashboard' },
            { label: folderName },
          ]}
        />

        <header className="rounded-xl border border-neutral-200 bg-white p-5 shadow-md">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">{folderName}</h1>
              <p className="text-sm text-muted-foreground">
                Processes and subfolders inside this space.
              </p>
            </div>
            <SectionToolbar title={folderName} variant="blue" newLabel="New" />
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {childItems.map((item) => (
            <FileCard
              key={item.id}
              title={item.title}
              description={item.description}
              type={item.type}
            />
          ))}
        </section>
      </div>
    </AppLayout>
  );
}

