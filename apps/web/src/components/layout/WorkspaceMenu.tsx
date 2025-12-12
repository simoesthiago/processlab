'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useSpaces } from '@/contexts/SpacesContext';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Check, UserPlus, LogOut, ChevronDown, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WorkspaceMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger?: React.ReactNode;
}

export function WorkspaceMenu({ open, onOpenChange, trigger }: WorkspaceMenuProps) {
  const { user, logout } = useAuth();
  const { spaces, selectedSpaceId, selectSpace } = useSpaces();
  const router = useRouter();

  const initials = useMemo(() => {
    if (!user?.full_name) return user?.email?.[0]?.toUpperCase() ?? '?';
    return user.full_name
      .split(' ')
      .map((p) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }, [user]);

  const privateSpace = useMemo(() => spaces.find((s) => s.id === 'private'), [spaces]);
  const teamSpaces = useMemo(() => spaces.filter((s) => s.type === 'team'), [spaces]);

  const handleSpaceClick = (spaceId: string) => {
    selectSpace(spaceId);
    router.push(`/spaces/${spaceId}`);
    onOpenChange(false);
  };

  return (
    <>
      {trigger}

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md p-0">
          <DialogTitle className="sr-only">Workspace Menu</DialogTitle>
          {/* Current Workspace Header */}
          <div className="p-4 border-b">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-sm font-semibold text-primary">
                {initials?.[0] || 'W'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-foreground truncate">
                  {user?.full_name || user?.email || 'Workspace'}
                </div>
                <div className="text-sm text-muted-foreground">Free Plan · 1 member</div>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1">
                <UserPlus className="h-4 w-4 mr-2" />
                Invite members
              </Button>
            </div>
          </div>

          {/* Spaces List */}
          <div className="max-h-[400px] overflow-y-auto">
            {/* Private Space */}
            {privateSpace && (
              <div className="p-2">
                <div className="text-xs font-medium text-muted-foreground px-3 py-2">
                  {user?.email || 'Account'}
                </div>
                <button
                  onClick={() => handleSpaceClick(privateSpace.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent transition-colors',
                    selectedSpaceId === privateSpace.id && 'bg-accent'
                  )}
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-xs font-semibold text-primary">
                    {initials?.[0] || 'T'}
                  </div>
                  <span className="flex-1 text-left font-medium">{privateSpace.name}</span>
                  {selectedSpaceId === privateSpace.id && <Check className="h-4 w-4 text-primary" />}
                </button>
              </div>
            )}

            {/* Team Spaces */}
            {teamSpaces.length > 0 && (
              <div className="p-2 border-t">
                {teamSpaces.map((space) => (
                  <div key={space.id} className="mb-2">
                    <button
                      onClick={() => handleSpaceClick(space.id)}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent transition-colors',
                        selectedSpaceId === space.id && 'bg-accent'
                      )}
                    >
                      <div className="flex h-6 w-6 items-center justify-center rounded-md bg-muted text-xs font-semibold">
                        {space.name[0]?.toUpperCase() || 'T'}
                      </div>
                      <span className="flex-1 text-left font-medium">{space.name}</span>
                      {selectedSpaceId === space.id && <Check className="h-4 w-4 text-primary" />}
                    </button>
                  </div>
                ))}
              </div>
            )}

          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t space-y-2">
            <button
              onClick={() => {
                onOpenChange(false);
                // Could add "Add another account" functionality
              }}
              className="w-full text-left text-sm text-muted-foreground hover:text-foreground py-1"
            >
              Add another account
            </button>
            <button
              onClick={() => {
                logout();
                onOpenChange(false);
              }}
              className="w-full text-left text-sm text-muted-foreground hover:text-foreground py-1"
            >
              Log out all accounts
            </button>
            <button
              onClick={() => {
                onOpenChange(false);
                // Could link to app stores
              }}
              className="w-full text-left text-sm text-muted-foreground hover:text-foreground py-1"
            >
              Get iOS & Android app
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

