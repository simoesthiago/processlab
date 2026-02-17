import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Textarea } from '@/shared/components/ui/textarea';
import { Badge } from '@/shared/components/ui/badge';
import { cn } from '@/lib/utils';

interface SaveVersionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (message: string, changeType: 'major' | 'minor' | 'patch') => Promise<boolean>;
  isSaving: boolean;
  currentVersionNumber?: number;
}

type ChangeType = 'major' | 'minor' | 'patch';

const CHANGE_TYPES: { value: ChangeType; label: string; description: string }[] = [
  { value: 'patch', label: 'Patch', description: 'Small fixes or tweaks' },
  { value: 'minor', label: 'Minor', description: 'New elements or changes' },
  { value: 'major', label: 'Major', description: 'Breaking restructure' },
];

function computeNextVersion(current: number | undefined, changeType: ChangeType): string {
  if (!current) return changeType === 'major' ? '2.0.0' : changeType === 'minor' ? '1.1.0' : '1.0.1';
  // Version number stored as integer: major*10000 + minor*100 + patch
  const major = Math.floor(current / 10000);
  const minor = Math.floor((current % 10000) / 100);
  const patch = current % 100;
  if (changeType === 'major') return `${major + 1}.0.0`;
  if (changeType === 'minor') return `${major}.${minor + 1}.0`;
  return `${major}.${minor}.${patch + 1}`;
}

export default function SaveVersionModal({
  isOpen,
  onClose,
  onSave,
  isSaving,
  currentVersionNumber,
}: SaveVersionModalProps) {
  const [message, setMessage] = useState('');
  const [changeType, setChangeType] = useState<ChangeType>('minor');

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setMessage('');
      setChangeType('minor');
    }
  }, [isOpen]);

  const nextVersion = computeNextVersion(currentVersionNumber, changeType);

  const handleSave = async () => {
    const finalMessage = message.trim() || 'Manual save';
    const success = await onSave(finalMessage, changeType);
    if (success) onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Save Version
            <Badge variant="outline" className="font-mono text-xs">
              v{nextVersion}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Change type selector */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Change type</label>
            <div className="grid grid-cols-3 gap-2">
              {CHANGE_TYPES.map(({ value, label, description }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setChangeType(value)}
                  className={cn(
                    'flex flex-col items-start gap-0.5 rounded-lg border p-3 text-left transition-colors',
                    changeType === value
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border hover:border-muted-foreground/50 hover:bg-muted/50'
                  )}
                >
                  <span className="text-sm font-semibold">{label}</span>
                  <span className={cn(
                    'text-[11px] leading-tight',
                    changeType === value ? 'text-primary/70' : 'text-muted-foreground'
                  )}>
                    {description}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Commit message */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              Description{' '}
              <span className="font-normal text-muted-foreground">(optional)</span>
            </label>
            <Textarea
              placeholder="Describe your changes..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              className="resize-none"
              disabled={isSaving}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : `Save v${nextVersion}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
