'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useMemo, useEffect, useState } from 'react';
import { PanelLeftClose, PanelLeftOpen, Plus, Folder, Lock, Workflow, Home, LogOut, FolderKanban, Search } from 'lucide-react';

import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useSpaces } from '@/contexts/SpacesContext';
import { QuickSearch } from '@/features/spaces/components/QuickSearch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Button } from '@/shared/components/ui/button';

interface NewItemState {
  open: boolean;
  spaceId: string;
  parentFolderId?: string | null;
  type: 'folder' | 'process';
}

interface SpacesSidebarProps {
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
}

export function SpacesSidebar({ collapsed = false, onToggleCollapsed }: SpacesSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const { spaces, selectedSpaceId, selectSpace, trees, loadTree, createFolder, createProcess, loading } = useSpaces();
  const [newItem, setNewItem] = useState<NewItemState>({ open: false, spaceId: '', parentFolderId: null, type: 'folder' });
  const [itemName, setItemName] = useState('');
  const [itemDesc, setItemDesc] = useState('');
  const [quickSearchOpen, setQuickSearchOpen] = useState(false);

  useEffect(() => {
    if (selectedSpaceId && !trees[selectedSpaceId]) {
      loadTree(selectedSpaceId);
    }
  }, [selectedSpaceId, trees, loadTree]);

  const initials = useMemo(() => {
    if (!user?.full_name) return user?.email?.[0]?.toUpperCase() ?? '?';
    return user.full_name
      .split(' ')
      .map((p) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }, [user]);

  const handleCreate = async () => {
    if (!newItem.spaceId || !itemName.trim()) return;
    if (newItem.type === 'folder') {
      await createFolder(newItem.spaceId, {
        name: itemName.trim(),
        description: itemDesc || undefined,
        parent_folder_id: newItem.parentFolderId ?? null,
      });
    } else {
      await createProcess(newItem.spaceId, {
        name: itemName.trim(),
        description: itemDesc || undefined,
        folder_id: newItem.parentFolderId ?? null,
      });
    }
    setItemName('');
    setItemDesc('');
    setNewItem({ open: false, spaceId: '', parentFolderId: null, type: 'folder' });
  };

  return (
    <>
      <aside
        className={cn(
          'fixed left-0 top-0 z-30 flex h-screen flex-col bg-neutral-100 border-r border-neutral-200 transition-all duration-200',
          collapsed ? 'w-14' : 'w-72'
        )}
      >
        <div className="flex flex-col gap-2 py-3">
          <div className="flex items-center">
            <button
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-md hover:bg-muted/60',
                collapsed ? 'mx-auto' : 'pl-4'
              )}
              onClick={onToggleCollapsed}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <nav className="space-y-0.5">
          <button
            className={cn(
              'flex h-10 items-center rounded-md py-1.5 text-sm font-medium transition-colors text-muted-foreground hover:bg-neutral-200',
              collapsed ? 'justify-center px-0 mx-0 w-full' : 'gap-1.5 px-4 mx-1 w-full'
            )}
            onClick={async () => {
              try {
                await loadTree('private', true);
              } catch (err) {
                console.warn('Failed to pre-load private tree before search:', err);
              }
              selectSpace('private');
              setQuickSearchOpen(true);
            }}
          >
            <Search className="h-5 w-5" />
            {!collapsed && <span>Search</span>}
          </button>
        </nav>

        <div
          className={cn(
            'flex-1 mt-4 overflow-y-auto pb-3 space-y-3',
            collapsed ? 'px-1' : 'px-3'
          )}
        >
          {spaces.map((space) => {
            const isSelected = space.id === selectedSpaceId;
            const tree = trees[space.id];
            return (
              <div key={space.id} className="rounded-lg border border-gray-100 bg-white/60">
                <div
                  className={cn(
                    'relative flex h-12 items-center',
                    collapsed ? 'justify-center px-2' : 'justify-between px-3'
                  )}
                >
                  {/*
                    Show lock icon for Private Space for visual distinction.
                    This keeps icon spacing consistent with other spaces.
                  */}
                  {null}
                  <Link
                    href={`/spaces/${space.id}`}
                    className={cn(
                      'flex items-center text-sm font-semibold text-gray-800 hover:text-orange-600 transition-colors',
                      collapsed ? 'justify-center gap-0 h-10 w-10' : 'justify-start gap-2 h-10 w-full',
                      isSelected && 'text-orange-600'
                    )}
                    onClick={() => selectSpace(space.id)}
                  >
                    {space.name.toLowerCase().includes('private') ? (
                      <Lock className="h-4 w-4" />
                    ) : (
                      <Folder className="h-4 w-4" />
                    )}
                    {!collapsed && <span className="truncate">{space.name}</span>}
                  </Link>
                  {!collapsed && (
                    <button
                      onClick={() => {
                        setNewItem({ open: true, spaceId: space.id, parentFolderId: null, type: 'folder' });
                        setItemName('');
                        setItemDesc('');
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground hover:bg-muted/60 flex h-7 w-7 items-center justify-center"
                      title="Add folder or process"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  )}
                </div>
                {isSelected && !collapsed && tree && ((tree.root_folders?.length ?? 0) + (tree.root_processes?.length ?? 0) > 0) && (
                  <SpaceTreeList
                    spaceId={space.id}
                    folders={tree?.root_folders || []}
                    processes={tree?.root_processes || []}
                    showLabels={!collapsed}
                    onAdd={(parentId, type) => {
                      setNewItem({ open: true, spaceId: space.id, parentFolderId: parentId, type });
                      setItemName('');
                      setItemDesc('');
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>

        <div className={cn('py-2 text-sm text-muted-foreground border-t border-gray-100 mt-auto w-full', collapsed ? 'px-0' : 'px-3')}>
          <div
            className={cn(
              'flex w-full text-muted-foreground',
              collapsed ? 'flex-col-reverse items-center justify-center gap-2 px-0' : 'items-center justify-start gap-2 px-2'
            )}
          >
            <button
              className="rounded p-1 hover:text-foreground"
              onClick={() => router.push('/')}
              title="Go to landing"
              aria-label="Go to landing"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </aside>

      <Dialog open={newItem.open} onOpenChange={(open) => setNewItem((prev) => ({ ...prev, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add {newItem.type === 'folder' ? 'folder' : 'process'}</DialogTitle>
            <DialogDescription>Create inside the selected space.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex gap-3">
              <Button
                type="button"
                variant={newItem.type === 'folder' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setNewItem((prev) => ({ ...prev, type: 'folder' }))}
              >
                Folder
              </Button>
              <Button
                type="button"
                variant={newItem.type === 'process' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setNewItem((prev) => ({ ...prev, type: 'process' }))}
              >
                Process
              </Button>
            </div>
            <div className="space-y-1">
              <Label>Name</Label>
              <Input value={itemName} onChange={(e) => setItemName(e.target.value)} placeholder="Name" />
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Input value={itemDesc} onChange={(e) => setItemDesc(e.target.value)} placeholder="Optional" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewItem({ open: false, spaceId: '', parentFolderId: null, type: 'folder' })}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!itemName.trim()}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <QuickSearch open={quickSearchOpen} onOpenChange={setQuickSearchOpen} />
    </>
  );
}

function SpaceTreeList({
  spaceId,
  folders,
  processes,
  onAdd,
  depth = 0,
  showLabels = true,
}: {
  spaceId: string;
  folders: any[];
  processes: any[];
  onAdd: (parentFolderId: string | null, type: 'folder' | 'process') => void;
  depth?: number;
  showLabels?: boolean;
}) {
  return (
    <div className="space-y-1">
      {folders.map((folder) => (
        <div key={folder.id}>
          <div
            className={cn(
              'group relative flex items-center gap-2 rounded-md py-1.5 text-sm font-medium text-muted-foreground hover:bg-neutral-200'
            )}
            // Extra indent to emphasize hierarchy under the space header
            style={{ paddingLeft: `${(depth + 1) * 16}px` }}
          >
            <Link href={`/spaces/${spaceId}/folders/${folder.id}`} className="flex items-center gap-2 flex-1 pr-10">
              <Folder className="h-5 w-5 text-muted-foreground/70" />
              {showLabels && <span className="truncate flex-1">{folder.name}</span>}
            </Link>
            <button
              className="opacity-0 group-hover:opacity-100 absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 hover:bg-muted/60 flex h-7 w-7 items-center justify-center"
              onClick={() => onAdd(folder.id, 'folder')}
              title="Add folder"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          {folder.children && folder.children.length > 0 && (
            <SpaceTreeList
              spaceId={spaceId}
              folders={folder.children}
              processes={folder.processes || []}
              onAdd={onAdd}
              depth={depth + 1}
            />
          )}
          {folder.processes?.length ? (
            <div className="space-y-1">
              {folder.processes.map((proc: any) => (
                <Link
                  key={proc.id}
                  href={`/spaces/${spaceId}/processes/${proc.id}`}
                  className="flex items-center gap-2 rounded-md py-1.5 text-sm text-muted-foreground hover:bg-neutral-200"
                  style={{ paddingLeft: `${(depth + 2) * 12}px` }}
                >
                  <Workflow className="h-4 w-4" />
                  {showLabels && <span className="truncate">{proc.name}</span>}
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      ))}
      {processes.map((proc) => (
        <Link
          key={proc.id}
          href={`/spaces/${spaceId}/processes/${proc.id}`}
          className="flex items-center gap-2 rounded-md py-1.5 text-sm text-muted-foreground hover:bg-neutral-200"
          style={{ paddingLeft: `${(depth + 1) * 16}px` }}
        >
          <Workflow className="h-4 w-4" />
          {showLabels && <span className="truncate">{proc.name}</span>}
        </Link>
      ))}
    </div>
  );
}

