'use client';

/**
 * Workspace Switcher Component
 * 
 * Dropdown component to switch between organizations and personal workspace.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWorkspace, Workspace } from '@/contexts/WorkspaceContext';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import {
  Building2,
  User,
  ChevronDown,
  Check,
  Plus,
  Settings,
} from 'lucide-react';

export function WorkspaceSwitcher() {
  const router = useRouter();
  const { user } = useAuth();
  const {
    currentWorkspace,
    organizations,
    setCurrentWorkspace,
    loading
  } = useWorkspace();
  const [isOpen, setIsOpen] = useState(false);

  const handleSelectWorkspace = (workspace: Workspace) => {
    setCurrentWorkspace(workspace);
    setIsOpen(false);

    // Navigate to the new workspace's dashboard
    if (workspace.type === 'personal') {
      router.push('/home');
    } else {
      router.push('/dashboard');
    }
  };

  const handleSelectPersonal = () => {
    if (!user) return;

    const personalWorkspace: Workspace = {
      type: 'personal',
      id: user.id,
      name: 'Personal',
      slug: 'personal',
      role: 'owner',
    };
    handleSelectWorkspace(personalWorkspace);
  };

  if (loading) {
    return (
      <div className="h-10 w-48 animate-pulse rounded-lg bg-muted" />
    );
  }

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors w-full',
          'bg-accent/50 hover:bg-accent text-foreground',
          'border border-border'
        )}
      >
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10">
          {currentWorkspace?.type === 'personal' ? (
            <User className="h-4 w-4 text-primary" />
          ) : (
            <Building2 className="h-4 w-4 text-primary" />
          )}
        </div>
        <div className="flex flex-col items-start flex-1 min-w-0">
          <span className="truncate font-semibold">
            {currentWorkspace?.name || 'Select Workspace'}
          </span>
          <span className="text-xs text-muted-foreground capitalize">
            {currentWorkspace?.type || 'workspace'}
          </span>
        </div>
        <ChevronDown className={cn(
          'h-4 w-4 text-muted-foreground transition-transform',
          isOpen && 'rotate-180'
        )} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu */}
          <div className="absolute left-0 top-full z-50 mt-2 w-72 rounded-lg border bg-popover p-2 shadow-lg">
            {/* Personal Workspace */}
            <div className="mb-2">
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Personal
              </div>
              <button
                onClick={handleSelectPersonal}
                className={cn(
                  'flex w-full items-center gap-3 rounded-md px-2 py-2 text-sm transition-colors',
                  currentWorkspace?.type === 'personal'
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent'
                )}
              >
                <div className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-md',
                  currentWorkspace?.type === 'personal'
                    ? 'bg-primary-foreground/20'
                    : 'bg-muted'
                )}>
                  <User className="h-4 w-4" />
                </div>
                <div className="flex flex-col items-start flex-1">
                  <span className="font-medium">Personal Space</span>
                  <span className={cn(
                    'text-xs',
                    currentWorkspace?.type === 'personal'
                      ? 'text-primary-foreground/70'
                      : 'text-muted-foreground'
                  )}>
                    Your private workspace
                  </span>
                </div>
                {currentWorkspace?.type === 'personal' && (
                  <Check className="h-4 w-4" />
                )}
              </button>
            </div>

            {/* Organizations */}
            {organizations.length > 0 && (
              <div className="border-t pt-2">
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Organizations
                </div>
                <div className="space-y-1">
                  {organizations.map((org) => {
                    const isSelected = currentWorkspace?.type === 'organization' &&
                      currentWorkspace.id === org.id;
                    return (
                      <button
                        key={org.id}
                        onClick={() => handleSelectWorkspace({
                          type: 'organization',
                          id: org.id,
                          name: org.name,
                          slug: org.slug,
                          role: org.role,
                        })}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-md px-2 py-2 text-sm transition-colors',
                          isSelected
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-accent'
                        )}
                      >
                        <div className={cn(
                          'flex h-8 w-8 items-center justify-center rounded-md',
                          isSelected
                            ? 'bg-primary-foreground/20'
                            : 'bg-muted'
                        )}>
                          <Building2 className="h-4 w-4" />
                        </div>
                        <div className="flex flex-col items-start flex-1 min-w-0">
                          <span className="font-medium truncate">{org.name}</span>
                          <span className={cn(
                            'text-xs capitalize',
                            isSelected
                              ? 'text-primary-foreground/70'
                              : 'text-muted-foreground'
                          )}>
                            {org.role}
                          </span>
                        </div>
                        {isSelected && (
                          <Check className="h-4 w-4 flex-shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="border-t mt-2 pt-2">
              <button
                onClick={() => {
                  setIsOpen(false);
                  // TODO: Navigate to create org page
                }}
                className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Create Organization</span>
              </button>
              <button
                onClick={() => {
                  setIsOpen(false);
                  // TODO: Navigate to settings
                }}
                className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              >
                <Settings className="h-4 w-4" />
                <span>Workspace Settings</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

