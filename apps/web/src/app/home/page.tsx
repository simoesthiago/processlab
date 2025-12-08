'use client';

import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { Clock3, Home as HomeIcon, LayoutGrid, Workflow, Folder as FolderIcon } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';

const recentlyVisited = [
  { id: 'gov', title: 'Governance', type: 'folder' as const },
  { id: 'school', title: 'School', type: 'folder' as const },
  { id: 'house', title: 'House cleaning', type: 'process' as const },
  { id: 'reg', title: 'Regulation', type: 'folder' as const },
  { id: 'fin', title: 'Finance', type: 'folder' as const },
];

const privateSpace = [
  { id: 'ps-school', title: 'School', type: 'folder' as const },
  { id: 'ps-drafts', title: 'Drafts', type: 'folder' as const },
  { id: 'ps-house', title: 'House cleaning', type: 'process' as const },
];

const teamSpace = [
  { id: 'ts-governance', title: 'Governance', type: 'folder' as const },
  { id: 'ts-finance', title: 'Finance', type: 'folder' as const },
  { id: 'ts-regulation', title: 'Regulation', type: 'folder' as const },
];

function FolderGlyph() {
  return (
    <FolderIcon className="h-24 w-24 text-neutral-500" strokeWidth={1.5} />
  );
}

function ProcessGlyph() {
  return (
    <Workflow className="h-24 w-24 text-neutral-500" strokeWidth={1.25} />
  );
}

function FolderTile({ title, type = 'folder' as const }: { title: string; type?: 'folder' | 'process' }) {
  const isProcess = type === 'process';
  return (
    <Card className="flex h-full min-h-[200px] w-full flex-col items-center justify-center gap-2 rounded-xl border-none bg-white px-4 py-6 text-center shadow-none transition-transform duration-200 hover:-translate-y-1 hover:scale-105 hover:bg-[#ffe8d7]/30">
      {isProcess ? <ProcessGlyph /> : <FolderGlyph />}
      <div className="text-lg font-semibold text-neutral-800">{title}</div>
    </Card>
  );
}

export default function HomePage() {
  const { user } = useAuth();
  const name = useMemo(
    () => user?.full_name?.split(' ')[0] || user?.email || 'there',
    [user]
  );

  return (
    <AppLayout>
      <div className="px-8 py-6 bg-white">
        <div className="max-w-7xl">
          <div className="flex items-center gap-2 text-sm text-neutral-500 mb-6">
            <HomeIcon className="h-4 w-4" />
            <Breadcrumbs items={[{ label: 'Home' }]} />
          </div>

          <header className="mb-8 space-y-2">
            <h1 className="text-4xl font-bold text-neutral-900">Home</h1>
            <p className="text-base text-neutral-600">Welcome back, {name}</p>
          </header>

          <section className="mb-10">
            <div className="flex items-center gap-2 text-lg font-semibold text-neutral-900">
              <Clock3 className="h-5 w-5 text-neutral-500" />
              <span>Recently Visited</span>
            </div>
            <div className="my-3 h-px bg-neutral-200" />
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-5">
              {recentlyVisited.map((item) => (
                <FolderTile key={item.id} title={item.title} type={item.type} />
              ))}
            </div>
          </section>

          <div className="space-y-10">
            <section>
              <div className="flex items-center gap-2 text-lg font-semibold text-neutral-900">
                <LayoutGrid className="h-5 w-5 text-neutral-500" />
                <span>Private Space</span>
              </div>
              <div className="my-3 h-px bg-neutral-200" />
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-5">
                {privateSpace.map((item) => (
                  <FolderTile key={item.id} title={item.title} type={item.type} />
                ))}
              </div>
            </section>

            <section>
              <div className="flex items-center gap-2 text-lg font-semibold text-neutral-900">
                <LayoutGrid className="h-5 w-5 text-neutral-500" />
                <span>Teams Space</span>
              </div>
              <div className="my-3 h-px bg-neutral-200" />
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-5">
                {teamSpace.map((item) => (
                  <FolderTile key={item.id} title={item.title} type={item.type} />
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

