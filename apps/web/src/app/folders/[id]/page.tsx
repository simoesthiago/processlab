'use client';

import { useMemo } from 'react';
import { SectionToolbar } from '@/components/layout/SectionToolbar';
import { FileCard } from '@/components/files/FileCard';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { LayoutDashboard, Users, FolderOpen } from 'lucide-react';

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
      <div className="mx-auto max-w-7xl px-8 py-8 space-y-8">
        <PageHeader
          title={folderName}
          description="Processes and subfolders inside this space."
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
            { label: 'Teams Space', href: '/dashboard', icon: Users },
            { label: folderName, icon: FolderOpen },
          ]}
          actions={<SectionToolbar title={folderName} variant="blue" newLabel="New" />}
        />

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

