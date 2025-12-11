'use client';

/**
 * Studio Navbar Component
 * 
 * Professional top navigation bar for the Studio editor.
 * Shows workspace context, process info, version status, and actions.
 */

import { useState, useEffect } from 'react';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BpmnEditorRef } from '@/features/bpmn/editor/BpmnEditor';
import { cn } from '@/lib/utils';
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
  ZoomIn,
  ZoomOut,
  Maximize2,
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
  onSave: () => void;
  onExport: () => void;
  onActivateVersion?: (versionId: string) => void;
  projectName?: string;
  spaceName?: string;
  folderPath?: Array<{ id: string; name: string }>;
  workspaceType?: 'personal' | 'organization';
  projectId?: string;
  editorRef?: React.RefObject<BpmnEditorRef>;
  onSettingsClick?: () => void;
}

export function StudioNavbar({
  process,
  versions,
  selectedVersionId,
  basePath,
  isSaving,
  onSave,
  onExport,
  onActivateVersion,
  projectName,
  spaceName,
  folderPath = [],
  workspaceType,
  projectId,
  editorRef,
  onSettingsClick,
}: StudioNavbarProps) {
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(1);
  const [isEditingZoom, setIsEditingZoom] = useState(false);
  const [zoomInputValue, setZoomInputValue] = useState('100');

  // Check undo/redo state periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (editorRef?.current) {
        setCanUndo(editorRef.current.canUndo());
        setCanRedo(editorRef.current.canRedo());
        // Update zoom level (only if not editing)
        if (!isEditingZoom) {
          const zoom = editorRef.current.getZoom();
          // getZoom() already returns percentage (100 = 100%), so use it directly
          setCurrentZoom(zoom / 100); // Store as decimal for calculations
          setZoomInputValue(zoom.toString());
        }
      }
    }, 100);
    return () => clearInterval(interval);
  }, [editorRef, isEditingZoom]);

  const handleZoomInputChange = (value: string) => {
    // Remove non-numeric characters except empty string
    const numericValue = value.replace(/[^0-9]/g, '');
    setZoomInputValue(numericValue);
  };

  const handleZoomInputBlur = () => {
    setIsEditingZoom(false);
    applyZoomFromInput();
  };

  const handleZoomInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
      applyZoomFromInput();
    } else if (e.key === 'Escape') {
      setIsEditingZoom(false);
      // Reset to current zoom (currentZoom is decimal, getZoom returns percentage)
      const zoom = editorRef?.current?.getZoom() || 100;
      setZoomInputValue(zoom.toString());
    }
  };

  const applyZoomFromInput = () => {
    if (!editorRef?.current) return;
    
    const numericValue = parseInt(zoomInputValue);
    if (isNaN(numericValue) || numericValue < 20 || numericValue > 300) {
      // Reset to current zoom if invalid (getZoom returns percentage)
      const zoom = editorRef.current.getZoom();
      setZoomInputValue(zoom.toString());
      setCurrentZoom(zoom / 100);
      return;
    }
    
    const zoomDecimal = numericValue / 100;
    editorRef.current.setZoom(zoomDecimal);
    setCurrentZoom(zoomDecimal);
  };
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
      <div className="flex items-center gap-1.5">
        {/* Undo/Redo */}
        <div className="flex items-center gap-0.5 border-r border-border pr-1.5 mr-0.5">
          <button
            onClick={() => {
              if (editorRef?.current) {
                editorRef.current.undo();
              }
            }}
            disabled={!canUndo}
            className={cn(
              "p-1.5 rounded-md transition-colors",
              canUndo 
                ? "hover:bg-accent text-muted-foreground hover:text-foreground" 
                : "text-muted-foreground/50 cursor-not-allowed"
            )}
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              if (editorRef?.current) {
                editorRef.current.redo();
              }
            }}
            disabled={!canRedo}
            className={cn(
              "p-1.5 rounded-md transition-colors",
              canRedo 
                ? "hover:bg-accent text-muted-foreground hover:text-foreground" 
                : "text-muted-foreground/50 cursor-not-allowed"
            )}
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="h-4 w-4" />
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-0.5 border-r border-border pr-1.5 mr-0.5">
          <button
            onClick={() => {
              if (editorRef?.current) {
                editorRef.current.zoomOut();
              }
            }}
            className="p-1.5 rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
            title="Zoom Out (Ctrl+-)"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          {isEditingZoom ? (
            <input
              type="text"
              value={zoomInputValue}
              onChange={(e) => handleZoomInputChange(e.target.value)}
              onBlur={handleZoomInputBlur}
              onKeyDown={handleZoomInputKeyDown}
              onClick={(e) => e.stopPropagation()}
              className="w-12 px-1.5 py-1 text-xs text-center border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
              autoFocus
              min={20}
              max={300}
            />
          ) : (
            <button
              onClick={() => {
                setIsEditingZoom(true);
                // getZoom() already returns percentage, use it directly
                const zoom = editorRef?.current?.getZoom() || 100;
                setZoomInputValue(zoom.toString());
              }}
              className="px-1.5 py-1 text-xs text-muted-foreground hover:text-foreground min-w-[40px] text-center hover:bg-accent rounded-md transition-colors"
              title="Click to edit zoom percentage"
            >
              {editorRef?.current ? editorRef.current.getZoom() : 100}%
            </button>
          )}
          <button
            onClick={() => {
              if (editorRef?.current) {
                editorRef.current.zoomIn();
              }
            }}
            className="p-1.5 rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
            title="Zoom In (Ctrl++)"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
        </div>

        {/* Settings */}
        <button
          onClick={onSettingsClick}
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

