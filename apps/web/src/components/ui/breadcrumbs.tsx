import Link from 'next/link';
import { ChevronRight, type LucideIcon } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: LucideIcon;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav className="flex items-center gap-1 text-sm text-muted-foreground">
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        const Icon = item.icon;

        const content = (
          <span className="flex items-center gap-1.5">
            {Icon ? (
              <Icon
                className={`h-4 w-4 ${isLast ? 'text-foreground' : 'text-muted-foreground'}`}
              />
            ) : null}
            <span className={isLast ? 'text-foreground font-medium' : undefined}>{item.label}</span>
          </span>
        );

        return (
          <span key={`${item.label}-${idx}`} className="flex items-center gap-1">
            {item.href && !isLast ? (
              <Link href={item.href} className="hover:text-foreground transition-colors">
                {content}
              </Link>
            ) : (
              content
            )}
            {!isLast && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60" />}
          </span>
        );
      })}
    </nav>
  );
}

