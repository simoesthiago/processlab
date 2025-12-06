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
  LogOut,
  MoreVertical,
  User,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export function WorkspaceSidebar() {
  const pathname = usePathname();
  const { currentWorkspace, getWorkspaceBasePath, canAdmin, isPersonalWorkspace } = useWorkspace();
  const { user, logout } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

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
          'fixed lg:static inset-y-0 left-0 z-50 flex h-full w-72 flex-col bg-card transition-transform duration-300 ease-in-out shadow-[1px_0_20px_rgba(0,0,0,0.03)]',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center border-b px-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Logo variant="horizontal" height={32} />
          </Link>
        </div>

        {/* Workspace Switcher */}
        <div className="p-4">
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
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
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
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
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
                  'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
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

        {/* User Profile Footer */}
        <div className="mt-auto p-4 border-t border-border/40 relative">
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex w-full items-center gap-3 rounded-xl p-2 hover:bg-accent transition-colors text-left group"
          >
            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium border border-border/50">
              {user?.full_name?.[0] || user?.email?.[0]?.toUpperCase()}
            </div>
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-sm font-medium truncate text-foreground group-hover:text-accent-foreground">
                {user?.full_name || 'User'}
              </span>
              <span className="text-xs text-muted-foreground truncate">
                {user?.email}
              </span>
            </div>
            <MoreVertical className="h-4 w-4 text-muted-foreground opacity-50 group-hover:opacity-100" />
          </button>

          {/* Custom Dropdown Menu */}
          {isUserMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsUserMenuOpen(false)}
              />
              <div className="absolute bottom-full left-4 right-4 mb-2 rounded-lg border bg-popover p-1 shadow-lg z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-2 py-1.5 text-sm font-semibold">
                  My Account
                </div>
                <div className="h-px bg-border my-1" />
                <Link
                  href="/settings/profile"
                  className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
                  onClick={() => setIsUserMenuOpen(false)}
                >
                  <User className="h-4 w-4" />
                  Profile
                </Link>
                <Link
                  href="/settings"
                  className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
                  onClick={() => setIsUserMenuOpen(false)}
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </Link>
                <div className="h-px bg-border my-1" />
                <button
                  className="flex w-full items-center gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-destructive/10 text-destructive hover:text-destructive transition-colors"
                  onClick={() => {
                    logout();
                    setIsUserMenuOpen(false);
                  }}
                >
                  <LogOut className="h-4 w-4" />
                  Log out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

