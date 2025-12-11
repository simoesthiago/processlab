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
  FolderKanban,
  FolderOpen,
  Workflow,
  Undo2,
  Redo2,
  Settings,
  Globe,
  ChevronDown,
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
  spaceName?: string;
  folderPath?: Array<{ id: string; name: string }>;
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
  spaceName,
  folderPath = [],
  workspaceType,
  projectId,
}: StudioNavbarProps) {
  const { currentWorkspace } = useWorkspace();
  
  // Use spaceName if provided (for spaces), otherwise fall back to currentWorkspace or projectName
  // Priority: spaceName > projectName > currentWorkspace > 'Workspace'
  const displayWorkspaceName = spaceName || projectName || currentWorkspace?.name || 'Workspace';

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
            <FolderKanban className="h-3.5 w-3.5" />
            {displayWorkspaceName}
          </Link>

          {process ? (
            <>
              {/* Show folder path if process is in a folder within a space (not a project) */}
              {!process.project_id && folderPath && folderPath.length > 0 ? (
                <>
                  {folderPath.map((folder) => (
                    <span key={folder.id} className="flex items-center gap-1.5">
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
                      <Link
                        href={`${basePath}/folders/${folder.id}`}
                        className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <FolderOpen className="h-3.5 w-3.5" />
                        <span className="truncate max-w-[120px]">{folder.name}</span>
                      </Link>
                    </span>
                  ))}
                </>
              ) : process.project_id ? (
                <>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
                  <Link
                    href={`${basePath}/folders/${process.project_id}`}
                    className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <FolderKanban className="h-3.5 w-3.5" />
                    {projectName || 'Folder'}
                  </Link>
                  {folderPath && folderPath.length > 0 && folderPath.map((folder) => (
                    <span key={folder.id} className="flex items-center gap-1.5">
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
                      <FolderOpen className="h-3.5 w-3.5" />
                      <span className="truncate max-w-[120px] text-muted-foreground">{folder.name}</span>
                    </span>
                  ))}
                </>
              ) : null}
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
              <span className="flex items-center gap-1.5 font-medium text-foreground truncate max-w-[200px]">
                <Workflow className="h-3.5 w-3.5" />
                {process.name}
              </span>
            </>
          ) : (
            <>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
              <span className="font-medium text-foreground">
                New Process
              </span>
            </>
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
        {/* Undo/Redo */}
        <div className="flex items-center gap-1 border-r border-border pr-2 mr-1">
          <button
            className="p-1.5 rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
            title="Undo"
          >
            <Undo2 className="h-4 w-4" />
          </button>
          <button
            className="p-1.5 rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
            title="Redo"
          >
            <Redo2 className="h-4 w-4" />
          </button>
        </div>

        {/* Language Selector */}
        <div className="relative group">
          <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md hover:bg-accent transition-colors text-sm text-muted-foreground hover:text-foreground">
            <Globe className="h-3.5 w-3.5" />
            <span>EN</span>
            <ChevronDown className="h-3 w-3" />
          </button>
          <div className="absolute top-full right-0 mt-1 p-1 bg-card border border-border rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 min-w-[100px]">
            <button className="w-full text-left px-2 py-1.5 text-xs hover:bg-accent rounded transition-colors">
              English (EN)
            </button>
            <button className="w-full text-left px-2 py-1.5 text-xs hover:bg-accent rounded transition-colors">
              Português (PT)
            </button>
          </div>
        </div>

        {/* Settings */}
        <button
          className="p-1.5 rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
          title="Settings"
        >
          <Settings className="h-4 w-4" />
        </button>

        {/* Export */}
        <Button
          variant="outline"
          size="sm"
          onClick={onExport}
          className="min-w-[88px]"
        >
          <Share className="h-4 w-4 mr-1.5" />
          Export
        </Button>

        {/* Save */}
        <Button
          variant="default"
          size="sm"
          onClick={onSave}
          disabled={isSaving || (!process && !projectId)}
          className="bg-primary hover:bg-primary/90 text-primary-foreground min-w-[88px]"
        >
          <Save className="h-4 w-4 mr-1.5" />
          {isSaving ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </header>
  );
}

