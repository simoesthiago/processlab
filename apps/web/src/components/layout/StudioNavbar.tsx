'use client';

/**
 * Studio Navbar Component
 * 
 * Professional top navigation bar for the Studio editor.
 * Shows workspace context, process info, version status, and actions.
 */

import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Logo } from '@/components/branding/Logo';
import {
  ChevronRight,
  Save,
  Download,
  MoreHorizontal,
  GitBranch,
  Clock,
  CheckCircle,
  User,
  LogOut,
  Settings,
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
}: StudioNavbarProps) {
  const { user, logout } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const router = useRouter();

  const selectedVersion = versions.find(v => v.id === selectedVersionId);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className="h-14 bg-card border-b border-border flex items-center justify-between px-4 shrink-0">
      {/* Left Section - Logo, Back, Breadcrumbs */}
      <div className="flex items-center gap-3">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2 pr-3 border-r border-border">
          <Logo variant="horizontal" height={24} />
        </Link>

        {/* Back to Workspace */}
        <Link
          href={basePath}
          className="p-1.5 hover:bg-accent rounded-md transition-colors text-muted-foreground hover:text-foreground"
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
              <Link
                href={`${basePath}/projects/${process.project_id}`}
                className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
              >
                <FolderKanban className="h-3.5 w-3.5" />
                Project
              </Link>
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

      {/* Right Section - Actions & User */}
      <div className="flex items-center gap-2">
        {/* Save Button */}
        {process && (
          <Button
            variant="default"
            size="sm"
            onClick={onSave}
            disabled={isSaving}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Save className="h-4 w-4 mr-1.5" />
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        )}

        {/* Export Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onExport}
        >
          <Download className="h-4 w-4 mr-1.5" />
          Export
        </Button>

        {/* Separator */}
        <div className="w-px h-6 bg-border mx-1" />

        {/* User Menu */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-accent transition-colors cursor-pointer">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10">
              <User className="h-3.5 w-3.5 text-primary" />
            </div>
            <span className="text-sm font-medium hidden md:block max-w-[100px] truncate">
              {user?.full_name?.split(' ')[0] || user?.email?.split('@')[0]}
            </span>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={handleLogout}
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}

