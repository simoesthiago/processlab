'use client';

import { BreadcrumbItem, Breadcrumbs } from '@/shared/components/ui/breadcrumbs';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {breadcrumbs?.length ? (
        <div className="text-sm text-muted-foreground">
          <Breadcrumbs items={breadcrumbs} />
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1.5">
          <h1 className="text-3xl font-semibold tracking-tight text-gray-900">{title}</h1>
          {description ? (
            <p className="text-base text-muted-foreground max-w-3xl">{description}</p>
          ) : null}
        </div>

        {actions ? <div className="flex items-center gap-3">{actions}</div> : null}
      </div>
    </div>
  );
}


