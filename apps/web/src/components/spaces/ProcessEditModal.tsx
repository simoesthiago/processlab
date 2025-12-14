'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSpaces, SpaceProcess } from '@/contexts/SpacesContext';

interface ProcessEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  spaceId: string;
  process: SpaceProcess | null;
  onSuccess?: () => void;
}

export function ProcessEditModal({ open, onOpenChange, spaceId, process, onSuccess }: ProcessEditModalProps) {
  const { updateProcess } = useSpaces();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (process) {
      setName(process.name || '');
      setDescription(process.description || '');
      setError(null);
    }
  }, [process, open]);

  const handleSubmit = async () => {
    if (!process || !name.trim()) return;
    setError(null);
    setUpdating(true);
    try {
      await updateProcess(spaceId, process.id, {
        name: name.trim(),
        description: description.trim() || undefined,
      });
      onOpenChange(false);
      onSuccess?.();
    } catch (e: any) {
      setError(e?.message || 'Error updating process');
    } finally {
      setUpdating(false);
    }
  };

  if (!process) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit process</DialogTitle>
          <DialogDescription>Update process information.</DialogDescription>
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
              placeholder="Process name"
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

