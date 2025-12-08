'use client';

/**
 * Studio Navbar Component
 * 
 * Professional top navigation bar for the Studio editor.
 * Shows workspace context, process info, version status, and actions.
 */

import { useWorkspace } from '@/contexts/WorkspaceContext';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ChevronRight,
  Save,
  Share,
  GitBranch,
  Clock,
  CheckCircle,
  ArrowLeft,
  LayoutDashboard,
  FolderKanban,
  FileText,
} from 'lucide-react';

interface Process {
  id: string;
  name: string;
  project_id: string;
}

interface Version {
  id: string;
  version_number: number;
  version_label?: string;
  is_active: boolean;
}

interface StudioNavbarProps {
  process: Process | null;
  versions: Version[];
  selectedVersionId: string | null;
  basePath: string;
  isSaving: boolean;
  isGenerating?: boolean;
  onSave: () => void;
  onExport: () => void;
  onActivateVersion?: (versionId: string) => void;
  projectName?: string;
  folderPath?: string[];
  workspaceType?: 'personal' | 'organization';
  projectId?: string;
}

export function StudioNavbar({
  process,
  versions,
  selectedVersionId,
  basePath,
  isSaving,
  isGenerating,
  onSave,
  onExport,
  onActivateVersion,
  projectName,
  folderPath = [],
  workspaceType,
  projectId,
}: StudioNavbarProps) {
  const { currentWorkspace } = useWorkspace();

  const selectedVersion = versions.find(v => v.id === selectedVersionId);

  return (
    <header className="h-14 bg-card border-b border-border flex items-center justify-between px-4 shrink-0">
      {/* Left Section - Back, Breadcrumbs */}
      <div className="flex items-center gap-3">
        {/* Back to Workspace/Project */}
        <Link
          href={basePath}
          className="p-2 bg-muted/60 hover:bg-muted rounded-md transition-colors text-muted-foreground hover:text-foreground shadow-sm"
          title="Back to workspace"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>

        {/* Breadcrumbs */}
        <nav className="flex items-center gap-1.5 text-sm">
          <Link
            href={basePath}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
          >
            <LayoutDashboard className="h-3.5 w-3.5" />
            {currentWorkspace?.name || 'Workspace'}
          </Link>

          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />

          {process ? (
            <>
              {process.project_id ? (
                <Link
                  href={`${basePath}/folders/${process.project_id}`}
                  className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <FolderKanban className="h-3.5 w-3.5" />
                  {projectName || 'Folder'}
                </Link>
              ) : (
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <FolderKanban className="h-3.5 w-3.5" />
                  {projectName || (workspaceType === 'personal' ? 'Personal' : 'Folder')}
                </span>
              )}
              {folderPath.length > 0 && folderPath.map((folder, idx) => (
                <span key={idx} className="flex items-center gap-1.5 text-muted-foreground">
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
                  <FolderKanban className="h-3.5 w-3.5" />
                  <span className="truncate max-w-[120px]">{folder}</span>
                </span>
              ))}
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
              <span className="flex items-center gap-1.5 font-medium text-foreground truncate max-w-[200px]">
                <FileText className="h-3.5 w-3.5" />
                {process.name}
              </span>
            </>
          ) : (
            <span className="font-medium text-foreground">
              New Process
            </span>
          )}
        </nav>
      </div>

      {/* Center Section - Version Info */}
      {selectedVersion && (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary/50 rounded-lg border border-border">
            <GitBranch className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-sm font-medium">
              v{selectedVersion.version_number}
            </span>
            {selectedVersion.is_active ? (
              <Badge variant="default" className="h-5 px-1.5 text-[10px] bg-success text-success-foreground">
                <CheckCircle className="h-2.5 w-2.5 mr-0.5" />
                Active
              </Badge>
            ) : onActivateVersion && (
              <Button
                variant="ghost"
                size="sm"
                className="h-5 px-2 text-xs"
                onClick={() => onActivateVersion(selectedVersionId!)}
              >
                Activate
              </Button>
            )}
          </div>

          {versions.length > 1 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{versions.length} versions</span>
            </div>
          )}
        </div>
      )}

      {/* Right Section - Actions */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onExport}
          className="min-w-[88px]"
        >
          <Share className="h-4 w-4 mr-1.5" />
          Export
        </Button>

        <Button
          variant="default"
          size="sm"
          onClick={onSave}
          disabled={isSaving || (!process && !projectId)}
          className="bg-green-500/90 hover:bg-green-600 text-white min-w-[88px]"
        >
          <Save className="h-4 w-4 mr-1.5" />
          {isSaving ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </header>
  );
}

