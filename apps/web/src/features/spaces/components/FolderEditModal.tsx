'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { useSpaces, SpaceFolder } from '@/contexts/SpacesContext';

interface FolderEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  spaceId: string;
  folder: SpaceFolder | null;
  onSuccess?: () => void;
}

export function FolderEditModal({ open, onOpenChange, spaceId, folder, onSuccess }: FolderEditModalProps) {
  const { updateFolder } = useSpaces();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (folder) {
      setName(folder.name || '');
      setDescription(folder.description || '');
      setError(null);
    }
  }, [folder, open]);

  const handleSubmit = async () => {
    if (!folder || !name.trim()) return;
    setError(null);
    setUpdating(true);
    try {
      await updateFolder(spaceId, folder.id, {
        name: name.trim(),
        description: description.trim() || undefined,
      });
      onOpenChange(false);
      onSuccess?.();
    } catch (e: any) {
      setError(e?.message || 'Error updating folder');
    } finally {
      setUpdating(false);
    }
  };

  if (!folder) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit folder</DialogTitle>
          <DialogDescription>Update folder information.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>
          )}
          <div className="space-y-1">
            <Label>Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Folder name"
              disabled={updating}
            />
          </div>
          <div className="space-y-1">
            <Label>Description</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional"
              disabled={updating}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={updating}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!name.trim() || updating}>
            {updating ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

