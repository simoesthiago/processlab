'use client';

/**
 * Workspace Sidebar Component
 * 
 * Sidebar navigation for workspace pages.
 * Includes workspace switcher and context-aware navigation.
 */

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { WorkspaceSwitcher } from './WorkspaceSwitcher';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/branding/Logo';
import {
  LayoutDashboard,
  FileText,
  FolderKanban,
  Sparkles,
  Settings,
  BarChart,
  Menu,
  X,
  Users,
  Share2,
} from 'lucide-react';

export function WorkspaceSidebar() {
  const pathname = usePathname();
  const { currentWorkspace, getWorkspaceBasePath, canAdmin, isPersonalWorkspace } = useWorkspace();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const basePath = getWorkspaceBasePath();

  // Navigation items that adapt to workspace type
  const navigation = [
    {
      name: 'Dashboard',
      href: basePath,
      icon: LayoutDashboard,
      exact: true,
    },
    {
      name: 'Projects',
      href: `${basePath}/projects`,
      icon: FolderKanban,
    },
    {
      name: 'Process Catalog',
      href: `${basePath}/catalog`,
      icon: FileText,
    },
    {
      name: 'Studio',
      href: `${basePath}/studio`,
      icon: Sparkles,
    },
  ];

  // Personal workspace specific items
  const personalNavigation = isPersonalWorkspace() ? [
    {
      name: 'Shared with Me',
      href: `${basePath}/shared`,
      icon: Share2,
    },
  ] : [];

  // Organization specific items
  const orgNavigation = !isPersonalWorkspace() ? [
    {
      name: 'Team Members',
      href: `${basePath}/members`,
      icon: Users,
      adminOnly: true,
    },
  ] : [];

  const secondaryNavigation = [
    {
      name: 'Analytics',
      href: `${basePath}/analytics`,
      icon: BarChart,
      disabled: true,
    },
    {
      name: 'Settings',
      href: `${basePath}/settings`,
      icon: Settings,
      disabled: !canAdmin(),
    },
  ];

  const isActive = (href: string, exact = false) => {
    if (exact) {
      return pathname === href;
    }
    return pathname === href || pathname?.startsWith(href + '/');
  };

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="bg-card border shadow-sm"
        >
          {isMobileOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-50 flex h-full w-72 flex-col border-r bg-card transition-transform duration-300 ease-in-out',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center border-b px-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Logo variant="icon" width={32} height={32} />
            <span className="text-lg font-bold tracking-tight">ProcessLab</span>
          </Link>
        </div>

        {/* Workspace Switcher */}
        <div className="p-4 border-b">
          <WorkspaceSwitcher />
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {/* Main Navigation */}
          <div className="space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
                  isActive(item.href, item.exact)
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            ))}
          </div>

          {/* Personal or Org specific items */}
          {(personalNavigation.length > 0 || orgNavigation.length > 0) && (
            <div className="pt-4 mt-4 border-t">
              {[...personalNavigation, ...orgNavigation]
                .filter(item => !('adminOnly' in item) || (item.adminOnly && canAdmin()))
                .map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsMobileOpen(false)}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
                      isActive(item.href)
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                ))}
            </div>
          )}
        </nav>

        {/* Secondary Navigation */}
        <div className="border-t px-3 py-4">
          <nav className="space-y-1">
            {secondaryNavigation.map((item) => (
              <button
                key={item.name}
                disabled={item.disabled}
                onClick={() => {
                  if (!item.disabled) {
                    setIsMobileOpen(false);
                    // Navigate to item.href
                  }
                }}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  item.disabled
                    ? 'cursor-not-allowed text-muted-foreground opacity-50'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Workspace Info Footer */}
        <div className="border-t px-4 py-3">
          <div className="text-xs text-muted-foreground">
            <span className="capitalize">{currentWorkspace?.type}</span>
            {' · '}
            <span className="capitalize">{currentWorkspace?.role}</span>
          </div>
        </div>
      </div>
    </>
  );
}

