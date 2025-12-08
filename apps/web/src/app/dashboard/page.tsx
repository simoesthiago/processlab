'use client';

import { FileCard } from '@/components/files/FileCard';
import { AppLayout } from '@/components/layout/AppLayout';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  LayoutGrid,
  List,
  ArrowUpDown,
  SlidersHorizontal,
  Search as SearchIcon,
  Plus,
} from 'lucide-react';

const privateItems = [
  { id: 'school', title: 'School', type: 'folder' as const, description: '' },
  { id: 'drafts', title: 'Drafts', type: 'folder' as const, description: '' },
  { id: 'house', title: 'House cleaning', type: 'process' as const, description: '' },
];

const teamItems = [
  { id: 'gov', title: 'Governance', type: 'folder' as const, description: '' },
  { id: 'fin', title: 'Finance', type: 'folder' as const, description: '' },
  { id: 'reg', title: 'Regulation', type: 'folder' as const, description: '' },
];

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-2xl font-semibold text-neutral-900">{title}</h2>
      <div className="flex items-center gap-2 text-neutral-500">
        <Button variant="ghost" size="icon" className="h-9 w-9" title="Grid view">
          <LayoutGrid className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-9 w-9" title="List view">
          <List className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-9 w-9" title="Sort">
          <ArrowUpDown className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-9 w-9" title="Filter">
          <SlidersHorizontal className="h-4 w-4" />
        </Button>
        <div className="hidden sm:flex items-center gap-2 rounded-md border px-2 h-9 bg-white">
          <SearchIcon className="h-4 w-4 text-neutral-400" />
          <Input
            placeholder="Search"
            className="h-7 border-0 bg-transparent px-0 text-sm focus-visible:ring-0"
          />
        </div>
        <Button className="h-9 gap-2">
          New
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <AppLayout>
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-8 py-8">
        <div className="flex items-center gap-3 text-sm text-neutral-500">
          <Breadcrumbs items={[{ label: 'Dashboard' }]} />
        </div>

        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-neutral-900">Dashboard</h1>
        </div>

        <section className="space-y-4">
          <SectionHeader title="Private Space" />
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {privateItems.map((item) => (
              <FileCard
                key={item.id}
                title={item.title}
                description={item.description}
                type={item.type}
              />
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <SectionHeader title="Teams Space" />
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {teamItems.map((item) => (
              <FileCard
                key={item.id}
                title={item.title}
                description={item.description}
                type={item.type}
              />
            ))}
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
