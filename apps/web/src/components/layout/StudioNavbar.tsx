'use client';

/**
 * Studio Navbar Component
 * 
 * Professional top navigation bar for the Studio editor.
 * Shows workspace context, process info, version status, and actions.
 */

import { useState, useEffect, useMemo } from 'react';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BpmnEditorRef } from '@/features/bpmn/editor/BpmnEditor';
import { Breadcrumbs, type BreadcrumbItem } from '@/components/ui/breadcrumbs';
import { cn } from '@/lib/utils';
import {
  ChevronRight,
  Save,
  Share,
  GitBranch,
  Clock,
  CheckCircle,
  ArrowLeft,
  FolderOpen,
  Workflow,
  Undo2,
  Redo2,
  Globe,
  ChevronDown,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Search,
  Lock,
  Trash2,
} from 'lucide-react';


export interface Process {
  id: string;
  name: string;
  folder_id?: string | null;
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
  spaceName?: string;
  folderPath?: Array<{ id: string; name: string }>;
  editorRef?: React.RefObject<BpmnEditorRef | null>;
  onSearchClick?: () => void;
  onDeleteProcess?: () => void;
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
  spaceName,
  folderPath = [],
  editorRef,
  onSearchClick,
  onDeleteProcess,
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

  // Use spaceName if provided (for spaces), otherwise fall back to currentWorkspace
  const displayWorkspaceName = spaceName || currentWorkspace?.name || 'Workspace';

  const selectedVersion = versions.find(v => v.id === selectedVersionId);
  const breadcrumbItems = useMemo<BreadcrumbItem[]>(() => {
    const items: BreadcrumbItem[] = [
      {
        label: spaceName === 'Private Space' || displayWorkspaceName === 'Private Space' ? 'Private Space' : (spaceName || displayWorkspaceName),
        href: basePath,
        icon: (spaceName === 'Private Space' || displayWorkspaceName === 'Private Space') ? Lock : FolderOpen,
      },
    ];

    // Folder path inside space
    if (folderPath && folderPath.length) {
      folderPath.forEach((folder) => {
        items.push({
          label: folder.name,
          href: `${basePath}/folders/${folder.id}`,
          icon: FolderOpen,
        });
      });
    }

    if (process) {
      items.push({
        label: process.name,
        icon: Workflow,
      });
    }

    // Truncation Logic
    const MAX_ITEMS = 5;
    if (items.length > MAX_ITEMS) {
      const first = items[0];
      const last = items[items.length - 1];

      return [
        first,
        { label: '...', icon: FolderOpen },
        last
      ];
    }

    return items;
  }, [basePath, displayWorkspaceName, folderPath, process, spaceName]);

  return (
    <header className="h-14 bg-card border-b border-border flex items-center justify-between px-4 shrink-0">
      {/* Left Section - Back, Breadcrumbs */}
      <div className="flex items-center gap-3">
        {/* Back to Workspace */}
        <Link
          href={basePath}
          className="p-2 bg-muted/60 hover:bg-muted rounded-md transition-colors text-muted-foreground hover:text-foreground shadow-sm"
          title="Back to workspace"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>

        {/* Breadcrumbs */}
        <div className="text-sm text-muted-foreground">
          <Breadcrumbs items={breadcrumbItems} />
        </div>
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

        {/* Search & Delete */}
        <div className="flex items-center gap-1">
          <button
            onClick={onSearchClick}
            className="p-1.5 rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
            title="Search (Ctrl+F)"
            aria-label="Open search"
          >
            <Search className="h-4 w-4" />
          </button>
          {process && onDeleteProcess ? (
            <button
              onClick={onDeleteProcess}
              className="p-1.5 rounded-md hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
              title="Delete process"
              aria-label="Delete process"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          ) : null}
        </div>

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
          disabled={isSaving}
          className="bg-primary hover:bg-primary/90 text-primary-foreground min-w-[88px]"
        >
          <Save className="h-4 w-4 mr-1.5" />
          {isSaving ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </header>
  );
}

