'use client';

/**
 * Version Timeline Component
 * 
 * Displays version history with timeline visualization.
 * Updated to match ProcessLab design system.
 */

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { 
  GitBranch, 
  Clock, 
  CheckCircle, 
  RotateCcw, 
  GitCompare,
  User,
  X,
} from 'lucide-react';

interface Version {
  id: string;
  version_number: number;
  version_label?: string;
  commit_message?: string;
  created_at: string;
  created_by?: string;
  is_active: boolean;
  change_type?: 'major' | 'minor' | 'patch';
}

interface VersionTimelineProps {
  versions: Version[];
  selectedVersionId: string | null;
  onSelectVersion: (versionId: string) => void;
  onCompareVersions?: (baseVersionId: string, compareVersionId: string) => void;
  onRestoreVersion?: (versionId: string) => void;
}

export default function VersionTimeline({
  versions,
  selectedVersionId,
  onSelectVersion,
  onCompareVersions,
  onRestoreVersion
}: VersionTimelineProps) {
  const [compareMode, setCompareMode] = useState(false);
  const [baseVersionId, setBaseVersionId] = useState<string | null>(null);

  if (versions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <div className="p-3 rounded-full bg-muted mb-4">
          <Clock className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="text-sm font-semibold text-foreground mb-1">
          No History Yet
        </h3>
        <p className="text-xs text-muted-foreground max-w-[200px]">
          Save your first version to start tracking changes
        </p>
      </div>
    );
  }

  const handleCompareClick = (versionId: string) => {
    if (!onCompareVersions) return;
    
    if (!compareMode) {
      setCompareMode(true);
      setBaseVersionId(versionId);
    } else {
      if (baseVersionId && baseVersionId !== versionId) {
        onCompareVersions(baseVersionId, versionId);
        setCompareMode(false);
        setBaseVersionId(null);
      } else {
        setCompareMode(false);
        setBaseVersionId(null);
      }
    }
  };

  const handleCancelCompare = () => {
    setCompareMode(false);
    setBaseVersionId(null);
  };

  const getChangeTypeColor = (changeType?: string) => {
    switch (changeType) {
      case 'major':
        return 'text-destructive';
      case 'minor':
        return 'text-primary';
      case 'patch':
        return 'text-muted-foreground';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border shrink-0">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <GitBranch className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold text-sm text-foreground">Version History</h3>
            <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
              {versions.length}
            </span>
          </div>
          {compareMode && (
            <button
              onClick={handleCancelCompare}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-3 w-3" />
              Cancel
            </button>
          )}
        </div>
        {compareMode && (
          <p className="text-xs text-primary mt-1.5 flex items-center gap-1">
            <GitCompare className="h-3 w-3" />
            Select a version to compare with v{versions.find(v => v.id === baseVersionId)?.version_number}
          </p>
        )}
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-y-auto">
        <div className="relative pl-6 pr-4 py-4 space-y-4">
          {/* Vertical Line */}
          <div className="absolute left-[27px] top-4 bottom-4 w-px bg-border" />

          {versions.map((version) => {
            const isSelected = version.id === selectedVersionId;
            const isActive = version.is_active;
            const isCompareBase = compareMode && baseVersionId === version.id;

            return (
              <div
                key={version.id}
                className="relative pl-6 cursor-pointer group"
                onClick={() => onSelectVersion(version.id)}
              >
                {/* Timeline Dot */}
                <div className={cn(
                  'absolute left-[-5px] top-3 w-3 h-3 rounded-full border-2 z-10 transition-colors',
                  isActive
                    ? 'bg-success border-success'
                    : isSelected
                    ? 'bg-primary border-primary'
                    : 'bg-background border-border group-hover:border-primary/50'
                )} />

                {/* Version Card */}
                <div className={cn(
                  'p-3 rounded-lg border transition-all',
                  isSelected
                    ? 'bg-primary/5 border-primary/30'
                    : isCompareBase
                    ? 'bg-info/5 border-info/30'
                    : 'bg-card border-border hover:border-border hover:bg-accent/30'
                )}>
                  {/* Header Row */}
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-foreground">
                        v{version.version_number}
                      </span>
                      {version.version_label && (
                        <span className="text-xs px-1.5 py-0.5 bg-secondary rounded text-secondary-foreground">
                          {version.version_label}
                        </span>
                      )}
                      {isActive && (
                        <span className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 bg-success/10 text-success rounded font-medium">
                          <CheckCircle className="h-2.5 w-2.5" />
                          Active
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(version.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Commit Message */}
                  {version.commit_message && (
                    <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                      {version.commit_message}
                    </p>
                  )}

                  {/* Footer Row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="h-2.5 w-2.5" />
                        <span>{version.created_by || 'System'}</span>
                      </div>
                      {version.change_type && (
                        <>
                          <span>•</span>
                          <span className={cn(
                            'uppercase font-semibold',
                            getChangeTypeColor(version.change_type)
                          )}>
                            {version.change_type}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      {onCompareVersions && versions.length > 1 && (
                        <button
                          onClick={() => handleCompareClick(version.id)}
                          className={cn(
                            'flex items-center gap-1 text-[10px] px-2 py-1 rounded transition-colors',
                            isCompareBase
                              ? 'bg-primary text-primary-foreground'
                              : compareMode
                              ? 'bg-info/10 text-info hover:bg-info/20'
                              : 'bg-secondary text-secondary-foreground hover:bg-accent'
                          )}
                          title="Compare versions"
                        >
                          <GitCompare className="h-2.5 w-2.5" />
                          {isCompareBase ? 'Base' : compareMode ? 'Compare' : 'Compare'}
                        </button>
                      )}
                      {onRestoreVersion && !isActive && (
                        <button
                          onClick={() => onRestoreVersion(version.id)}
                          className="flex items-center gap-1 text-[10px] px-2 py-1 rounded bg-warning/10 text-warning hover:bg-warning/20 transition-colors"
                          title="Restore this version"
                        >
                          <RotateCcw className="h-2.5 w-2.5" />
                          Restore
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
